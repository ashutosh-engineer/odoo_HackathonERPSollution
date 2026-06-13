# -*- coding: utf-8 -*-
"""
Module 6 — Manufacturing Execution
Bill of Materials — hierarchical component definition.
"""
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError, UserError


class ShivBom(models.Model):
    _name = 'shiv.bom'
    _description = 'Shiv Furniture - Bill of Materials'
    _rec_name = 'display_name_computed'

    product_id = fields.Many2one(
        'shiv.product', string='Finished Product',
        required=True, index=True, ondelete='restrict')

    qty_produced = fields.Float(
        string='Qty Produced per BoM', digits=(12, 3), default=1.0, required=True,
        help='How many units of finished product this BoM produces.')

    version = fields.Integer(string='Version', default=1)
    is_active = fields.Boolean(string='Active', default=True, index=True)

    component_ids = fields.One2many(
        'shiv.bom.line', 'bom_id', string='Components')

    notes = fields.Text(string='Manufacturing Notes')

    display_name_computed = fields.Char(
        compute='_compute_display_name', store=True)

    @api.depends('product_id.name', 'version')
    def _compute_display_name(self):
        for bom in self:
            bom.display_name_computed = f'BoM: {bom.product_id.name} v{bom.version}'

    _sql_constraints = [
        ('product_version_unique', 'UNIQUE(product_id, version)',
         'A product can only have one BoM per version.'),
        ('qty_produced_positive', 'CHECK(qty_produced > 0)',
         'Qty produced must be positive.'),
    ]

    @api.constrains('component_ids')
    def _check_no_circular_bom(self):
        for bom in self:
            finished = bom.product_id
            for line in bom.component_ids:
                if line.product_id == finished:
                    raise ValidationError(
                        _('Circular BoM: finished product "%s" cannot be its own component.')
                        % finished.name)

    @api.model
    def get_active_bom(self, product_id):
        """Return the active BoM for a product."""
        return self.search([
            ('product_id', '=', product_id),
            ('is_active', '=', True),
        ], order='version desc', limit=1)


class ShivBomLine(models.Model):
    _name = 'shiv.bom.line'
    _description = 'Shiv Furniture - BoM Component Line'
    _order = 'bom_id, id'

    bom_id = fields.Many2one('shiv.bom', required=True, ondelete='cascade', index=True)
    product_id = fields.Many2one('shiv.product', string='Component', required=True, index=True)
    qty_required = fields.Float(string='Qty Required', digits=(12, 4), required=True, default=1.0)
    uom_id = fields.Many2one('uom.uom', string='UoM', required=True)
    notes = fields.Char(string='Notes')

    _sql_constraints = [
        ('qty_positive', 'CHECK(qty_required > 0)', 'Component quantity must be positive.'),
    ]
