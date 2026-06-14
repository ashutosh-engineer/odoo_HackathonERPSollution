# -*- coding: utf-8 -*-
"""
Module 2 — Product & Category Master
shiv_product/models/shiv_product.py

PostgreSQL table: shiv_product
Central product master for Shiv Furniture Works.
Every other module (Inventory, Sales, Purchase, Manufacturing) references this.
"""
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError, UserError


class ShivProduct(models.Model):
    _name = 'shiv.product'
    _description = 'Shiv Furniture - Product Master'
    _order = 'name'
    _rec_name = 'name'

    # ── Identity ──────────────────────────────────────────────
    name = fields.Char(
        string='Product Name', required=True, index=True, tracking=True)

    internal_ref = fields.Char(
        string='Internal Reference (SKU)', index=True, copy=False,
        help='Unique SKU. Auto-generated if left blank.')

    barcode = fields.Char(
        string='Barcode / EAN', index=True, copy=False)

    category_id = fields.Many2one(
        'shiv.product.category', string='Category',
        required=True, index=True, ondelete='restrict')

    description = fields.Text(string='Description')
    description_purchase = fields.Text(string='Purchase Description')
    description_manufacture = fields.Text(string='Manufacturing Notes')

    image_1920 = fields.Image(string="Product Image", max_width=1920, max_height=1920)

    # ── Type & UoM ────────────────────────────────────────────
    product_type = fields.Selection([
        ('storable',      'Storable Product'),   # tracked in inventory
        ('consumable',    'Consumable'),          # not tracked (screws, nails)
        ('service',       'Service'),             # no inventory movement
    ], string='Product Type', required=True, default='storable', index=True)

    uom_id = fields.Many2one(
        'uom.uom', string='Unit of Measure', required=True,
        help='Primary UoM for sales and inventory (e.g. Units, Kg, Metres).')

    uom_purchase_id = fields.Many2one(
        'uom.uom', string='Purchase UoM',
        help='UoM used on purchase orders. Converted to primary UoM on receipt.')

    # ── Pricing ───────────────────────────────────────────────
    sale_price = fields.Float(
        string='Sales Price (₹)', digits=(12, 2), default=0.0)

    cost_price = fields.Float(
        string='Cost Price (₹)', digits=(12, 2), default=0.0,
        groups='shiv_auth.group_shiv_purchase_user,shiv_auth.group_shiv_auditor,shiv_auth.group_shiv_accountant',
        help='Visible only to Purchase, Auditors and Accountants. Hidden from sales staff.')

    # ── Inventory Control ─────────────────────────────────────
    is_tracked = fields.Boolean(
        string='Track Inventory', default=True,
        help='If True, all stock movements are recorded in the ledger.')

    reorder_point = fields.Float(
        string='Reorder Point (Min Qty)', digits=(12, 3), default=0.0,
        help='When on-hand qty falls below this, auto-procurement is triggered.')

    reorder_qty = fields.Float(
        string='Reorder Quantity', digits=(12, 3), default=0.0,
        help='How much to order/manufacture when reorder point is triggered.')

    lead_time_days = fields.Integer(
        string='Lead Time (Days)', default=0,
        help='Expected days from PO/MO creation to availability.')

    procurement_method = fields.Selection([
        ('buy',  'Buy (Purchase Order)'),
        ('make', 'Make (Manufacturing Order)'),
        ('mts',  'Make to Stock'),
        ('mto',  'Make to Order'),
    ], string='Procurement Method', default='buy', required=True,
       help='Determines what happens when inventory runs low.')

    # ── BoM flag ──────────────────────────────────────────────
    has_bom = fields.Boolean(
        string='Has Bill of Materials', default=False,
        help='Set True when a BoM is defined in the Manufacturing module.')

    # ── Lifecycle ─────────────────────────────────────────────
    state = fields.Selection([
        ('draft',       'Draft'),
        ('active',      'Active'),
        ('discontinued','Discontinued'),
        ('archived',    'Archived'),
    ], string='Status', default='draft', required=True, index=True, tracking=True)

    is_active = fields.Boolean(string='Active', default=True, index=True)

    # ── Computed stock (read from inventory module) ───────────
    qty_on_hand = fields.Float(
        string='On Hand Qty', digits=(12, 3),
        compute='_compute_stock_quantities', store=False)

    qty_reserved = fields.Float(
        string='Reserved Qty', digits=(12, 3),
        compute='_compute_stock_quantities', store=False)

    qty_available = fields.Float(
        string='Available Qty', digits=(12, 3),
        compute='_compute_stock_quantities', store=False)

    # ── Audit ─────────────────────────────────────────────────
    create_uid = fields.Many2one('res.users', string='Created By', readonly=True)
    write_uid = fields.Many2one('res.users', string='Last Updated By', readonly=True)

    # ── SQL Constraints ───────────────────────────────────────
    _sql_constraints = [
        ('internal_ref_unique',
         'UNIQUE(internal_ref)',
         'Internal Reference (SKU) must be unique across all products.'),
        ('barcode_unique',
         'UNIQUE(barcode)',
         'Barcode must be unique.'),
        ('sale_price_positive',
         'CHECK(sale_price >= 0)',
         'Sales price cannot be negative.'),
        ('cost_price_positive',
         'CHECK(cost_price >= 0)',
         'Cost price cannot be negative.'),
        ('reorder_point_positive',
         'CHECK(reorder_point >= 0)',
         'Reorder point cannot be negative.'),
    ]

    # ── Computed Stock ────────────────────────────────────────
    def _compute_stock_quantities(self):
        """Pull live stock figures from shiv.stock.ledger aggregate."""
        for product in self:
            stock = self.env['shiv.stock.summary'].sudo().search([
                ('product_id', '=', product.id)], limit=1)
            if stock:
                product.qty_on_hand = stock.qty_on_hand
                product.qty_reserved = stock.qty_reserved
                product.qty_available = stock.qty_available
            else:
                product.qty_on_hand = 0.0
                product.qty_reserved = 0.0
                product.qty_available = 0.0

    # ── Lifecycle ─────────────────────────────────────────────
    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get('internal_ref'):
                vals['internal_ref'] = self.env['ir.sequence'].next_by_code(
                    'shiv.product.sku') or 'SKU-NEW'
        products = super().create(vals_list)
        for product in products:
            self.env['shiv.audit.log'].sudo()._log(
                model='shiv.product', record_id=product.id,
                record_name=product.name, action='create',
                changed_fields=list(vals_list[0].keys()),
                actor_id=self.env.uid)
        return products

    def write(self, vals):
        result = super().write(vals)
        for product in self:
            self.env['shiv.audit.log'].sudo()._log(
                model='shiv.product', record_id=product.id,
                record_name=product.name, action='write',
                changed_fields=list(vals.keys()),
                actor_id=self.env.uid)
        return result

    def unlink(self):
        for product in self:
            if product.qty_on_hand > 0:
                raise UserError(
                    _('Cannot delete "%s" — it has %.2f units in stock. '
                      'Archive it instead.') % (product.name, product.qty_on_hand))
        return super().unlink()

    # ── Actions ───────────────────────────────────────────────
    def action_activate(self):
        self.write({'state': 'active', 'is_active': True})

    def action_discontinue(self):
        self.write({'state': 'discontinued', 'is_active': False})
        self.env['shiv.bom'].search([('product_id', 'in', self.ids)]).write({'is_active': False})

    def action_archive(self):
        self.write({'state': 'archived', 'is_active': False})
        self.env['shiv.bom'].search([('product_id', 'in', self.ids)]).write({'is_active': False})

    @api.constrains('uom_id', 'uom_purchase_id')
    def _check_uom_category(self):
        for product in self:
            if (product.uom_purchase_id
                    and product.uom_id.category_id != product.uom_purchase_id.category_id):
                raise ValidationError(
                    _('Purchase UoM "%s" must belong to the same category as primary UoM "%s".')
                    % (product.uom_purchase_id.name, product.uom_id.name))
