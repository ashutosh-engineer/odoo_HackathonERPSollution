# -*- coding: utf-8 -*-
{
    'name': 'Shiv Furniture - Product & Category Master',
    'version': '16.0.1.0.0',
    'category': 'Shiv Furniture/Product',
    'summary': 'Product catalog, categories, variants, UoM, and BoM foundation.',
    'author': 'Shiv Furniture Works ERP Team',
    'depends': ['shiv_auth', 'product', 'uom'],
    'data': [
        'security/ir.model.access.csv',
        'security/record_rules.xml',
        'data/shiv_product_data.xml',
        'views/shiv_product_views.xml',
        'views/shiv_category_views.xml',
        'views/shiv_product_menus.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'sequence': 2,
}
