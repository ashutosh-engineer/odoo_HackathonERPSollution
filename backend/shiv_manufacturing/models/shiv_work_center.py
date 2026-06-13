# -*- coding: utf-8 -*-
"""
shiv_manufacturing/models/shiv_work_center.py
Shiv Furniture Works ERP — Work Center with Live Status Console Support
Production-ready | Odoo 16

Features:
- Live operational status (idle/running/paused/breakdown/maintenance)
- Anomaly reporting with auto-rerouting of Manufacturing Orders
- Capacity tracking and utilization %
- Full audit trail on every status change
"""

import logging
from datetime import datetime, timedelta
from odoo import api, fields, models, _
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)


class ShivWorkCenter(models.Model):
    """
    Work Center master with live operational status.
    One row per physical work center on the factory floor.
    Status drives the entire Work Center Status Console.
    """
    _name = 'shiv.work.center'
    _description = 'Shiv Furniture - Work Center'
    _rec_name = 'name'
    _order = 'sequence asc, name asc'

    # ── Identity ──────────────────────────────────────────────────────────────
    name = fields.Char(
        string='Work Center Name', required=True, index=True)

    code = fields.Char(
        string='Code', size=16, index=True, copy=False)

    sequence = fields.Integer(
        string='Sequence', default=10,
        help='Display order on the floor console.')

    color = fields.Integer(
        string='Color Index', default=0,
        help='Kanban color for visual differentiation on console.')

    workcenter_type = fields.Selection([
        ('cutting',     'Cutting'),
        ('carpentry',   'Carpentry'),
        ('upholstery',  'Upholstery'),
        ('finishing',   'Finishing & Polish'),
        ('assembly',    'Final Assembly'),
        ('qc',          'Quality Control'),
        ('packaging',   'Packaging'),
        ('other',       'Other'),
    ], string='Type', required=True, default='other')

    # ── Capacity ──────────────────────────────────────────────────────────────
    capacity = fields.Integer(
        string='Capacity (units/day)', default=10,
        help='Maximum units this work center can process per 8-hour shift.')

    operator_count = fields.Integer(
        string='Assigned Operators', default=1)

    # ── Live Status ───────────────────────────────────────────────────────────
    status = fields.Selection([
        ('idle',        'Idle'),
        ('running',     'Running'),
        ('paused',      'Paused'),
        ('breakdown',   'Breakdown ⚠'),
        ('maintenance', 'Scheduled Maintenance'),
        ('offline',     'Offline'),
    ], string='Current Status', default='idle',
       required=True, index=True, tracking=True,
       help='Live operational status. Changes trigger console updates.')

    status_since = fields.Datetime(
        string='Status Since', readonly=True,
        default=fields.Datetime.now,
        help='Timestamp when current status was set.')

    status_duration_minutes = fields.Integer(
        string='Status Duration (min)',
        compute='_compute_status_duration',
        store=False,
        help='How long the work center has been in current status.')

    # ── Anomaly ───────────────────────────────────────────────────────────────
    anomaly_type = fields.Selection([
        ('machine_breakdown',   'Machine Breakdown'),
        ('power_failure',       'Power Failure'),
        ('material_shortage',   'Material Shortage'),
        ('operator_absent',     'Operator Absent'),
        ('quality_issue',       'Quality Issue'),
        ('safety_hazard',       'Safety Hazard'),
        ('tool_failure',        'Tool / Equipment Failure'),
        ('other',               'Other'),
    ], string='Anomaly Type', readonly=True,
       help='Populated when status = breakdown.')

    anomaly_description = fields.Text(
        string='Anomaly Description', readonly=True,
        help='Operator-reported description of the breakdown.')

    anomaly_reported_by = fields.Many2one(
        'res.users', string='Reported By', readonly=True, ondelete='set null')

    anomaly_reported_at = fields.Datetime(
        string='Reported At', readonly=True)

    anomaly_resolved_at = fields.Datetime(
        string='Resolved At', readonly=True)

    anomaly_resolution_notes = fields.Text(
        string='Resolution Notes', readonly=True)

    # ── Alternative Work Centers ──────────────────────────────────────────────
    alternative_workcenter_ids = fields.Many2many(
        'shiv.work.center',
        'shiv_wc_alternative_rel',
        'workcenter_id',
        'alternative_id',
        string='Alternative Work Centers',
        help='When this WC breaks down, active MOs are rerouted here in priority order.')

    # ── Performance ───────────────────────────────────────────────────────────
    utilization_pct = fields.Float(
        string='Utilization %', digits=(5, 2), default=0.0,
        help='Auto-computed from active work orders vs capacity.')

    active_mo_count = fields.Integer(
        string='Active MOs',
        compute='_compute_active_mo_count',
        store=False)

    on_hold_mo_count = fields.Integer(
        string='On Hold MOs',
        compute='_compute_active_mo_count',
        store=False)

    today_completed_count = fields.Integer(
        string='Completed Today',
        compute='_compute_today_stats',
        store=False)

    today_units_produced = fields.Float(
        string='Units Produced Today', digits=(12, 2),
        compute='_compute_today_stats',
        store=False)

    is_active = fields.Boolean(string='Active', default=True, index=True)

    # ── SQL Constraints ───────────────────────────────────────────────────────
    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Work center code must be unique.'),
        ('capacity_positive', 'CHECK(capacity > 0)', 'Capacity must be positive.'),
        ('utilization_range', 'CHECK(utilization_pct BETWEEN 0 AND 100)',
         'Utilization must be 0–100%.'),
    ]

    # ── Computed ──────────────────────────────────────────────────────────────

    def _compute_status_duration(self):
        now = fields.Datetime.now()
        for wc in self:
            if wc.status_since:
                delta = now - wc.status_since
                wc.status_duration_minutes = int(delta.total_seconds() / 60)
            else:
                wc.status_duration_minutes = 0

    def _compute_active_mo_count(self):
        for wc in self:
            wc.active_mo_count = self.env['shiv.manufacturing.order'].search_count([
                ('work_center_id', '=', wc.id),
                ('state', '=', 'in_progress'),
            ])
            wc.on_hold_mo_count = self.env['shiv.manufacturing.order'].search_count([
                ('work_center_id', '=', wc.id),
                ('state', '=', 'on_hold'),
            ])

    def _compute_today_stats(self):
        today_start = fields.Datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        for wc in self:
            done_mos = self.env['shiv.manufacturing.order'].search([
                ('work_center_id', '=', wc.id),
                ('state', '=', 'done'),
                ('write_date', '>=', today_start),
            ])
            wc.today_completed_count = len(done_mos)
            wc.today_units_produced = sum(mo.qty_produced for mo in done_mos)

    # ──────────────────────────────────────────────────────────────────────────
    # STATUS TRANSITION METHODS
    # ──────────────────────────────────────────────────────────────────────────

    def action_set_running(self):
        """Operator starts a work center (marks it running)."""
        for wc in self:
            if wc.status == 'breakdown':
                raise UserError(
                    _('Work center "%s" has an active breakdown. '
                      'Resolve it first before resuming operations.') % wc.name)
            wc._set_status('running')

    def action_set_paused(self):
        """Operator pauses a running work center (break, shift change, etc.)."""
        for wc in self:
            wc._set_status('paused')

    def action_set_idle(self):
        """Work center completes all work and returns to idle."""
        for wc in self:
            wc._set_status('idle')

    def action_set_maintenance(self):
        """Schedule maintenance — puts WC offline, holds active MOs."""
        for wc in self:
            wc._set_status('maintenance')
            wc._hold_active_mos(reason='Scheduled maintenance.')

    def _set_status(self, new_status):
        """Internal status setter — always records timestamp and audit log."""
        self.ensure_one()
        old_status = self.status
        self.sudo().write({
            'status': new_status,
            'status_since': fields.Datetime.now(),
        })
        self.env['shiv.audit.log'].sudo()._log(
            model='shiv.work.center',
            record_id=self.id,
            record_name=self.name,
            action='write',
            changed_fields=['status'],
            values_before={'status': old_status},
            values_after={'status': new_status},
            actor_id=self.env.uid,
            notes=f'Status changed: {old_status} → {new_status}',
        )
        _logger.info('WorkCenter "%s" status: %s → %s', self.name, old_status, new_status)

    # ──────────────────────────────────────────────────────────────────────────
    # ANOMALY REPORTING — THE CORE FEATURE
    # ──────────────────────────────────────────────────────────────────────────

    def action_report_anomaly(self, anomaly_type, description=''):
        """
        MAIN ANOMALY METHOD — called from API and UI button.

        What happens in sequence:
        1. Work center status → 'breakdown'
        2. All active (in_progress) MOs on this WC → 'on_hold'
        3. Auto-reroute held MOs to alternative work centers
        4. Log anomaly event with full details
        5. Create audit log entry
        6. Return rerouting report
        """
        self.ensure_one()

        if self.status == 'breakdown':
            raise UserError(
                _('Work center "%s" already has an active breakdown reported.') % self.name)

        if not anomaly_type:
            raise ValidationError(_('Anomaly type is required.'))

        now = fields.Datetime.now()

        # Step 1: Mark work center as breakdown
        old_status = self.status
        self.sudo().write({
            'status': 'breakdown',
            'status_since': now,
            'anomaly_type': anomaly_type,
            'anomaly_description': description or '',
            'anomaly_reported_by': self.env.uid,
            'anomaly_reported_at': now,
            'anomaly_resolved_at': False,
            'anomaly_resolution_notes': False,
        })

        # Step 2: Put all in-progress MOs on hold
        held_mos = self._hold_active_mos(
            reason=f'Work center breakdown: {anomaly_type}. {description}')

        # Step 3: Auto-reroute to alternatives
        rerouting_report = self._auto_reroute_mos(held_mos)

        # Step 4 & 5: Comprehensive audit log
        self.env['shiv.audit.log'].sudo()._log(
            model='shiv.work.center',
            record_id=self.id,
            record_name=self.name,
            action='write',
            changed_fields=['status', 'anomaly_type', 'anomaly_description'],
            values_before={'status': old_status},
            values_after={
                'status': 'breakdown',
                'anomaly_type': anomaly_type,
                'held_mos': len(held_mos),
                'rerouted_mos': rerouting_report['rerouted_count'],
            },
            actor_id=self.env.uid,
            notes=(
                f'ANOMALY REPORTED: {anomaly_type}. '
                f'Description: {description}. '
                f'MOs held: {len(held_mos)}. '
                f'MOs rerouted: {rerouting_report["rerouted_count"]}.'
            ),
        )

        # Create anomaly event record
        event = self.env['shiv.wc.anomaly.event'].sudo().create({
            'work_center_id': self.id,
            'anomaly_type': anomaly_type,
            'description': description or '',
            'reported_by': self.env.uid,
            'reported_at': now,
            'held_mo_count': len(held_mos),
            'rerouted_mo_count': rerouting_report['rerouted_count'],
            'rerouting_details': str(rerouting_report['details']),
            'state': 'active',
        })

        _logger.warning(
            'ANOMALY: WorkCenter "%s" → breakdown. Type: %s. '
            'MOs held: %d. MOs rerouted: %d.',
            self.name, anomaly_type, len(held_mos), rerouting_report['rerouted_count']
        )

        return {
            'event_id': event.id,
            'work_center': self.name,
            'anomaly_type': anomaly_type,
            'held_mos': len(held_mos),
            'rerouted_count': rerouting_report['rerouted_count'],
            'unrouted_count': rerouting_report['unrouted_count'],
            'rerouting_details': rerouting_report['details'],
            'message': (
                f'Breakdown reported on {self.name}. '
                f'{len(held_mos)} MO(s) put on hold. '
                f'{rerouting_report["rerouted_count"]} rerouted. '
                f'{rerouting_report["unrouted_count"]} require manual assignment.'
            ),
        }

    def _hold_active_mos(self, reason=''):
        """
        Put all in-progress MOs on this work center on hold.
        Returns the recordset of held MOs.
        """
        self.ensure_one()
        active_mos = self.env['shiv.manufacturing.order'].search([
            ('work_center_id', '=', self.id),
            ('state', '=', 'in_progress'),
        ])
        for mo in active_mos:
            mo.sudo().write({
                'state': 'on_hold',
                'hold_reason': reason,
                'held_at': fields.Datetime.now(),
            })
            self.env['shiv.audit.log'].sudo()._log(
                model='shiv.manufacturing.order',
                record_id=mo.id,
                record_name=mo.name,
                action='write',
                changed_fields=['state'],
                values_before={'state': 'in_progress'},
                values_after={'state': 'on_hold', 'reason': reason},
                actor_id=self.env.uid,
                notes=f'Auto-held due to work center breakdown: {self.name}',
            )
        if active_mos:
            _logger.info('Held %d MOs due to breakdown on "%s"', len(active_mos), self.name)
        return active_mos

    def _auto_reroute_mos(self, mos):
        """
        Auto-reroute held MOs to available alternative work centers.

        Algorithm:
        1. Get alternative work centers (not in breakdown/maintenance/offline)
        2. Sort by: status=idle first, then running, then by utilization asc
        3. Assign each MO to the least-loaded available alternative
        4. Return rerouting report

        Returns dict:
            rerouted_count: int
            unrouted_count: int
            details: list of {mo_name, from_wc, to_wc, status}
        """
        self.ensure_one()

        if not mos:
            return {'rerouted_count': 0, 'unrouted_count': 0, 'details': []}

        # Get available alternatives sorted by load
        alternatives = self.alternative_workcenter_ids.filtered(
            lambda wc: wc.status not in ('breakdown', 'maintenance', 'offline')
                       and wc.is_active
        ).sorted(key=lambda wc: (
            0 if wc.status == 'idle' else 1 if wc.status == 'running' else 2,
            wc.utilization_pct
        ))

        rerouted = 0
        unrouted = 0
        details = []

        if not alternatives:
            # No alternatives available — all MOs stay on hold
            for mo in mos:
                details.append({
                    'mo_name': mo.name,
                    'product': mo.product_id.name,
                    'from_wc': self.name,
                    'to_wc': None,
                    'status': 'unrouted_no_alternatives',
                })
            unrouted = len(mos)
        else:
            # Round-robin across alternatives to balance load
            alt_list = list(alternatives)
            for i, mo in enumerate(mos):
                target_wc = alt_list[i % len(alt_list)]
                old_wc_name = mo.work_center_id.name if mo.work_center_id else 'None'

                mo.sudo().write({
                    'work_center_id': target_wc.id,
                    'rerouted_from_wc_id': self.id,
                    'rerouted_at': fields.Datetime.now(),
                    'reroute_reason': f'Auto-rerouted from {self.name} (breakdown)',
                })

                self.env['shiv.audit.log'].sudo()._log(
                    model='shiv.manufacturing.order',
                    record_id=mo.id,
                    record_name=mo.name,
                    action='write',
                    changed_fields=['work_center_id'],
                    values_before={'work_center_id': self.id, 'work_center_name': self.name},
                    values_after={'work_center_id': target_wc.id, 'work_center_name': target_wc.name},
                    actor_id=self.env.uid,
                    notes=f'Auto-rerouted: {self.name} → {target_wc.name} (breakdown recovery)',
                )

                details.append({
                    'mo_name': mo.name,
                    'product': mo.product_id.name,
                    'from_wc': old_wc_name,
                    'to_wc': target_wc.name,
                    'status': 'rerouted',
                })
                rerouted += 1

                _logger.info(
                    'MO "%s" rerouted: %s → %s', mo.name, self.name, target_wc.name)

        return {
            'rerouted_count': rerouted,
            'unrouted_count': unrouted,
            'details': details,
        }

    # ──────────────────────────────────────────────────────────────────────────
    # ANOMALY RESOLUTION
    # ──────────────────────────────────────────────────────────────────────────

    def action_resolve_anomaly(self, resolution_notes=''):
        """
        Resolve the current breakdown:
        1. Mark WC as idle
        2. Resolve the anomaly event record
        3. Resume held MOs that were NOT rerouted (still on this WC)
        4. Write audit log
        """
        self.ensure_one()

        if self.status != 'breakdown':
            raise UserError(
                _('Work center "%s" does not have an active breakdown.') % self.name)

        now = fields.Datetime.now()

        # Resolve the anomaly event
        active_event = self.env['shiv.wc.anomaly.event'].sudo().search([
            ('work_center_id', '=', self.id),
            ('state', '=', 'active'),
        ], limit=1)

        if active_event:
            downtime_minutes = 0
            if active_event.reported_at:
                downtime_minutes = int(
                    (now - active_event.reported_at).total_seconds() / 60)
            active_event.sudo().write({
                'state': 'resolved',
                'resolved_at': now,
                'resolved_by': self.env.uid,
                'resolution_notes': resolution_notes or '',
                'downtime_minutes': downtime_minutes,
            })

        # Update work center
        self.sudo().write({
            'status': 'idle',
            'status_since': now,
            'anomaly_type': False,
            'anomaly_description': False,
            'anomaly_resolved_at': now,
            'anomaly_resolution_notes': resolution_notes or '',
        })

        # Resume on-hold MOs that are still assigned to THIS work center
        held_mos = self.env['shiv.manufacturing.order'].search([
            ('work_center_id', '=', self.id),
            ('state', '=', 'on_hold'),
        ])
        resumed_count = 0
        for mo in held_mos:
            mo.sudo().write({'state': 'in_progress', 'hold_reason': False, 'held_at': False})
            resumed_count += 1

        self.env['shiv.audit.log'].sudo()._log(
            model='shiv.work.center',
            record_id=self.id,
            record_name=self.name,
            action='write',
            changed_fields=['status', 'anomaly_resolved_at'],
            values_before={'status': 'breakdown'},
            values_after={'status': 'idle', 'resolution': resolution_notes},
            actor_id=self.env.uid,
            notes=(
                f'Anomaly resolved. '
                f'Downtime: {active_event.downtime_minutes if active_event else "?"} min. '
                f'MOs resumed: {resumed_count}. '
                f'Notes: {resolution_notes}'
            ),
        )

        _logger.info(
            'WorkCenter "%s" anomaly resolved. Downtime: %d min. MOs resumed: %d.',
            self.name,
            active_event.downtime_minutes if active_event else 0,
            resumed_count,
        )

        return {
            'work_center': self.name,
            'resolved_at': str(now),
            'downtime_minutes': active_event.downtime_minutes if active_event else 0,
            'mos_resumed': resumed_count,
            'message': (
                f'{self.name} back online. '
                f'{resumed_count} MO(s) resumed. '
                f'Downtime: {active_event.downtime_minutes if active_event else "?"} minutes.'
            ),
        }

    # ──────────────────────────────────────────────────────────────────────────
    # UTILIZATION RECOMPUTE
    # ──────────────────────────────────────────────────────────────────────────

    @api.model
    def cron_recompute_utilization(self):
        """
        Scheduled action: recompute utilization % for all work centers.
        Run every 15 minutes via ir.cron.
        utilization = (active MOs / capacity) * 100, capped at 100%
        """
        for wc in self.search([('is_active', '=', True)]):
            active_count = self.env['shiv.manufacturing.order'].search_count([
                ('work_center_id', '=', wc.id),
                ('state', 'in', ['confirmed', 'in_progress']),
            ])
            utilization = min(100.0, (active_count / wc.capacity) * 100) if wc.capacity else 0.0
            wc.sudo().write({'utilization_pct': round(utilization, 2)})


class ShivWCAnomalyEvent(models.Model):
    """
    Immutable record of every anomaly event on a work center.
    Tracks downtime, rerouting, resolution for KPI reporting.
    """
    _name = 'shiv.wc.anomaly.event'
    _description = 'Shiv Furniture - Work Center Anomaly Event'
    _order = 'reported_at desc'
    _rec_name = 'display_name_computed'

    work_center_id = fields.Many2one(
        'shiv.work.center', string='Work Center',
        required=True, index=True, ondelete='restrict')

    anomaly_type = fields.Selection([
        ('machine_breakdown',   'Machine Breakdown'),
        ('power_failure',       'Power Failure'),
        ('material_shortage',   'Material Shortage'),
        ('operator_absent',     'Operator Absent'),
        ('quality_issue',       'Quality Issue'),
        ('safety_hazard',       'Safety Hazard'),
        ('tool_failure',        'Tool / Equipment Failure'),
        ('other',               'Other'),
    ], string='Anomaly Type', required=True, readonly=True)

    description = fields.Text(string='Description', readonly=True)

    state = fields.Selection([
        ('active',   'Active'),
        ('resolved', 'Resolved'),
    ], string='State', default='active', required=True, index=True)

    reported_by = fields.Many2one(
        'res.users', string='Reported By', readonly=True, ondelete='set null')

    reported_at = fields.Datetime(
        string='Reported At', required=True, readonly=True, index=True)

    resolved_at = fields.Datetime(string='Resolved At', readonly=True)

    resolved_by = fields.Many2one(
        'res.users', string='Resolved By', readonly=True, ondelete='set null')

    resolution_notes = fields.Text(string='Resolution Notes', readonly=True)

    downtime_minutes = fields.Integer(
        string='Downtime (minutes)', readonly=True, default=0)

    held_mo_count = fields.Integer(
        string='MOs Put on Hold', readonly=True, default=0)

    rerouted_mo_count = fields.Integer(
        string='MOs Rerouted', readonly=True, default=0)

    rerouting_details = fields.Text(
        string='Rerouting Details (JSON)', readonly=True)

    display_name_computed = fields.Char(
        compute='_compute_display_name', store=True)

    @api.depends('work_center_id', 'anomaly_type', 'reported_at')
    def _compute_display_name(self):
        for ev in self:
            ev.display_name_computed = (
                f'{ev.work_center_id.name} | {ev.anomaly_type} | {ev.reported_at}'
            )
