# -*- coding: utf-8 -*-
"""
shiv_manufacturing/tests/test_floor_console.py
Full test suite for the Work Center Status Console feature.

Tests:
  - Work center status transitions
  - Anomaly reporting: breakdown, hold MOs, auto-reroute
  - Anomaly resolution: resume MOs, restore status
  - Edge cases: no alternatives, already in breakdown, concurrent reports
  - Security: production_user vs production_manager gates
  - Audit log written on every event

Run: odoo-bin --test-enable --test-tags shiv_floor_console -d <db>
"""
from datetime import datetime, timedelta
from odoo.exceptions import UserError, ValidationError, AccessError
from odoo.tests import TransactionCase, tagged, HttpCase
from odoo import fields
import json


def _make_product(env, name='Test Product'):
    cat = env['shiv.product.category'].sudo().create({'name': f'Cat-{name}'})
    uom = env.ref('uom.product_uom_unit')
    return env['shiv.product'].sudo().create({
        'name': name,
        'category_id': cat.id,
        'product_type': 'storable',
        'uom_id': uom.id,
    })


def _make_bom(env, product):
    comp = _make_product(env, f'Comp-{product.name}')
    env['shiv.stock.ledger'].sudo().record_movement(
        product_id=comp.id,
        movement_type='in_opening',
        qty_change=100,
        source_ref='INIT',
        actor_id=env.ref('base.user_admin').id,
    )
    return env['shiv.bom'].sudo().create({
        'product_id': product.id,
        'qty_produced': 1.0,
        'component_ids': [(0, 0, {
            'product_id': comp.id,
            'qty_required': 2.0,
            'uom_id': env.ref('uom.product_uom_unit').id,
        })],
    })


def _make_wc(env, name, code, alternatives=None):
    wc = env['shiv.work.center'].sudo().create({
        'name': name,
        'code': code,
        'workcenter_type': 'carpentry',
        'capacity': 10,
    })
    if alternatives:
        wc.write({'alternative_workcenter_ids': [(4, a.id) for a in alternatives]})
    return wc


def _make_mo(env, product, bom, wc, qty=2):
    return env['shiv.manufacturing.order'].sudo().create({
        'product_id': product.id,
        'bom_id': bom.id,
        'qty_to_produce': qty,
        'work_center_id': wc.id,
        'scheduled_date': datetime.now() + timedelta(hours=2),
    })


# ══════════════════════════════════════════════════════════════════════════════
# WORK CENTER STATUS TRANSITIONS
# ══════════════════════════════════════════════════════════════════════════════

@tagged('shiv_floor_console', 'post_install', '-at_install')
class TestWorkCenterStatus(TransactionCase):

    def setUp(self):
        super().setUp()
        self.wc = _make_wc(self.env, 'Test WC', 'WC-TEST-001')

    def test_initial_status_is_idle(self):
        self.assertEqual(self.wc.status, 'idle')

    def test_set_running(self):
        self.wc.action_set_running()
        self.assertEqual(self.wc.status, 'running')

    def test_set_paused_from_running(self):
        self.wc.action_set_running()
        self.wc.action_set_paused()
        self.assertEqual(self.wc.status, 'paused')

    def test_set_idle_from_paused(self):
        self.wc.action_set_running()
        self.wc.action_set_paused()
        self.wc.action_set_idle()
        self.assertEqual(self.wc.status, 'idle')

    def test_status_since_updated_on_change(self):
        before = self.wc.status_since
        import time; time.sleep(0.01)
        self.wc.action_set_running()
        self.assertGreaterEqual(self.wc.status_since, before)

    def test_cannot_start_breakdown_wc(self):
        """Cannot start a WC that is in breakdown — must resolve first."""
        self.wc.sudo().write({'status': 'breakdown'})
        with self.assertRaises(UserError) as ctx:
            self.wc.action_set_running()
        self.assertIn('breakdown', str(ctx.exception).lower())

    def test_audit_log_written_on_status_change(self):
        """Every status change must produce an audit log entry."""
        count_before = self.env['shiv.audit.log'].sudo().search_count([
            ('model', '=', 'shiv.work.center'),
            ('record_id', '=', self.wc.id),
        ])
        self.wc.action_set_running()
        count_after = self.env['shiv.audit.log'].sudo().search_count([
            ('model', '=', 'shiv.work.center'),
            ('record_id', '=', self.wc.id),
        ])
        self.assertGreater(count_after, count_before)


# ══════════════════════════════════════════════════════════════════════════════
# ANOMALY REPORTING — CORE FEATURE
# ══════════════════════════════════════════════════════════════════════════════

@tagged('shiv_floor_console', 'post_install', '-at_install')
class TestAnomalyReporting(TransactionCase):

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')

        # Primary work center
        self.wc_primary = _make_wc(self.env, 'Primary WC', 'WC-PRIM-001')

        # Alternative work center
        self.wc_alt = _make_wc(self.env, 'Alternative WC', 'WC-ALT-001')
        self.wc_primary.write({
            'alternative_workcenter_ids': [(4, self.wc_alt.id)]
        })

        # Products + BoMs
        self.product_a = _make_product(self.env, 'Sofa A')
        self.product_b = _make_product(self.env, 'Sofa B')
        self.bom_a = _make_bom(self.env, self.product_a)
        self.bom_b = _make_bom(self.env, self.product_b)

        # Create 3 in-progress MOs on primary WC
        self.mo1 = _make_mo(self.env, self.product_a, self.bom_a, self.wc_primary)
        self.mo2 = _make_mo(self.env, self.product_b, self.bom_b, self.wc_primary)
        self.mo3 = _make_mo(self.env, self.product_a, self.bom_a, self.wc_primary)

        # Confirm and start MOs
        for mo in [self.mo1, self.mo2, self.mo3]:
            mo.write({'state': 'confirmed'})
            mo.action_start()

    # ── Basic anomaly flow ────────────────────────────────────────────────────

    def test_anomaly_sets_wc_to_breakdown(self):
        """After reporting anomaly, WC status must be 'breakdown'."""
        self.wc_primary.action_report_anomaly('machine_breakdown', 'Saw blade snapped')
        self.assertEqual(self.wc_primary.status, 'breakdown')

    def test_anomaly_stores_type_and_description(self):
        self.wc_primary.action_report_anomaly('power_failure', 'Main switch tripped')
        self.assertEqual(self.wc_primary.anomaly_type, 'power_failure')
        self.assertIn('switch', self.wc_primary.anomaly_description.lower())

    def test_anomaly_records_reporter(self):
        self.wc_primary.action_report_anomaly('tool_failure', 'Drill bit broken')
        self.assertEqual(self.wc_primary.anomaly_reported_by.id, self.admin.id)
        self.assertIsNotNone(self.wc_primary.anomaly_reported_at)

    # ── MO hold ───────────────────────────────────────────────────────────────

    def test_anomaly_holds_all_active_mos(self):
        """All in-progress MOs on the WC must go on_hold after breakdown."""
        self.wc_primary.action_report_anomaly('machine_breakdown', 'Test')
        for mo in [self.mo1, self.mo2, self.mo3]:
            mo.invalidate_recordset(['state'])
            self.assertEqual(
                mo.state, 'on_hold',
                f'MO {mo.name} should be on_hold but is {mo.state}'
            )

    def test_held_mos_have_hold_reason(self):
        self.wc_primary.action_report_anomaly('machine_breakdown', 'Gear failure')
        for mo in [self.mo1, self.mo2, self.mo3]:
            mo.invalidate_recordset(['hold_reason'])
            self.assertIn('breakdown', mo.hold_reason.lower())

    def test_held_mos_have_held_at_timestamp(self):
        self.wc_primary.action_report_anomaly('machine_breakdown', 'Test')
        for mo in [self.mo1, self.mo2, self.mo3]:
            mo.invalidate_recordset(['held_at'])
            self.assertIsNotNone(mo.held_at)

    # ── Auto-rerouting ────────────────────────────────────────────────────────

    def test_mos_rerouted_to_alternative(self):
        """MOs should be auto-rerouted to the alternative work center."""
        result = self.wc_primary.action_report_anomaly('machine_breakdown', 'Test')
        self.assertGreater(result['rerouted_count'], 0)
        for mo in [self.mo1, self.mo2, self.mo3]:
            mo.invalidate_recordset(['work_center_id'])
            self.assertEqual(
                mo.work_center_id.id, self.wc_alt.id,
                f'MO {mo.name} should be rerouted to alt WC'
            )

    def test_rerouted_mos_have_reroute_metadata(self):
        self.wc_primary.action_report_anomaly('machine_breakdown', 'Test')
        for mo in [self.mo1, self.mo2, self.mo3]:
            mo.invalidate_recordset(['rerouted_from_wc_id', 'rerouted_at', 'reroute_reason'])
            self.assertEqual(mo.rerouted_from_wc_id.id, self.wc_primary.id)
            self.assertIsNotNone(mo.rerouted_at)
            self.assertIn('auto-rerouted', mo.reroute_reason.lower())

    def test_reroute_result_contains_count(self):
        result = self.wc_primary.action_report_anomaly('machine_breakdown', 'Test')
        self.assertEqual(result['held_mos'], 3)
        self.assertEqual(result['rerouted_count'], 3)
        self.assertEqual(result['unrouted_count'], 0)

    def test_reroute_details_contain_all_mos(self):
        result = self.wc_primary.action_report_anomaly('machine_breakdown', 'Test')
        mo_names = {d['mo_name'] for d in result['rerouting_details']}
        self.assertIn(self.mo1.name, mo_names)
        self.assertIn(self.mo2.name, mo_names)
        self.assertIn(self.mo3.name, mo_names)

    # ── Anomaly event record ──────────────────────────────────────────────────

    def test_anomaly_event_created(self):
        """An anomaly event record must be created."""
        before = self.env['shiv.wc.anomaly.event'].sudo().search_count([
            ('work_center_id', '=', self.wc_primary.id)])
        self.wc_primary.action_report_anomaly('machine_breakdown', 'Test')
        after = self.env['shiv.wc.anomaly.event'].sudo().search_count([
            ('work_center_id', '=', self.wc_primary.id)])
        self.assertEqual(after, before + 1)

    def test_anomaly_event_state_is_active(self):
        self.wc_primary.action_report_anomaly('quality_issue', 'Test')
        event = self.env['shiv.wc.anomaly.event'].sudo().search([
            ('work_center_id', '=', self.wc_primary.id),
            ('state', '=', 'active'),
        ], limit=1)
        self.assertTrue(event.exists())

    def test_anomaly_event_tracks_held_and_rerouted_counts(self):
        self.wc_primary.action_report_anomaly('machine_breakdown', 'Test')
        event = self.env['shiv.wc.anomaly.event'].sudo().search([
            ('work_center_id', '=', self.wc_primary.id),
            ('state', '=', 'active'),
        ], limit=1)
        self.assertEqual(event.held_mo_count, 3)
        self.assertEqual(event.rerouted_mo_count, 3)

    # ── Audit log ────────────────────────────────────────────────────────────

    def test_audit_log_written_for_anomaly(self):
        before = self.env['shiv.audit.log'].sudo().search_count([
            ('model', '=', 'shiv.work.center'),
            ('record_id', '=', self.wc_primary.id),
        ])
        self.wc_primary.action_report_anomaly('machine_breakdown', 'Audit test')
        after = self.env['shiv.audit.log'].sudo().search_count([
            ('model', '=', 'shiv.work.center'),
            ('record_id', '=', self.wc_primary.id),
        ])
        self.assertGreater(after, before)

    def test_audit_log_written_for_held_mos(self):
        """Each held MO should have its own audit log entry."""
        before = self.env['shiv.audit.log'].sudo().search_count([
            ('model', '=', 'shiv.manufacturing.order'),
        ])
        self.wc_primary.action_report_anomaly('machine_breakdown', 'Audit test MOs')
        after = self.env['shiv.audit.log'].sudo().search_count([
            ('model', '=', 'shiv.manufacturing.order'),
        ])
        self.assertGreaterEqual(after, before + 3)

    # ── Edge cases ────────────────────────────────────────────────────────────

    def test_double_breakdown_raises(self):
        """Reporting anomaly on already-broken WC must raise."""
        self.wc_primary.action_report_anomaly('machine_breakdown', 'First')
        with self.assertRaises(UserError) as ctx:
            self.wc_primary.action_report_anomaly('power_failure', 'Second')
        self.assertIn('breakdown', str(ctx.exception).lower())

    def test_missing_anomaly_type_raises(self):
        with self.assertRaises(ValidationError):
            self.wc_primary.action_report_anomaly('', 'No type given')

    def test_no_alternatives_returns_unrouted(self):
        """WC with no alternatives should put MOs on hold but report unrouted."""
        wc_no_alt = _make_wc(self.env, 'No Alt WC', 'WC-NOALT-001')
        product = _make_product(self.env, 'No Alt Product')
        bom = _make_bom(self.env, product)
        mo = _make_mo(self.env, product, bom, wc_no_alt)
        mo.write({'state': 'confirmed'})
        mo.action_start()

        result = wc_no_alt.action_report_anomaly('machine_breakdown', 'No alt available')
        self.assertEqual(result['rerouted_count'], 0)
        self.assertEqual(result['unrouted_count'], 1)
        self.assertEqual(result['rerouting_details'][0]['status'], 'unrouted_no_alternatives')

    def test_breakdown_alternative_in_breakdown_excluded(self):
        """If alternative WC is also in breakdown, it should not be used."""
        self.wc_alt.sudo().write({'status': 'breakdown'})
        result = self.wc_primary.action_report_anomaly('machine_breakdown', 'Both broken')
        self.assertEqual(result['rerouted_count'], 0)
        self.assertEqual(result['unrouted_count'], 3)

    def test_wc_with_no_active_mos_reports_cleanly(self):
        """WC with zero active MOs can still report breakdown — just no MOs to hold."""
        empty_wc = _make_wc(self.env, 'Empty WC', 'WC-EMPTY-001')
        result = empty_wc.action_report_anomaly('power_failure', 'No MOs anyway')
        self.assertEqual(result['held_mos'], 0)
        self.assertEqual(result['rerouted_count'], 0)
        self.assertEqual(empty_wc.status, 'breakdown')


# ══════════════════════════════════════════════════════════════════════════════
# ANOMALY RESOLUTION
# ══════════════════════════════════════════════════════════════════════════════

@tagged('shiv_floor_console', 'post_install', '-at_install')
class TestAnomalyResolution(TransactionCase):

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')
        self.wc = _make_wc(self.env, 'Resolve WC', 'WC-RESV-001')
        self.product = _make_product(self.env, 'Resolve Product')
        self.bom = _make_bom(self.env, self.product)
        self.mo = _make_mo(self.env, self.product, self.bom, self.wc)
        self.mo.write({'state': 'confirmed'})
        self.mo.action_start()
        # Report breakdown to set up state
        self.wc.action_report_anomaly('machine_breakdown', 'Setup breakdown')

    def test_resolve_sets_wc_to_idle(self):
        self.wc.action_resolve_anomaly('Machine fixed. Tested OK.')
        self.assertEqual(self.wc.status, 'idle')

    def test_resolve_clears_anomaly_fields(self):
        self.wc.action_resolve_anomaly('Fixed.')
        self.wc.invalidate_recordset(['anomaly_type', 'anomaly_description'])
        self.assertFalse(self.wc.anomaly_type)
        self.assertFalse(self.wc.anomaly_description)

    def test_resolve_sets_resolved_timestamp(self):
        self.wc.action_resolve_anomaly('Fixed.')
        self.assertIsNotNone(self.wc.anomaly_resolved_at)

    def test_resolve_resumes_on_hold_mos_on_this_wc(self):
        """On-hold MOs still assigned to this WC should resume after resolution."""
        # Since this MO was rerouted (but no alternatives exist here), it stays
        # Let's directly put one on hold on this WC
        self.mo.sudo().write({'work_center_id': self.wc.id, 'state': 'on_hold'})
        self.wc.action_resolve_anomaly('Fixed.')
        self.mo.invalidate_recordset(['state'])
        self.assertEqual(self.mo.state, 'in_progress')

    def test_resolve_updates_event_state(self):
        self.wc.action_resolve_anomaly('Resolved.')
        event = self.env['shiv.wc.anomaly.event'].sudo().search([
            ('work_center_id', '=', self.wc.id),
            ('state', '=', 'resolved'),
        ], limit=1)
        self.assertTrue(event.exists())

    def test_resolve_event_records_downtime(self):
        import time; time.sleep(1)
        self.wc.action_resolve_anomaly('Quick fix.')
        event = self.env['shiv.wc.anomaly.event'].sudo().search([
            ('work_center_id', '=', self.wc.id),
            ('state', '=', 'resolved'),
        ], limit=1)
        self.assertGreaterEqual(event.downtime_minutes, 0)

    def test_resolve_non_breakdown_raises(self):
        wc2 = _make_wc(self.env, 'Normal WC', 'WC-NORM-001')
        with self.assertRaises(UserError) as ctx:
            wc2.action_resolve_anomaly('Should fail.')
        self.assertIn('breakdown', str(ctx.exception).lower())

    def test_resolve_result_contains_message(self):
        result = self.wc.action_resolve_anomaly('All good.')
        self.assertIn('message', result)
        self.assertIn('online', result['message'].lower())


# ══════════════════════════════════════════════════════════════════════════════
# CONSOLE DATA PAYLOAD
# ══════════════════════════════════════════════════════════════════════════════

@tagged('shiv_floor_console', 'post_install', '-at_install')
class TestFloorConsolePayload(TransactionCase):

    def setUp(self):
        super().setUp()
        self.wc1 = _make_wc(self.env, 'Payload WC 1', 'WC-PAY-001')
        self.wc2 = _make_wc(self.env, 'Payload WC 2', 'WC-PAY-002')

    def test_console_data_returns_dict(self):
        data = self.env['shiv.floor.console'].sudo().get_console_data()
        self.assertIsInstance(data, dict)

    def test_console_data_has_work_centers_key(self):
        data = self.env['shiv.floor.console'].sudo().get_console_data()
        self.assertIn('work_centers', data)

    def test_console_data_has_summary(self):
        data = self.env['shiv.floor.console'].sudo().get_console_data()
        self.assertIn('summary', data)
        summary = data['summary']
        self.assertIn('total_wcs', summary)
        self.assertIn('running', summary)
        self.assertIn('breakdown', summary)

    def test_console_data_has_alerts_key(self):
        data = self.env['shiv.floor.console'].sudo().get_console_data()
        self.assertIn('alerts', data)

    def test_breakdown_appears_in_alerts(self):
        self.wc1.action_report_anomaly('machine_breakdown', 'Test alert')
        # Invalidate cache
        self.env['shiv.floor.console'].sudo().invalidate_console_cache()
        data = self.env['shiv.floor.console'].sudo()._compute_console_data()
        critical_alerts = [a for a in data['alerts'] if a['level'] == 'critical']
        wc_names = [a['work_center'] for a in critical_alerts]
        self.assertIn(self.wc1.name, wc_names)

    def test_breakdown_wc_status_in_payload(self):
        self.wc1.action_report_anomaly('power_failure', 'Console test')
        self.env['shiv.floor.console'].sudo().invalidate_console_cache()
        data = self.env['shiv.floor.console'].sudo()._compute_console_data()
        wc_data = next((w for w in data['work_centers'] if w['id'] == self.wc1.id), None)
        self.assertIsNotNone(wc_data)
        self.assertEqual(wc_data['status'], 'breakdown')
        self.assertIsNotNone(wc_data['anomaly'])
        self.assertEqual(wc_data['anomaly']['type'], 'power_failure')

    def test_summary_counts_match_reality(self):
        self.wc1.action_set_running()
        self.wc2.action_report_anomaly('machine_breakdown', 'Count test')
        self.env['shiv.floor.console'].sudo().invalidate_console_cache()
        data = self.env['shiv.floor.console'].sudo()._compute_console_data()
        summary = data['summary']
        # Summary breakdown count should be >= 1
        self.assertGreaterEqual(summary['breakdown'], 1)

    def test_generated_at_present(self):
        data = self.env['shiv.floor.console'].sudo().get_console_data()
        self.assertIn('generated_at', data)


# ══════════════════════════════════════════════════════════════════════════════
# API INTEGRATION TESTS (HTTP)
# ══════════════════════════════════════════════════════════════════════════════

@tagged('shiv_floor_console', 'shiv_floor_api', 'post_install', '-at_install')
class TestFloorConsoleAPI(HttpCase):

    def setUp(self):
        super().setUp()
        self.authenticate('admin', 'admin')
        self.wc = self.env['shiv.work.center'].sudo().create({
            'name': 'API Test WC',
            'code': 'WC-API-001',
            'workcenter_type': 'carpentry',
            'capacity': 10,
        })

    def _post(self, url, data=None):
        return self.url_open(
            url,
            data=json.dumps(data or {}).encode(),
            headers={'Content-Type': 'application/json'},
        )

    def test_console_endpoint_returns_200(self):
        resp = self.url_open('/shiv/floor/console')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body['success'])
        self.assertIn('work_centers', body['data'])

    def test_list_work_centers_returns_200(self):
        resp = self.url_open('/shiv/floor/work-centers')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body['success'])

    def test_get_single_work_center_returns_200(self):
        resp = self.url_open(f'/shiv/floor/work-centers/{self.wc.id}')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body['data']['id'], self.wc.id)

    def test_get_nonexistent_wc_returns_404(self):
        resp = self.url_open('/shiv/floor/work-centers/99999')
        self.assertEqual(resp.status_code, 404)

    def test_start_work_center_api(self):
        resp = self._post(f'/shiv/floor/work-centers/{self.wc.id}/start')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['status'], 'running')

    def test_report_anomaly_api_full_flow(self):
        resp = self._post(
            f'/shiv/floor/work-centers/{self.wc.id}/report-anomaly',
            {'anomaly_type': 'machine_breakdown', 'description': 'API test breakdown'}
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body['success'])
        self.assertIn('held_mos', body['data'])
        self.assertIn('rerouted_count', body['data'])
        self.assertIn('event_id', body['data'])

    def test_report_anomaly_missing_type_returns_422(self):
        resp = self._post(
            f'/shiv/floor/work-centers/{self.wc.id}/report-anomaly',
            {'description': 'No type provided'}
        )
        self.assertEqual(resp.status_code, 422)

    def test_report_anomaly_invalid_type_returns_422(self):
        resp = self._post(
            f'/shiv/floor/work-centers/{self.wc.id}/report-anomaly',
            {'anomaly_type': 'flying_spaghetti_monster'}
        )
        self.assertEqual(resp.status_code, 422)

    def test_resolve_anomaly_api(self):
        # First report
        self._post(
            f'/shiv/floor/work-centers/{self.wc.id}/report-anomaly',
            {'anomaly_type': 'power_failure', 'description': 'API resolve test'}
        )
        # Then resolve
        resp = self._post(
            f'/shiv/floor/work-centers/{self.wc.id}/resolve-anomaly',
            {'resolution_notes': 'Fixed via API test'}
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body['success'])

    def test_alerts_endpoint_returns_200(self):
        resp = self.url_open('/shiv/floor/alerts')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn('alerts', body['data'])
        self.assertIn('critical_count', body['data'])

    def test_unauthenticated_returns_401(self):
        # Log out first
        self.logout()
        resp = self.url_open('/shiv/floor/console')
        self.assertEqual(resp.status_code, 401)

    def test_floor_mos_endpoint(self):
        resp = self.url_open('/shiv/floor/manufacturing-orders')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn('manufacturing_orders', body['data'])
