# -*- coding: utf-8 -*-
"""Module 6 — Work Center definition."""
from odoo import fields, models


class ShivWorkCenter(models.Model):
    _name = 'shiv.work.center'
    _description = 'Shiv Furniture - Work Center'
    _rec_name = 'name'

    name = fields.Char(string='Work Center Name', required=True, index=True)
    code = fields.Char(string='Code', size=16, index=True)
    capacity = fields.Integer(string='Capacity (units/day)', default=10)
    is_active = fields.Boolean(string='Active', default=True)

    utilization_pct = fields.Float(
        string='Utilization %', digits=(5, 2), default=0.0,
        help='Auto-computed from active work orders.')

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Work center code must be unique.'),
    ]
