# -*- coding: utf-8 -*-
"""
Module 6 — Manufacturing Execution
shiv_manufacturing/models/shiv_manufacturing_order.py

MO lifecycle: Draft → In Progress → Done / Cancelled
Consumes components from inventory, produces finished goods.
Recursive BoM procurement: if components are short, auto-procures them.
"""
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError, UserError


class ShivManufacturingOrder(models.Model):
    _name = 'shiv.manufacturing.order'
    _description = 'Shiv Furniture - Manufacturing Order'
    _order = 'scheduled_date asc'
    _rec_name = 'name'

    name = fields.Char(
        string='MO Reference', required=True, copy=False, readonly=True,
        default=lambda self: _('New'))

    product_id = fields.Many2one(
        'shiv.product', string='Product to Manufacture',
        required=True, index=True, ondelete='restrict')

    bom_id = fields.Many2one(
        'shiv.bom', string='Bill of Materials',
        required=True, index=True, ondelete='restrict')

    qty_to_produce = fields.Float(
        string='Qty to Produce', digits=(12, 3), required=True, default=1.0)

    qty_produced = fields.Float(
        string='Qty Produced', digits=(12, 3), default=0.0, readonly=True)

    state = fields.Selection([
        ('draft',       'Draft'),
        ('confirmed',   'Confirmed'),
        ('in_progress', 'In Progress'),
        ('done',        'Done'),
        ('cancelled',   'Cancelled'),
    ], string='Status', default='draft', required=True,
       index=True, readonly=True, tracking=True)

    work_center_id = fields.Many2one('shiv.work.center', string='Work Center')

    scheduled_date = fields.Datetime(string='Scheduled Date', required=True)

    is_auto_generated = fields.Boolean(
        string='Auto-Generated', default=False, readonly=True)

    trigger_source = fields.Char(string='Triggered By', readonly=True, size=128)

    component_line_ids = fields.One2many(
        'shiv.mo.component.line', 'mo_id', string='Components Consumed')

    notes = fields.Text(string='Notes')

    _sql_constraints = [
        ('name_unique', 'UNIQUE(name)', 'MO reference must be unique.'),
        ('qty_positive', 'CHECK(qty_to_produce > 0)', 'Qty to produce must be positive.'),
    ]

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', _('New')) == _('New'):
                vals['name'] = self.env['ir.sequence'].next_by_code(
                    'shiv.manufacturing.order') or _('New')
            # Auto-populate component lines from BoM
        orders = super().create(vals_list)
        for order in orders:
            order._populate_component_lines()
        return orders

    def _populate_component_lines(self):
        """Fill component lines from the BoM, scaled to qty_to_produce."""
        self.ensure_one()
        self.component_line_ids.unlink()
        scale = self.qty_to_produce / (self.bom_id.qty_produced or 1.0)
        for bom_line in self.bom_id.component_ids:
            self.env['shiv.mo.component.line'].create({
                'mo_id': self.id,
                'product_id': bom_line.product_id.id,
                'qty_required': bom_line.qty_required * scale,
                'qty_consumed': 0.0,
                'uom_id': bom_line.uom_id.id,
            })

    def action_start(self):
        """Start production — consume components from inventory."""
        self.ensure_one()
        if self.state not in ('confirmed',):
            raise UserError(_('Only confirmed MOs can be started.'))

        for comp in self.component_line_ids:
            try:
                self.env['shiv.stock.ledger'].sudo().record_movement(
                    product_id=comp.product_id.id,
                    movement_type='out_consumed',
                    qty_change=-comp.qty_required,
                    source_model='shiv.manufacturing.order',
                    source_id=self.id,
                    source_ref=self.name,
                    notes=f'Component consumed for {self.name}',
                    actor_id=self.env.uid,
                )
                comp.sudo().write({'qty_consumed': comp.qty_required})
            except ValidationError as e:
                raise UserError(
                    _('Insufficient stock for component "%s": %s')
                    % (comp.product_id.name, str(e)))

        self.write({'state': 'in_progress'})

    def action_mark_done(self):
        """Mark MO done — add finished goods to inventory."""
        self.ensure_one()
        if self.state != 'in_progress':
            raise UserError(_('Only in-progress MOs can be marked done.'))

        self.env['shiv.stock.ledger'].sudo().record_movement(
            product_id=self.product_id.id,
            movement_type='in_production',
            qty_change=self.qty_to_produce,
            source_model='shiv.manufacturing.order',
            source_id=self.id,
            source_ref=self.name,
            notes=f'Finished goods produced by {self.name}',
            actor_id=self.env.uid,
        )
        self.write({'state': 'done', 'qty_produced': self.qty_to_produce})
        self.product_id.write({'has_bom': True})

    @api.model
    def auto_create_from_demand(self, product_id, qty_needed, trigger_source=''):
        """Auto-create MO when sales order demand cannot be met from stock."""
        from odoo import fields as f
        from datetime import timedelta

        product = self.env['shiv.product'].browse(product_id)
        bom = self.env['shiv.bom'].get_active_bom(product_id)
        if not bom:
            raise UserError(
                _('Cannot auto-create Manufacturing Order for "%s" — no active BoM found.')
                % product.name)

        order = self.sudo().create({
            'product_id': product_id,
            'bom_id': bom.id,
            'qty_to_produce': qty_needed,
            'scheduled_date': f.Datetime.now() + timedelta(days=product.lead_time_days or 3),
            'is_auto_generated': True,
            'trigger_source': trigger_source,
        })

        # Recursive: check if components are available, procure if not
        for comp_line in order.component_line_ids:
            summary = self.env['shiv.stock.summary'].search([
                ('product_id', '=', comp_line.product_id.id)], limit=1)
            available = summary.qty_available if summary else 0.0
            if available < comp_line.qty_required:
                shortage = comp_line.qty_required - available
                self.env['shiv.purchase.order'].sudo().auto_create_from_demand(
                    product_id=comp_line.product_id.id,
                    qty_needed=shortage,
                    trigger_source=f'{trigger_source} → {order.name}',
                )

        return order


class ShivMOComponentLine(models.Model):
    _name = 'shiv.mo.component.line'
    _description = 'Shiv Furniture - MO Component Line'

    mo_id = fields.Many2one('shiv.manufacturing.order', required=True, ondelete='cascade', index=True)
    product_id = fields.Many2one('shiv.product', string='Component', required=True)
    qty_required = fields.Float(string='Required', digits=(12, 4), required=True)
    qty_consumed = fields.Float(string='Consumed', digits=(12, 4), default=0.0, readonly=True)
    uom_id = fields.Many2one('uom.uom', string='UoM', required=True)
