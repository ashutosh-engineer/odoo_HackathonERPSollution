# -*- coding: utf-8 -*-
"""
shiv_auth/models/shiv_user.py
Shiv Furniture Works ERP — User Model (extends res.users)
Production-ready | Odoo 16
"""

import re
import logging
import hashlib
import secrets
from datetime import datetime, timedelta

from odoo import api, fields, models, _
from odoo.exceptions import ValidationError, AccessError, UserError
from odoo.tools import config

_logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Password complexity constants
# ─────────────────────────────────────────────
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128
PASSWORD_HISTORY_DEPTH = 5          # cannot reuse last 5 passwords
PASSWORD_EXPIRY_DAYS = 90           # force reset after 90 days
MAX_LOGIN_ATTEMPTS = 5              # lockout threshold
LOCKOUT_DURATION_MINUTES = 30       # account lockout window


class ShivUser(models.Model):
    """
    Extends Odoo's built-in res.users with:
    - Shiv-specific role assignment
    - Password policy enforcement
    - MFA (TOTP) support
    - Brute-force protection
    - Soft-delete (is_archived)
    - Full audit on every write/unlink
    """
    _inherit = 'res.users'
    _description = 'Shiv Furniture - Extended User'

    # ── Identity & Role ──────────────────────────────────────────────────────
    shiv_role = fields.Selection(
        selection=[
            ('admin',           'System Administrator'),
            ('sales_manager',   'Sales Manager'),
            ('sales_user',      'Sales Executive'),
            ('warehouse_manager','Warehouse Manager'),
            ('warehouse_user',  'Warehouse Staff'),
            ('purchase_manager','Purchase Manager'),
            ('purchase_user',   'Purchase Officer'),
            ('production_manager','Production Manager'),
            ('production_user', 'Production Staff'),
            ('accountant',      'Accountant'),
            ('auditor',         'Auditor (Read-Only)'),
            ('viewer',          'Read-Only Viewer'),
        ],
        string='Shiv Role',
        required=True,
        default='viewer',
        index=True,
        tracking=True,                      # logged in mail.tracking.value
        help='Primary role governing all RBAC record rules across modules.',
    )

    employee_id = fields.Char(
        string='Employee ID',
        size=20,
        copy=False,
        index=True,
        help='HR employee reference code. Used for audit cross-referencing.',
    )

    department = fields.Selection(
        selection=[
            ('sales',       'Sales'),
            ('purchase',    'Purchase'),
            ('warehouse',   'Warehouse / Inventory'),
            ('production',  'Manufacturing'),
            ('finance',     'Finance & Accounts'),
            ('management',  'Management'),
            ('it',          'IT / Admin'),
        ],
        string='Department',
        index=True,
        tracking=True,
    )

    phone_number = fields.Char(
        string='Mobile / Phone',
        size=15,
        help='Used for MFA OTP delivery via SMS (Phase 2).',
    )

    # ── Security & Session ───────────────────────────────────────────────────
    is_mfa_enabled = fields.Boolean(
        string='MFA Enabled',
        default=False,
        help='When True, user must provide TOTP code on each login.',
    )

    mfa_secret = fields.Char(
        string='MFA Secret (TOTP)',
        copy=False,
        groups='shiv_auth.group_shiv_admin',    # only admin can read raw secret
        help='Base32 TOTP secret. Stored encrypted at DB level.',
    )

    last_login = fields.Datetime(
        string='Last Login',
        readonly=True,
        copy=False,
    )

    last_login_ip = fields.Char(
        string='Last Login IP',
        readonly=True,
        copy=False,
        size=45,    # IPv6 max length
    )

    failed_login_count = fields.Integer(
        string='Failed Login Attempts',
        default=0,
        copy=False,
        groups='shiv_auth.group_shiv_admin',
    )

    locked_until = fields.Datetime(
        string='Account Locked Until',
        copy=False,
        groups='shiv_auth.group_shiv_admin',
        help='Null = not locked. Set by brute-force protection trigger.',
    )

    is_account_locked = fields.Boolean(
        string='Account Locked',
        compute='_compute_is_account_locked',
        store=False,
        help='True if locked_until is in the future.',
    )

    # ── Password Policy ──────────────────────────────────────────────────────
    password_last_changed = fields.Datetime(
        string='Password Last Changed',
        copy=False,
        readonly=True,
    )

    password_expires_on = fields.Datetime(
        string='Password Expires On',
        compute='_compute_password_expires_on',
        store=True,
        help='Computed from password_last_changed + 90 days.',
    )

    is_password_expired = fields.Boolean(
        string='Password Expired',
        compute='_compute_is_password_expired',
        store=False,
    )

    must_change_password = fields.Boolean(
        string='Must Change Password on Next Login',
        default=True,
        copy=False,
        help='Forced password change for new accounts and admin resets.',
    )

    password_history_ids = fields.One2many(
        comodel_name='shiv.password.history',
        inverse_name='user_id',
        string='Password History',
        copy=False,
        groups='shiv_auth.group_shiv_admin',
    )

    # ── Soft Delete ──────────────────────────────────────────────────────────
    is_active_shiv = fields.Boolean(
        string='Active (Shiv)',
        default=True,
        index=True,
        help='Soft-delete flag. Never hard-delete users. Deactivate instead.',
    )

    deactivated_on = fields.Datetime(
        string='Deactivated On',
        readonly=True,
        copy=False,
    )

    deactivated_by = fields.Many2one(
        comodel_name='res.users',
        string='Deactivated By',
        readonly=True,
        copy=False,
        ondelete='set null',
    )

    deactivation_reason = fields.Text(
        string='Deactivation Reason',
        copy=False,
    )

    # ── Audit ────────────────────────────────────────────────────────────────
    created_by_id = fields.Many2one(
        comodel_name='res.users',
        string='Created By',
        readonly=True,
        copy=False,
        default=lambda self: self.env.uid,
    )

    last_modified_by_id = fields.Many2one(
        comodel_name='res.users',
        string='Last Modified By',
        readonly=True,
        copy=False,
    )

    # ─────────────────────────────────────────────────────────────────────────
    # COMPUTED FIELDS
    # ─────────────────────────────────────────────────────────────────────────

    @api.depends('locked_until')
    def _compute_is_account_locked(self):
        now = fields.Datetime.now()
        for user in self:
            user.is_account_locked = bool(
                user.locked_until and user.locked_until > now
            )

    @api.depends('password_last_changed')
    def _compute_password_expires_on(self):
        for user in self:
            if user.password_last_changed:
                user.password_expires_on = (
                    user.password_last_changed
                    + timedelta(days=PASSWORD_EXPIRY_DAYS)
                )
            else:
                user.password_expires_on = False

    @api.depends('password_expires_on')
    def _compute_is_password_expired(self):
        now = fields.Datetime.now()
        for user in self:
            user.is_password_expired = bool(
                user.password_expires_on and user.password_expires_on < now
            )

    # ─────────────────────────────────────────────────────────────────────────
    # CONSTRAINTS
    # ─────────────────────────────────────────────────────────────────────────

    @api.constrains('employee_id')
    def _check_employee_id_unique(self):
        for user in self:
            if user.employee_id:
                duplicate = self.search([
                    ('employee_id', '=', user.employee_id),
                    ('id', '!=', user.id),
                ], limit=1)
                if duplicate:
                    raise ValidationError(
                        _('Employee ID "%s" is already assigned to %s.')
                        % (user.employee_id, duplicate.name)
                    )

    @api.constrains('phone_number')
    def _check_phone_format(self):
        phone_re = re.compile(r'^\+?[1-9]\d{6,14}$')
        for user in self:
            if user.phone_number and not phone_re.match(user.phone_number):
                raise ValidationError(
                    _('Phone number "%s" is invalid. Use E.164 format, e.g. +919876543210.')
                    % user.phone_number
                )

    # ─────────────────────────────────────────────────────────────────────────
    # PASSWORD POLICY ENFORCEMENT
    # ─────────────────────────────────────────────────────────────────────────

    def _validate_password_complexity(self, password):
        """
        Enforce production-grade password policy:
        - Min 8, max 128 chars
        - At least 1 uppercase letter
        - At least 1 lowercase letter
        - At least 1 digit
        - At least 1 special character
        - Not in last 5 passwords
        """
        if not password:
            raise ValidationError(_('Password cannot be empty.'))

        if len(password) < PASSWORD_MIN_LENGTH:
            raise ValidationError(
                _('Password must be at least %d characters.') % PASSWORD_MIN_LENGTH
            )

        if len(password) > PASSWORD_MAX_LENGTH:
            raise ValidationError(
                _('Password cannot exceed %d characters.') % PASSWORD_MAX_LENGTH
            )

        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _('Password must contain at least one uppercase letter.')
            )

        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _('Password must contain at least one lowercase letter.')
            )

        if not re.search(r'\d', password):
            raise ValidationError(
                _('Password must contain at least one digit.')
            )

        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>/?`~]', password):
            raise ValidationError(
                _('Password must contain at least one special character (!@#$%^&* etc.).')
            )

        # Check password history
        self._check_password_not_in_history(password)

    def _check_password_not_in_history(self, new_password):
        """Prevent reuse of last PASSWORD_HISTORY_DEPTH passwords."""
        new_hash = self._hash_password(new_password)
        for record in self.password_history_ids.sorted('created_at', reverse=True)[:PASSWORD_HISTORY_DEPTH]:
            if record.password_hash == new_hash:
                raise ValidationError(
                    _('You cannot reuse any of your last %d passwords.')
                    % PASSWORD_HISTORY_DEPTH
                )

    @staticmethod
    def _hash_password(password):
        """SHA-256 hash for password history comparison (NOT for auth storage)."""
        return hashlib.sha256(password.encode('utf-8')).hexdigest()

    def _save_password_to_history(self, password):
        """Persist current password hash to history before changing."""
        if password:
            self.env['shiv.password.history'].sudo().create({
                'user_id': self.id,
                'password_hash': self._hash_password(password),
                'created_at': fields.Datetime.now(),
            })

    # ─────────────────────────────────────────────────────────────────────────
    # OVERRIDE: _set_encrypted_password — hook into Odoo's password change
    # ─────────────────────────────────────────────────────────────────────────

    def write(self, vals):
        # Track who made the last modification
        vals['last_modified_by_id'] = self.env.uid

        # If password is being changed, enforce policy
        if 'password' in vals and vals['password']:
            for user in self:
                user._validate_password_complexity(vals['password'])
                user._save_password_to_history(vals.get('password', ''))
            vals['password_last_changed'] = fields.Datetime.now()
            vals['must_change_password'] = False

        # Capture deactivation
        if 'active' in vals and not vals['active']:
            vals['is_active_shiv'] = False
            vals['deactivated_on'] = fields.Datetime.now()
            vals['deactivated_by'] = self.env.uid

        result = super().write(vals)

        # Emit audit log for every write on a user record
        for user in self:
            self.env['shiv.audit.log'].sudo()._log(
                model='res.users',
                record_id=user.id,
                record_name=user.name,
                action='write',
                changed_fields=list(vals.keys()),
                actor_id=self.env.uid,
            )

        return result

    def unlink(self):
        """Block hard delete. Redirect to soft-delete."""
        raise UserError(
            _('Users cannot be permanently deleted. '
              'Use "Deactivate User" to disable access. '
              'This preserves audit history as required by compliance policy.')
        )

    # ─────────────────────────────────────────────────────────────────────────
    # BRUTE-FORCE PROTECTION
    # ─────────────────────────────────────────────────────────────────────────

    def _on_failed_login(self):
        """
        Called after each failed authentication attempt.
        Increments counter; locks account after MAX_LOGIN_ATTEMPTS.
        """
        self.ensure_one()
        self.sudo().write({
            'failed_login_count': self.failed_login_count + 1,
        })
        if self.failed_login_count >= MAX_LOGIN_ATTEMPTS:
            lock_until = fields.Datetime.now() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            self.sudo().write({'locked_until': lock_until})
            _logger.warning(
                'SECURITY: User %s (id=%d) locked out until %s after %d failed attempts.',
                self.login, self.id, lock_until, self.failed_login_count,
            )
            self.env['shiv.audit.log'].sudo()._log(
                model='res.users',
                record_id=self.id,
                record_name=self.name,
                action='account_locked',
                changed_fields=['locked_until', 'failed_login_count'],
                actor_id=self.id,
                notes=f'Locked after {self.failed_login_count} failed attempts.',
            )

    def _on_successful_login(self, ip_address=None):
        """
        Called after successful authentication.
        Resets failed counter, updates last-login metadata.
        """
        self.ensure_one()
        self.sudo().write({
            'failed_login_count': 0,
            'locked_until': False,
            'last_login': fields.Datetime.now(),
            'last_login_ip': ip_address or 'unknown',
        })
        self.env['shiv.audit.log'].sudo()._log(
            model='res.users',
            record_id=self.id,
            record_name=self.name,
            action='login_success',
            changed_fields=['last_login', 'last_login_ip'],
            actor_id=self.id,
            notes=f'Login from IP: {ip_address}',
        )

    # ─────────────────────────────────────────────────────────────────────────
    # ROLE → ODOO GROUP SYNC
    # ─────────────────────────────────────────────────────────────────────────

    ROLE_GROUP_MAP = {
        'admin':              'shiv_auth.group_shiv_admin',
        'sales_manager':      'shiv_auth.group_shiv_sales_manager',
        'sales_user':         'shiv_auth.group_shiv_sales_user',
        'warehouse_manager':  'shiv_auth.group_shiv_warehouse_manager',
        'warehouse_user':     'shiv_auth.group_shiv_warehouse_user',
        'purchase_manager':   'shiv_auth.group_shiv_purchase_manager',
        'purchase_user':      'shiv_auth.group_shiv_purchase_user',
        'production_manager': 'shiv_auth.group_shiv_production_manager',
        'production_user':    'shiv_auth.group_shiv_production_user',
        'accountant':         'shiv_auth.group_shiv_accountant',
        'auditor':            'shiv_auth.group_shiv_auditor',
        'viewer':             'shiv_auth.group_shiv_viewer',
    }

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            vals['created_by_id'] = self.env.uid
            vals['last_modified_by_id'] = self.env.uid
            if 'password_last_changed' not in vals:
                vals['password_last_changed'] = fields.Datetime.now()
        users = super().create(vals_list)
        for user in users:
            user._sync_role_to_groups()
            self.env['shiv.audit.log'].sudo()._log(
                model='res.users',
                record_id=user.id,
                record_name=user.name,
                action='create',
                changed_fields=list(vals_list[0].keys()),
                actor_id=self.env.uid,
            )
        return users

    def _sync_role_to_groups(self):
        """
        Ensure the user belongs to exactly one Shiv role group.
        Removes all other Shiv groups first to prevent privilege accumulation.
        """
        self.ensure_one()
        all_shiv_groups = self.env['res.groups'].search([
            ('category_id.name', '=', 'Shiv Furniture')
        ])
        target_group_xml = self.ROLE_GROUP_MAP.get(self.shiv_role)
        if not target_group_xml:
            return

        target_group = self.env.ref(target_group_xml, raise_if_not_found=False)
        if not target_group:
            _logger.error('Shiv group %s not found. Check shiv_auth_groups.xml.', target_group_xml)
            return

        # Remove all Shiv groups except the target
        groups_to_remove = all_shiv_groups - target_group
        self.sudo().write({
            'groups_id': [
                (3, g.id) for g in groups_to_remove   # (3, id) = unlink in Odoo m2m
            ] + [
                (4, target_group.id)                   # (4, id) = link
            ]
        })
        _logger.info(
            'User %s role synced: %s → group %s',
            self.login, self.shiv_role, target_group.full_name
        )

    @api.onchange('shiv_role')
    def _onchange_shiv_role(self):
        """Warn UI when role changes — groups will be resynced on save."""
        if self.shiv_role:
            return {
                'warning': {
                    'title': _('Role Changed'),
                    'message': _(
                        'Changing the role will update all access permissions '
                        'immediately upon saving. Ensure this is intentional.'
                    ),
                }
            }

    # ─────────────────────────────────────────────────────────────────────────
    # ADMIN ACTIONS
    # ─────────────────────────────────────────────────────────────────────────

    def action_unlock_account(self):
        """Admin action: manually unlock a locked-out account."""
        self._check_admin()
        self.sudo().write({
            'locked_until': False,
            'failed_login_count': 0,
        })
        self.env['shiv.audit.log'].sudo()._log(
            model='res.users',
            record_id=self.id,
            record_name=self.name,
            action='account_unlocked',
            changed_fields=['locked_until', 'failed_login_count'],
            actor_id=self.env.uid,
            notes='Manual unlock by admin.',
        )
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Account Unlocked'),
                'message': _('User %s has been unlocked.') % self.name,
                'type': 'success',
                'sticky': False,
            },
        }

    def action_force_password_reset(self):
        """Admin action: force user to change password on next login."""
        self._check_admin()
        self.sudo().write({'must_change_password': True})
        self.env['shiv.audit.log'].sudo()._log(
            model='res.users',
            record_id=self.id,
            record_name=self.name,
            action='force_password_reset',
            changed_fields=['must_change_password'],
            actor_id=self.env.uid,
            notes='Forced password reset by admin.',
        )
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Password Reset Required'),
                'message': _('%s will be prompted to change password on next login.') % self.name,
                'type': 'warning',
                'sticky': False,
            },
        }

    def action_deactivate_user(self):
        """Soft-deactivate a user — never hard delete."""
        self._check_admin()
        self.sudo().write({
            'active': False,
            'is_active_shiv': False,
            'deactivated_on': fields.Datetime.now(),
            'deactivated_by': self.env.uid,
        })
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('User Deactivated'),
                'message': _('%s has been deactivated. All audit history preserved.') % self.name,
                'type': 'warning',
                'sticky': False,
            },
        }

    def action_reactivate_user(self):
        """Re-enable a previously deactivated user."""
        self._check_admin()
        self.sudo().write({
            'active': True,
            'is_active_shiv': True,
            'deactivated_on': False,
            'deactivated_by': False,
        })
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('User Reactivated'),
                'message': _('%s has been reactivated.') % self.name,
                'type': 'success',
                'sticky': False,
            },
        }

    def _check_admin(self):
        """Raise AccessError if current user is not a Shiv admin."""
        if not self.env.user.has_group('shiv_auth.group_shiv_admin'):
            raise AccessError(
                _('Only System Administrators can perform this action.')
            )


class ShivPasswordHistory(models.Model):
    """
    Immutable password history table.
    Stores SHA-256 hashes of past passwords (NOT plaintext, NOT bcrypt).
    Used only for re-use prevention — NOT for authentication.
    """
    _name = 'shiv.password.history'
    _description = 'Shiv Furniture - Password History'
    _order = 'created_at desc'

    # No create_uid / write_uid tracking needed — this is system-written only
    user_id = fields.Many2one(
        comodel_name='res.users',
        string='User',
        required=True,
        ondelete='cascade',     # when user is archived, history cascades
        index=True,
    )

    password_hash = fields.Char(
        string='Password Hash (SHA-256)',
        required=True,
        readonly=True,
        help='SHA-256 hash used only for reuse prevention. Not used for auth.',
    )

    created_at = fields.Datetime(
        string='Created At',
        required=True,
        readonly=True,
        default=fields.Datetime.now,
        index=True,
    )

    def unlink(self):
        """Block deletion of password history — compliance requirement."""
        raise UserError(
            _('Password history records cannot be deleted. '
              'This is required for password reuse prevention compliance.')
        )

    def write(self, vals):
        """Block any modification to password history."""
        raise UserError(
            _('Password history records are immutable and cannot be modified.')
        )
