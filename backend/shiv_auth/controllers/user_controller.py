# -*- coding: utf-8 -*-
"""
shiv_auth/controllers/user_controller.py
Shiv Furniture Works ERP — User Management REST API Controller
Production-ready | Odoo 16

Endpoints:
    GET    /shiv/users                    — List users (admin only)
    POST   /shiv/users                    — Create user (admin only)
    GET    /shiv/users/<id>               — Get user detail
    PUT    /shiv/users/<id>               — Update user (admin only)
    POST   /shiv/users/<id>/deactivate    — Soft-deactivate user
    POST   /shiv/users/<id>/reactivate    — Reactivate user
    POST   /shiv/users/<id>/unlock        — Unlock locked account
    POST   /shiv/users/<id>/force-reset-password — Force password reset
    GET    /shiv/users/<id>/audit         — Get user's audit history
    GET    /shiv/audit-logs               — System-wide audit log (admin/auditor)
    GET    /shiv/audit-logs/security      — Security events only
"""

import json
import logging
import math

from odoo import http, fields as odoo_fields
from odoo.http import request, Response
from odoo.exceptions import AccessError, ValidationError, UserError

from .auth_controller import success, error, require_auth, get_client_ip

_logger = logging.getLogger(__name__)

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


def paginate(query_result, page, page_size):
    """Return a pagination envelope around a recordset."""
    total = len(query_result)
    start = (page - 1) * page_size
    end = start + page_size
    records = query_result[start:end]
    return {
        'records': records,
        'pagination': {
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': math.ceil(total / page_size) if total else 1,
            'has_next': end < total,
            'has_prev': page > 1,
        },
    }


def require_admin(f):
    """Decorator: require shiv_auth.group_shiv_admin group."""
    @require_auth
    def wrapper(*args, **kwargs):
        #if the request is not from the admininstrator
        if not request.env.user.has_group('shiv_auth.group_shiv_admin'):
            return error(
                'Only System Administrators can perform this action.',
                code='FORBIDDEN', status=403,
            )
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper


def require_admin_or_auditor(f):
    """Decorator: require admin OR auditor group."""
    @require_auth
    def wrapper(*args, **kwargs):
        user = request.env.user
        is_admin = user.has_group('shiv_auth.group_shiv_admin')
        is_auditor = user.has_group('shiv_auth.group_shiv_auditor')
        if not (is_admin or is_auditor):
            return error(
                'Only Administrators and Auditors can access this resource.',
                code='FORBIDDEN', status=403,
            )
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper


def serialize_user(user):
    """Convert res.users record to safe API response dict."""
    return {
        'id': user.id,
        'name': user.name,
        'login': user.login,
        'email': user.email,
        'shiv_role': user.shiv_role,
        'department': user.department,
        'employee_id': user.employee_id,
        'phone_number': user.phone_number,
        'is_mfa_enabled': user.is_mfa_enabled,
        'is_account_locked': user.is_account_locked,
        'must_change_password': user.must_change_password,
        'is_password_expired': user.is_password_expired,
        'is_active': user.active,
        'is_active_shiv': user.is_active_shiv,
        'deactivated_on': str(user.deactivated_on) if user.deactivated_on else None,
        'deactivated_by': user.deactivated_by.name if user.deactivated_by else None,
        'last_login': str(user.last_login) if user.last_login else None,
        'last_login_ip': user.last_login_ip,
        'created_by': user.created_by_id.name if user.created_by_id else None,
        'created_on': str(user.create_date) if user.create_date else None,
    }


class ShivUserController(http.Controller):

    # ──────────────────────────────────────────────────────────────────────────
    # GET /shiv/users
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/users', type='http', auth='user', methods=['GET'], csrf=False)
    @require_admin
    def list_users(self, **kwargs):
        """
        List all users with filtering, sorting, and pagination.

        Query params:
            page          (int, default=1)
            page_size     (int, default=20, max=100)
            role          (string, filter by shiv_role)
            department    (string, filter by department)
            is_active     (bool, default=true)
            search        (string, search name/email)
            sort_by       (string: name|login|shiv_role|create_date, default=name)
            sort_dir      (string: asc|desc, default=asc)
        """
        params = request.params

        page = max(1, int(params.get('page', 1)))
        page_size = min(MAX_PAGE_SIZE, max(1, int(params.get('page_size', DEFAULT_PAGE_SIZE))))

        # Build domain
        domain = []

        is_active_param = params.get('is_active', 'true').lower()
        if is_active_param == 'false':
            domain.append(('active', '=', False))
        elif is_active_param == 'all':
            domain.append('|')
            domain.append(('active', '=', True))
            domain.append(('active', '=', False))
        else:
            domain.append(('active', '=', True))

        if params.get('role'):
            domain.append(('shiv_role', '=', params['role']))
        if params.get('department'):
            domain.append(('department', '=', params['department']))
        if params.get('search'):
            search_val = params['search']
            domain += ['|', '|',
                ('name', 'ilike', search_val),
                ('login', 'ilike', search_val),
                ('employee_id', 'ilike', search_val),
            ]

        sort_by = params.get('sort_by', 'name')
        sort_dir = 'desc' if params.get('sort_dir', 'asc').lower() == 'desc' else 'asc'
        allowed_sorts = {'name', 'login', 'shiv_role', 'create_date', 'last_login'}
        if sort_by not in allowed_sorts:
            sort_by = 'name'
        order = f'{sort_by} {sort_dir}'

        users = request.env['res.users'].sudo().with_context(active_test=False).search(
            domain, order=order
        )

        paged = paginate(users, page, page_size)
        return success(data={
            'users': [serialize_user(u) for u in paged['records']],
            'pagination': paged['pagination'],
        })

    # ──────────────────────────────────────────────────────────────────────────
    # POST /shiv/users
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/users', type='http', auth='user', methods=['POST'], csrf=False)
    @require_admin
    def create_user(self, **kwargs):
        """
        Create a new user.

        Request body:
            {
                "name": "Rahul Sharma",
                "login": "rahul@shivfurniture.com",
                "password": "TempPass@123",
                "shiv_role": "sales_user",
                "department": "sales",
                "employee_id": "EMP001",
                "phone_number": "+919876543210"
            }
        """
        try:
            body = json.loads(request.httprequest.data or '{}')
        except json.JSONDecodeError:
            return error('Invalid JSON body.', code='INVALID_JSON', status=400)

        required = ['name', 'login', 'password', 'shiv_role']
        missing = [f for f in required if not body.get(f)]
        if missing:
            return error(
                f'Missing required fields: {", ".join(missing)}',
                code='MISSING_FIELDS', status=422,
            )

        # Validate email format
        import re
        email_re = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
        if not email_re.match(body['login']):
            return error('Invalid email address format.', code='INVALID_EMAIL', status=422)

        # Check duplicate login
        existing = request.env['res.users'].sudo().search(
            [('login', '=', body['login'].lower().strip())], limit=1
        )
        if existing:
            return error(
                f'A user with login "{body["login"]}" already exists.',
                code='DUPLICATE_LOGIN', status=409,
            )

        valid_roles = [
            'admin', 'sales_manager', 'sales_user', 'warehouse_manager',
            'warehouse_user', 'purchase_manager', 'purchase_user',
            'production_manager', 'production_user', 'accountant', 'auditor', 'viewer',
        ]
        if body['shiv_role'] not in valid_roles:
            return error(
                f'Invalid role. Allowed: {", ".join(valid_roles)}',
                code='INVALID_ROLE', status=422,
            )

        try:
            user = request.env['res.users'].sudo().create({
                'name': body['name'].strip(),
                'login': body['login'].strip().lower(),
                'password': body['password'],
                'email': body['login'].strip().lower(),
                'shiv_role': body['shiv_role'],
                'department': body.get('department'),
                'employee_id': body.get('employee_id', '').strip() or False,
                'phone_number': body.get('phone_number', '').strip() or False,
                'must_change_password': True,   # Always force change on first login
                'active': True,
            })
        except ValidationError as e:
            return error(str(e), code='VALIDATION_ERROR', status=422)

        _logger.info('Admin %s created user %s (role=%s)', request.env.uid, user.login, user.shiv_role)

        return success(
            data=serialize_user(user),
            message=f'User {user.name} created successfully. They must change password on first login.',
            status=201,
        )

    # ──────────────────────────────────────────────────────────────────────────
    # GET /shiv/users/<id>
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/users/<int:user_id>', type='http', auth='user', methods=['GET'], csrf=False)
    @require_auth
    def get_user(self, user_id, **kwargs):
        """Get user profile. Own profile accessible by any user; others require admin."""
        current = request.env.user
        is_admin = current.has_group('shiv_auth.group_shiv_admin')
        is_auditor = current.has_group('shiv_auth.group_shiv_auditor')

        if not (is_admin or is_auditor or current.id == user_id):
            return error('Access denied.', code='FORBIDDEN', status=403)

        user = request.env['res.users'].sudo().with_context(active_test=False).browse(user_id)
        if not user.exists():
            return error('User not found.', code='NOT_FOUND', status=404)

        return success(data=serialize_user(user))

    # ──────────────────────────────────────────────────────────────────────────
    # PUT /shiv/users/<id>
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/users/<int:user_id>', type='http', auth='user', methods=['PUT'], csrf=False)
    @require_admin
    def update_user(self, user_id, **kwargs):
        """Update user profile (admin only)."""
        try:
            body = json.loads(request.httprequest.data or '{}')
        except json.JSONDecodeError:
            return error('Invalid JSON body.', code='INVALID_JSON', status=400)

        user = request.env['res.users'].sudo().with_context(active_test=False).browse(user_id)
        if not user.exists():
            return error('User not found.', code='NOT_FOUND', status=404)

        allowed_fields = {
            'name', 'shiv_role', 'department', 'employee_id',
            'phone_number', 'is_mfa_enabled',
        }
        update_vals = {k: v for k, v in body.items() if k in allowed_fields}

        if not update_vals:
            return error(
                f'No updatable fields provided. Allowed: {", ".join(allowed_fields)}',
                code='NOTHING_TO_UPDATE', status=422,
            )

        try:
            user.write(update_vals)
            if 'shiv_role' in update_vals:
                user._sync_role_to_groups()
        except ValidationError as e:
            return error(str(e), code='VALIDATION_ERROR', status=422)

        return success(data=serialize_user(user), message='User updated successfully.')

    # ──────────────────────────────────────────────────────────────────────────
    # POST /shiv/users/<id>/deactivate
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/users/<int:user_id>/deactivate', type='http',
                auth='user', methods=['POST'], csrf=False)
    @require_admin
    def deactivate_user(self, user_id, **kwargs):
        try:
            body = json.loads(request.httprequest.data or '{}')
        except json.JSONDecodeError:
            body = {}

        user = request.env['res.users'].sudo().browse(user_id)
        if not user.exists():
            return error('User not found.', code='NOT_FOUND', status=404)
        if user.id == request.env.uid:
            return error('Cannot deactivate your own account.', code='SELF_DEACTIVATE', status=400)
        if not user.active:
            return error('User is already inactive.', code='ALREADY_INACTIVE', status=409)

        user.sudo().write({
            'active': False,
            'is_active_shiv': False,
            'deactivated_on': odoo_fields.Datetime.now(),
            'deactivated_by': request.env.uid,
            'deactivation_reason': body.get('reason', ''),
        })

        # Expire all sessions
        request.env['shiv.session'].sudo().action_expire_all_user_sessions(
            user_id, reason='User account deactivated by admin.'
        )

        return success(message=f'User {user.name} has been deactivated. All sessions revoked.')

    # ──────────────────────────────────────────────────────────────────────────
    # POST /shiv/users/<id>/reactivate
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/users/<int:user_id>/reactivate', type='http',
                auth='user', methods=['POST'], csrf=False)
    @require_admin
    def reactivate_user(self, user_id, **kwargs):
        user = request.env['res.users'].sudo().with_context(active_test=False).browse(user_id)
        if not user.exists():
            return error('User not found.', code='NOT_FOUND', status=404)
        if user.active:
            return error('User is already active.', code='ALREADY_ACTIVE', status=409)

        user.sudo().write({
            'active': True,
            'is_active_shiv': True,
            'deactivated_on': False,
            'deactivated_by': False,
            'must_change_password': True,   # Force password change on reactivation
        })
        return success(message=f'User {user.name} reactivated. Password reset required on next login.')

    # ──────────────────────────────────────────────────────────────────────────
    # POST /shiv/users/<id>/unlock
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/users/<int:user_id>/unlock', type='http',
                auth='user', methods=['POST'], csrf=False)
    @require_admin
    def unlock_user(self, user_id, **kwargs):
        user = request.env['res.users'].sudo().browse(user_id)
        if not user.exists():
            return error('User not found.', code='NOT_FOUND', status=404)
        if not user.is_account_locked:
            return error('Account is not locked.', code='NOT_LOCKED', status=409)

        user.action_unlock_account()
        return success(message=f'Account {user.name} has been unlocked.')

    # ──────────────────────────────────────────────────────────────────────────
    # POST /shiv/users/<id>/force-reset-password
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/users/<int:user_id>/force-reset-password', type='http',
                auth='user', methods=['POST'], csrf=False)
    @require_admin
    def force_password_reset(self, user_id, **kwargs):
        user = request.env['res.users'].sudo().browse(user_id)
        if not user.exists():
            return error('User not found.', code='NOT_FOUND', status=404)
        user.action_force_password_reset()
        return success(message=f'{user.name} will be prompted to change password on next login.')

    # ──────────────────────────────────────────────────────────────────────────
    # GET /shiv/users/<id>/audit
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/users/<int:user_id>/audit', type='http',
                auth='user', methods=['GET'], csrf=False)
    @require_admin_or_auditor
    def user_audit_history(self, user_id, **kwargs):
        """Get full audit history for a specific user."""
        params = request.params
        limit = min(500, int(params.get('limit', 50)))
        from_date = params.get('from_date')
        to_date = params.get('to_date')

        logs = request.env['shiv.audit.log'].sudo().get_user_activity(
            user_id, from_date=from_date, to_date=to_date, limit=limit
        )

        return success(data={
            'user_id': user_id,
            'logs': [{
                'id': log.id,
                'action': log.action,
                'model': log.model,
                'record_id': log.record_id,
                'record_name': log.record_name,
                'changed_fields': log.changed_fields,
                'notes': log.notes,
                'timestamp': str(log.timestamp),
                'ip_address': log.ip_address,
            } for log in logs],
            'count': len(logs),
        })

    # ──────────────────────────────────────────────────────────────────────────
    # GET /shiv/audit-logs
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/audit-logs', type='http', auth='user', methods=['GET'], csrf=False)
    @require_admin_or_auditor
    def list_audit_logs(self, **kwargs):
        """
        System-wide audit log with filtering and pagination.

        Query params:
            page, page_size, action, model, actor_id, from_date, to_date
        """
        params = request.params
        page = max(1, int(params.get('page', 1)))
        page_size = min(MAX_PAGE_SIZE, max(1, int(params.get('page_size', DEFAULT_PAGE_SIZE))))

        domain = []
        if params.get('action'):
            domain.append(('action', '=', params['action']))
        if params.get('model'):
            domain.append(('model', '=', params['model']))
        if params.get('actor_id'):
            domain.append(('actor_id', '=', int(params['actor_id'])))
        if params.get('from_date'):
            domain.append(('timestamp', '>=', params['from_date']))
        if params.get('to_date'):
            domain.append(('timestamp', '<=', params['to_date']))

        logs = request.env['shiv.audit.log'].sudo().search(domain, order='timestamp desc')
        paged = paginate(logs, page, page_size)

        return success(data={
            'logs': [{
                'id': log.id,
                'action': log.action,
                'model': log.model,
                'record_id': log.record_id,
                'record_name': log.record_name,
                'changed_fields': log.changed_fields,
                'actor_id': log.actor_id,
                'actor_name': log.actor_name,
                'actor_role': log.actor_role,
                'ip_address': log.ip_address,
                'notes': log.notes,
                'timestamp': str(log.timestamp),
            } for log in paged['records']],
            'pagination': paged['pagination'],
        })

    # ──────────────────────────────────────────────────────────────────────────
    # GET /shiv/audit-logs/security
    # ──────────────────────────────────────────────────────────────────────────

    @http.route('/shiv/audit-logs/security', type='http', auth='user',
                methods=['GET'], csrf=False)
    @require_admin_or_auditor
    def security_events(self, **kwargs):
        """Return security-relevant events for admin review."""
        params = request.params
        from_date = params.get('from_date')
        limit = min(1000, int(params.get('limit', 100)))

        logs = request.env['shiv.audit.log'].sudo().get_security_events(
            from_date=from_date, limit=limit
        )

        return success(data={
            'events': [{
                'id': log.id,
                'action': log.action,
                'actor_name': log.actor_name,
                'actor_role': log.actor_role,
                'ip_address': log.ip_address,
                'notes': log.notes,
                'timestamp': str(log.timestamp),
            } for log in logs],
            'count': len(logs),
        })
