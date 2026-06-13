# -*- coding: utf-8 -*-
"""shiv_manufacturing/tests/test_manufacturing_order.py — BoM + MO lifecycle tests."""
from odoo.exceptions import UserError, ValidationError
from odoo.tests import TransactionCase, tagged
from datetime import datetime, timedelta


@tagged('shiv_manufacturing', 'post_install', '-at_install')
class TestBOM(TransactionCase):

    def setUp(self):
        super().setUp()
        uom = self.env.ref('uom.product_uom_unit')
        cat = self.env['shiv.product.category'].sudo().create({'name': 'MFG Cat'})
        self.finished = self.env['shiv.product'].sudo().create({
            'name': 'Finished Sofa', 'category_id': cat.id,
            'product_type': 'storable', 'uom_id': uom.id,
            'procurement_method': 'make',
        })
        self.wood = self.env['shiv.product'].sudo().create({
            'name': 'Teak Wood', 'category_id': cat.id,
            'product_type': 'storable', 'uom_id': uom.id,
        })
        self.fabric = self.env['shiv.product'].sudo().create({
            'name': 'Fabric Roll', 'category_id': cat.id,
            'product_type': 'storable', 'uom_id': uom.id,
        })

    def _make_bom(self):
        return self.env['shiv.bom'].sudo().create({
            'product_id': self.finished.id,
            'qty_produced': 1.0,
            'component_ids': [
                (0, 0, {'product_id': self.wood.id,   'qty_required': 5.0, 'uom_id': self.env.ref('uom.product_uom_unit').id}),
                (0, 0, {'product_id': self.fabric.id, 'qty_required': 3.0, 'uom_id': self.env.ref('uom.product_uom_unit').id}),
            ],
        })

    def test_bom_created_with_components(self):
        bom = self._make_bom()
        self.assertEqual(len(bom.component_ids), 2)

    def test_bom_circular_reference_blocked(self):
        """Product cannot be its own component."""
        with self.assertRaises(ValidationError):
            self.env['shiv.bom'].sudo().create({
                'product_id': self.finished.id,
                'qty_produced': 1.0,
                'component_ids': [(0, 0, {
                    'product_id': self.finished.id,  # CIRCULAR
                    'qty_required': 1.0,
                    'uom_id': self.env.ref('uom.product_uom_unit').id,
                })],
            })

    def test_get_active_bom_returns_correct(self):
        bom = self._make_bom()
        found = self.env['shiv.bom'].get_active_bom(self.finished.id)
        self.assertEqual(found.id, bom.id)


@tagged('shiv_manufacturing', 'post_install', '-at_install')
class TestManufacturingOrder(TransactionCase):

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')
        uom = self.env.ref('uom.product_uom_unit')
        cat = self.env['shiv.product.category'].sudo().create({'name': 'MO Cat'})
        self.finished = self.env['shiv.product'].sudo().create({
            'name': 'MO Finished', 'category_id': cat.id,
            'product_type': 'storable', 'uom_id': uom.id,
        })
        self.comp = self.env['shiv.product'].sudo().create({
            'name': 'MO Component', 'category_id': cat.id,
            'product_type': 'storable', 'uom_id': uom.id,
        })
        self.bom = self.env['shiv.bom'].sudo().create({
            'product_id': self.finished.id,
            'qty_produced': 1.0,
            'component_ids': [(0, 0, {
                'product_id': self.comp.id,
                'qty_required': 4.0,
                'uom_id': uom.id,
            })],
        })
        # Stock 20 units of component
        self.env['shiv.stock.ledger'].sudo().record_movement(
            product_id=self.comp.id, movement_type='in_opening',
            qty_change=20, source_ref='INIT', actor_id=self.admin.id)

    def _make_mo(self, qty=2):
        return self.env['shiv.manufacturing.order'].sudo().create({
            'product_id': self.finished.id,
            'bom_id': self.bom.id,
            'qty_to_produce': qty,
            'scheduled_date': datetime.now() + timedelta(days=2),
        })

    def test_mo_sequence_generated(self):
        mo = self._make_mo()
        self.assertTrue(mo.name.startswith('MO-'))

    def test_mo_components_populated_from_bom(self):
        mo = self._make_mo(qty=2)
        self.assertEqual(len(mo.component_line_ids), 1)
        # qty = bom_line.qty_required * scale = 4 * 2 = 8
        self.assertAlmostEqual(mo.component_line_ids[0].qty_required, 8.0, places=2)

    def test_mo_start_consumes_components(self):
        mo = self._make_mo(qty=2)
        mo.write({'state': 'confirmed'})
        mo.action_start()
        self.assertEqual(mo.state, 'in_progress')
        summary = self.env['shiv.stock.summary'].sudo().search([
            ('product_id', '=', self.comp.id)], limit=1)
        # 20 - 8 = 12
        self.assertAlmostEqual(summary.qty_on_hand, 12.0, places=2)

    def test_mo_done_adds_finished_goods(self):
        mo = self._make_mo(qty=2)
        mo.write({'state': 'confirmed'})
        mo.action_start()
        mo.action_mark_done()
        self.assertEqual(mo.state, 'done')
        summary = self.env['shiv.stock.summary'].sudo().search([
            ('product_id', '=', self.finished.id)], limit=1)
        self.assertAlmostEqual(summary.qty_on_hand, 2.0, places=2)

    def test_mo_start_fails_insufficient_components(self):
        """If components are short, starting MO must raise."""
        mo = self._make_mo(qty=10)  # needs 40 units, only 20 available
        mo.write({'state': 'confirmed'})
        with self.assertRaises(UserError):
            mo.action_start()
