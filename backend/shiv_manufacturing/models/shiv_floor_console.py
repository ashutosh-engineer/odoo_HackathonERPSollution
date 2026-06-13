# -*- coding: utf-8 -*-
"""
shiv_manufacturing/models/shiv_floor_console.py
Shiv Furniture Works ERP — Factory Floor Console Backend
Production-ready | Odoo 16

Aggregates live data for the Work Center Status Console.
Called by the REST API to serve real-time shop floor data.
Redis-cached for <50ms panel refresh (fallback: PostgreSQL direct).
"""

import json
import logging
from odoo import api, models, fields

_logger = logging.getLogger(__name__)
CONSOLE_CACHE_KEY = 'shiv:floor:console'
CONSOLE_CACHE_TTL = 15  # 15 seconds — near real-time


class ShivFloorConsole(models.TransientModel):
    """
    Transient model — no DB table.
    Provides all data needed for the floor console panel.
    """
    _name = 'shiv.floor.console'
    _description = 'Shiv Furniture - Factory Floor Console'

    @api.model
    def get_console_data(self):
        """
        Returns complete floor console payload.
        Cached in Redis for 15s.

        Response shape:
        {
            "work_centers": [
                {
                    "id": 1,
                    "name": "Carpentry",
                    "code": "WC-CARP",
                    "type": "carpentry",
                    "status": "running",
                    "status_since": "2026-06-13T08:30:00",
                    "status_duration_minutes": 45,
                    "utilization_pct": 80.0,
                    "active_mo_count": 4,
                    "on_hold_mo_count": 0,
                    "today_completed": 6,
                    "today_units_produced": 6.0,
                    "anomaly": null,
                    "active_mos": [...],
                    "on_hold_mos": [...],
                    "alternatives": ["Carpentry-B", "Finishing"]
                }
            ],
            "summary": {
                "total_wcs": 5,
                "running": 3,
                "idle": 1,
                "breakdown": 1,
                "total_active_mos": 12,
                "total_on_hold_mos": 2
            },
            "alerts": [...],
            "generated_at": "2026-06-13T10:15:00"
        }
        """
        # ── Redis cache check ─────────────────────────────────────────────
        redis_client = self._get_redis()
        if redis_client:
            try:
                cached = redis_client.get(CONSOLE_CACHE_KEY)
                if cached:
                    return json.loads(cached)
            except Exception as e:
                _logger.warning('Redis read failed for console cache: %s', e)

        # ── Compute from PostgreSQL ───────────────────────────────────────
        data = self._compute_console_data()

        # ── Store in Redis ────────────────────────────────────────────────
        if redis_client:
            try:
                redis_client.setex(
                    CONSOLE_CACHE_KEY,
                    CONSOLE_CACHE_TTL,
                    json.dumps(data, default=str)
                )
            except Exception as e:
                _logger.warning('Redis write failed for console cache: %s', e)

        return data

    @api.model
    def _compute_console_data(self):
        """Build full console payload from live PostgreSQL data."""
        WorkCenter = self.env['shiv.work.center'].sudo()
        MO = self.env['shiv.manufacturing.order'].sudo()

        work_centers = WorkCenter.search(
            [('is_active', '=', True)],
            order='sequence asc, name asc'
        )

        wc_payloads = []
        status_counts = {
            'idle': 0, 'running': 0, 'paused': 0,
            'breakdown': 0, 'maintenance': 0, 'offline': 0
        }
        total_active_mos = 0
        total_on_hold_mos = 0
        alerts = []

        for wc in work_centers:
            # Count status
            status_counts[wc.status] = status_counts.get(wc.status, 0) + 1

            # Active MOs for this WC
            active_mos = MO.search([
                ('work_center_id', '=', wc.id),
                ('state', '=', 'in_progress'),
            ], order='scheduled_date asc')

            on_hold_mos = MO.search([
                ('work_center_id', '=', wc.id),
                ('state', '=', 'on_hold'),
            ])

            total_active_mos += len(active_mos)
            total_on_hold_mos += len(on_hold_mos)

            # Anomaly info
            anomaly_data = None
            if wc.status == 'breakdown':
                active_event = self.env['shiv.wc.anomaly.event'].sudo().search([
                    ('work_center_id', '=', wc.id),
                    ('state', '=', 'active'),
                ], limit=1)
                if active_event:
                    anomaly_data = {
                        'event_id': active_event.id,
                        'type': active_event.anomaly_type,
                        'description': active_event.description,
                        'reported_by': active_event.reported_by.name if active_event.reported_by else 'Unknown',
                        'reported_at': str(active_event.reported_at),
                        'held_mos': active_event.held_mo_count,
                        'rerouted_mos': active_event.rerouted_mo_count,
                    }
                alerts.append({
                    'level': 'critical',
                    'work_center': wc.name,
                    'message': f'BREAKDOWN: {wc.anomaly_type or "Unknown"} — {wc.anomaly_description or "No details"}',
                    'since': str(wc.status_since) if wc.status_since else None,
                })

            # Low utilization alert
            if wc.status == 'idle' and wc.on_hold_mo_count > 0:
                alerts.append({
                    'level': 'warning',
                    'work_center': wc.name,
                    'message': f'{wc.on_hold_mo_count} MO(s) on hold — work center is idle',
                })

            # Status duration alert (paused > 30 min)
            if wc.status == 'paused' and wc.status_duration_minutes > 30:
                alerts.append({
                    'level': 'warning',
                    'work_center': wc.name,
                    'message': f'Paused for {wc.status_duration_minutes} minutes',
                })

            wc_payloads.append({
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
                'active_mo_count': len(active_mos),
                'on_hold_mo_count': len(on_hold_mos),
                'today_completed': wc.today_completed_count,
                'today_units_produced': wc.today_units_produced,
                'anomaly': anomaly_data,
                'alternatives': [
                    {'id': alt.id, 'name': alt.name, 'status': alt.status}
                    for alt in wc.alternative_workcenter_ids
                ],
                'active_mos': [
                    {
                        'id': mo.id,
                        'name': mo.name,
                        'product': mo.product_id.name,
                        'qty_to_produce': mo.qty_to_produce,
                        'qty_produced': mo.qty_produced,
                        'progress_pct': round(
                            (mo.qty_produced / mo.qty_to_produce * 100)
                            if mo.qty_to_produce else 0, 1),
                        'scheduled_date': str(mo.scheduled_date) if mo.scheduled_date else None,
                    }
                    for mo in active_mos
                ],
                'on_hold_mos': [
                    {
                        'id': mo.id,
                        'name': mo.name,
                        'product': mo.product_id.name,
                        'hold_reason': mo.hold_reason or '',
                        'held_at': str(mo.held_at) if mo.held_at else None,
                        'rerouted_from': mo.rerouted_from_wc_id.name if mo.rerouted_from_wc_id else None,
                    }
                    for mo in on_hold_mos
                ],
            })

        return {
            'generated_at': str(fields.Datetime.now()),
            'cache_ttl_seconds': CONSOLE_CACHE_TTL,
            'work_centers': wc_payloads,
            'summary': {
                'total_wcs': len(work_centers),
                'running': status_counts.get('running', 0),
                'idle': status_counts.get('idle', 0),
                'paused': status_counts.get('paused', 0),
                'breakdown': status_counts.get('breakdown', 0),
                'maintenance': status_counts.get('maintenance', 0),
                'total_active_mos': total_active_mos,
                'total_on_hold_mos': total_on_hold_mos,
            },
            'alerts': alerts,
        }

    @api.model
    def invalidate_console_cache(self):
        """Bust floor console cache — called after any status change."""
        redis_client = self._get_redis()
        if redis_client:
            try:
                redis_client.delete(CONSOLE_CACHE_KEY)
            except Exception:
                pass

    @staticmethod
    def _get_redis():
        """Get Redis client. Returns None if Redis unavailable (graceful degradation)."""
        try:
            import redis as redis_lib
            import os
            return redis_lib.from_url(
                os.environ.get('REDIS_URL', 'redis://:ShivRedis@2024@redis:6379/0'),
                decode_responses=True,
                socket_connect_timeout=1,
            )
        except Exception:
            return None
