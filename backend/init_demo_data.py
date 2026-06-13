import odoo
from odoo import api, SUPERUSER_ID
from datetime import datetime, timedelta
import random

odoo.tools.config.parse_config(['-c', '/etc/odoo/odoo.conf', '-d', 'shiv_furniture_erp'])
db_name = 'shiv_furniture_erp'
registry = odoo.registry(db_name)

with registry.cursor() as cr:
    env = api.Environment(cr, SUPERUSER_ID, {})
    
    # Check if we already have demo data to avoid duplicates
    if env['shiv.customer'].search([('email', '=', 'demo1@example.com')]):
        print("Demo data already exists")
    else:
        # Create Customers
        customers = []
        for i in range(1, 6):
            customers.append(env['shiv.customer'].create({
                'name': f'Customer {i}',
                'email': f'demo{i}@example.com',
                'phone': f'123456789{i}',
                'is_active': True,
            }))

        # Create Category
        cat_sofa = env['shiv.product.category'].search([('name', '=', 'Sofas & Seating')], limit=1)
        if not cat_sofa:
            cat_sofa = env['shiv.product.category'].create({'name': 'Sofas & Seating'})
            
        cat_table = env['shiv.product.category'].search([('name', '=', 'Tables & Desks')], limit=1)
        if not cat_table:
            cat_table = env['shiv.product.category'].create({'name': 'Tables & Desks'})

        # Create UoM if needed
        uom = env['uom.uom'].search([('name', '=', 'Units')], limit=1)
        if not uom:
            uom_cat = env['uom.category'].search([('name', '=', 'Unit')], limit=1)
            if not uom_cat:
                uom_cat = env['uom.category'].create({'name': 'Unit'})
            uom = env['uom.uom'].create({'name': 'Units', 'category_id': uom_cat.id, 'uom_type': 'reference'})

        # Create Products
        products = []
        products.append(env['shiv.product'].create({
            'name': 'Premium Leather Sofa',
            'category_id': cat_sofa.id,
            'uom_id': uom.id,
            'uom_purchase_id': uom.id,
            'sale_price': 45000.0,
            'cost_price': 25000.0,
            'state': 'active',
            'is_active': True,
        }))
        products.append(env['shiv.product'].create({
            'name': 'Wooden Dining Table',
            'category_id': cat_table.id,
            'uom_id': uom.id,
            'uom_purchase_id': uom.id,
            'sale_price': 15000.0,
            'cost_price': 8000.0,
            'state': 'active',
            'is_active': True,
        }))
        products.append(env['shiv.product'].create({
            'name': 'Office Desk',
            'category_id': cat_table.id,
            'uom_id': uom.id,
            'uom_purchase_id': uom.id,
            'sale_price': 12000.0,
            'cost_price': 6000.0,
            'state': 'active',
            'is_active': True,
        }))

        # Create Vendors
        vendors = []
        for i in range(1, 4):
            vendors.append(env['shiv.vendor'].create({
                'name': f'Supplier {i}',
                'is_active': True,
            }))

        # Create Work Centers
        wcs = []
        for name in ['Cutting & Shaping', 'Assembly Line', 'Finishing & Polishing']:
            wcs.append(env['shiv.work.center'].create({
                'name': name,
                'is_active': True,
                'capacity': 100,
            }))

        # Update utilization for demo
        wcs[0].write({'utilization_pct': 85.0})
        wcs[1].write({'utilization_pct': 45.0})
        wcs[2].write({'utilization_pct': 60.0})

        # Create BoM
        for p in products:
            bom = env['shiv.bom'].create({
                'product_id': p.id,
                'qty_produced': 1.0,
            })
            env['shiv.bom.line'].create({
                'bom_id': bom.id,
                'product_id': p.id,
                'qty_required': 1.0,
                'uom_id': uom.id,
            })
            
        # Create Sales Orders
        for i in range(1, 6):
            so = env['shiv.sale.order'].create({
                'customer_id': random.choice(customers).id,
                'delivery_date': (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d'),
            })
            env['shiv.sale.order.line'].create({
                'order_id': so.id,
                'product_id': random.choice(products).id,
                'qty_ordered': random.randint(1, 5),
                'unit_price': products[0].sale_price,
            })
            so.action_confirm()

        # Create Purchase Orders
        for i in range(1, 4):
            po = env['shiv.purchase.order'].create({
                'vendor_id': random.choice(vendors).id,
                'date_expected': (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d'),
            })
            env['shiv.purchase.order.line'].create({
                'order_id': po.id,
                'product_id': random.choice(products).id,
                'qty_ordered': random.randint(10, 50),
                'unit_price': products[0].cost_price,
            })
            if i % 2 == 0:
                po.action_confirm()
                
        # Create Manufacturing Orders
        for i in range(1, 4):
            env['shiv.manufacturing.order'].create({
                'product_id': random.choice(products).id,
                'bom_id': env['shiv.bom'].search([('product_id', '=', products[0].id)], limit=1).id,
                'qty_to_produce': random.randint(5, 20),
                'scheduled_date': (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d %H:%M:%S'),
                'work_center_id': random.choice(wcs).id,
            })
            
        cr.commit()
        print("Demo data initialized successfully with multiple records")
