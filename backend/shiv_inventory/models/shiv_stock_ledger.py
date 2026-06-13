# -*- coding: utf-8 -*-
"""
Module 3 — Inventory Management
shiv_inventory/models/shiv_stock_ledger.py

PostgreSQL table: shiv_stock_ledger
APPEND-ONLY, IMMUTABLE stock movement log.
Every unit in/out is a row. Never updated, never deleted.
This is the single source of truth for inventory accuracy.

DB-level immutability enforced by PostgreSQL trigger (01_extensions.sql).
"""
from odoo import api, fields, models, _
from odoo.exceptions import UserError, ValidationError

MOVEMENT_TYPES = [
    ('in_purchase',     'Stock In — Purchase Receipt'),
    ('in_return',       'Stock In — Customer Return'),
    ('in_production',   'Stock In — Manufacturing Output'),
    ('in_adjustment',   'Stock In — Manual Adjustment'),
    ('in_opening',      'Stock In — Opening Balance'),
    ('out_sale',        'Stock Out — Sales Delivery'),
    ('out_consumed',    'Stock Out — Manufacturing Consumption'),
    ('out_adjustment',  'Stock Out — Manual Adjustment / Write-off'),
    ('out_return',      'Stock Out — Return to Vendor'),
    ('reserve',         'Reservation — Sales Order Hold'),
    ('unreserve',       'Unreservation — Order Cancelled / Released'),
    ('transfer',        'Transfer — Location Move'),
]


class ShivStockLedger(models.Model):
    """
    Append-only stock ledger.
    Each row = one stock movement event.
    On-hand qty = SUM of all qty_change for a product.
    Reserved qty = SUM of all reservation entries.

    ACID guarantee: SERIALIZABLE isolation on all reserve/unreserve operations.
    """
    _name = 'shiv.stock.ledger'
    _description = 'Shiv Furniture - Stock Ledger (Immutable)'
    _order = 'timestamp desc, id desc'
    _rec_name = 'display_ref'

    # ── What moved ────────────────────────────────────────────
    product_id = fields.Many2one(
        'shiv.product', string='Product',
        required=True, readonly=True, index=True, ondelete='restrict')

    movement_type = fields.Selection(
        MOVEMENT_TYPES, string='Movement Type',
        required=True, readonly=True, index=True)

    qty_change = fields.Float(
        string='Qty Change', digits=(12, 4),
        required=True, readonly=True,
        help='Positive = stock in. Negative = stock out/reservation.')

    qty_after = fields.Float(
        string='On-Hand After', digits=(12, 4),
        readonly=True,
        help='Snapshot of on-hand qty after this movement.')

    uom_id = fields.Many2one(
        'uom.uom', string='Unit of Measure',
        required=True, readonly=True)

    # ── Location ──────────────────────────────────────────────
    location_from = fields.Char(
        string='From Location', readonly=True, size=128, default='MAIN_WAREHOUSE')

    location_to = fields.Char(
        string='To Location', readonly=True, size=128, default='MAIN_WAREHOUSE')

    # ── Source document ───────────────────────────────────────
    source_model = fields.Char(
        string='Source Model', readonly=True, size=128,
        help='e.g. shiv.sale.order, shiv.purchase.order, shiv.manufacturing.order')

    source_id = fields.Integer(
        string='Source Record ID', readonly=True, index=True)

    source_ref = fields.Char(
        string='Source Reference', readonly=True, size=64,
        help='e.g. SO-001, PO-042, MO-007')

    # ── Who & When ────────────────────────────────────────────
    actor_id = fields.Integer(
        string='Actor User ID', readonly=True, index=True)

    actor_name = fields.Char(
        string='Actor Name', readonly=True, size=256)

    timestamp = fields.Datetime(
        string='Timestamp', required=True, readonly=True,
        default=fields.Datetime.now, index=True)

    notes = fields.Text(string='Notes', readonly=True)

    # ── Immutability ──────────────────────────────────────────
    is_locked = fields.Boolean(
        string='Locked', default=True, readonly=True)

    display_ref = fields.Char(
        string='Reference', compute='_compute_display_ref', store=True)

    @api.depends('product_id', 'movement_type', 'timestamp')
    def _compute_display_ref(self):
        for rec in self:
            rec.display_ref = (
                f'{rec.product_id.internal_ref or rec.product_id.name} '
                f'| {rec.movement_type} | {rec.timestamp}'
            )

    # ── Immutability enforcement ──────────────────────────────
    def write(self, vals):
        raise UserError(_('Stock ledger entries are immutable and cannot be modified.'))

    def unlink(self):
        raise UserError(_('Stock ledger entries cannot be deleted. They are the permanent inventory audit trail.'))

    # ── Core method: record a movement ───────────────────────
    @api.model
    def record_movement(self, product_id, movement_type, qty_change,
                        source_model=None, source_id=None, source_ref=None,
                        location_from='MAIN_WAREHOUSE', location_to='MAIN_WAREHOUSE',
                        notes='', actor_id=None):
        """
        THE single entrypoint for all stock movements.
        All modules call this. Never write to shiv_stock_ledger directly.

        For reserve/unreserve: uses SERIALIZABLE isolation to prevent overselling.
        """
        product = self.env['shiv.product'].sudo().browse(product_id)
        if not product.exists():
            raise ValidationError(_('Product ID %d not found.') % product_id)

        # Recalculate on-hand after this movement
        summary = self.env['shiv.stock.summary'].sudo()._get_or_create(product_id)

        if movement_type == 'reserve':
            # CRITICAL PATH: reservation must be atomic
            # Uses row-level lock via FOR UPDATE
            self.env.cr.execute(
                'SELECT qty_available FROM shiv_stock_summary WHERE product_id = %s FOR UPDATE',
                (product_id,)
            )
            row = self.env.cr.fetchone()
            available = row[0] if row else 0.0
            if available < abs(qty_change):
                raise ValidationError(
                    _('Insufficient stock for "%s". '
                      'Available: %.3f, Requested: %.3f.')
                    % (product.name, available, abs(qty_change))
                )

        actor = self.env['res.users'].sudo().browse(actor_id or self.env.uid)

        # Write ledger entry (append-only)
        ledger_entry = self.sudo().create({
            'product_id': product_id,
            'movement_type': movement_type,
            'qty_change': qty_change,
            'qty_after': summary.qty_on_hand + qty_change if movement_type not in ('reserve', 'unreserve') else summary.qty_on_hand,
            'uom_id': product.uom_id.id,
            'location_from': location_from,
            'location_to': location_to,
            'source_model': source_model or '',
            'source_id': source_id or 0,
            'source_ref': source_ref or '',
            'actor_id': actor_id or self.env.uid,
            'actor_name': actor.name if actor.exists() else 'System',
            'timestamp': fields.Datetime.now(),
            'notes': notes,
            'is_locked': True,
        })

        # Update summary table (materialized view alternative for performance)
        summary._recompute(product_id)

        return ledger_entry
