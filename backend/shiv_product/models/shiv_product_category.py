# -*- coding: utf-8 -*-
"""
Module 2 — Product & Category Master
shiv_product/models/shiv_product_category.py

PostgreSQL table: shiv_product_category
"""
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError, UserError


class ShivProductCategory(models.Model):
    _name = 'shiv.product.category'
    _description = 'Shiv Furniture - Product Category'
    _parent_name = 'parent_id'
    _parent_store = True
    _order = 'complete_name'
    _rec_name = 'complete_name'

    # ── Fields ────────────────────────────────────────────────
    name = fields.Char(string='Category Name', required=True, index=True, translate=True)

    complete_name = fields.Char(
        string='Full Path', compute='_compute_complete_name', store=True)

    parent_id = fields.Many2one(
        'shiv.product.category', string='Parent Category',
        index=True, ondelete='restrict')

    parent_path = fields.Char(index=True)

    child_ids = fields.One2many(
        'shiv.product.category', 'parent_id', string='Sub-Categories')

    product_count = fields.Integer(
        string='# Products', compute='_compute_product_count', store=False)

    description = fields.Text(string='Description')

    is_active = fields.Boolean(string='Active', default=True, index=True)

    # Audit
    create_uid = fields.Many2one('res.users', string='Created By', readonly=True)
    write_uid = fields.Many2one('res.users', string='Last Updated By', readonly=True)

    # ── Computed ──────────────────────────────────────────────
    @api.depends('name', 'parent_id.complete_name')
    def _compute_complete_name(self):
        for cat in self:
            if cat.parent_id:
                cat.complete_name = f'{cat.parent_id.complete_name} / {cat.name}'
            else:
                cat.complete_name = cat.name

    def _compute_product_count(self):
        for cat in self:
            cat.product_count = self.env['shiv.product'].search_count([
                ('category_id', '=', cat.id)])

    # ── Constraints ───────────────────────────────────────────
    @api.constrains('parent_id')
    def _check_category_recursion(self):
        if not self._check_recursion():
            raise ValidationError(_('Category cannot be its own parent (circular reference).'))

    def unlink(self):
        for cat in self:
            if cat.product_count > 0:
                raise UserError(
                    _('Cannot delete category "%s" — %d product(s) are assigned to it.')
                    % (cat.name, cat.product_count))
        return super().unlink()
