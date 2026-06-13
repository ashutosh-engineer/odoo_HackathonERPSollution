# -*- coding: utf-8 -*-
"""
shiv_manufacturing/controllers/floor_console_controller.py
Shiv Furniture Works ERP — Factory Floor Console REST API
Production-ready | Odoo 16

All endpoints are designed for:
  - Large touch targets on rugged shop-floor tablets
  - <50ms response (Redis-cached console state)
  - Role-gated: production_user+ can operate, production_manager+ can manage

Endpoints:
  GET  /shiv/floor/console                        — Full console payload (Redis-cached 15s)
  GET  /shiv/floor/work-centers                   — List all work centers + live status
  GET  /shiv/floor/work-centers/<id>              — Single WC detail
  POST /shiv/floor/work-centers/<id>/start        — Operator starts WC
  POST /shiv/floor/work-centers/<id>/pause        — Operator pauses WC
  POST /shiv/floor/work-centers/<id>/idle         — Operator sets WC idle
  POST /shiv/floor/work-centers/<id>/report-anomaly   — *** CORE FEATURE ***
  POST /shiv/floor/work-centers/<id>/resolve-anomaly  — Supervisor resolves breakdown
  GET  /shiv/floor/work-centers/<id>/anomaly-history  — Past anomaly events
  GET  /shiv/floor/manufacturing-orders           — Live MO list (all states)
  POST /shiv/floor/manufacturing-orders/<id>/start    — Operator starts MO
  POST /shiv/floor/manufacturing-orders/<id>/pause    — Operator pauses MO
  POST /shiv/floor/manufacturing-orders/<id>/done     — Operator marks MO done
  GET  /shiv/floor/alerts                         — Active alerts (breakdowns, holds)
  GET  /shiv/floor/anomaly-events                 — All anomaly events with filters
"""

import json
import logging

from odoo import http, fields as odoo_fields
from odoo.http import request, Response
from odoo.exceptions import UserError, ValidationError, AccessError

_logger = logging.getLogger(__name__)


# ─── Response helpers ─────────────────────────────────────────────────────────

def json_ok(data=None, message='OK', status=200):
    return Response(
        json.dumps({'success': True, 'message': message, 'data': data or {}}, default=str),
        status=status, mimetype='application/json',
    )


def json_err(message, code='ERROR', status=400, details=None):
    body = {'success': False, 'error': {'code': code, 'message': message}}
    if details:
        body['error']['details'] = details
    return Response(json.dumps(body, default=str), status=status, mimetype='application/json')


def require_auth(f):
    from functools import wraps
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not request.session.uid:
            return json_err('Authentication required.', 'UNAUTHENTICATED', 401)
        return f(*args, **kwargs)
    return wrapper


def require_production(f):
    """Minimum: production_user role."""
    from functools import wraps
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not request.session.uid:
            return json_err('Authentication required.', 'UNAUTHENTICATED', 401)
        user = request.env.user
        allowed = (
            user.has_group('shiv_auth.group_shiv_production_user') or
            user.has_group('shiv_auth.group_shiv_production_manager') or
            user.has_group('shiv_auth.group_shiv_admin')
        )
        if not allowed:
            return json_err(
                'Production staff access required.',
                'FORBIDDEN', 403
            )
        return f(*args, **kwargs)
    return wrapper


def require_production_manager(f):
    """Minimum: production_manager role."""
    from functools import wraps
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not request.session.uid:
            return json_err('Authentication required.', 'UNAUTHENTICATED', 401)
        user = request.env.user
        allowed = (
            user.has_group('shiv_auth.group_shiv_production_manager') or
            user.has_group('shiv_auth.group_shiv_admin')
        )
        if not allowed:
            return json_err(
                'Production Manager or Admin access required.',
                'FORBIDDEN', 403
            )
        return f(*args, **kwargs)
    return wrapper


def parse_body():
    """Parse JSON request body safely."""
    try:
        return json.loads(request.httprequest.data or '{}')
    except json.JSONDecodeError:
        return None


def _serialize_wc(wc):
    """Serialize a work center record to a safe dict."""
    return {
        'id': wc.id,
        'name': wc.name,
        'code': wc.code or '',
        'type': wc.workcenter_type,
        'sequence': wc.sequence,
        'status': wc.status,
        'status_since': str(wc.status_since) if wc.status_since else None,
        'status_duration_minutes': wc.status_duration_minutes,
        'capacity': wc.capacity,
        'operator_count': wc.operator_count,
        'utilization_pct': wc.utilization_pct,
        'active_mo_count': wc.active_mo_count,
        'on_hold_mo_count': wc.on_hold_mo_count,
        'today_completed': wc.today_completed_count,
        'today_units_produced': wc.today_units_produced,
        'anomaly_type': wc.anomaly_type or None,
        'anomaly_description': wc.anomaly_description or None,
        'anomaly_reported_by': wc.anomaly_reported_by.name if wc.anomaly_reported_by else None,
        'anomaly_reported_at': str(wc.anomaly_reported_at) if wc.anomaly_reported_at else None,
        'alternatives': [
            {'id': a.id, 'name': a.name, 'status': a.status}
            for a in wc.alternative_workcenter_ids
        ],
    }


def _serialize_mo(mo):
    """Serialize a manufacturing order record."""
    progress = 0.0
    if mo.qty_to_produce:
        progress = round((mo.qty_produced / mo.qty_to_produce) * 100, 1)
    return {
        'id': mo.id,
        'name': mo.name,
        'product': mo.product_id.name,
        'product_id': mo.product_id.id,
        'qty_to_produce': mo.qty_to_produce,
        'qty_produced': mo.qty_produced,
        'progress_pct': progress,
        'state': mo.state,
        'work_center_id': mo.work_center_id.id if mo.work_center_id else None,
        'work_center_name': mo.work_center_id.name if mo.work_center_id else None,
        'scheduled_date': str(mo.scheduled_date) if mo.scheduled_date else None,
        'hold_reason': mo.hold_reason or None,
        'held_at': str(mo.held_at) if mo.held_at else None,
        'rerouted_from': mo.rerouted_from_wc_id.name if mo.rerouted_from_wc_id else None,
        'rerouted_at': str(mo.rerouted_at) if mo.rerouted_at else None,
        'is_auto_generated': mo.is_auto_generated,
    }


# ─── Controller ───────────────────────────────────────────────────────────────

class ShivFloorConsoleController(http.Controller):

    # ══════════════════════════════════════════════════════════════════════════
    # CONSOLE — FULL PAYLOAD (Redis-cached, <50ms)
    # ══════════════════════════════════════════════════════════════════════════

    @http.route('/shiv/floor/console', type='http', auth='user',
                methods=['GET'], csrf=False)
    @require_production
    def get_console(self, **kwargs):
        """
        Full floor console payload — all work centers, live MOs, alerts.
        Cached in Redis for 15 seconds. Designed for tablet polling every 10s.

        Response: See ShivFloorConsole._compute_console_data() for full schema.
        """
        data = request.env['shiv.floor.console'].sudo().get_console_data()
        return json_ok(data, message='Console data loaded.')

    # ══════════════════════════════════════════════════════════════════════════
    # WORK CENTERS
    # ══════════════════════════════════════════════════════════════════════════

    @http.route('/shiv/floor/work-centers', type='http', auth='user',
                methods=['GET'], csrf=False)
    @require_production
    def list_work_centers(self, **kwargs):
        """List all active work centers with live status."""
        wcs = request.env['shiv.work.center'].sudo().search(
            [('is_active', '=', True)], order='sequence asc')
        return json_ok({'work_centers': [_serialize_wc(wc) for wc in wcs],
                        'count': len(wcs)})

    @http.route('/shiv/floor/work-centers/<int:wc_id>', type='http', auth='user',
                methods=['GET'], csrf=False)
    @require_production
    def get_work_center(self, wc_id, **kwargs):
        """Single work center detail with active + on-hold MOs."""
        wc = request.env['shiv.work.center'].sudo().browse(wc_id)
        if not wc.exists():
            return json_err('Work center not found.', 'NOT_FOUND', 404)

        active_mos = request.env['shiv.manufacturing.order'].sudo().search([
            ('work_center_id', '=', wc_id), ('state', '=', 'in_progress')])
        on_hold_mos = request.env['shiv.manufacturing.order'].sudo().search([
            ('work_center_id', '=', wc_id), ('state', '=', 'on_hold')])

        data = _serialize_wc(wc)
        data['active_mos'] = [_serialize_mo(mo) for mo in active_mos]
        data['on_hold_mos'] = [_serialize_mo(mo) for mo in on_hold_mos]
        return json_ok(data)

    # ── Status transitions ────────────────────────────────────────────────────

    @http.route('/shiv/floor/work-centers/<int:wc_id>/start', type='http',
                auth='user', methods=['POST'], csrf=False)
    @require_production
    def start_work_center(self, wc_id, **kwargs):
        """Operator marks work center as Running."""
        wc = request.env['shiv.work.center'].sudo().browse(wc_id)
        if not wc.exists():
            return json_err('Work center not found.', 'NOT_FOUND', 404)
        try:
            wc.action_set_running()
            request.env['shiv.floor.console'].sudo().invalidate_console_cache()
        except (UserError, ValidationError) as e:
            return json_err(str(e), 'TRANSITION_ERROR', 400)
        return json_ok(_serialize_wc(wc), message=f'{wc.name} is now Running.')

    @http.route('/shiv/floor/work-centers/<int:wc_id>/pause', type='http',
                auth='user', methods=['POST'], csrf=False)
    @require_production
    def pause_work_center(self, wc_id, **kwargs):
        """Operator pauses a running work center."""
        wc = request.env['shiv.work.center'].sudo().browse(wc_id)
        if not wc.exists():
            return json_err('Work center not found.', 'NOT_FOUND', 404)
        try:
            wc.action_set_paused()
            request.env['shiv.floor.console'].sudo().invalidate_console_cache()
        except (UserError, ValidationError) as e:
            return json_err(str(e), 'TRANSITION_ERROR', 400)
        return json_ok(_serialize_wc(wc), message=f'{wc.name} is now Paused.')

    @http.route('/shiv/floor/work-centers/<int:wc_id>/idle', type='http',
                auth='user', methods=['POST'], csrf=False)
    @require_production
    def idle_work_center(self, wc_id, **kwargs):
        """Operator sets work center back to Idle."""
        wc = request.env['shiv.work.center'].sudo().browse(wc_id)
        if not wc.exists():
            return json_err('Work center not found.', 'NOT_FOUND', 404)
        try:
            wc.action_set_idle()
            request.env['shiv.floor.console'].sudo().invalidate_console_cache()
        except (UserError, ValidationError) as e:
            return json_err(str(e), 'TRANSITION_ERROR', 400)
        return json_ok(_serialize_wc(wc), message=f'{wc.name} is now Idle.')

    # ══════════════════════════════════════════════════════════════════════════
    # ANOMALY REPORTING — THE CORE FEATURE
    # ══════════════════════════════════════════════════════════════════════════

    @http.route('/shiv/floor/work-centers/<int:wc_id>/report-anomaly',
                type='http', auth='user', methods=['POST'], csrf=False)
    @require_production
    def report_anomaly(self, wc_id, **kwargs):
        """
        *** CORE FEATURE — ANOMALY REPORT ***

        Operator presses "Report Machine Anomaly" on the console.

        What happens (all in one atomic call):
          1. Work center → status = 'breakdown' (turns RED on console)
          2. All in-progress MOs on this WC → state = 'on_hold'
          3. Held MOs auto-rerouted to best available alternative WC
          4. Anomaly event record created (immutable history)
          5. Audit log written
          6. Redis console cache invalidated
          7. Returns full rerouting report

        Request body:
          {
            "anomaly_type": "machine_breakdown",   (required)
            "description": "Saw blade snapped"     (optional)
          }

        Valid anomaly_type values:
          machine_breakdown | power_failure | material_shortage |
          operator_absent | quality_issue | safety_hazard |
          tool_failure | other

        Response:
          {
            "event_id": 42,
            "work_center": "Carpentry",
            "anomaly_type": "machine_breakdown",
            "held_mos": 3,
            "rerouted_count": 3,
            "unrouted_count": 0,
            "rerouting_details": [...],
            "message": "Breakdown reported on Carpentry. 3 MO(s) held. 3 rerouted."
          }
        """
        body = parse_body()
        if body is None:
            return json_err('Invalid JSON body.', 'INVALID_JSON', 400)

        anomaly_type = (body.get('anomaly_type') or '').strip()
        description = (body.get('description') or '').strip()

        if not anomaly_type:
            return json_err(
                'anomaly_type is required. '
                'Valid values: machine_breakdown, power_failure, material_shortage, '
                'operator_absent, quality_issue, safety_hazard, tool_failure, other',
                'MISSING_FIELD', 422
            )

        valid_types = {
            'machine_breakdown', 'power_failure', 'material_shortage',
            'operator_absent', 'quality_issue', 'safety_hazard',
            'tool_failure', 'other'
        }
        if anomaly_type not in valid_types:
            return json_err(
                f'Invalid anomaly_type: "{anomaly_type}". '
                f'Valid: {", ".join(sorted(valid_types))}',
                'INVALID_ANOMALY_TYPE', 422
            )

        wc = request.env['shiv.work.center'].sudo().browse(wc_id)
        if not wc.exists():
            return json_err('Work center not found.', 'NOT_FOUND', 404)

        try:
            result = wc.action_report_anomaly(
                anomaly_type=anomaly_type,
                description=description,
            )
            # Invalidate console cache so next poll shows breakdown immediately
            request.env['shiv.floor.console'].sudo().invalidate_console_cache()
        except UserError as e:
            return json_err(str(e), 'ANOMALY_ERROR', 400)
        except ValidationError as e:
            return json_err(str(e), 'VALIDATION_ERROR', 422)

        _logger.warning(
            'FLOOR CONSOLE: Anomaly reported on WC "%s" by user %s. '
            'Type: %s. MOs held: %d. Rerouted: %d.',
            wc.name, request.env.user.name, anomaly_type,
            result.get('held_mos', 0), result.get('rerouted_count', 0)
        )

        return json_ok(result, message=result.get('message', 'Anomaly reported.'), status=200)

    # ══════════════════════════════════════════════════════════════════════════
    # ANOMALY RESOLUTION
    # ══════════════════════════════════════════════════════════════════════════

    @http.route('/shiv/floor/work-centers/<int:wc_id>/resolve-anomaly',
                type='http', auth='user', methods=['POST'], csrf=False)
    @require_production_manager
    def resolve_anomaly(self, wc_id, **kwargs):
        """
        Supervisor resolves a breakdown.
        Work center → idle. On-hold MOs → in_progress (resumed).

        Request body:
          {
            "resolution_notes": "Saw blade replaced. Machine tested OK."
          }
        """
        body = parse_body()
        if body is None:
            return json_err('Invalid JSON body.', 'INVALID_JSON', 400)

        resolution_notes = (body.get('resolution_notes') or '').strip()

        wc = request.env['shiv.work.center'].sudo().browse(wc_id)
        if not wc.exists():
            return json_err('Work center not found.', 'NOT_FOUND', 404)

        try:
            result = wc.action_resolve_anomaly(resolution_notes=resolution_notes)
            request.env['shiv.floor.console'].sudo().invalidate_console_cache()
        except UserError as e:
            return json_err(str(e), 'RESOLVE_ERROR', 400)

        return json_ok(result, message=result.get('message', 'Anomaly resolved.'))

    # ══════════════════════════════════════════════════════════════════════════
    # ANOMALY HISTORY
    # ══════════════════════════════════════════════════════════════════════════

    @http.route('/shiv/floor/work-centers/<int:wc_id>/anomaly-history',
                type='http', auth='user', methods=['GET'], csrf=False)
    @require_production_manager
    def anomaly_history(self, wc_id, **kwargs):
        """
        Full anomaly event history for a specific work center.
        Sorted by most recent first.
        """
        wc = request.env['shiv.work.center'].sudo().browse(wc_id)
        if not wc.exists():
            return json_err('Work center not found.', 'NOT_FOUND', 404)

        limit = min(200, int(request.params.get('limit', 50)))
        events = request.env['shiv.wc.anomaly.event'].sudo().search([
            ('work_center_id', '=', wc_id),
        ], order='reported_at desc', limit=limit)

        return json_ok({
            'work_center': wc.name,
            'events': [{
                'id': ev.id,
                'anomaly_type': ev.anomaly_type,
                'description': ev.description,
                'state': ev.state,
                'reported_by': ev.reported_by.name if ev.reported_by else 'Unknown',
                'reported_at': str(ev.reported_at),
                'resolved_at': str(ev.resolved_at) if ev.resolved_at else None,
                'resolved_by': ev.resolved_by.name if ev.resolved_by else None,
                'resolution_notes': ev.resolution_notes or '',
                'downtime_minutes': ev.downtime_minutes,
                'held_mos': ev.held_mo_count,
                'rerouted_mos': ev.rerouted_mo_count,
            } for ev in events],
            'total_events': len(events),
            'total_downtime_minutes': sum(ev.downtime_minutes for ev in events),
        })

    # ══════════════════════════════════════════════════════════════════════════
    # MANUFACTURING ORDERS — Floor-level operations
    # ══════════════════════════════════════════════════════════════════════════

    @http.route('/shiv/floor/manufacturing-orders', type='http', auth='user',
                methods=['GET'], csrf=False)
    @require_production
    def list_floor_mos(self, **kwargs):
        """
        Live MO list for the floor.
        Filters: state, work_center_id, date_from, date_to
        """
        params = request.params
        domain = []

        state = params.get('state')
        if state:
            if ',' in state:
                domain.append(('state', 'in', state.split(',')))
            else:
                domain.append(('state', '=', state))
        else:
            # Default: active states only
            domain.append(('state', 'in', ['confirmed', 'in_progress', 'on_hold']))

        wc_id = params.get('work_center_id')
        if wc_id:
            domain.append(('work_center_id', '=', int(wc_id)))

        from_date = params.get('from_date')
        if from_date:
            domain.append(('scheduled_date', '>=', from_date))

        to_date = params.get('to_date')
        if to_date:
            domain.append(('scheduled_date', '<=', to_date))

        mos = request.env['shiv.manufacturing.order'].sudo().search(
            domain, order='scheduled_date asc', limit=200)

        return json_ok({
            'manufacturing_orders': [_serialize_mo(mo) for mo in mos],
            'count': len(mos),
        })

    @http.route('/shiv/floor/manufacturing-orders/<int:mo_id>/start',
                type='http', auth='user', methods=['POST'], csrf=False)
    @require_production
    def start_mo(self, mo_id, **kwargs):
        """Operator starts a confirmed MO — consumes components."""
        mo = request.env['shiv.manufacturing.order'].sudo().browse(mo_id)
        if not mo.exists():
            return json_err('Manufacturing order not found.', 'NOT_FOUND', 404)
        try:
            mo.action_start()
            request.env['shiv.floor.console'].sudo().invalidate_console_cache()
        except (UserError, ValidationError) as e:
            return json_err(str(e), 'MO_ERROR', 400)
        return json_ok(_serialize_mo(mo), message=f'{mo.name} started. Components consumed.')

    @http.route('/shiv/floor/manufacturing-orders/<int:mo_id>/done',
                type='http', auth='user', methods=['POST'], csrf=False)
    @require_production
    def complete_mo(self, mo_id, **kwargs):
        """Operator marks MO done — adds finished goods to inventory."""
        mo = request.env['shiv.manufacturing.order'].sudo().browse(mo_id)
        if not mo.exists():
            return json_err('Manufacturing order not found.', 'NOT_FOUND', 404)
        try:
            mo.action_mark_done()
            request.env['shiv.floor.console'].sudo().invalidate_console_cache()
        except (UserError, ValidationError) as e:
            return json_err(str(e), 'MO_ERROR', 400)
        return json_ok(
            _serialize_mo(mo),
            message=f'{mo.name} completed. {mo.qty_produced} units added to inventory.'
        )

    @http.route('/shiv/floor/manufacturing-orders/<int:mo_id>/resume',
                type='http', auth='user', methods=['POST'], csrf=False)
    @require_production_manager
    def resume_mo(self, mo_id, **kwargs):
        """Manager manually resumes a single on-hold MO."""
        mo = request.env['shiv.manufacturing.order'].sudo().browse(mo_id)
        if not mo.exists():
            return json_err('Manufacturing order not found.', 'NOT_FOUND', 404)
        if mo.state != 'on_hold':
            return json_err(
                f'MO is not on hold (current state: {mo.state}).',
                'INVALID_STATE', 409
            )
        mo.sudo().write({'state': 'in_progress', 'hold_reason': False, 'held_at': False})
        request.env['shiv.audit.log'].sudo()._log(
            model='shiv.manufacturing.order',
            record_id=mo.id,
            record_name=mo.name,
            action='write',
            changed_fields=['state'],
            values_before={'state': 'on_hold'},
            values_after={'state': 'in_progress'},
            actor_id=request.env.uid,
            notes='Manually resumed by production manager.',
        )
        request.env['shiv.floor.console'].sudo().invalidate_console_cache()
        return json_ok(_serialize_mo(mo), message=f'{mo.name} resumed.')

    # ══════════════════════════════════════════════════════════════════════════
    # ALERTS
    # ══════════════════════════════════════════════════════════════════════════

    @http.route('/shiv/floor/alerts', type='http', auth='user',
                methods=['GET'], csrf=False)
    @require_production
    def get_alerts(self, **kwargs):
        """
        Active floor alerts:
        - Breakdowns (critical)
        - Work centers paused > 30 min (warning)
        - On-hold MOs with idle work center (warning)
        - High utilization WCs > 90% (info)
        """
        alerts = []
        wcs = request.env['shiv.work.center'].sudo().search([('is_active', '=', True)])

        for wc in wcs:
            if wc.status == 'breakdown':
                alerts.append({
                    'level': 'critical',
                    'work_center_id': wc.id,
                    'work_center': wc.name,
                    'message': f'BREAKDOWN: {dict(wc._fields["anomaly_type"].selection).get(wc.anomaly_type, "Unknown")}',
                    'detail': wc.anomaly_description or '',
                    'since': str(wc.status_since) if wc.status_since else None,
                    'duration_minutes': wc.status_duration_minutes,
                    'on_hold_mos': wc.on_hold_mo_count,
                })
            elif wc.status == 'paused' and wc.status_duration_minutes > 30:
                alerts.append({
                    'level': 'warning',
                    'work_center_id': wc.id,
                    'work_center': wc.name,
                    'message': f'Paused for {wc.status_duration_minutes} minutes',
                    'duration_minutes': wc.status_duration_minutes,
                })
            elif wc.utilization_pct > 90:
                alerts.append({
                    'level': 'info',
                    'work_center_id': wc.id,
                    'work_center': wc.name,
                    'message': f'High utilization: {wc.utilization_pct:.1f}%',
                })

        # Unassigned on-hold MOs (no work center assigned after rerouting failed)
        unassigned_held = request.env['shiv.manufacturing.order'].sudo().search([
            ('state', '=', 'on_hold'),
            ('work_center_id', '=', False),
        ])
        for mo in unassigned_held:
            alerts.append({
                'level': 'critical',
                'work_center_id': None,
                'work_center': 'UNASSIGNED',
                'message': f'MO {mo.name} on hold with no work center assigned',
                'mo_id': mo.id,
                'product': mo.product_id.name,
            })

        return json_ok({
            'alerts': alerts,
            'critical_count': sum(1 for a in alerts if a['level'] == 'critical'),
            'warning_count': sum(1 for a in alerts if a['level'] == 'warning'),
            'info_count': sum(1 for a in alerts if a['level'] == 'info'),
            'total': len(alerts),
        })

    # ══════════════════════════════════════════════════════════════════════════
    # ANOMALY EVENTS — System-wide history
    # ══════════════════════════════════════════════════════════════════════════

    @http.route('/shiv/floor/anomaly-events', type='http', auth='user',
                methods=['GET'], csrf=False)
    @require_production_manager
    def list_anomaly_events(self, **kwargs):
        """
        All anomaly events with filtering.
        Query params: state (active|resolved), wc_id, from_date, to_date, limit
        """
        params = request.params
        domain = []

        state = params.get('state')
        if state:
            domain.append(('state', '=', state))

        wc_id = params.get('wc_id')
        if wc_id:
            domain.append(('work_center_id', '=', int(wc_id)))

        from_date = params.get('from_date')
        if from_date:
            domain.append(('reported_at', '>=', from_date))

        to_date = params.get('to_date')
        if to_date:
            domain.append(('reported_at', '<=', to_date))

        limit = min(500, int(params.get('limit', 100)))
        events = request.env['shiv.wc.anomaly.event'].sudo().search(
            domain, order='reported_at desc', limit=limit)

        total_downtime = sum(ev.downtime_minutes for ev in events)
        total_held = sum(ev.held_mo_count for ev in events)
        total_rerouted = sum(ev.rerouted_mo_count for ev in events)

        return json_ok({
            'events': [{
                'id': ev.id,
                'work_center_id': ev.work_center_id.id,
                'work_center': ev.work_center_id.name,
                'anomaly_type': ev.anomaly_type,
                'description': ev.description,
                'state': ev.state,
                'reported_by': ev.reported_by.name if ev.reported_by else 'Unknown',
                'reported_at': str(ev.reported_at),
                'resolved_at': str(ev.resolved_at) if ev.resolved_at else None,
                'resolved_by': ev.resolved_by.name if ev.resolved_by else None,
                'downtime_minutes': ev.downtime_minutes,
                'held_mos': ev.held_mo_count,
                'rerouted_mos': ev.rerouted_mo_count,
            } for ev in events],
            'count': len(events),
            'stats': {
                'total_downtime_minutes': total_downtime,
                'total_mos_held': total_held,
                'total_mos_rerouted': total_rerouted,
                'avg_downtime_minutes': round(total_downtime / len(events), 1) if events else 0,
            },
        })
