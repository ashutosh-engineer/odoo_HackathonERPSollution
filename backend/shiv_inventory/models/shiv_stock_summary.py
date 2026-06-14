# -*- coding: utf-8 -*-
"""
Module 3 — Inventory Management
shiv_inventory/models/shiv_stock_summary.py

PostgreSQL table: shiv_stock_summary
Real-time inventory snapshot per product.
Computed from shiv_stock_ledger aggregation.
Cached in Redis for <5ms dashboard reads.
"""
from odoo import api, fields, models, _  # type: ignore
from odoo.exceptions import ValidationError  # type: ignore


class ShivStockSummary(models.Model):
    """
    One row per product. Kept in sync with stock ledger via _recompute().
    Acts as a materialized summary — all reads go here, writes go to ledger.
    """
    _name = 'shiv.stock.summary'
    _description = 'Shiv Furniture - Stock Summary (Real-time)'
    _order = 'product_id'
    _rec_name = 'product_id'

    product_id = fields.Many2one(
        'shiv.product', string='Product',
        required=True, index=True, ondelete='cascade')

    qty_on_hand = fields.Float(
        string='On Hand', digits=(12, 3), default=0.0,
        help='Physical stock currently in warehouse.')

    qty_reserved = fields.Float(
        string='Reserved', digits=(12, 3), default=0.0,
        help='Qty locked by confirmed sales orders, not yet delivered.')

    qty_available = fields.Float(
        string='Available (Free to Sell)', digits=(12, 3),
        compute='_compute_available', store=True,
        help='On Hand minus Reserved. This is what can be sold/used today.')

    qty_incoming = fields.Float(
        string='Incoming (On Order)', digits=(12, 3), default=0.0,
        help='Qty on active purchase/manufacturing orders not yet received.')

    qty_forecasted = fields.Float(
        string='Forecasted', digits=(12, 3),
        compute='_compute_forecasted', store=True,
        help='Available + Incoming. Expected qty if all orders are fulfilled.')

    last_movement_at = fields.Datetime(
        string='Last Movement', readonly=True)

    valuation_method = fields.Selection([
        ('fifo', 'FIFO'),
        ('avg',  'Average Cost'),
    ], string='Valuation Method', default='avg')

    stock_value = fields.Float(
        string='Stock Value (₹)', digits=(12, 2),
        compute='_compute_stock_value', store=False,
        groups='shiv_auth.group_shiv_purchase_user,shiv_auth.group_shiv_auditor,shiv_auth.group_shiv_accountant')

    # ── SQL Constraints ───────────────────────────────────────
    _sql_constraints = [
        ('product_unique', 'UNIQUE(product_id)',
         'Only one stock summary record per product.'),
        ('qty_on_hand_non_negative', 'CHECK(qty_on_hand >= 0)',
         'On-hand quantity cannot go negative. ACID constraint.'),
        ('qty_reserved_non_negative', 'CHECK(qty_reserved >= 0)',
         'Reserved quantity cannot be negative.'),
    ]

    @api.depends('qty_on_hand', 'qty_reserved')
    def _compute_available(self):
        for rec in self:
            rec.qty_available = max(0.0, rec.qty_on_hand - rec.qty_reserved)

    @api.depends('qty_available', 'qty_incoming')
    def _compute_forecasted(self):
        for rec in self:
            rec.qty_forecasted = rec.qty_available + rec.qty_incoming

    def _compute_stock_value(self):
        for rec in self:
            rec.stock_value = rec.qty_on_hand * (rec.product_id.cost_price or 0.0)

    # ── Core methods ─────────────────────────────────────────
    @api.model
    def _get_or_create(self, product_id):
        """Get existing summary or create blank one for new product."""
        summary = self.search([('product_id', '=', product_id)], limit=1)
        if not summary:
            summary = self.sudo().create({'product_id': product_id})
        return summary

    @api.model
    def _recompute(self, product_id):
        """
        Recompute summary from ledger aggregation.
        Called after every ledger entry write.
        """
        self.env.flush_all()
        self.env.cr.execute("""
            SELECT
                COALESCE(SUM(CASE
                    WHEN movement_type IN ('in_purchase','in_return','in_production',
                                           'in_adjustment','in_opening')
                    THEN qty_change
                    WHEN movement_type IN ('out_sale','out_consumed',
                                           'out_adjustment','out_return')
                    THEN qty_change
                    ELSE 0
                END), 0) AS qty_on_hand,
                COALESCE(SUM(CASE
                    WHEN movement_type = 'reserve' THEN ABS(qty_change)
                    WHEN movement_type = 'unreserve' THEN -ABS(qty_change)
                    ELSE 0
                END), 0) AS qty_reserved,
                MAX(timestamp) AS last_movement_at
            FROM shiv_stock_ledger
            WHERE product_id = %s
        """, (product_id,))

        row = self.env.cr.fetchone()
        if not row:
            return

        qty_on_hand, qty_reserved, last_movement_at = row
        qty_on_hand = max(0.0, qty_on_hand)
        qty_reserved = max(0.0, qty_reserved)
        qty_available = max(0.0, qty_on_hand - qty_reserved)

        summary = self._get_or_create(product_id)
        # Direct SQL update for performance (bypasses ORM overhead on hot path)
        self.env.cr.execute("""
            UPDATE shiv_stock_summary
            SET qty_on_hand = %s,
                qty_reserved = %s,
                qty_available = %s,
                qty_forecasted = %s + COALESCE(qty_incoming, 0.0),
                last_movement_at = %s,
                write_date = NOW()
            WHERE product_id = %s
        """, (qty_on_hand, qty_reserved, qty_available, qty_available, last_movement_at, product_id))

        summary.invalidate_recordset()
        if 'shiv.kpi' in self.env:
            self.env['shiv.kpi'].sudo().invalidate_cache()

    def action_view_ledger(self):
        """Open ledger history for this product."""
        return {
            'type': 'ir.actions.act_window',
            'name': f'Stock Ledger — {self.product_id.name}',
            'res_model': 'shiv.stock.ledger',
            'view_mode': 'list,form',
            'domain': [('product_id', '=', self.product_id.id)],
            'context': {'create': False},
        }
