# -*- coding: utf-8 -*-
"""
shiv_auth/tests/test_shiv_auth_api.py
HTTP controller integration tests for auth endpoints.
Uses Odoo's HttpCase to make real HTTP requests against controllers.
"""

import json
from odoo.tests import HttpCase, tagged


@tagged('shiv_auth', 'shiv_auth_api', 'post_install', '-at_install')
class TestShivAuthLoginAPI(HttpCase):
    """Tests for POST /shiv/auth/login"""

    def setUp(self):
        super().setUp()
        # Create a test user via ORM (bypasses HTTP)
        self.test_user = self.env['res.users'].sudo().create({
            'name': 'API Test User',
            'login': 'apitest@shivfurniture.com',
            'password': 'TestPass@123',
            'shiv_role': 'sales_user',
            'department': 'sales',
            'must_change_password': False,
        })

    def _post(self, url, data):
        return self.url_open(
            url,
            data=json.dumps(data).encode(),
            headers={'Content-Type': 'application/json'},
        )

    # ── Happy path ────────────────────────────────────────────────────────────

    def test_login_success(self):
        resp = self._post('/shiv/auth/login', {
            'login': 'apitest@shivfurniture.com',
            'password': 'TestPass@123',
        })
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['login'], 'apitest@shivfurniture.com')
        self.assertEqual(body['data']['shiv_role'], 'sales_user')
        self.assertIn('session_id', body['data'])

    # ── Missing fields ─────────────────────────────────────────────────────────

    def test_login_missing_password(self):
        resp = self._post('/shiv/auth/login', {'login': 'apitest@shivfurniture.com'})
        self.assertEqual(resp.status_code, 422)
        body = resp.json()
        self.assertFalse(body['success'])
        self.assertEqual(body['error']['code'], 'MISSING_PASSWORD')

    def test_login_missing_login(self):
        resp = self._post('/shiv/auth/login', {'password': 'TestPass@123'})
        self.assertEqual(resp.status_code, 422)
        body = resp.json()
        self.assertEqual(body['error']['code'], 'MISSING_LOGIN')

    # ── Wrong credentials ─────────────────────────────────────────────────────

    def test_login_wrong_password(self):
        resp = self._post('/shiv/auth/login', {
            'login': 'apitest@shivfurniture.com',
            'password': 'WrongPass@999',
        })
        self.assertEqual(resp.status_code, 401)
        body = resp.json()
        self.assertEqual(body['error']['code'], 'INVALID_CREDENTIALS')

    def test_login_nonexistent_user(self):
        resp = self._post('/shiv/auth/login', {
            'login': 'nobody@shivfurniture.com',
            'password': 'AnyPass@123',
        })
        self.assertEqual(resp.status_code, 401)
        # Must NOT reveal whether user exists
        body = resp.json()
        self.assertEqual(body['error']['code'], 'INVALID_CREDENTIALS')

    # ── Lockout ───────────────────────────────────────────────────────────────

    def test_login_locked_account_returns_423(self):
        from odoo import fields
        from datetime import timedelta
        self.test_user.sudo().write({
            'locked_until': fields.Datetime.now() + timedelta(minutes=30),
            'failed_login_count': 5,
        })
        resp = self._post('/shiv/auth/login', {
            'login': 'apitest@shivfurniture.com',
            'password': 'TestPass@123',
        })
        self.assertEqual(resp.status_code, 423)
        body = resp.json()
        self.assertEqual(body['error']['code'], 'ACCOUNT_LOCKED')

    # ── Invalid JSON ──────────────────────────────────────────────────────────

    def test_login_invalid_json(self):
        resp = self.url_open(
            '/shiv/auth/login',
            data=b'not json at all',
            headers={'Content-Type': 'application/json'},
        )
        self.assertEqual(resp.status_code, 400)


@tagged('shiv_auth', 'shiv_auth_api', 'post_install', '-at_install')
class TestShivMeAPI(HttpCase):
    """Tests for GET /shiv/auth/me"""

    def test_me_requires_auth(self):
        resp = self.url_open('/shiv/auth/me')
        self.assertEqual(resp.status_code, 401)

    def test_me_returns_profile(self):
        self.authenticate('admin', 'admin')
        resp = self.url_open('/shiv/auth/me')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body['success'])
        self.assertIn('login', body['data'])
        self.assertIn('shiv_role', body['data'])


@tagged('shiv_auth', 'shiv_auth_api', 'post_install', '-at_install')
class TestShivUserAPI(HttpCase):
    """Tests for /shiv/users CRUD endpoints"""

    def setUp(self):
        super().setUp()
        self.authenticate('admin', 'admin')

    def test_list_users_as_admin(self):
        resp = self.url_open('/shiv/users')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body['success'])
        self.assertIn('pagination', body['data'])

    def test_create_user_as_admin(self):
        resp = self.url_open(
            '/shiv/users',
            data=json.dumps({
                'name': 'New API User',
                'login': 'newapi@shivfurniture.com',
                'password': 'NewApiPass@1',
                'shiv_role': 'sales_user',
            }).encode(),
            headers={'Content-Type': 'application/json'},
        )
        self.assertEqual(resp.status_code, 201)
        body = resp.json()
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['login'], 'newapi@shivfurniture.com')

    def test_create_user_duplicate_login_returns_409(self):
        # Create first
        self.env['res.users'].sudo().create({
            'name': 'Existing', 'login': 'existing@shivfurniture.com',
            'password': 'TestPass@123', 'shiv_role': 'viewer',
        })
        resp = self.url_open(
            '/shiv/users',
            data=json.dumps({
                'name': 'Duplicate',
                'login': 'existing@shivfurniture.com',
                'password': 'TestPass@123',
                'shiv_role': 'viewer',
            }).encode(),
            headers={'Content-Type': 'application/json'},
        )
        self.assertEqual(resp.status_code, 409)

    def test_list_users_non_admin_returns_403(self):
        # Create a non-admin user and authenticate as them
        viewer = self.env['res.users'].sudo().create({
            'name': 'Viewer', 'login': 'viewer@shivfurniture.com',
            'password': 'ViewerPass@1', 'shiv_role': 'viewer',
        })
        self.authenticate('viewer@shivfurniture.com', 'ViewerPass@1')
        resp = self.url_open('/shiv/users')
        self.assertEqual(resp.status_code, 403)
