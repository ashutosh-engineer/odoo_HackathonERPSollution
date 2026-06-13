# -*- coding: utf-8 -*-
"""
test_stock_reservation.py
End-to-end sales order confirmation test with inventory reservation.
"""
from odoo.exceptions import ValidationError
from odoo.tests import TransactionCase, tagged
from odoo import fields
from datetime import date, timedelta


@tagged('shiv_inventory', 'shiv_sales', 'post_install', '-at_install')
class TestSalesOrderReservation(TransactionCase):

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')
        category = self.env['shiv.product.category'].sudo().create({'name': 'SO Test Cat'})
        uom_unit = self.env.ref('uom.product_uom_unit')
        self.product = self.env['shiv.product'].sudo().create({
            'name': 'SO Test Product',
            'category_id': category.id,
            'product_type': 'storable',
            'uom_id': uom_unit.id,
            'sale_price': 10000.0,
            'procurement_method': 'buy',
        })
        self.customer = self.env['shiv.customer'].sudo().create({
            'name': 'Test Customer',
            'email': 'test@customer.com',
        })
        # Stock 10 units
        self.env['shiv.stock.ledger'].sudo().record_movement(
            product_id=self.product.id,
            movement_type='in_opening',
            qty_change=10,
            source_ref='INIT',
            actor_id=self.admin.id,
        )

    def _make_so(self, qty):
        return self.env['shiv.sale.order'].sudo().create({
            'customer_id': self.customer.id,
            'delivery_date': date.today() + timedelta(days=7),
            'line_ids': [(0, 0, {
                'product_id': self.product.id,
                'qty_ordered': qty,
                'unit_price': 10000.0,
            })],
        })

    def test_so_confirmation_reserves_stock(self):
        so = self._make_so(5)
        so.action_confirm()
        self.assertEqual(so.state, 'confirmed')
        # Check reservation
        line = so.line_ids[0]
        self.assertTrue(line.is_reserved)
        summary = self.env['shiv.stock.summary'].sudo().search([
            ('product_id', '=', self.product.id)], limit=1)
        self.assertAlmostEqual(summary.qty_reserved, 5.0, places=2)

    def test_so_delivery_deducts_stock(self):
        so = self._make_so(5)
        so.action_confirm()
        so.action_deliver()
        self.assertEqual(so.state, 'delivered')
        summary = self.env['shiv.stock.summary'].sudo().search([
            ('product_id', '=', self.product.id)], limit=1)
        self.assertAlmostEqual(summary.qty_on_hand, 5.0, places=2)
        self.assertAlmostEqual(summary.qty_reserved, 0.0, places=2)

    def test_so_cancel_releases_reservation(self):
        so = self._make_so(5)
        so.action_confirm()
        so.action_cancel()
        self.assertEqual(so.state, 'cancelled')
        summary = self.env['shiv.stock.summary'].sudo().search([
            ('product_id', '=', self.product.id)], limit=1)
        self.assertAlmostEqual(summary.qty_reserved, 0.0, places=2)
        self.assertAlmostEqual(summary.qty_available, 10.0, places=2)

    def test_two_orders_same_stock_second_triggers_procurement(self):
        """
        If two orders exceed available stock, second triggers auto-procurement.
        This verifies the procurement automation path.
        """
        so1 = self._make_so(8)
        so1.action_confirm()

        so2 = self._make_so(5)  # only 2 available after so1
        so2.action_confirm()

        self.assertEqual(so2.state, 'confirmed')
        # so2 should have triggered procurement since not enough stock
        self.assertTrue(so2.procurement_triggered)
        self.assertFalse(so2.is_fully_reserved)
