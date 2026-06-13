# -*- coding: utf-8 -*-
"""
shiv_auth/tests/test_shiv_password_policy.py
Tests for ShivPasswordPolicy singleton and session limits.
"""

from odoo.exceptions import ValidationError, UserError
from odoo.tests import TransactionCase, tagged


@tagged('shiv_auth', 'shiv_policy', 'post_install', '-at_install')
class TestPasswordPolicySingleton(TransactionCase):

    def setUp(self):
        super().setUp()
        self.Policy = self.env['shiv.password.policy'].sudo()

    def test_get_policy_creates_if_missing(self):
        """get_policy() should return a record even if none exists."""
        policy = self.Policy.get_policy()
        self.assertIsNotNone(policy)
        self.assertTrue(policy.id)

    def test_second_create_raises_error(self):
        """Only one policy record allowed."""
        # Ensure one exists
        self.Policy.get_policy()
        with self.assertRaises(UserError) as ctx:
            self.Policy.create({'policy_name': 'Second Policy'})
        self.assertIn('one', str(ctx.exception).lower())

    def test_min_length_below_6_rejected(self):
        policy = self.Policy.get_policy()
        with self.assertRaises(ValidationError):
            policy.write({'min_length': 4})

    def test_max_length_above_256_rejected(self):
        policy = self.Policy.get_policy()
        with self.assertRaises(ValidationError):
            policy.write({'max_length': 300})

    def test_min_greater_than_max_rejected(self):
        policy = self.Policy.get_policy()
        with self.assertRaises(ValidationError):
            policy.write({'min_length': 50, 'max_length': 20})

    def test_zero_expiry_days_allowed(self):
        """0 expiry days = never expire (valid config)."""
        policy = self.Policy.get_policy()
        policy.write({'expiry_days': 0})
        self.assertEqual(policy.expiry_days, 0)

    def test_negative_expiry_days_rejected(self):
        policy = self.Policy.get_policy()
        with self.assertRaises(ValidationError):
            policy.write({'expiry_days': -1})

    def test_zero_max_login_attempts_rejected(self):
        policy = self.Policy.get_policy()
        with self.assertRaises(ValidationError):
            policy.write({'max_login_attempts': 0})


@tagged('shiv_auth', 'shiv_session', 'post_install', '-at_install')
class TestShivSession(TransactionCase):
    """Tests for session tracking and concurrent session limits."""

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')
        self.Session = self.env['shiv.session'].sudo()

    def test_register_session_creates_record(self):
        session = self.Session.register_session(
            user_id=self.admin.id,
            session_token='abc123def456',
            ip_address='127.0.0.1',
            user_agent='TestAgent/1.0',
            device_type='api',
        )
        self.assertIsNotNone(session.id)
        self.assertEqual(session.state, 'active')
        self.assertEqual(session.ip_address, '127.0.0.1')

    def test_session_token_preview_shows_partial(self):
        session = self.Session.register_session(
            user_id=self.admin.id,
            session_token='abcdefgh12345678',
            ip_address='127.0.0.1',
        )
        self.assertTrue(session.session_token_preview.startswith('abcdefgh'))
        self.assertIn('...', session.session_token_preview)

    def test_concurrent_session_limit_evicts_oldest(self):
        """Creating more than 3 sessions should evict the oldest ones."""
        for i in range(4):
            self.Session.register_session(
                user_id=self.admin.id,
                session_token=f'session_token_{i:04d}',
                ip_address='10.0.0.1',
            )
        active_sessions = self.Session.search([
            ('user_id', '=', self.admin.id),
            ('state', '=', 'active'),
        ])
        self.assertLessEqual(len(active_sessions), 3)

    def test_session_unlink_blocked(self):
        session = self.Session.register_session(
            user_id=self.admin.id,
            session_token='permanent_session',
            ip_address='127.0.0.1',
        )
        with self.assertRaises(UserError):
            session.unlink()

    def test_expire_all_user_sessions(self):
        self.Session.register_session(
            user_id=self.admin.id,
            session_token='session_to_expire_1',
            ip_address='127.0.0.1',
        )
        self.Session.register_session(
            user_id=self.admin.id,
            session_token='session_to_expire_2',
            ip_address='127.0.0.1',
        )
        self.Session.action_expire_all_user_sessions(
            self.admin.id, reason='Test expiry'
        )
        active = self.Session.search([
            ('user_id', '=', self.admin.id),
            ('state', '=', 'active'),
        ])
        self.assertEqual(len(active), 0)
