# -*- coding: utf-8 -*-
"""
Module 4 — Procurement & Purchase Orders
shiv_purchase/models/shiv_vendor.py

PostgreSQL table: shiv_vendor, shiv_vendor_product
Vendor master with per-product pricing and lead times.
Auto-selection engine picks best vendor by (lead_time, price).
"""
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class ShivVendor(models.Model):
    _name = 'shiv.vendor'
    _description = 'Shiv Furniture - Vendor Master'
    _order = 'name'
    _rec_name = 'name'

    name = fields.Char(string='Vendor Name', required=True, index=True)
    code = fields.Char(string='Vendor Code', index=True, copy=False)
    email = fields.Char(string='Email', size=254)
    phone = fields.Char(string='Phone', size=20)
    address = fields.Text(string='Address')
    gstin = fields.Char(string='GSTIN', size=15)

    is_active = fields.Boolean(string='Active', default=True, index=True)

    reliability_score = fields.Float(
        string='Reliability Score (0-10)', digits=(3, 1), default=5.0,
        help='Auto-computed from on-time delivery %. Used in auto-selection.')

    on_time_delivery_pct = fields.Float(
        string='On-Time Delivery %', digits=(5, 2), default=100.0)

    product_line_ids = fields.One2many(
        'shiv.vendor.product', 'vendor_id', string='Products Supplied')

    total_orders = fields.Integer(string='Total POs', readonly=True, default=0)

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Vendor code must be unique.'),
        ('gstin_unique', 'UNIQUE(gstin)', 'GSTIN must be unique.'),
        ('reliability_range', 'CHECK(reliability_score BETWEEN 0 AND 10)',
         'Reliability score must be between 0 and 10.'),
    ]


class ShivVendorProduct(models.Model):
    """Per-vendor, per-product pricing and lead time."""
    _name = 'shiv.vendor.product'
    _description = 'Shiv Furniture - Vendor Product Pricelist'
    _order = 'vendor_id, product_id'
    _rec_name = 'display_name_computed'

    vendor_id = fields.Many2one('shiv.vendor', required=True, ondelete='cascade', index=True)
    product_id = fields.Many2one('shiv.product', required=True, ondelete='cascade', index=True)

    vendor_product_code = fields.Char(string="Vendor's Product Code", size=64)
    unit_price = fields.Float(string='Unit Price (₹)', digits=(12, 2), required=True)
    min_order_qty = fields.Float(string='Min Order Qty', digits=(12, 3), default=1.0)
    lead_time_days = fields.Integer(string='Lead Time (Days)', default=7)
    is_preferred = fields.Boolean(string='Preferred Vendor', default=False)

    display_name_computed = fields.Char(
        compute='_compute_display_name', store=True)

    @api.depends('vendor_id.name', 'product_id.name')
    def _compute_display_name(self):
        for rec in self:
            rec.display_name_computed = f'{rec.vendor_id.name} → {rec.product_id.name}'

    _sql_constraints = [
        ('vendor_product_unique', 'UNIQUE(vendor_id, product_id)',
         'A vendor can only have one price entry per product.'),
        ('price_positive', 'CHECK(unit_price > 0)', 'Unit price must be positive.'),
        ('lead_time_positive', 'CHECK(lead_time_days >= 0)', 'Lead time cannot be negative.'),
    ]

    @api.model
    def get_best_vendor(self, product_id, required_qty=1.0):
        """
        Auto-vendor selection engine.
        Picks best vendor by: preferred > shortest lead time > lowest price.
        Used by procurement automation.
        """
        candidates = self.search([
            ('product_id', '=', product_id),
            ('vendor_id.is_active', '=', True),
            ('min_order_qty', '<=', required_qty),
        ], order='is_preferred desc, lead_time_days asc, unit_price asc')
        return candidates[0] if candidates else False
