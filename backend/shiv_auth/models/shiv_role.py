# -*- coding: utf-8 -*-
"""
shiv_auth/models/shiv_role.py
Shiv Furniture Works ERP — Role Metadata Model
Production-ready | Odoo 16

Stores human-readable metadata about each role:
description, permissions summary, module access matrix.
The actual access control is enforced by ir.model.access + ir.rule.
This model is the "documentation layer" of RBAC.
"""

from odoo import api, fields, models, _
from odoo.exceptions import UserError


class ShivRole(models.Model):
    """
    Role metadata registry.
    Each row describes one Shiv role's capabilities and constraints.
    Read-only to non-admins — defines the RBAC contract for the entire ERP.
    """
    _name = 'shiv.role'
    _description = 'Shiv Furniture - Role Definition'
    _order = 'sequence asc'
    _rec_name = 'display_name'

    # ── Identity ─────────────────────────────────────────────────────────────
    code = fields.Char(
        string='Role Code',
        required=True,
        readonly=True,
        size=32,
        index=True,
        help='Internal code matching res.users.shiv_role selection values.',
    )

    display_name = fields.Char(
        string='Display Name',
        required=True,
        size=64,
        translate=True,
    )

    description = fields.Text(
        string='Description',
        translate=True,
        help='Human-readable description of what this role can do.',
    )

    sequence = fields.Integer(
        string='Sequence',
        default=10,
        help='Display order in UI lists.',
    )

    color = fields.Integer(
        string='Color Index',
        default=0,
        help='Kanban color for visual differentiation.',
    )

    # ── Access Matrix ─────────────────────────────────────────────────────────
    # Each Boolean represents a module-level capability.
    # These are purely informational — actual enforcement is in ir.model.access.

    can_view_sales = fields.Boolean(string='View Sales Orders', default=False)
    can_create_sales = fields.Boolean(string='Create Sales Orders', default=False)
    can_approve_sales = fields.Boolean(string='Approve Sales Orders', default=False)

    can_view_inventory = fields.Boolean(string='View Inventory', default=False)
    can_adjust_inventory = fields.Boolean(string='Adjust Inventory', default=False)
    can_transfer_inventory = fields.Boolean(string='Transfer Inventory', default=False)

    can_view_purchase = fields.Boolean(string='View Purchase Orders', default=False)
    can_create_purchase = fields.Boolean(string='Create Purchase Orders', default=False)
    can_approve_purchase = fields.Boolean(string='Approve Purchase Orders', default=False)

    can_view_manufacturing = fields.Boolean(string='View Manufacturing Orders', default=False)
    can_create_manufacturing = fields.Boolean(string='Create Manufacturing Orders', default=False)
    can_execute_manufacturing = fields.Boolean(string='Execute Work Orders', default=False)

    can_view_audit_log = fields.Boolean(string='View Audit Logs', default=False)
    can_export_audit_log = fields.Boolean(string='Export Audit Logs', default=False)

    can_manage_users = fields.Boolean(string='Manage Users', default=False)
    can_manage_roles = fields.Boolean(string='Manage Roles', default=False)

    can_view_financial = fields.Boolean(string='View Financial Data', default=False)
    can_view_cost_prices = fields.Boolean(string='View Cost Prices', default=False)

    can_view_dashboard = fields.Boolean(string='View Dashboard', default=True)
    can_view_reports = fields.Boolean(string='View Reports', default=False)
    can_export_reports = fields.Boolean(string='Export Reports', default=False)

    # ── Linked Odoo Group ─────────────────────────────────────────────────────
    group_id = fields.Many2one(
        comodel_name='res.groups',
        string='Odoo Security Group',
        help='The ir.groups record that enforces this role\'s permissions.',
        readonly=True,
    )

    active_user_count = fields.Integer(
        string='Active Users',
        compute='_compute_active_user_count',
        store=False,
        help='Number of currently active users with this role.',
    )

    # ─────────────────────────────────────────────────────────────────────────

    @api.depends('code')
    def _compute_active_user_count(self):
        for role in self:
            role.active_user_count = self.env['res.users'].sudo().search_count([
                ('shiv_role', '=', role.code),
                ('active', '=', True),
            ])

    def unlink(self):
        """Roles cannot be deleted if users are assigned."""
        for role in self:
            if role.active_user_count > 0:
                raise UserError(
                    _('Cannot delete role "%s" — %d user(s) are assigned to it. '
                      'Reassign users first.')
                    % (role.display_name, role.active_user_count)
                )
        return super().unlink()


class ShivLoginAttempt(models.Model):
    """
    Records every login attempt (success or failure) with IP and timestamp.
    Used for brute-force detection and security reporting.
    Immutable — never modified after creation.
    """
    _name = 'shiv.login.attempt'
    _description = 'Shiv Furniture - Login Attempt Log'
    _order = 'timestamp desc'
    _rec_name = 'login'

    login = fields.Char(
        string='Login (Email)',
        required=True,
        readonly=True,
        size=254,
        index=True,
    )

    ip_address = fields.Char(
        string='IP Address',
        required=True,
        readonly=True,
        size=45,
        index=True,
    )

    user_agent = fields.Char(
        string='User Agent',
        readonly=True,
        size=512,
    )

    result = fields.Selection(
        selection=[
            ('success',         'Success'),
            ('failed_password', 'Failed — Wrong Password'),
            ('failed_mfa',      'Failed — MFA Code Invalid'),
            ('blocked_locked',  'Blocked — Account Locked'),
            ('blocked_inactive','Blocked — Account Inactive'),
            ('blocked_ip',      'Blocked — IP Rate Limited'),
        ],
        string='Result',
        required=True,
        readonly=True,
        index=True,
    )

    user_id = fields.Many2one(
        comodel_name='res.users',
        string='User',
        readonly=True,
        ondelete='set null',
        index=True,
        help='Populated only on successful login or known-user failure.',
    )

    timestamp = fields.Datetime(
        string='Timestamp',
        required=True,
        readonly=True,
        default=fields.Datetime.now,
        index=True,
    )

    def write(self, vals):
        raise UserError(_('Login attempt records are immutable.'))

    def unlink(self):
        raise UserError(_('Login attempt records cannot be deleted.'))
