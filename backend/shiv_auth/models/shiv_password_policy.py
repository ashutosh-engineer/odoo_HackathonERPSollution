# -*- coding: utf-8 -*-
"""
shiv_auth/models/shiv_password_policy.py
Shiv Furniture Works ERP — Password Policy Configuration
Production-ready | Odoo 16

Allows admins to configure password policy from the UI
without code changes. Singleton model (only one record exists).
"""

from odoo import api, fields, models, _
from odoo.exceptions import ValidationError, UserError


class ShivPasswordPolicy(models.Model):
    """
    Singleton configuration model for password policy.
    Only one record (id=1) is allowed.
    All password validation in ShivUser reads from this record.
    """
    _name = 'shiv.password.policy'
    _description = 'Shiv Furniture - Password Policy'
    _rec_name = 'policy_name'

    policy_name = fields.Char(
        string='Policy Name',
        default='Default Password Policy',
        required=True,
    )

    min_length = fields.Integer(
        string='Minimum Length',
        default=8,
        required=True,
        help='Minimum number of characters required.',
    )

    max_length = fields.Integer(
        string='Maximum Length',
        default=128,
        required=True,
    )

    require_uppercase = fields.Boolean(
        string='Require Uppercase Letter',
        default=True,
    )

    require_lowercase = fields.Boolean(
        string='Require Lowercase Letter',
        default=True,
    )

    require_digit = fields.Boolean(
        string='Require Digit',
        default=True,
    )

    require_special = fields.Boolean(
        string='Require Special Character',
        default=True,
    )

    special_chars_allowed = fields.Char(
        string='Allowed Special Characters',
        default='!@#$%^&*()_+-=[]{};\':"|,.<>/?`~',
        help='List of characters considered "special".',
    )

    expiry_days = fields.Integer(
        string='Password Expiry (Days)',
        default=90,
        required=True,
        help='0 = never expire.',
    )

    history_depth = fields.Integer(
        string='Password History Depth',
        default=5,
        required=True,
        help='Number of previous passwords that cannot be reused.',
    )

    max_login_attempts = fields.Integer(
        string='Max Failed Login Attempts',
        default=5,
        required=True,
        help='Lockout triggered after this many consecutive failures.',
    )

    lockout_duration_minutes = fields.Integer(
        string='Lockout Duration (Minutes)',
        default=30,
        required=True,
    )

    max_concurrent_sessions = fields.Integer(
        string='Max Concurrent Sessions per User',
        default=3,
        required=True,
    )

    session_idle_timeout_hours = fields.Integer(
        string='Session Idle Timeout (Hours)',
        default=8,
        required=True,
    )

    force_change_on_first_login = fields.Boolean(
        string='Force Password Change on First Login',
        default=True,
    )

    # ── Constraints ──────────────────────────────────────────────────────────

    @api.constrains('min_length', 'max_length')
    def _check_length_range(self):
        for policy in self:
            if policy.min_length < 6:
                raise ValidationError(_('Minimum password length cannot be less than 6.'))
            if policy.max_length > 256:
                raise ValidationError(_('Maximum password length cannot exceed 256.'))
            if policy.min_length > policy.max_length:
                raise ValidationError(_('Minimum length cannot exceed maximum length.'))

    @api.constrains('expiry_days')
    def _check_expiry(self):
        for policy in self:
            if policy.expiry_days < 0:
                raise ValidationError(_('Expiry days cannot be negative.'))

    @api.constrains('max_login_attempts')
    def _check_max_attempts(self):
        for policy in self:
            if policy.max_login_attempts < 1:
                raise ValidationError(_('Max login attempts must be at least 1.'))

    @api.constrains('lockout_duration_minutes')
    def _check_lockout(self):
        for policy in self:
            if policy.lockout_duration_minutes < 1:
                raise ValidationError(_('Lockout duration must be at least 1 minute.'))

    # ── Singleton enforcement ─────────────────────────────────────────────────

    @api.model
    def create(self, vals):
        if self.search_count([]) >= 1:
            raise UserError(
                _('Only one Password Policy record is allowed. Edit the existing one.')
            )
        return super().create(vals)

    @api.model
    def get_policy(self):
        """Returns the active policy record, or creates default if missing."""
        policy = self.search([], limit=1)
        if not policy:
            policy = self.sudo().create({'policy_name': 'Default Password Policy'})
        return policy
