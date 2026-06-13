# -*- coding: utf-8 -*-
"""
Module 5 — Sales Order Management
shiv_sales/models/shiv_sale_order.py

PostgreSQL tables: shiv_sale_order, shiv_sale_order_line
Full SO lifecycle: Draft → Confirmed → Delivered → Done
ACID inventory reservation on confirmation — overselling is IMPOSSIBLE.
Auto-procurement triggered when stock is insufficient.
"""
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError, UserError


class ShivSaleOrder(models.Model):
    _name = 'shiv.sale.order'
    _description = 'Shiv Furniture - Sales Order'
    _order = 'date_order desc'
    _rec_name = 'name'

    name = fields.Char(
        string='Order Reference', required=True, copy=False, readonly=True,
        default=lambda self: _('New'))

    customer_id = fields.Many2one(
        'shiv.customer', string='Customer',
        required=True, index=True, ondelete='restrict', tracking=True)

    state = fields.Selection([
        ('draft',       'Draft'),
        ('confirmed',   'Confirmed'),
        ('picking',     'Picking / In Progress'),
        ('delivered',   'Delivered'),
        ('done',        'Done / Invoiced'),
        ('cancelled',   'Cancelled'),
    ], string='Status', default='draft', required=True,
       index=True, readonly=True, tracking=True)

    date_order = fields.Datetime(
        string='Order Date', required=True, default=fields.Datetime.now, index=True)

    delivery_date = fields.Date(
        string='Requested Delivery Date', required=True)

    line_ids = fields.One2many(
        'shiv.sale.order.line', 'order_id', string='Order Lines')

    total_amount = fields.Float(
        string='Total Amount (₹)', digits=(14, 2),
        compute='_compute_total', store=True)

    is_fully_reserved = fields.Boolean(
        string='Fully Reserved', default=False, readonly=True,
        help='True when all lines have inventory reserved.')

    procurement_triggered = fields.Boolean(
        string='Procurement Triggered', default=False, readonly=True)

    confirmed_by = fields.Many2one('res.users', string='Confirmed By', readonly=True)
    confirmed_at = fields.Datetime(string='Confirmed At', readonly=True)

    notes = fields.Text(string='Internal Notes')

    _sql_constraints = [
        ('name_unique', 'UNIQUE(name)', 'Sales order reference must be unique.'),
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
                    'shiv.sale.order') or _('New')
        orders = super().create(vals_list)
        for order in orders:
            self.env['shiv.audit.log'].sudo()._log(
                model='shiv.sale.order', record_id=order.id,
                record_name=order.name, action='create',
                actor_id=self.env.uid)
        return orders

    def action_confirm(self):
        """
        Confirm sales order.

        CRITICAL PATH:
        1. Check available inventory for each line.
        2. Reserve stock atomically (SELECT FOR UPDATE — row-level lock).
        3. If insufficient: auto-trigger procurement.
        4. Write audit log.

        PostgreSQL SERIALIZABLE isolation guarantees:
        Two concurrent orders for the last 1 unit → only one succeeds.
        """
        self.ensure_one()
        if self.state != 'draft':
            raise UserError(_('Only draft orders can be confirmed.'))
        if not self.line_ids:
            raise UserError(_('Add at least one product line before confirming.'))

        shortfall_lines = []

        for line in self.line_ids:
            # Reserve inventory — uses FOR UPDATE lock inside record_movement
            try:
                self.env['shiv.stock.ledger'].sudo().record_movement(
                    product_id=line.product_id.id,
                    movement_type='reserve',
                    qty_change=-line.qty_ordered,
                    source_model='shiv.sale.order',
                    source_id=self.id,
                    source_ref=self.name,
                    notes=f'Reserved for SO: {self.name}',
                    actor_id=self.env.uid,
                )
                line.sudo().write({'is_reserved': True})
            except ValidationError:
                # Not enough stock — flag for procurement
                shortfall_lines.append(line)

        if shortfall_lines:
            # Auto-trigger procurement for shortfall items
            for line in shortfall_lines:
                product = line.product_id
                if product.procurement_method in ('buy', 'mto'):
                    self.env['shiv.purchase.order'].sudo().auto_create_from_demand(
                        product_id=product.id,
                        qty_needed=line.qty_ordered,
                        trigger_source=self.name,
                    )
                elif product.procurement_method in ('make', 'mts'):
                    self.env['shiv.manufacturing.order'].sudo().auto_create_from_demand(
                        product_id=product.id,
                        qty_needed=line.qty_ordered,
                        trigger_source=self.name,
                    )
            self.sudo().write({'procurement_triggered': True})

        all_reserved = all(line.is_reserved for line in self.line_ids)
        self.write({
            'state': 'confirmed',
            'is_fully_reserved': all_reserved,
            'confirmed_by': self.env.uid,
            'confirmed_at': fields.Datetime.now(),
        })

        self.env['shiv.audit.log'].sudo()._log(
            model='shiv.sale.order', record_id=self.id,
            record_name=self.name, action='write',
            changed_fields=['state', 'is_fully_reserved'],
            actor_id=self.env.uid,
            notes=f'Confirmed. Reserved: {all_reserved}. Procurement triggered: {bool(shortfall_lines)}')

    def action_deliver(self):
        """Mark order as delivered — releases reservation, writes OUT movement."""
        self.ensure_one()
        if self.state not in ('confirmed', 'picking'):
            raise UserError(_('Only confirmed orders can be delivered.'))

        for line in self.line_ids:
            if line.is_reserved:
                # Release reservation + deduct stock
                self.env['shiv.stock.ledger'].sudo().record_movement(
                    product_id=line.product_id.id,
                    movement_type='unreserve',
                    qty_change=abs(line.qty_ordered),
                    source_model='shiv.sale.order',
                    source_id=self.id,
                    source_ref=self.name,
                    notes=f'Unreserved on delivery: {self.name}',
                    actor_id=self.env.uid,
                )
                self.env['shiv.stock.ledger'].sudo().record_movement(
                    product_id=line.product_id.id,
                    movement_type='out_sale',
                    qty_change=-line.qty_ordered,
                    source_model='shiv.sale.order',
                    source_id=self.id,
                    source_ref=self.name,
                    notes=f'Delivered to {self.customer_id.name}',
                    actor_id=self.env.uid,
                )

        self.write({'state': 'delivered'})

    def action_cancel(self):
        """Cancel order — unreserve any held stock."""
        for order in self:
            if order.state in ('delivered', 'done'):
                raise UserError(_('Delivered or completed orders cannot be cancelled.'))
            for line in order.line_ids:
                if line.is_reserved:
                    self.env['shiv.stock.ledger'].sudo().record_movement(
                        product_id=line.product_id.id,
                        movement_type='unreserve',
                        qty_change=abs(line.qty_ordered),
                        source_model='shiv.sale.order',
                        source_id=order.id,
                        source_ref=order.name,
                        notes=f'Unreserved due to cancellation: {order.name}',
                        actor_id=self.env.uid,
                    )
                    line.sudo().write({'is_reserved': False})
        self.write({'state': 'cancelled'})


class ShivSaleOrderLine(models.Model):
    _name = 'shiv.sale.order.line'
    _description = 'Shiv Furniture - Sales Order Line'
    _order = 'order_id, id'

    order_id = fields.Many2one(
        'shiv.sale.order', required=True, ondelete='cascade', index=True)

    product_id = fields.Many2one(
        'shiv.product', string='Product', required=True, index=True)

    qty_ordered = fields.Float(
        string='Qty Ordered', digits=(12, 3), required=True, default=1.0)

    unit_price = fields.Float(
        string='Unit Price (₹)', digits=(12, 2), required=True)

    discount_pct = fields.Float(
        string='Discount %', digits=(5, 2), default=0.0,
        groups='shiv_auth.group_shiv_sales_manager')

    subtotal = fields.Float(
        string='Subtotal (₹)', digits=(14, 2),
        compute='_compute_subtotal', store=True)

    is_reserved = fields.Boolean(
        string='Stock Reserved', default=False, readonly=True)

    @api.depends('qty_ordered', 'unit_price', 'discount_pct')
    def _compute_subtotal(self):
        for line in self:
            line.subtotal = line.qty_ordered * line.unit_price * (1 - line.discount_pct / 100)

    _sql_constraints = [
        ('qty_positive', 'CHECK(qty_ordered > 0)', 'Order quantity must be positive.'),
        ('price_positive', 'CHECK(unit_price >= 0)', 'Unit price cannot be negative.'),
        ('discount_range', 'CHECK(discount_pct BETWEEN 0 AND 100)', 'Discount must be 0-100%.'),
    ]
