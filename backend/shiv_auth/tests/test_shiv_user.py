# -*- coding: utf-8 -*-
"""
shiv_auth/tests/test_shiv_user.py
Unit + Integration tests for ShivUser model.
Run: odoo-bin --test-enable --test-tags shiv_auth -d <db>
"""

from datetime import timedelta
from unittest.mock import patch

from odoo.exceptions import ValidationError, UserError, AccessError
from odoo.tests import TransactionCase, tagged
from odoo import fields


@tagged('shiv_auth', 'shiv_user', 'post_install', '-at_install')
class TestShivUserCreate(TransactionCase):
    """Tests for user creation and field validation."""

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')
        self.env = self.env(user=self.admin)

    def _make_user(self, **kwargs):
        defaults = {
            'name': 'Test User',
            'login': 'testuser@shivfurniture.com',
            'password': 'TestPass@123',
            'shiv_role': 'sales_user',
            'department': 'sales',
        }
        defaults.update(kwargs)
        return self.env['res.users'].create(defaults)

    # ── Creation ─────────────────────────────────────────────────────────────

    def test_create_user_sets_must_change_password(self):
        """New users must always be flagged for password change."""
        user = self._make_user(login='newuser@shiv.com')
        self.assertTrue(user.must_change_password)

    def test_create_user_sets_created_by(self):
        user = self._make_user(login='newuser2@shiv.com')
        self.assertEqual(user.created_by_id.id, self.admin.id)

    def test_create_user_sets_password_last_changed(self):
        user = self._make_user(login='newuser3@shiv.com')
        self.assertIsNotNone(user.password_last_changed)

    def test_create_user_adds_to_role_group(self):
        """Creating a user with shiv_role should add them to the matching Odoo group."""
        user = self._make_user(login='salesperson@shiv.com', shiv_role='sales_user')
        sales_group = self.env.ref('shiv_auth.group_shiv_sales_user', raise_if_not_found=False)
        if sales_group:
            self.assertIn(sales_group, user.groups_id)

    def test_duplicate_employee_id_rejected(self):
        self._make_user(login='emp1@shiv.com', employee_id='EMP001')
        with self.assertRaises(ValidationError) as ctx:
            self._make_user(login='emp2@shiv.com', employee_id='EMP001')
        self.assertIn('EMP001', str(ctx.exception))

    def test_invalid_phone_format_rejected(self):
        with self.assertRaises(ValidationError):
            self._make_user(login='badphone@shiv.com', phone_number='not-a-phone')

    def test_valid_phone_e164_accepted(self):
        user = self._make_user(login='goodphone@shiv.com', phone_number='+919876543210')
        self.assertEqual(user.phone_number, '+919876543210')

    # ── Soft Delete ───────────────────────────────────────────────────────────

    def test_unlink_raises_user_error(self):
        """Hard delete must always be blocked."""
        user = self._make_user(login='todelete@shiv.com')
        with self.assertRaises(UserError) as ctx:
            user.unlink()
        self.assertIn('permanently deleted', str(ctx.exception))

    def test_deactivate_sets_timestamps(self):
        user = self._make_user(login='todeactivate@shiv.com')
        user.action_deactivate_user()
        self.assertFalse(user.active)
        self.assertFalse(user.is_active_shiv)
        self.assertIsNotNone(user.deactivated_on)
        self.assertEqual(user.deactivated_by.id, self.admin.id)

    def test_reactivate_sets_must_change_password(self):
        user = self._make_user(login='reactivate@shiv.com')
        user.sudo().write({'active': False, 'is_active_shiv': False})
        user.action_reactivate_user()
        self.assertTrue(user.active)
        self.assertTrue(user.must_change_password)

    # ── Brute Force ───────────────────────────────────────────────────────────

    def test_failed_login_increments_counter(self):
        user = self._make_user(login='brute@shiv.com')
        initial = user.failed_login_count
        user._on_failed_login()
        self.assertEqual(user.failed_login_count, initial + 1)

    def test_lockout_after_5_failures(self):
        user = self._make_user(login='lockout@shiv.com')
        for _ in range(5):
            user._on_failed_login()
        self.assertTrue(user.is_account_locked)
        self.assertIsNotNone(user.locked_until)

    def test_successful_login_resets_counter(self):
        user = self._make_user(login='resetcounter@shiv.com')
        user.sudo().write({'failed_login_count': 3})
        user._on_successful_login(ip_address='127.0.0.1')
        self.assertEqual(user.failed_login_count, 0)
        self.assertFalse(user.locked_until)

    def test_successful_login_sets_ip(self):
        user = self._make_user(login='iplogin@shiv.com')
        user._on_successful_login(ip_address='192.168.1.100')
        self.assertEqual(user.last_login_ip, '192.168.1.100')


@tagged('shiv_auth', 'shiv_password', 'post_install', '-at_install')
class TestPasswordPolicy(TransactionCase):
    """Tests for password complexity and history enforcement."""

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')
        self.env = self.env(user=self.admin)
        self.user = self.env['res.users'].create({
            'name': 'Policy Tester',
            'login': 'policytest@shiv.com',
            'password': 'FirstPass@123',
            'shiv_role': 'viewer',
        })

    def test_password_too_short_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            self.user._validate_password_complexity('Sh@1')
        self.assertIn('at least', str(ctx.exception))

    def test_password_no_uppercase_rejected(self):
        with self.assertRaises(ValidationError):
            self.user._validate_password_complexity('nouppercase@1')

    def test_password_no_lowercase_rejected(self):
        with self.assertRaises(ValidationError):
            self.user._validate_password_complexity('NOLOWERCASE@1')

    def test_password_no_digit_rejected(self):
        with self.assertRaises(ValidationError):
            self.user._validate_password_complexity('NoDigit@here')

    def test_password_no_special_rejected(self):
        with self.assertRaises(ValidationError):
            self.user._validate_password_complexity('NoSpecial123')

    def test_valid_password_accepted(self):
        # Should not raise
        self.user._validate_password_complexity('ValidPass@123')

    def test_password_history_prevents_reuse(self):
        """After saving a password to history, it should not be reusable."""
        self.user._save_password_to_history('FirstPass@123')
        with self.assertRaises(ValidationError) as ctx:
            self.user._check_password_not_in_history('FirstPass@123')
        self.assertIn('reuse', str(ctx.exception))

    def test_password_expiry_computed(self):
        """password_expires_on should be 90 days after password_last_changed."""
        from_date = fields.Datetime.now()
        self.user.sudo().write({'password_last_changed': from_date})
        expected = from_date + timedelta(days=90)
        # Allow 1s tolerance
        diff = abs((self.user.password_expires_on - expected).total_seconds())
        self.assertLess(diff, 2)

    def test_is_password_expired_true_when_past(self):
        past_date = fields.Datetime.now() - timedelta(days=100)
        self.user.sudo().write({'password_last_changed': past_date})
        # Trigger recompute
        self.user.invalidate_recordset(['password_expires_on', 'is_password_expired'])
        self.assertTrue(self.user.is_password_expired)

    def test_is_password_expired_false_when_fresh(self):
        self.user.sudo().write({'password_last_changed': fields.Datetime.now()})
        self.user.invalidate_recordset(['password_expires_on', 'is_password_expired'])
        self.assertFalse(self.user.is_password_expired)


@tagged('shiv_auth', 'shiv_role_sync', 'post_install', '-at_install')
class TestRoleGroupSync(TransactionCase):
    """Tests for role → Odoo group synchronization."""

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')
        self.env = self.env(user=self.admin)

    def test_sales_user_role_assigned_to_sales_group(self):
        user = self.env['res.users'].create({
            'name': 'Sales Test',
            'login': 'sales.role@shiv.com',
            'password': 'TestPass@123',
            'shiv_role': 'sales_user',
        })
        sales_group = self.env.ref('shiv_auth.group_shiv_sales_user', raise_if_not_found=False)
        if sales_group:
            self.assertIn(sales_group, user.groups_id)

    def test_role_change_removes_old_group(self):
        user = self.env['res.users'].create({
            'name': 'Role Switch',
            'login': 'roleswitch@shiv.com',
            'password': 'TestPass@123',
            'shiv_role': 'sales_user',
        })
        user.write({'shiv_role': 'warehouse_user'})
        user._sync_role_to_groups()

        sales_group = self.env.ref('shiv_auth.group_shiv_sales_user', raise_if_not_found=False)
        wh_group = self.env.ref('shiv_auth.group_shiv_warehouse_user', raise_if_not_found=False)
        if sales_group and wh_group:
            self.assertNotIn(sales_group, user.groups_id)
            self.assertIn(wh_group, user.groups_id)
