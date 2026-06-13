# -*- coding: utf-8 -*-
{
    'name': 'Shiv Furniture - Sales Order Management',
    'version': '16.0.1.0.0',
    'category': 'Shiv Furniture/Sales',
    'summary': 'Sales orders with ACID inventory reservation. Overselling is impossible.',
    'author': 'Shiv Furniture Works ERP Team',
    'depends': ['shiv_auth', 'shiv_product', 'shiv_inventory', 'shiv_purchase'],
    'data': [
        'security/ir.model.access.csv',
        'security/record_rules.xml',
        'data/shiv_sales_data.xml',
        'views/shiv_customer_views.xml',
        'views/shiv_sale_order_views.xml',
        'views/shiv_sales_menus.xml',
    ],
    'installable': True,
    'application': False,
    'sequence': 5,
}
