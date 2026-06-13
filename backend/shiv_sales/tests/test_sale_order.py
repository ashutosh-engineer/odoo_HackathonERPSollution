# -*- coding: utf-8 -*-
"""shiv_sales/tests/test_sale_order.py — Sales order lifecycle tests."""
from odoo.exceptions import UserError
from odoo.tests import TransactionCase, tagged
from datetime import date, timedelta


@tagged('shiv_sales', 'post_install', '-at_install')
class TestSaleOrderLifecycle(TransactionCase):

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')
        category = self.env['shiv.product.category'].sudo().create({'name': 'Sales Cat'})
        uom = self.env.ref('uom.product_uom_unit')
        self.product = self.env['shiv.product'].sudo().create({
            'name': 'Sales Product', 'category_id': category.id,
            'product_type': 'storable', 'uom_id': uom.id,
            'sale_price': 5000.0, 'procurement_method': 'buy',
        })
        self.customer = self.env['shiv.customer'].sudo().create({'name': 'Cust A'})
        # Add 20 units stock
        self.env['shiv.stock.ledger'].sudo().record_movement(
            product_id=self.product.id, movement_type='in_opening',
            qty_change=20, source_ref='INIT', actor_id=self.admin.id)

    def _make_so(self, qty=5):
        return self.env['shiv.sale.order'].sudo().create({
            'customer_id': self.customer.id,
            'delivery_date': date.today() + timedelta(days=5),
            'line_ids': [(0, 0, {
                'product_id': self.product.id,
                'qty_ordered': qty,
                'unit_price': 5000.0,
            })],
        })

    def test_so_sequence_generated(self):
        so = self._make_so()
        self.assertTrue(so.name.startswith('SO-'))

    def test_so_draft_to_confirmed(self):
        so = self._make_so()
        self.assertEqual(so.state, 'draft')
        so.action_confirm()
        self.assertEqual(so.state, 'confirmed')

    def test_so_confirmed_by_set(self):
        so = self._make_so()
        so.action_confirm()
        self.assertEqual(so.confirmed_by.id, self.admin.id)
        self.assertIsNotNone(so.confirmed_at)

    def test_so_total_computed_correctly(self):
        so = self._make_so(qty=3)
        self.assertAlmostEqual(so.total_amount, 15000.0, places=2)

    def test_so_delivered_after_confirm(self):
        so = self._make_so()
        so.action_confirm()
        so.action_deliver()
        self.assertEqual(so.state, 'delivered')

    def test_so_cancel_from_draft(self):
        so = self._make_so()
        so.action_cancel()
        self.assertEqual(so.state, 'cancelled')

    def test_so_cannot_cancel_delivered(self):
        so = self._make_so()
        so.action_confirm()
        so.action_deliver()
        with self.assertRaises(UserError):
            so.action_cancel()

    def test_so_discount_applied_in_subtotal(self):
        so = self.env['shiv.sale.order'].sudo().create({
            'customer_id': self.customer.id,
            'delivery_date': date.today() + timedelta(days=5),
            'line_ids': [(0, 0, {
                'product_id': self.product.id,
                'qty_ordered': 2,
                'unit_price': 10000.0,
                'discount_pct': 10.0,  # 10% discount
            })],
        })
        line = so.line_ids[0]
        # 2 * 10000 * 0.9 = 18000
        self.assertAlmostEqual(line.subtotal, 18000.0, places=2)
