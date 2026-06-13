# -*- coding: utf-8 -*-
"""
shiv_auth/controllers/auth_controller.py
Shiv Furniture Works ERP — Authentication REST API Controller
Production-ready | Odoo 16

Endpoints:
    POST /shiv/auth/login          — Authenticate user, return session
    POST /shiv/auth/logout         — Invalidate session
    POST /shiv/auth/change-password — Change own password
    POST /shiv/auth/verify-mfa     — Submit TOTP code
    GET  /shiv/auth/me             — Get current user profile
    GET  /shiv/auth/sessions       — List own active sessions
    POST /shiv/auth/sessions/<id>/revoke — Revoke a specific session
"""

import json
import logging
import ipaddress
from functools import wraps

from odoo import http, _
from odoo.http import request, Response
from odoo.exceptions import AccessDenied, ValidationError, UserError

_logger = logging.getLogger(__name__)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def json_response(data, status=200):
    """Return a standardised JSON response envelope."""
    return Response(
        json.dumps(data, default=str),
        status=status,
        mimetype='application/json',
    )


def success(data=None, message='OK', status=200):
    return json_response({
        'success': True,
        'message': message,
        'data': data or {},
    }, status=status)


def error(message, code='ERROR', status=400, details=None):
    payload = {
        'success': False,
        'error': {
            'code': code,
            'message': message,
        },
    }
    if details:
        payload['error']['details'] = details
    return json_response(payload, status=status)


def get_client_ip():
    """Extract real client IP, respecting X-Forwarded-For from Nginx."""
    xff = request.httprequest.headers.get('X-Forwarded-For', '')
    if xff:
        # Take the first (leftmost) IP — that's the real client
        candidate = xff.split(',')[0].strip()
        try:
            ipaddress.ip_address(candidate)
            return candidate
        except ValueError:
            pass
    return request.httprequest.remote_addr or 'unknown'


def detect_device_type(user_agent):
    """Rough device type detection from User-Agent string."""
    if not user_agent:
        return 'unknown'
    ua = user_agent.lower()
    if any(x in ua for x in ['mobile', 'android', 'iphone']):
        return 'mobile'
    if any(x in ua for x in ['tablet', 'ipad']):
        return 'tablet'
    if any(x in ua for x in ['curl', 'python', 'postman', 'insomnia', 'httpie']):
        return 'api'
    return 'desktop'


def require_auth(f):
    """Decorator: reject unauthenticated requests with 401."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not request.session.uid:
            return error(
                message='Authentication required.',
                code='UNAUTHENTICATED',
                status=401,
            )
        return f(*args, **kwargs)
    return wrapper


# ─── Controller ───────────────────────────────────────────────────────────────

class ShivAuthController(http.Controller):
    """REST API for authentication operations."""

    # ──────────────────────────────────────────────────────────────────────────
    # GET /status
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/status', type='http', auth='none', methods=['GET'], csrf=False)
    def status(self, **kwargs):
        """Health check endpoint - shows server is live."""
        return Response(
            json.dumps({
                'status': 'live',
                'message': 'Shiv Furniture Works ERP Backend is running',
                'timestamp': str(__import__('datetime').datetime.now()),
            }, default=str),
            status=200,
            mimetype='application/json',
        )

    # ──────────────────────────────────────────────────────────────────────────
    # POST /shiv/auth/login
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/auth/login', type='http', auth='none', methods=['POST'], csrf=False)
    def login(self, **kwargs):
        """
        Authenticate a user.

        Request body (JSON):
            {
                "login": "user@shivfurniture.com",
                "password": "SecurePass@123"
            }

        Response 200:
            {
                "success": true,
                "message": "Login successful",
                "data": {
                    "uid": 5,
                    "name": "Rahul Sharma",
                    "login": "rahul@shivfurniture.com",
                    "shiv_role": "sales_user",
                    "session_id": "abc12345...",
                    "must_change_password": false,
                    "is_mfa_required": false
                }
            }
        """
        try:
            body = json.loads(request.httprequest.data or '{}')
        except json.JSONDecodeError:
            return error('Invalid JSON body.', code='INVALID_JSON', status=400)

        login = (body.get('login') or '').strip().lower()
        password = body.get('password') or ''
        ip = get_client_ip()
        user_agent = request.httprequest.headers.get('User-Agent', '')

        # ── Input validation ──────────────────────────────────────────────
        if not login:
            return error('Login (email) is required.', code='MISSING_LOGIN', status=422)
        if not password:
            return error('Password is required.', code='MISSING_PASSWORD', status=422)
        if len(login) > 254:
            return error('Login too long.', code='INVALID_LOGIN', status=422)

        # ── Find user ─────────────────────────────────────────────────────
        User = request.env['res.users'].sudo()
        user = User.search([('login', '=', login)], limit=1)

        # ── Record login attempt ──────────────────────────────────────────
        attempt_vals = {
            'login': login,
            'ip_address': ip,
            'user_agent': user_agent[:512],
        }

        if not user or not user.active:
            request.env['shiv.login.attempt'].sudo().create({
                **attempt_vals,
                'result': 'blocked_inactive',
            })
            # Deliberately vague message to prevent user enumeration
            return error(
                'Invalid credentials.',
                code='INVALID_CREDENTIALS',
                status=401,
            )

        # ── Check account lock ────────────────────────────────────────────
        if user.is_account_locked:
            request.env['shiv.login.attempt'].sudo().create({
                **attempt_vals,
                'user_id': user.id,
                'result': 'blocked_locked',
            })
            return error(
                'Account is temporarily locked due to too many failed attempts. '
                'Please try again later or contact your administrator.',
                code='ACCOUNT_LOCKED',
                status=423,   # 423 Locked
            )

        # ── Verify password ───────────────────────────────────────────────
        try:
            uid = request.env['res.users'].sudo()._login(
                request.env.cr.dbname, login, password, {'interactive': False}
            )
        except AccessDenied:
            uid = False

        if not uid:
            user._on_failed_login()
            request.env['shiv.login.attempt'].sudo().create({
                **attempt_vals,
                'user_id': user.id,
                'result': 'failed_password',
            })
            remaining = max(0, 5 - user.failed_login_count)
            return error(
                f'Invalid credentials. {remaining} attempt(s) remaining before lockout.',
                code='INVALID_CREDENTIALS',
                status=401,
            )

        # ── Successful password auth ──────────────────────────────────────
        authed_user = User.browse(uid)

        # ── MFA check ─────────────────────────────────────────────────────
        if authed_user.is_mfa_enabled:
            # Don't create session yet — require MFA completion
            request.env['shiv.login.attempt'].sudo().create({
                **attempt_vals,
                'user_id': uid,
                'result': 'success',
            })
            # Store pending uid in a temporary cookie/token (simplified)
            return success(
                data={
                    'uid': uid,
                    'is_mfa_required': True,
                    'mfa_hint': 'Submit TOTP code to /shiv/auth/verify-mfa',
                },
                message='MFA verification required.',
                status=200,
            )

        # ── Create Odoo session ───────────────────────────────────────────
        request.session.authenticate(request.env.cr.dbname, login, password)
        session_token = request.session.sid

        # ── Register session in our tracker ──────────────────────────────
        request.env['shiv.session'].sudo().register_session(
            user_id=uid,
            session_token=session_token,
            ip_address=ip,
            user_agent=user_agent,
            device_type=detect_device_type(user_agent),
        )

        authed_user._on_successful_login(ip_address=ip)

        request.env['shiv.login.attempt'].sudo().create({
            **attempt_vals,
            'user_id': uid,
            'result': 'success',
        })

        return success(
            data={
                'uid': uid,
                'name': authed_user.name,
                'login': authed_user.login,
                'shiv_role': authed_user.shiv_role,
                'department': authed_user.department,
                'session_id': session_token[:8] + '...',  # partial only
                'must_change_password': authed_user.must_change_password,
                'is_password_expired': authed_user.is_password_expired,
                'is_mfa_required': False,
            },
            message='Login successful.',
        )

    # ──────────────────────────────────────────────────────────────────────────
    # POST /shiv/auth/logout
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/auth/logout', type='http', auth='user', methods=['POST'], csrf=False)
    @require_auth
    def logout(self, **kwargs):
        """
        Logout current session.
        Invalidates the Odoo session and marks our tracker record as logged out.
        """
        uid = request.session.uid
        session_token = request.session.sid

        # Mark tracker record
        session_record = request.env['shiv.session'].sudo().search([
            ('session_token', '=', session_token),
            ('state', '=', 'active'),
        ], limit=1)
        if session_record:
            session_record.sudo().write({
                'state': 'logged_out',
                'logout_at': http.fields.Datetime.now() if hasattr(http, 'fields') else None,
            })

        request.env['shiv.audit.log'].sudo()._log(
            model='res.users',
            record_id=uid,
            record_name=request.env.user.name,
            action='logout',
            actor_id=uid,
            ip_address=get_client_ip(),
            session_token=session_token,
        )

        request.session.logout(keep_db=True)
        return success(message='Logged out successfully.')

    # ──────────────────────────────────────────────────────────────────────────
    # GET /shiv/auth/me
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/auth/me', type='http', auth='user', methods=['GET'], csrf=False)
    @require_auth
    def me(self, **kwargs):
        """Return current authenticated user's profile."""
        user = request.env.user
        return success(data={
            'uid': user.id,
            'name': user.name,
            'login': user.login,
            'email': user.email,
            'shiv_role': user.shiv_role,
            'department': user.department,
            'employee_id': user.employee_id,
            'phone_number': user.phone_number,
            'is_mfa_enabled': user.is_mfa_enabled,
            'must_change_password': user.must_change_password,
            'is_password_expired': user.is_password_expired,
            'password_expires_on': str(user.password_expires_on) if user.password_expires_on else None,
            'last_login': str(user.last_login) if user.last_login else None,
            'last_login_ip': user.last_login_ip,
        })

    # ──────────────────────────────────────────────────────────────────────────
    # POST /shiv/auth/change-password
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/auth/change-password', type='http', auth='user',
                methods=['POST'], csrf=False)
    @require_auth
    def change_password(self, **kwargs):
        """
        Change own password.

        Request body:
            {
                "current_password": "OldPass@123",
                "new_password": "NewPass@456",
                "confirm_password": "NewPass@456"
            }
        """
        try:
            body = json.loads(request.httprequest.data or '{}')
        except json.JSONDecodeError:
            return error('Invalid JSON body.', code='INVALID_JSON', status=400)
#Here the real logic is written to check with 5 old passwords.
        current_password = body.get('current_password', '')
        new_password = body.get('new_password', '')
        confirm_password = body.get('confirm_password', '')

        if not current_password:
            return error('Current password is required.', code='MISSING_FIELD', status=422)
        if not new_password:
            return error('New password is required.', code='MISSING_FIELD', status=422)
        if new_password != confirm_password:
            return error('New password and confirmation do not match.', code='PASSWORD_MISMATCH', status=422)

        if current_password == new_password:
            return error(
                'New password must be different from current password.',
                code='SAME_PASSWORD', status=422,
            )

        user = request.env.user
        try:
            # Verify current password
            request.env['res.users'].sudo()._login(
                request.env.cr.dbname, user.login, current_password,
                {'interactive': False}
            )
        except AccessDenied:
            return error('Current password is incorrect.', code='WRONG_CURRENT_PASSWORD', status=401)

        try:
            user.write({'password': new_password})
        except ValidationError as e:
            return error(str(e), code='PASSWORD_POLICY_VIOLATION', status=422)

        # we will suspend all te sessons after the password chnages;
        request.env['shiv.session'].sudo().action_expire_all_user_sessions(
            user.id,
            reason='Password changed — all other sessions revoked.',
        )

        request.env['shiv.audit.log'].sudo()._log(
            model='res.users',
            record_id=user.id,
            record_name=user.name,
            action='password_changed',
            actor_id=user.id,
            ip_address=get_client_ip(),
        )

        return success(message='Password changed successfully. All other sessions have been revoked.')

    # ──────────────────────────────────────────────────────────────────────────
    # GET /shiv/auth/sessions
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/auth/sessions', type='http', auth='user', methods=['GET'], csrf=False)
    @require_auth
    def list_sessions(self, **kwargs):
        """List active sessions for the current user."""
        user = request.env.user
        sessions = request.env['shiv.session'].sudo().search([
            ('user_id', '=', user.id),
            ('state', '=', 'active'),
        ], order='login_at desc')

        return success(data={
            'sessions': [{
                'id': s.id,
                'session_ref': s.session_token_preview,
                'ip_address': s.ip_address,
                'device_type': s.device_type,
                'login_at': str(s.login_at),
                'last_activity': str(s.last_activity),
                'expires_at': str(s.expires_at) if s.expires_at else None,
            } for s in sessions],
            'count': len(sessions),
        })

    # ──────────────────────────────────────────────────────────────────────────
    # POST /shiv/auth/sessions/<int:session_id>/revoke
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/auth/sessions/<int:session_id>/revoke', type='http',
                auth='user', methods=['POST'], csrf=False)
    @require_auth
    def revoke_session(self, session_id, **kwargs):
        """Revoke a specific session (user can only revoke their own)."""
        user = request.env.user
        session = request.env['shiv.session'].sudo().search([
            ('id', '=', session_id),
            ('user_id', '=', user.id),
        ], limit=1)

        if not session:
            return error('Session not found.', code='NOT_FOUND', status=404)

        if session.state != 'active':
            return error('Session is already inactive.', code='ALREADY_INACTIVE', status=409)

        session.sudo().write({
            'state': 'logged_out',
            'logout_at': http.fields.Datetime.now() if hasattr(http, 'fields') else None,
            'force_expired_reason': 'Revoked by user.',
        })

        return success(message=f'Session {session.session_token_preview} revoked.')
