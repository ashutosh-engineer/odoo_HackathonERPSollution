# -*- coding: utf-8 -*-
{
    'name': 'Shiv Furniture - Inventory Management',
    'version': '16.0.1.0.0',
    'category': 'Shiv Furniture/Inventory',
    'summary': 'Real-time inventory ledger with ACID guarantees, reservations, and 99.9% accuracy.',
    'author': 'Shiv Furniture Works ERP Team',
    'depends': ['shiv_auth', 'shiv_product'],
    'data': [
        'security/ir.model.access.csv',
        'security/record_rules.xml',
        'data/shiv_inventory_data.xml',
        'views/shiv_stock_ledger_views.xml',
        'views/shiv_stock_summary_views.xml',
        'views/shiv_inventory_menus.xml',
    ],
    'installable': True,
    'application': False,
    'sequence': 3,
}
