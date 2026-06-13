# -*- coding: utf-8 -*-
"""
shiv_auth/models/shiv_session.py
Shiv Furniture Works ERP — Session Tracking Model
Production-ready | Odoo 16

Tracks every active/closed session with device fingerprint,
IP, user-agent, and forced-logout capability.
"""

import logging
from datetime import timedelta

from odoo import api, fields, models, _
from odoo.exceptions import UserError, AccessError

_logger = logging.getLogger(__name__)

SESSION_TIMEOUT_HOURS = 8           # idle session expires after 8 hours
MAX_CONCURRENT_SESSIONS = 3         # per user (prevent credential sharing)


class ShivSession(models.Model):
    """
    Tracks every login session for audit and security purposes.
    Provides admin capability to force-logout specific or all sessions.
    """
    _name = 'shiv.session'
    _description = 'Shiv Furniture - User Session'
    _order = 'login_at desc'
    _rec_name = 'session_token_preview'

    # ── Identity ─────────────────────────────────────────────────────────────
    user_id = fields.Many2one(
        comodel_name='res.users',
        string='User',
        required=True,
        ondelete='cascade',
        index=True,
    )

    session_token = fields.Char(
        string='Session Token',
        required=True,
        readonly=True,
        copy=False,
        index=True,
        help='Odoo session ID stored in Redis. Never exposed in UI.',
        groups='shiv_auth.group_shiv_admin',
    )

    session_token_preview = fields.Char(
        string='Session Reference',
        compute='_compute_token_preview',
        store=True,
        help='First 8 chars of token — safe to display.',
    )

    # ── Client Info ──────────────────────────────────────────────────────────
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

    device_type = fields.Selection(
        selection=[
            ('desktop', 'Desktop'),
            ('mobile',  'Mobile'),
            ('tablet',  'Tablet'),
            ('api',     'API Client'),
            ('unknown', 'Unknown'),
        ],
        string='Device Type',
        default='unknown',
        readonly=True,
    )

    # ── Timing ───────────────────────────────────────────────────────────────
    login_at = fields.Datetime(
        string='Login Time',
        required=True,
        readonly=True,
        default=fields.Datetime.now,
        index=True,
    )

    last_activity = fields.Datetime(
        string='Last Activity',
        readonly=True,
        default=fields.Datetime.now,
        index=True,
    )

    logout_at = fields.Datetime(
        string='Logout Time',
        readonly=True,
    )

    expires_at = fields.Datetime(
        string='Expires At',
        readonly=True,
        compute='_compute_expires_at',
        store=True,
        help='Idle timeout: last_activity + 8 hours.',
    )

    # ── State ────────────────────────────────────────────────────────────────
    state = fields.Selection(
        selection=[
            ('active',        'Active'),
            ('expired',       'Expired (Idle Timeout)'),
            ('logged_out',    'Logged Out'),
            ('force_expired', 'Force Expired (Admin)'),
        ],
        string='State',
        default='active',
        required=True,
        index=True,
        readonly=True,
    )

    force_expired_by = fields.Many2one(
        comodel_name='res.users',
        string='Force Expired By',
        readonly=True,
        ondelete='set null',
    )

    force_expired_reason = fields.Char(
        string='Force Expiry Reason',
        readonly=True,
    )

    # ── Computed ─────────────────────────────────────────────────────────────

    @api.depends('session_token')
    def _compute_token_preview(self):
        for session in self:
            if session.session_token:
                session.session_token_preview = session.session_token[:8] + '...'
            else:
                session.session_token_preview = 'N/A'

    @api.depends('last_activity')
    def _compute_expires_at(self):
        for session in self:
            if session.last_activity:
                session.expires_at = (
                    session.last_activity + timedelta(hours=SESSION_TIMEOUT_HOURS)
                )
            else:
                session.expires_at = False

    # ─────────────────────────────────────────────────────────────────────────
    # LIFECYCLE METHODS
    # ─────────────────────────────────────────────────────────────────────────

    @api.model
    def register_session(self, user_id, session_token, ip_address,
                         user_agent='', device_type='unknown'):
        """
        Called on successful login.
        Creates session record and enforces MAX_CONCURRENT_SESSIONS.
        """
        # Enforce concurrent session limit
        active_sessions = self.search([
            ('user_id', '=', user_id),
            ('state', '=', 'active'),
        ], order='login_at asc')

        if len(active_sessions) >= MAX_CONCURRENT_SESSIONS:
            # Expire oldest sessions to make room
            sessions_to_expire = active_sessions[:len(active_sessions) - MAX_CONCURRENT_SESSIONS + 1]
            sessions_to_expire.write({
                'state': 'force_expired',
                'force_expired_reason': 'Concurrent session limit reached. Oldest session expired.',
                'logout_at': fields.Datetime.now(),
            })
            _logger.info(
                'SECURITY: Expired %d old sessions for user_id=%d (concurrent limit=%d)',
                len(sessions_to_expire), user_id, MAX_CONCURRENT_SESSIONS,
            )

        return self.create({
            'user_id': user_id,
            'session_token': session_token,
            'ip_address': ip_address,
            'user_agent': user_agent[:512] if user_agent else '',
            'device_type': device_type,
            'login_at': fields.Datetime.now(),
            'last_activity': fields.Datetime.now(),
            'state': 'active',
        })

    @api.model
    def update_activity(self, session_token):
        """Update last_activity timestamp (called on each authenticated request)."""
        session = self.search([
            ('session_token', '=', session_token),
            ('state', '=', 'active'),
        ], limit=1)
        if session:
            session.sudo().write({'last_activity': fields.Datetime.now()})

    def action_force_logout(self):
        """Admin action: invalidate a specific session immediately."""
        if not self.env.user.has_group('shiv_auth.group_shiv_admin'):
            raise AccessError(_('Only administrators can force-logout sessions.'))
        self.sudo().write({
            'state': 'force_expired',
            'logout_at': fields.Datetime.now(),
            'force_expired_by': self.env.uid,
            'force_expired_reason': 'Manual force-logout by administrator.',
        })
        self.env['shiv.audit.log'].sudo()._log(
            model='shiv.session',
            record_id=self.id,
            record_name=self.session_token_preview,
            action='force_logout',
            changed_fields=['state'],
            actor_id=self.env.uid,
            notes=f'Force logout of session for user {self.user_id.name}',
        )
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Session Terminated'),
                'message': _('Session %s has been force-expired.') % self.session_token_preview,
                'type': 'warning',
                'sticky': False,
            },
        }

    @api.model
    def action_expire_all_user_sessions(self, user_id, reason='Admin action'):
        """Expire ALL active sessions for a given user (e.g., on password change)."""
        sessions = self.search([
            ('user_id', '=', user_id),
            ('state', '=', 'active'),
        ])
        if sessions:
            sessions.sudo().write({
                'state': 'force_expired',
                'logout_at': fields.Datetime.now(),
                'force_expired_by': self.env.uid,
                'force_expired_reason': reason,
            })
            _logger.info(
                'SECURITY: All sessions expired for user_id=%d. Reason: %s',
                user_id, reason,
            )

    @api.model
    def cron_expire_idle_sessions(self):
        """
        Scheduled action: expire sessions that have been idle past the timeout.
        Run every 15 minutes via ir.cron.
        """
        cutoff = fields.Datetime.now() - timedelta(hours=SESSION_TIMEOUT_HOURS)
        idle_sessions = self.search([
            ('state', '=', 'active'),
            ('last_activity', '<', cutoff),
        ])
        if idle_sessions:
            idle_sessions.sudo().write({
                'state': 'expired',
                'logout_at': fields.Datetime.now(),
            })
            _logger.info('CRON: Expired %d idle sessions.', len(idle_sessions))

    def unlink(self):
        """Sessions are immutable — audit record must be preserved."""
        raise UserError(
            _('Session records cannot be deleted. '
              'They are preserved as an immutable audit trail.')
        )
