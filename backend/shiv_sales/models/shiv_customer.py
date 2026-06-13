# -*- coding: utf-8 -*-
"""Module 5 — Customer master."""
from odoo import fields, models


class ShivCustomer(models.Model):
    _name = 'shiv.customer'
    _description = 'Shiv Furniture - Customer'
    _order = 'name'
    _rec_name = 'name'

    name = fields.Char(string='Customer Name', required=True, index=True)
    email = fields.Char(string='Email', size=254)
    phone = fields.Char(string='Phone', size=20)
    address = fields.Text(string='Address')
    gstin = fields.Char(string='GSTIN', size=15)
    credit_limit = fields.Float(string='Credit Limit (₹)', digits=(14, 2), default=0.0)
    is_active = fields.Boolean(string='Active', default=True, index=True)

    total_orders = fields.Integer(string='Total Orders', readonly=True, default=0)
    total_revenue = fields.Float(string='Total Revenue (₹)', digits=(14, 2), readonly=True, default=0.0)

    _sql_constraints = [
        ('gstin_unique', 'UNIQUE(gstin)', 'GSTIN must be unique.'),
        ('credit_limit_positive', 'CHECK(credit_limit >= 0)', 'Credit limit cannot be negative.'),
    ]
