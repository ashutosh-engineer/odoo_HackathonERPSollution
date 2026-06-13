# -*- coding: utf-8 -*-
{
    'name': 'Shiv Furniture - Manufacturing Execution & Floor Console',
    'version': '16.0.2.0.0',
    'category': 'Shiv Furniture/Manufacturing',
    'summary': (
        'Bill of Materials, work centers, manufacturing orders, work order execution. '
        'SPECIAL: Live Factory Floor Work Center Status Console with anomaly reporting '
        'and auto-rerouting of manufacturing orders.'
    ),
    'author': 'Shiv Furniture Works ERP Team',
    'depends': ['shiv_auth', 'shiv_product', 'shiv_inventory', 'shiv_purchase'],
    'data': [
        'security/ir.model.access.csv',
        'security/record_rules.xml',
        'data/shiv_manufacturing_data.xml',
        'views/shiv_bom_views.xml',
        'views/shiv_work_center_views.xml',
        'views/shiv_manufacturing_order_views.xml',
        'views/shiv_floor_console_views.xml',
        'views/shiv_manufacturing_menus.xml',
    ],
    'installable': True,
    'application': False,
    'sequence': 6,
}
