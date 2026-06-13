# -*- coding: utf-8 -*-
"""
Module 3 — Inventory Management
shiv_inventory/models/shiv_stock_adjustment.py

Manual inventory adjustments (stocktakes, write-offs, corrections).
Every adjustment writes to the immutable ledger.
"""
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError, UserError


class ShivStockAdjustment(models.Model):
    _name = 'shiv.stock.adjustment'
    _description = 'Shiv Furniture - Stock Adjustment'
    _order = 'date desc'
    _rec_name = 'name'

    name = fields.Char(
        string='Reference', required=True, copy=False, readonly=True,
        default=lambda self: _('New'))

    date = fields.Date(string='Date', required=True, default=fields.Date.today)

    adjustment_type = fields.Selection([
        ('stocktake',   'Physical Stocktake'),
        ('writeoff',    'Write-off / Damage'),
        ('correction',  'Correction'),
        ('opening',     'Opening Balance'),
    ], string='Type', required=True, default='correction')

    state = fields.Selection([
        ('draft',    'Draft'),
        ('done',     'Done'),
        ('cancelled','Cancelled'),
    ], string='State', default='draft', index=True, readonly=True)

    line_ids = fields.One2many(
        'shiv.stock.adjustment.line', 'adjustment_id', string='Lines')

    notes = fields.Text(string='Notes / Reason')

    validated_by = fields.Many2one('res.users', string='Validated By', readonly=True)
    validated_at = fields.Datetime(string='Validated At', readonly=True)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', _('New')) == _('New'):
                vals['name'] = self.env['ir.sequence'].next_by_code(
                    'shiv.stock.adjustment') or _('New')
        return super().create(vals_list)

    def action_validate(self):
        """Validate adjustment — writes each line to the immutable ledger."""
        self.ensure_one()
        if self.state != 'draft':
            raise UserError(_('Only draft adjustments can be validated.'))
        if not self.line_ids:
            raise UserError(_('Add at least one product line before validating.'))

        for line in self.line_ids:
            if line.qty_adjusted == 0:
                continue
            movement_type = 'in_adjustment' if line.qty_adjusted > 0 else 'out_adjustment'
            self.env['shiv.stock.ledger'].sudo().record_movement(
                product_id=line.product_id.id,
                movement_type=movement_type,
                qty_change=line.qty_adjusted,
                source_model='shiv.stock.adjustment',
                source_id=self.id,
                source_ref=self.name,
                notes=f'{self.adjustment_type}: {self.notes or ""}',
                actor_id=self.env.uid,
            )

        self.write({
            'state': 'done',
            'validated_by': self.env.uid,
            'validated_at': fields.Datetime.now(),
        })


class ShivStockAdjustmentLine(models.Model):
    _name = 'shiv.stock.adjustment.line'
    _description = 'Shiv Furniture - Stock Adjustment Line'

    adjustment_id = fields.Many2one(
        'shiv.stock.adjustment', string='Adjustment',
        required=True, ondelete='cascade', index=True)

    product_id = fields.Many2one(
        'shiv.product', string='Product', required=True, index=True)

    qty_system = fields.Float(
        string='System Qty', digits=(12, 3),
        compute='_compute_system_qty', store=False)

    qty_physical = fields.Float(
        string='Physical Count', digits=(12, 3), default=0.0)

    qty_adjusted = fields.Float(
        string='Difference', digits=(12, 3),
        compute='_compute_difference', store=True)

    notes = fields.Char(string='Line Notes')

    @api.depends('product_id')
    def _compute_system_qty(self):
        for line in self:
            summary = self.env['shiv.stock.summary'].search([
                ('product_id', '=', line.product_id.id)], limit=1)
            line.qty_system = summary.qty_on_hand if summary else 0.0

    @api.depends('qty_physical', 'qty_system')
    def _compute_difference(self):
        for line in self:
            line.qty_adjusted = line.qty_physical - line.qty_system
