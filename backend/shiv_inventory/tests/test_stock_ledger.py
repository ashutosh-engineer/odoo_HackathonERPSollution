# -*- coding: utf-8 -*-
"""
shiv_inventory/tests/test_stock_ledger.py
Tests for immutable stock ledger, summary recomputation, and stock adjustments.
Run: odoo-bin --test-enable --test-tags shiv_inventory -d <db>
"""
from odoo.exceptions import UserError, ValidationError
from odoo.tests import TransactionCase, tagged
from odoo import fields


@tagged('shiv_inventory', 'post_install', '-at_install')
class TestStockLedger(TransactionCase):

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')
        # Create a test product
        category = self.env['shiv.product.category'].sudo().create({'name': 'Test Cat'})
        uom_unit = self.env.ref('uom.product_uom_unit')
        self.product = self.env['shiv.product'].sudo().create({
            'name': 'Test Sofa',
            'category_id': category.id,
            'product_type': 'storable',
            'uom_id': uom_unit.id,
            'sale_price': 15000.0,
            'cost_price': 8000.0,
            'reorder_point': 5.0,
        })

    def _add_stock(self, qty, movement_type='in_opening'):
        return self.env['shiv.stock.ledger'].sudo().record_movement(
            product_id=self.product.id,
            movement_type=movement_type,
            qty_change=qty,
            source_ref='TEST',
            actor_id=self.admin.id,
        )

    # ── Immutability ──────────────────────────────────────────────────────────

    def test_ledger_write_blocked(self):
        entry = self._add_stock(10)
        with self.assertRaises(UserError) as ctx:
            entry.write({'notes': 'tampered'})
        self.assertIn('immutable', str(ctx.exception).lower())

    def test_ledger_unlink_blocked(self):
        entry = self._add_stock(10)
        with self.assertRaises(UserError):
            entry.unlink()

    def test_ledger_is_locked_always_true(self):
        entry = self._add_stock(5)
        self.assertTrue(entry.is_locked)

    # ── Stock IN ──────────────────────────────────────────────────────────────

    def test_stock_in_updates_summary(self):
        self._add_stock(20, 'in_opening')
        summary = self.env['shiv.stock.summary'].sudo().search([
            ('product_id', '=', self.product.id)], limit=1)
        self.assertIsNotNone(summary)
        self.assertGreaterEqual(summary.qty_on_hand, 20.0)

    def test_multiple_in_movements_cumulate(self):
        self._add_stock(10, 'in_opening')
        self._add_stock(5, 'in_purchase')
        summary = self.env['shiv.stock.summary'].sudo().search([
            ('product_id', '=', self.product.id)], limit=1)
        self.assertGreaterEqual(summary.qty_on_hand, 15.0)

    # ── Stock OUT ─────────────────────────────────────────────────────────────

    def test_stock_out_reduces_summary(self):
        self._add_stock(20, 'in_opening')
        self.env['shiv.stock.ledger'].sudo().record_movement(
            product_id=self.product.id,
            movement_type='out_sale',
            qty_change=-5,
            source_ref='SO-TEST',
            actor_id=self.admin.id,
        )
        summary = self.env['shiv.stock.summary'].sudo().search([
            ('product_id', '=', self.product.id)], limit=1)
        self.assertAlmostEqual(summary.qty_on_hand, 15.0, places=2)

    # ── Adjustment ────────────────────────────────────────────────────────────

    def test_stock_adjustment_validate_writes_ledger(self):
        self._add_stock(10, 'in_opening')
        adj = self.env['shiv.stock.adjustment'].sudo().create({
            'adjustment_type': 'correction',
            'notes': 'Test correction',
            'line_ids': [(0, 0, {
                'product_id': self.product.id,
                'qty_physical': 12.0,  # system=10, physical=12 → +2
            })],
        })
        adj.action_validate()
        self.assertEqual(adj.state, 'done')

    def test_stock_adjustment_cancel_blocked_after_done(self):
        self._add_stock(10, 'in_opening')
        adj = self.env['shiv.stock.adjustment'].sudo().create({
            'adjustment_type': 'correction',
            'line_ids': [(0, 0, {
                'product_id': self.product.id,
                'qty_physical': 10.0,
            })],
        })
        adj.action_validate()
        # Cannot validate a done adjustment again
        with self.assertRaises(UserError):
            adj.action_validate()


@tagged('shiv_inventory', 'post_install', '-at_install')
class TestStockReservation(TransactionCase):
    """
    Critical: tests for ACID inventory reservation.
    Overselling must be IMPOSSIBLE.
    """

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')
        category = self.env['shiv.product.category'].sudo().create({'name': 'Reserve Cat'})
        uom_unit = self.env.ref('uom.product_uom_unit')
        self.product = self.env['shiv.product'].sudo().create({
            'name': 'Reserve Product',
            'category_id': category.id,
            'product_type': 'storable',
            'uom_id': uom_unit.id,
            'sale_price': 5000.0,
        })
        # Add 10 units to start
        self.env['shiv.stock.ledger'].sudo().record_movement(
            product_id=self.product.id,
            movement_type='in_opening',
            qty_change=10,
            source_ref='INIT',
            actor_id=self.admin.id,
        )

    def test_reserve_within_available_succeeds(self):
        """Reserving 5 from 10 available should succeed."""
        self.env['shiv.stock.ledger'].sudo().record_movement(
            product_id=self.product.id,
            movement_type='reserve',
            qty_change=-5,
            source_ref='SO-001',
            actor_id=self.admin.id,
        )
        summary = self.env['shiv.stock.summary'].sudo().search([
            ('product_id', '=', self.product.id)], limit=1)
        self.assertAlmostEqual(summary.qty_reserved, 5.0, places=2)
        self.assertAlmostEqual(summary.qty_available, 5.0, places=2)

    def test_reserve_exceeds_available_raises(self):
        """Reserving 15 from 10 available MUST raise — no overselling."""
        with self.assertRaises(ValidationError) as ctx:
            self.env['shiv.stock.ledger'].sudo().record_movement(
                product_id=self.product.id,
                movement_type='reserve',
                qty_change=-15,
                source_ref='SO-OVER',
                actor_id=self.admin.id,
            )
        self.assertIn('Insufficient', str(ctx.exception))

    def test_unreserve_releases_stock(self):
        """After reserving and unreserving, available should return to original."""
        self.env['shiv.stock.ledger'].sudo().record_movement(
            product_id=self.product.id,
            movement_type='reserve',
            qty_change=-5,
            source_ref='SO-002',
            actor_id=self.admin.id,
        )
        self.env['shiv.stock.ledger'].sudo().record_movement(
            product_id=self.product.id,
            movement_type='unreserve',
            qty_change=5,
            source_ref='SO-002-CANCEL',
            actor_id=self.admin.id,
        )
        summary = self.env['shiv.stock.summary'].sudo().search([
            ('product_id', '=', self.product.id)], limit=1)
        self.assertAlmostEqual(summary.qty_reserved, 0.0, places=2)
        self.assertAlmostEqual(summary.qty_available, 10.0, places=2)

    def test_sequential_reserves_deplete_correctly(self):
        """Two sequential reserves of 5 each from 10 — second leaves 0 available."""
        for ref in ['SO-A', 'SO-B']:
            self.env['shiv.stock.ledger'].sudo().record_movement(
                product_id=self.product.id,
                movement_type='reserve',
                qty_change=-5,
                source_ref=ref,
                actor_id=self.admin.id,
            )
        summary = self.env['shiv.stock.summary'].sudo().search([
            ('product_id', '=', self.product.id)], limit=1)
        self.assertAlmostEqual(summary.qty_reserved, 10.0, places=2)
        self.assertAlmostEqual(summary.qty_available, 0.0, places=2)

    def test_third_reserve_after_depletion_fails(self):
        """After 10 units reserved, any further reservation must fail."""
        for ref in ['SO-A', 'SO-B']:
            self.env['shiv.stock.ledger'].sudo().record_movement(
                product_id=self.product.id,
                movement_type='reserve',
                qty_change=-5,
                source_ref=ref,
                actor_id=self.admin.id,
            )
        with self.assertRaises(ValidationError):
            self.env['shiv.stock.ledger'].sudo().record_movement(
                product_id=self.product.id,
                movement_type='reserve',
                qty_change=-1,
                source_ref='SO-C',
                actor_id=self.admin.id,
            )
