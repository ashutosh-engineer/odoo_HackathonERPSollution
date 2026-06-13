# -*- coding: utf-8 -*-
"""shiv_product/tests/test_product.py — Product master tests."""
from odoo.exceptions import ValidationError, UserError
from odoo.tests import TransactionCase, tagged


@tagged('shiv_product', 'post_install', '-at_install')
class TestShivProduct(TransactionCase):

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')
        self.cat = self.env['shiv.product.category'].sudo().create({'name': 'Furniture'})
        self.uom = self.env.ref('uom.product_uom_unit')

    def _make_product(self, **kwargs):
        defaults = {
            'name': 'Test Product',
            'category_id': self.cat.id,
            'product_type': 'storable',
            'uom_id': self.uom.id,
            'sale_price': 1000.0,
        }
        defaults.update(kwargs)
        return self.env['shiv.product'].sudo().create(defaults)

    def test_sku_auto_generated(self):
        p = self._make_product(name='Auto SKU Product')
        self.assertTrue(p.internal_ref.startswith('SKU-'))

    def test_custom_sku_preserved(self):
        p = self._make_product(internal_ref='CUSTOM-001')
        self.assertEqual(p.internal_ref, 'CUSTOM-001')

    def test_duplicate_sku_blocked(self):
        self._make_product(internal_ref='DUP-001')
        with self.assertRaises(Exception):  # SQL unique constraint
            self._make_product(name='Dupe', internal_ref='DUP-001')

    def test_duplicate_barcode_blocked(self):
        self._make_product(barcode='123456789')
        with self.assertRaises(Exception):
            self._make_product(name='Dupe Barcode', barcode='123456789')

    def test_negative_sale_price_blocked(self):
        with self.assertRaises(Exception):  # SQL CHECK constraint
            self._make_product(sale_price=-100.0)

    def test_state_defaults_to_draft(self):
        p = self._make_product()
        self.assertEqual(p.state, 'draft')

    def test_action_activate(self):
        p = self._make_product()
        p.action_activate()
        self.assertEqual(p.state, 'active')

    def test_action_discontinue(self):
        p = self._make_product()
        p.action_activate()
        p.action_discontinue()
        self.assertEqual(p.state, 'discontinued')
        self.assertFalse(p.is_active)

    def test_category_complete_name_includes_parent(self):
        parent = self.env['shiv.product.category'].sudo().create({'name': 'Parent'})
        child = self.env['shiv.product.category'].sudo().create({
            'name': 'Child', 'parent_id': parent.id})
        self.assertIn('Parent', child.complete_name)
        self.assertIn('Child', child.complete_name)

    def test_category_circular_blocked(self):
        cat = self.env['shiv.product.category'].sudo().create({'name': 'Circular Cat'})
        with self.assertRaises(ValidationError):
            cat.write({'parent_id': cat.id})

    def test_category_delete_with_products_blocked(self):
        p = self._make_product()
        with self.assertRaises(UserError):
            self.cat.unlink()
