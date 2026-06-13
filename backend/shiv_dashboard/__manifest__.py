# -*- coding: utf-8 -*-
{
    'name': 'Shiv Furniture - Dashboard & KPI Reporting',
    'version': '16.0.1.0.0',
    'category': 'Shiv Furniture/Dashboard',
    'summary': 'Real-time KPI dashboard with Redis caching. Business metrics in <50ms.',
    'author': 'Shiv Furniture Works ERP Team',
    'depends': ['shiv_auth', 'shiv_product', 'shiv_inventory', 'shiv_purchase', 'shiv_sales', 'shiv_manufacturing'],
    'data': [
        'security/ir.model.access.csv',
        'views/shiv_dashboard_views.xml',
        'views/shiv_dashboard_menus.xml',
    ],
    'installable': True,
    'application': True,
    'sequence': 7,
}
