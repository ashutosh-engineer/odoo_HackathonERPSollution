# -*- coding: utf-8 -*-
{
    'name': 'Shiv Furniture - Procurement & Purchase Orders',
    'version': '16.0.1.0.0',
    'category': 'Shiv Furniture/Purchase',
    'summary': '85% automated procurement: auto-PO from reorder rules, vendor selection, approval workflow.',
    'author': 'Shiv Furniture Works ERP Team',
    'depends': ['shiv_auth', 'shiv_product', 'shiv_inventory'],
    'data': [
        'security/ir.model.access.csv',
        'security/record_rules.xml',
        'data/shiv_purchase_data.xml',
        'views/shiv_vendor_views.xml',
        'views/shiv_purchase_order_views.xml',
        'views/shiv_purchase_menus.xml',
    ],
    'installable': True,
    'application': False,
    'sequence': 4,
}
