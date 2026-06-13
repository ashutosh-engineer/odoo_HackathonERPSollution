# -*- coding: utf-8 -*-
"""
shiv_auth/tests/test_shiv_audit_log.py
Tests for immutable audit log.
"""

from odoo.exceptions import UserError
from odoo.tests import TransactionCase, tagged
from odoo import fields


@tagged('shiv_auth', 'shiv_audit', 'post_install', '-at_install')
class TestShivAuditLog(TransactionCase):

    def setUp(self):
        super().setUp()
        self.admin = self.env.ref('base.user_admin')

    def _create_log(self, **kwargs):
        defaults = {
            'action': 'create',
            'model': 'res.users',
            'record_id': 1,
            'record_name': 'Test User',
            'actor_id': self.admin.id,
            'actor_name': self.admin.name,
            'actor_role': 'admin',
            'timestamp': fields.Datetime.now(),
            'is_locked': True,
        }
        defaults.update(kwargs)
        return self.env['shiv.audit.log'].sudo().create(defaults)

    def test_log_write_blocked(self):
        """Audit log entries must not be modifiable."""
        log = self._create_log()
        with self.assertRaises(UserError) as ctx:
            log.write({'notes': 'tampered'})
        self.assertIn('immutable', str(ctx.exception))

    def test_log_unlink_blocked(self):
        """Audit log entries must not be deletable."""
        log = self._create_log()
        with self.assertRaises(UserError) as ctx:
            log.unlink()
        self.assertIn('deleted', str(ctx.exception))

    def test_log_method_creates_record(self):
        """_log() helper should create an audit record."""
        before_count = self.env['shiv.audit.log'].sudo().search_count([])
        self.env['shiv.audit.log'].sudo()._log(
            model='res.users',
            record_id=999,
            record_name='Fictional User',
            action='write',
            changed_fields=['name'],
            actor_id=self.admin.id,
            notes='Test log entry',
        )
        after_count = self.env['shiv.audit.log'].sudo().search_count([])
        self.assertEqual(after_count, before_count + 1)

    def test_log_method_does_not_crash_on_bad_actor(self):
        """_log() must not raise even if actor_id is invalid (audit must never break flow)."""
        # Should not raise
        self.env['shiv.audit.log'].sudo()._log(
            model='res.users',
            record_id=1,
            action='write',
            actor_id=99999,   # non-existent user ID
        )

    def test_is_locked_always_true(self):
        log = self._create_log()
        self.assertTrue(log.is_locked)

    def test_get_user_activity_returns_correct_user(self):
        self._create_log(actor_id=self.admin.id, action='login_success')
        logs = self.env['shiv.audit.log'].sudo().get_user_activity(self.admin.id, limit=10)
        for log in logs:
            self.assertEqual(log.actor_id, self.admin.id)

    def test_get_security_events_filters_correctly(self):
        self._create_log(action='account_locked')
        self._create_log(action='create')    # should NOT appear in security events
        events = self.env['shiv.audit.log'].sudo().get_security_events(limit=100)
        for event in events:
            self.assertIn(event.action, [
                'login_failed', 'account_locked', 'account_unlocked',
                'force_logout', 'permission_denied', 'mfa_failed',
                'force_password_reset', 'role_changed',
            ])
