# -*- coding: utf-8 -*-
{
    'name': 'Shiv Furniture - User & Authentication Management',
    'version': '16.0.1.0.0',
    'category': 'Shiv Furniture/Authentication',
    'summary': 'Production-grade user management, RBAC, session security, and audit logging for Shiv Furniture Works ERP.',
    'description': """
        Module 1: User & Authentication Management
        ==========================================
        - Role-Based Access Control (RBAC) with 5 built-in roles
        - Session management with Redis-backed token store
        - Password policy enforcement (complexity, expiry, history)
        - Multi-factor authentication (TOTP)
        - Login rate limiting and IP-based brute-force protection
        - Immutable audit log for every auth event
        - Soft-delete for users (never hard delete)
        - Field-level security on sensitive user data
    """,
    'author': 'Shiv Furniture Works ERP Team',
    'website': 'https://github.com/ashutosh-engineer/odoo_Hackathon_Team_adip1',
    'license': 'LGPL-3',
    'depends': [
        'base',          # res.users, res.groups, ir.rule, ir.model.access
        'mail',          # Chatter / audit trail integration
        'web',           # Frontend controllers
    ],
    'data': [
        # Security — load first, always
        'security/shiv_auth_groups.xml',
        'security/ir.model.access.csv',
        'security/record_rules.xml',

        # Data
        'data/shiv_auth_data.xml',

        # Views
        'views/shiv_user_views.xml',
        'views/shiv_role_views.xml',
        'views/shiv_session_views.xml',
        'views/shiv_audit_log_views.xml',
        'views/shiv_password_policy_views.xml',
        'views/shiv_auth_menus.xml',
    ],
    'demo': [
        'demo/shiv_auth_demo.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'sequence': 1,  # First module installed
}
