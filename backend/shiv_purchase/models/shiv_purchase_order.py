# -*- coding: utf-8 -*-
"""
Module 4 — Procurement & Purchase Orders
shiv_purchase/models/shiv_purchase_order.py

PostgreSQL tables: shiv_purchase_order, shiv_purchase_order_line
Full PO lifecycle: Draft → Confirmed → Received → Done
Auto-procurement: triggered by low stock or sales order demand.
3-5 day manual cycle → 5 minute automated cycle.
"""
from odoo import api, fields, models, _  # type: ignore
from odoo.exceptions import ValidationError, UserError  # type: ignore


class ShivPurchaseOrder(models.Model):
    _name = 'shiv.purchase.order'
    _description = 'Shiv Furniture - Purchase Order'
    _order = 'date_order desc'
    _rec_name = 'name'

    name = fields.Char(
        string='PO Reference', required=True, copy=False, readonly=True,
        default=lambda self: _('New'))

    vendor_id = fields.Many2one(
        'shiv.vendor', string='Vendor',
        required=True, index=True, ondelete='restrict', tracking=True)

    state = fields.Selection([
        ('draft',     'Draft / RFQ'),
        ('confirmed', 'Confirmed'),
        ('received',  'Partially Received'),
        ('done',      'Fully Received'),
        ('cancelled', 'Cancelled'),
    ], string='Status', default='draft', required=True,
       index=True, readonly=True, tracking=True)

    date_order = fields.Datetime(
        string='Order Date', required=True, default=fields.Datetime.now, index=True)

    date_expected = fields.Date(
        string='Expected Delivery Date', required=True)

    line_ids = fields.One2many(
        'shiv.purchase.order.line', 'order_id', string='Order Lines')

    total_amount = fields.Float(
        string='Total Amount (₹)', digits=(14, 2),
        compute='_compute_total', store=True)

    is_auto_generated = fields.Boolean(
        string='Auto-Generated', default=False, readonly=True,
        help='True if created by the procurement automation engine.')

    trigger_source = fields.Char(
        string='Triggered By', readonly=True, size=128,
        help='e.g. SO-001, Reorder Rule, Manual')

    confirmed_by = fields.Many2one('res.users', string='Confirmed By', readonly=True)
    confirmed_at = fields.Datetime(string='Confirmed At', readonly=True)

    notes = fields.Text(string='Internal Notes')

    _sql_constraints = [
        ('name_unique', 'UNIQUE(name)', 'PO reference must be unique.'),
    ]

    @api.depends('line_ids.subtotal')
    def _compute_total(self):
        for order in self:
            order.total_amount = sum(line.subtotal for line in order.line_ids)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', _('New')) == _('New'):
                vals['name'] = self.env['ir.sequence'].next_by_code(
                    'shiv.purchase.order') or _('New')
        orders = super().create(vals_list)
        for order in orders:
            self.env['shiv.audit.log'].sudo()._log(
                model='shiv.purchase.order', record_id=order.id,
                record_name=order.name, action='create',
                actor_id=self.env.uid)
        return orders

    def action_confirm(self):
        """Confirm PO — moves to confirmed state."""
        self.ensure_one()
        if self.state != 'draft':
            raise UserError(_('Only Draft POs can be confirmed.'))
        if not self.line_ids:
            raise UserError(_('Add at least one product line before confirming.'))
        self.write({
            'state': 'confirmed',
            'confirmed_by': self.env.uid,
            'confirmed_at': fields.Datetime.now(),
        })
        self.env['shiv.audit.log'].sudo()._log(
            model='shiv.purchase.order', record_id=self.id,
            record_name=self.name, action='write',
            changed_fields=['state'], actor_id=self.env.uid,
            notes=f'PO confirmed. Vendor: {self.vendor_id.name}')

    def action_receive(self):
        """
        Mark goods as received.
        Writes IN movements to stock ledger for each line.
        """
        self.ensure_one()
        if self.state not in ('confirmed', 'received'):
            raise UserError(_('Only confirmed POs can be received.'))

        for line in self.line_ids:
            if line.qty_received >= line.qty_ordered:
                continue
            to_receive = line.qty_ordered - line.qty_received
            self.env['shiv.stock.ledger'].sudo().record_movement(
                product_id=line.product_id.id,
                movement_type='in_purchase',
                qty_change=to_receive,
                source_model='shiv.purchase.order',
                source_id=self.id,
                source_ref=self.name,
                notes=f'Received from {self.vendor_id.name}',
                actor_id=self.env.uid,
            )
            line.sudo().write({'qty_received': line.qty_ordered})

        all_received = all(l.qty_received >= l.qty_ordered for l in self.line_ids)
        self.write({'state': 'done' if all_received else 'received'})

    def action_cancel(self):
        """Cancel PO — only draft/confirmed POs can be cancelled."""
        for order in self:
            if order.state in ('done',):
                raise UserError(_('Cannot cancel a fully received PO.'))
        self.write({'state': 'cancelled'})

    # ── AUTOMATION ENGINE ──────────────────────────────────────
    @api.model
    def auto_create_from_demand(self, product_id, qty_needed, trigger_source=''):
        """
        Core automation method.
        Called when: sales order can't be fulfilled, or reorder point hit.
        Selects best vendor and creates PO automatically.
        3-5 days manual → 5 minutes automated.
        """
        from datetime import timedelta, date

        vendor_line = self.env['shiv.vendor.product'].get_best_vendor(
            product_id, qty_needed)

        if not vendor_line:
            fallback_vendor = self.env['shiv.vendor'].sudo().search([], limit=1)
            if fallback_vendor:
                vendor_id = fallback_vendor.id
            else:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning('No vendor configured for product ID %d and no fallback vendor exists. Skipping PO.', product_id)
                return False
        else:
            vendor_id = vendor_line.vendor_id.id

        product = self.env['shiv.product'].browse(product_id)
        lead_days = vendor_line.lead_time_days if vendor_line else (product.lead_time_days or 7)

        order = self.sudo().create({
            'vendor_id': vendor_id,
            'date_order': fields.Datetime.now(),
            'date_expected': date.today() + timedelta(days=lead_days),
            'is_auto_generated': True,
            'trigger_source': trigger_source,
            'line_ids': [(0, 0, {
                'product_id': product_id,
                'qty_ordered': qty_needed,
                'unit_price': vendor_line.unit_price if vendor_line else product.cost_price,
            })],
        })

        self.env['shiv.audit.log'].sudo()._log(
            model='shiv.purchase.order', record_id=order.id,
            record_name=order.name, action='create',
            actor_id=self.env.uid,
            notes=f'AUTO-GENERATED from {trigger_source}. Product: {product.name}, Qty: {qty_needed}')

        return order


class ShivPurchaseOrderLine(models.Model):
    _name = 'shiv.purchase.order.line'
    _description = 'Shiv Furniture - Purchase Order Line'
    _order = 'order_id, id'

    order_id = fields.Many2one(
        'shiv.purchase.order', required=True, ondelete='cascade', index=True)

    product_id = fields.Many2one(
        'shiv.product', string='Product', required=True, index=True)

    qty_ordered = fields.Float(
        string='Qty Ordered', digits=(12, 3), required=True, default=1.0)

    qty_received = fields.Float(
        string='Qty Received', digits=(12, 3), default=0.0, readonly=True)

    unit_price = fields.Float(
        string='Unit Price (₹)', digits=(12, 2), required=True)

    subtotal = fields.Float(
        string='Subtotal (₹)', digits=(14, 2),
        compute='_compute_subtotal', store=True)

    @api.depends('qty_ordered', 'unit_price')
    def _compute_subtotal(self):
        for line in self:
            line.subtotal = line.qty_ordered * line.unit_price

    _sql_constraints = [
        ('qty_positive', 'CHECK(qty_ordered > 0)', 'Order quantity must be positive.'),
        ('price_positive', 'CHECK(unit_price >= 0)', 'Unit price cannot be negative.'),
    ]
