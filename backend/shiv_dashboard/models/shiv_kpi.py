# -*- coding: utf-8 -*-
"""
Module 7 — Dashboard & KPI Reporting
Redis-cached KPI computation.
Cache TTL: 300s (5 min). Cache miss: recompute from PostgreSQL, re-cache.
Response: <50ms (cache hit), <2s (cache miss).
"""
import json
import logging
from datetime import date, timedelta

from odoo import api, models, fields, _

_logger = logging.getLogger(__name__)
KPI_CACHE_KEY = 'shiv:dashboard:kpis'
KPI_CACHE_TTL = 300  # 5 minutes


class ShivKPI(models.TransientModel):
    """Transient model — no DB table. Used only as a namespace for KPI methods."""
    _name = 'shiv.kpi'
    _description = 'Shiv Furniture - KPI Engine'

    @api.model
    def get_dashboard_kpis(self):
        """
        Returns full dashboard KPI payload.
        1. Try Redis cache → return immediately if fresh (< 5 min old)
        2. On cache miss → compute from PostgreSQL → cache result → return

        Response shape:
        {
            "sales": { today, this_month, pipeline_value, on_time_pct },
            "inventory": { total_products, low_stock_count, total_value },
            "procurement": { open_pos, pending_approval, avg_lead_days },
            "manufacturing": { active_mos, utilization_pct, avg_cycle_days },
            "alerts": [ ... ]
        }
        """
        # ── Redis cache check ─────────────────────────────────────────────
        try:
            import redis as redis_lib
            import os
            r = redis_lib.from_url(
                os.environ.get('REDIS_URL', 'redis://:ShivRedis@2024@redis:6379/0'),
                decode_responses=True)
            cached = r.get(KPI_CACHE_KEY)
            if cached:
                return json.loads(cached)
        except Exception as e:
            _logger.warning('Redis unavailable for KPI cache: %s', str(e))
            r = None

        # ── Compute from PostgreSQL ───────────────────────────────────────
        kpis = self._compute_kpis()

        # ── Store in Redis ────────────────────────────────────────────────
        if r:
            try:
                r.setex(KPI_CACHE_KEY, KPI_CACHE_TTL, json.dumps(kpis, default=str))
            except Exception as e:
                _logger.warning('Redis write failed for KPI cache: %s', str(e))

        return kpis

    @api.model
    def _compute_kpis(self):
        today = date.today()
        month_start = today.replace(day=1)
        cr = self.env.cr

        # ── Sales KPIs ─────────────────────────────────────────────────────
        cr.execute("""
            SELECT
                COUNT(*) FILTER (WHERE DATE(date_order) = %s) AS orders_today,
                COUNT(*) FILTER (WHERE date_order >= %s) AS orders_this_month,
                COALESCE(SUM(total_amount) FILTER (WHERE state = 'confirmed'), 0) AS pipeline_value,
                COALESCE(
                    100.0 * COUNT(*) FILTER (WHERE state = 'delivered' AND delivery_date >= DATE(date_order))
                    / NULLIF(COUNT(*) FILTER (WHERE state IN ('delivered','done')), 0),
                0) AS on_time_pct
            FROM shiv_sale_order
            WHERE state != 'cancelled'
        """, (today, month_start))
        sales_row = cr.fetchone()

        # ── Inventory KPIs ─────────────────────────────────────────────────
        cr.execute("""
            SELECT
                COUNT(*) AS total_products,
                COUNT(*) FILTER (
                    WHERE ss.qty_available <= sp.reorder_point
                    AND sp.reorder_point > 0
                ) AS low_stock_count,
                COALESCE(SUM(ss.qty_on_hand * sp.cost_price), 0) AS total_value
            FROM shiv_stock_summary ss
            JOIN shiv_product sp ON ss.product_id = sp.id
        """)
        inv_row = cr.fetchone()

        # ── Procurement KPIs ───────────────────────────────────────────────
        cr.execute("""
            SELECT
                COUNT(*) FILTER (WHERE state IN ('draft','confirmed')) AS open_pos,
                COUNT(*) FILTER (WHERE state = 'draft') AS pending_approval,
                COALESCE(AVG(date_expected - DATE(date_order)), 0) AS avg_lead_days
            FROM shiv_purchase_order
            WHERE state != 'cancelled'
              AND date_order >= %s
        """, (month_start,))
        proc_row = cr.fetchone()

        # ── Manufacturing KPIs ─────────────────────────────────────────────
        cr.execute("""
            SELECT
                COUNT(*) FILTER (WHERE state = 'in_progress') AS active_mos,
                COALESCE(AVG(wc.utilization_pct), 0) AS avg_utilization
            FROM shiv_manufacturing_order mo
            LEFT JOIN shiv_work_center wc ON mo.work_center_id = wc.id
        """)
        mfg_row = cr.fetchone()

        # ── Alerts ─────────────────────────────────────────────────────────
        cr.execute("""
            SELECT sp.name, ss.qty_available, sp.reorder_point
            FROM shiv_stock_summary ss
            JOIN shiv_product sp ON ss.product_id = sp.id
            WHERE ss.qty_available <= sp.reorder_point
              AND sp.reorder_point > 0
            ORDER BY (ss.qty_available / NULLIF(sp.reorder_point, 0)) ASC
            LIMIT 10
        """)
        low_stock_alerts = [
            {'product': row[0], 'available': float(row[1]), 'reorder_point': float(row[2])}
            for row in cr.fetchall()
        ]

        return {
            'generated_at': str(fields.Datetime.now()),
            'cache_ttl_seconds': KPI_CACHE_TTL,
            'sales': {
                'orders_today': int(sales_row[0] or 0),
                'orders_this_month': int(sales_row[1] or 0),
                'pipeline_value': float(sales_row[2] or 0),
                'on_time_delivery_pct': round(float(sales_row[3] or 0), 2),
            },
            'inventory': {
                'total_products': int(inv_row[0] or 0),
                'low_stock_count': int(inv_row[1] or 0),
                'total_stock_value': float(inv_row[2] or 0),
            },
            'procurement': {
                'open_purchase_orders': int(proc_row[0] or 0),
                'pending_approval': int(proc_row[1] or 0),
                'avg_lead_days': round(float(proc_row[2] or 0), 1),
            },
            'manufacturing': {
                'active_orders': int(mfg_row[0] or 0),
                'avg_utilization_pct': round(float(mfg_row[1] or 0), 2),
            },
            'alerts': {
                'low_stock': low_stock_alerts,
                'low_stock_count': len(low_stock_alerts),
            },
        }

    @api.model
    def invalidate_cache(self):
        """Call this after any significant data change to bust the KPI cache."""
        try:
            import redis as redis_lib
            import os
            r = redis_lib.from_url(
                os.environ.get('REDIS_URL', 'redis://:ShivRedis@2024@redis:6379/0'),
                decode_responses=True)
            r.delete(KPI_CACHE_KEY)
        except Exception:
            pass
