# -*- coding: utf-8 -*-
"""shiv_purchase/tests/test_purchase_order.py — PO lifecycle + auto-procurement tests."""
from odoo.exceptions import UserError
from odoo.tests import TransactionCase, tagged
from datetime import date, timedelta


@tagged('shiv_purchase', 'post_install', '-at_install')
class TestPurchaseOrder(TransactionCase):

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')
        category = self.env['shiv.product.category'].sudo().create({'name': 'PO Cat'})
        uom = self.env.ref('uom.product_uom_unit')
        self.product = self.env['shiv.product'].sudo().create({
            'name': 'PO Product', 'category_id': category.id,
            'product_type': 'storable', 'uom_id': uom.id,
            'cost_price': 500.0, 'procurement_method': 'buy',
        })
        self.vendor = self.env['shiv.vendor'].sudo().create({
            'name': 'Test Vendor', 'code': 'VEND-001',
        })
        self.vendor_product = self.env['shiv.vendor.product'].sudo().create({
            'vendor_id': self.vendor.id,
            'product_id': self.product.id,
            'unit_price': 500.0,
            'lead_time_days': 3,
            'min_order_qty': 1.0,
            'is_preferred': True,
        })

    def _make_po(self, qty=10):
        return self.env['shiv.purchase.order'].sudo().create({
            'vendor_id': self.vendor.id,
            'date_expected': date.today() + timedelta(days=3),
            'line_ids': [(0, 0, {
                'product_id': self.product.id,
                'qty_ordered': qty,
                'unit_price': 500.0,
            })],
        })

    def test_po_sequence_generated(self):
        po = self._make_po()
        self.assertTrue(po.name.startswith('PO-'))

    def test_po_total_computed(self):
        po = self._make_po(qty=10)
        self.assertAlmostEqual(po.total_amount, 5000.0, places=2)

    def test_po_confirm_changes_state(self):
        po = self._make_po()
        po.action_confirm()
        self.assertEqual(po.state, 'confirmed')
        self.assertEqual(po.confirmed_by.id, self.admin.id)

    def test_po_receive_adds_stock(self):
        po = self._make_po(qty=5)
        po.action_confirm()
        po.action_receive()
        self.assertEqual(po.state, 'done')
        summary = self.env['shiv.stock.summary'].sudo().search([
            ('product_id', '=', self.product.id)], limit=1)
        self.assertGreaterEqual(summary.qty_on_hand, 5.0)

    def test_po_cancel_from_draft(self):
        po = self._make_po()
        po.action_cancel()
        self.assertEqual(po.state, 'cancelled')

    def test_po_cannot_cancel_done(self):
        po = self._make_po()
        po.action_confirm()
        po.action_receive()
        with self.assertRaises(UserError):
            po.action_cancel()

    def test_auto_procurement_creates_po(self):
        """auto_create_from_demand should auto-select best vendor and create PO."""
        po = self.env['shiv.purchase.order'].sudo().auto_create_from_demand(
            product_id=self.product.id,
            qty_needed=20,
            trigger_source='SO-AUTO-TEST',
        )
        self.assertIsNotNone(po.id)
        self.assertTrue(po.is_auto_generated)
        self.assertEqual(po.trigger_source, 'SO-AUTO-TEST')
        self.assertEqual(len(po.line_ids), 1)
        self.assertAlmostEqual(po.line_ids[0].qty_ordered, 20.0, places=2)

    def test_vendor_best_selection(self):
        """get_best_vendor should return the preferred, shortest lead-time vendor."""
        best = self.env['shiv.vendor.product'].sudo().get_best_vendor(
            self.product.id, required_qty=5)
        self.assertIsNotNone(best)
        self.assertEqual(best.vendor_id.id, self.vendor.id)
