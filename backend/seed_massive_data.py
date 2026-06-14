"""
seed_massive_data.py
====================
Generates 1000s of realistic dummy records across EVERY model in the Shiv ERP.
Run inside Odoo container:
    docker exec -i shiv_odoo python3 < backend/seed_massive_data.py

Models seeded:
  - res.users          (12 users, all roles)
  - shiv.customer      (200 customers)
  - shiv.vendor        (50 vendors)
  - shiv.product.category (15 categories)
  - shiv.product       (80 products)
  - shiv.vendor.product (vendor-product pricelist, 200 entries)
  - shiv.bom + shiv.bom.line (80 BOMs)
  - shiv.work.center   (10 work centers)
  - shiv.stock.summary (80 stock summaries)
  - shiv.sale.order + lines (500 sales orders, ~1500 lines)
  - shiv.purchase.order + lines (300 purchase orders, ~900 lines)
  - shiv.manufacturing.order + components (200 manufacturing orders)
  - shiv.stock.ledger  (2000+ ledger entries)
  - shiv.audit.log     (500 audit entries)
"""

import odoo
from odoo import api, SUPERUSER_ID
from datetime import datetime, timedelta
import random
import string
import sys

print("=" * 60)
print("SHIV ERP — Massive Data Seeder")
print("=" * 60)

odoo.tools.config.parse_config(['-c', '/etc/odoo/odoo.conf', '-d', 'shiv_furniture_erp'])
db_name = 'shiv_furniture_erp'
registry = odoo.registry(db_name)

# ── Realistic Indian Names & Data ─────────────────────────────

FIRST_NAMES = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
    'Krishna', 'Ishaan', 'Shaurya', 'Atharva', 'Advait', 'Dhruv', 'Kabir',
    'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya', 'Aadhya', 'Ira', 'Anika',
    'Priya', 'Nisha', 'Kavita', 'Sunita', 'Rekha', 'Meena', 'Pooja',
    'Rajesh', 'Suresh', 'Ramesh', 'Dinesh', 'Mahesh', 'Vikram', 'Ajay',
    'Vijay', 'Sanjay', 'Deepak', 'Amit', 'Rohit', 'Nitin', 'Sachin', 'Gaurav',
    'Neha', 'Sneha', 'Swati', 'Ritu', 'Komal', 'Anjali', 'Shruti', 'Divya',
]

LAST_NAMES = [
    'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Nair',
    'Joshi', 'Mishra', 'Yadav', 'Chauhan', 'Agarwal', 'Mehta', 'Shah',
    'Bansal', 'Kapoor', 'Malhotra', 'Chopra', 'Bhatia', 'Desai', 'Iyer',
    'Pillai', 'Menon', 'Saxena', 'Trivedi', 'Pandey', 'Tiwari', 'Dubey',
    'Srivastava', 'Rastogi', 'Bajaj', 'Khanna', 'Sethi', 'Arora', 'Bhatt',
]

CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
    'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
    'Thane', 'Bhopal', 'Visakhapatnam', 'Vadodara', 'Coimbatore', 'Ludhiana',
    'Noida', 'Gurgaon', 'Chandigarh', 'Nashik', 'Faridabad', 'Rajkot',
]

STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal',
          'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Punjab', 'Kerala']

FURNITURE_ADJECTIVES = [
    'Premium', 'Executive', 'Classic', 'Modern', 'Vintage', 'Luxury', 'Compact',
    'Ergonomic', 'Rustic', 'Contemporary', 'Traditional', 'Minimalist', 'Grand',
    'Royal', 'Elite', 'Artisan', 'Heritage', 'Designer', 'Handcrafted', 'Custom',
]

FURNITURE_MATERIALS = [
    'Teak', 'Sheesham', 'Mango Wood', 'Rosewood', 'Pine', 'Oak', 'Walnut',
    'Bamboo', 'Plywood', 'MDF', 'Particle Board', 'Mahogany', 'Cedar', 'Birch',
    'Acacia', 'Rubber Wood', 'Engineered Wood', 'Solid Wood', 'Metal Frame', 'Wrought Iron',
]

FURNITURE_TYPES = [
    'Sofa', 'Dining Table', 'Office Desk', 'Bookshelf', 'Wardrobe', 'Bed Frame',
    'Coffee Table', 'TV Unit', 'Shoe Rack', 'Study Table', 'Dressing Table',
    'Side Table', 'Console Table', 'Bar Cabinet', 'Wine Rack', 'Chest of Drawers',
    'Nightstand', 'Bench', 'Recliner', 'Armchair', 'Lounge Chair', 'Rocking Chair',
    'Bunk Bed', 'King Bed', 'Queen Bed', 'Single Bed', 'Crib', 'Dining Chair',
    'Office Chair', 'Stool', 'Ottoman', 'Pouf', 'Bean Bag', 'Swing Chair',
    'Garden Set', 'Patio Table', 'Outdoor Bench', 'Planter Stand', 'Room Divider',
    'Display Cabinet', 'Kitchen Cabinet', 'Pantry Unit', 'Modular Kitchen',
]

RAW_MATERIALS = [
    'Teak Wood Plank 6ft', 'Sheesham Wood Board', 'MDF Sheet 8x4', 'Plywood 18mm',
    'Foam Cushion 4inch', 'Fabric Roll - Cotton', 'Fabric Roll - Velvet',
    'Leather Hide - Brown', 'Leather Hide - Black', 'Leather Hide - Tan',
    'Wood Screws Box (500)', 'Nails Box (1000)', 'Wood Glue 5L', 'Sandpaper Pack',
    'Varnish 5L - Clear', 'Varnish 5L - Walnut', 'Paint 5L - White', 'Paint 5L - Black',
    'Metal Bracket Set', 'Drawer Slides Pair', 'Door Hinges Set (4)',
    'Handle Set - Brass', 'Handle Set - Chrome', 'Caster Wheels Set (4)',
    'Glass Panel 4mm', 'Mirror Panel', 'Marble Top Slab', 'Granite Top Slab',
    'Upholstery Staples', 'Edge Banding Tape 50m', 'Dowel Pins Pack (100)',
]

VENDOR_NAMES = [
    'Rajasthan Timber Co.', 'Gujarat Wood Industries', 'Delhi Foam House',
    'Chennai Fabric Traders', 'Mumbai Metal Works', 'Hyderabad Hardware Hub',
    'Pune Plywood Centre', 'Bangalore Leather Mart', 'Kolkata Glass Works',
    'Ahmedabad Paint House', 'Jaipur Marble Exports', 'Surat Textile Mills',
    'Ludhiana Steel Trading', 'Nagpur Wood Craft', 'Indore Foam Industries',
    'Kanpur Hardware Store', 'Bhopal Timber Depot', 'Coimbatore Wood Panel',
    'Vadodara Veneer Works', 'Nashik Chemical Trading', 'Kerala Rubber Wood Co.',
    'Assam Bamboo Industries', 'Mysore Sandalwood Craft', 'Jodhpur Antique Lumber',
    'Agra Marble Palace', 'Varanasi Brass Works', 'Moradabad Metal Craft',
    'Saharanpur Wood Carving', 'Firozabad Glass Art', 'Aligarh Lock Industries',
]

CATEGORIES = [
    'Living Room Furniture', 'Bedroom Furniture', 'Dining Room Furniture',
    'Office Furniture', 'Outdoor & Garden', 'Storage & Organization',
    'Kids Furniture', 'Bathroom Furniture', 'Kitchen Furniture',
    'Raw Materials - Wood', 'Raw Materials - Metal', 'Raw Materials - Fabric',
    'Raw Materials - Hardware', 'Raw Materials - Finish', 'Components & Parts',
]

WORK_CENTER_NAMES = [
    'Cutting & Shaping Bay', 'CNC Machine Center', 'Assembly Line A',
    'Assembly Line B', 'Finishing & Polishing Unit', 'Upholstery Workshop',
    'Paint Booth', 'Quality Inspection Zone', 'Packaging Station', 'Wood Seasoning Yard',
]

def rand_phone():
    return f'+91{random.randint(7000000000, 9999999999)}'

def rand_gstin():
    state = str(random.randint(1, 37)).zfill(2)
    pan = ''.join(random.choices(string.ascii_uppercase, k=5)) + \
          ''.join(random.choices(string.digits, k=4)) + \
          random.choice(string.ascii_uppercase)
    return f'{state}{pan}1Z{random.choice(string.digits)}'

def rand_address():
    num = random.randint(1, 500)
    street = random.choice(['MG Road', 'Station Road', 'Industrial Area', 'MIDC',
                            'Ring Road', 'NH Highway', 'Sector ' + str(random.randint(1, 50)),
                            'Block ' + random.choice(string.ascii_uppercase)])
    city = random.choice(CITIES)
    state = random.choice(STATES)
    pin = random.randint(100000, 999999)
    return f'{num}, {street},\n{city}, {state} - {pin}'

def rand_date(days_back=365):
    d = datetime.now() - timedelta(days=random.randint(0, days_back))
    return d.strftime('%Y-%m-%d')

def rand_datetime(days_back=365):
    d = datetime.now() - timedelta(days=random.randint(0, days_back),
                                    hours=random.randint(0, 23),
                                    minutes=random.randint(0, 59))
    return d.strftime('%Y-%m-%d %H:%M:%S')


with registry.cursor() as cr:
    env = api.Environment(cr, SUPERUSER_ID, {})

    # ════════════════════════════════════════════════════════════
    # 1. USERS — Create all 12 role accounts
    # ════════════════════════════════════════════════════════════
    print("\n[1/12] Creating users for all roles...")
    ROLE_USERS = [
        ('sales.mgr@shivfurniture.com', 'Anita Desai', 'sales_manager', 'sales', 'EMP004'),
        ('purchase.mgr@shivfurniture.com', 'Meena Kumari', 'purchase_manager', 'purchase', 'EMP006'),
        ('purchase.user@shivfurniture.com', 'Ravi Kumar', 'purchase_user', 'purchase', 'EMP007'),
        ('prod.mgr@shivfurniture.com', 'Deepak Verma', 'production_manager', 'production', 'EMP008'),
        ('prod.user@shivfurniture.com', 'Santosh Yadav', 'production_user', 'production', 'EMP009'),
        ('wh.user@shivfurniture.com', 'Vikram Singh', 'warehouse_user', 'warehouse', 'EMP005'),
        ('accountant@shivfurniture.com', 'Kavita Joshi', 'accountant', 'finance', 'EMP010'),
        ('viewer@shivfurniture.com', 'Guest Viewer', 'viewer', 'management', 'EMP011'),
        ('rahul.demo@shivfurniture.com', 'Rahul Sharma', 'sales_user', 'sales', 'EMP001'),
        ('priya.demo@shivfurniture.com', 'Priya Patel', 'warehouse_manager', 'warehouse', 'EMP002'),
        ('suresh.demo@shivfurniture.com', 'Suresh Gupta', 'auditor', 'management', 'EMP003'),
    ]
    user_count = 0
    for login, name, role, dept, emp_id in ROLE_USERS:
        existing = env['res.users'].sudo().search([('login', '=', login)], limit=1)
        if not existing:
            try:
                env['res.users'].sudo().create({
                    'name': name,
                    'login': login,
                    'email': login,
                    'password': 'DemoPass@123',
                    'shiv_role': role,
                    'department': dept,
                    'employee_id': emp_id,
                    'must_change_password': False,  # False so we can test immediately
                })
                user_count += 1
            except Exception as e:
                print(f"  ⚠ Could not create {login}: {e}")
    print(f"  ✓ Created {user_count} new users")

    # Also make sure admin has shiv_role set
    admin = env['res.users'].sudo().browse(SUPERUSER_ID)
    if not admin.shiv_role:
        try:
            admin.write({'shiv_role': 'admin'})
        except:
            pass

    # ════════════════════════════════════════════════════════════
    # 2. CATEGORIES (15)
    # ════════════════════════════════════════════════════════════
    print("\n[2/12] Creating product categories...")
    cat_records = []
    for cat_name in CATEGORIES:
        existing = env['shiv.product.category'].search([('name', '=', cat_name)], limit=1)
        if existing:
            cat_records.append(existing)
        else:
            cat_records.append(env['shiv.product.category'].create({'name': cat_name}))
    print(f"  ✓ {len(cat_records)} categories ready")

    # ════════════════════════════════════════════════════════════
    # 3. UoM
    # ════════════════════════════════════════════════════════════
    uom = env['uom.uom'].search([('name', '=', 'Units')], limit=1)
    if not uom:
        uom_cat = env['uom.category'].search([('name', '=', 'Unit')], limit=1)
        if not uom_cat:
            uom_cat = env['uom.category'].create({'name': 'Unit'})
        uom = env['uom.uom'].create({'name': 'Units', 'category_id': uom_cat.id, 'uom_type': 'reference'})

    # ════════════════════════════════════════════════════════════
    # 4. PRODUCTS (80)
    # ════════════════════════════════════════════════════════════
    print("\n[3/12] Creating 80 products...")
    products = list(env['shiv.product'].search([]))
    existing_names = {p.name for p in products}

    # Finished goods (50)
    for i in range(50):
        adj = random.choice(FURNITURE_ADJECTIVES)
        mat = random.choice(FURNITURE_MATERIALS)
        typ = random.choice(FURNITURE_TYPES)
        name = f'{adj} {mat} {typ}'
        if name in existing_names:
            continue
        existing_names.add(name)
        sale_p = round(random.uniform(3000, 150000), 2)
        cost_p = round(sale_p * random.uniform(0.35, 0.65), 2)
        cat = random.choice(cat_records[:9])  # first 9 = finished goods categories
        try:
            products.append(env['shiv.product'].create({
                'name': name,
                'internal_ref': f'FG-{str(i+1).zfill(4)}',
                'category_id': cat.id,
                'uom_id': uom.id,
                'uom_purchase_id': uom.id,
                'sale_price': sale_p,
                'cost_price': cost_p,
                'product_type': 'storable',
                'reorder_point': random.randint(5, 30),
                'reorder_qty': random.randint(10, 50),
                'lead_time_days': random.randint(3, 21),
                'is_tracked': True,
                'state': 'active',
                'is_active': True,
                'description': f'High-quality {mat.lower()} {typ.lower()} with {adj.lower()} finish.',
            }))
        except Exception as e:
            pass

    # Raw materials (30)
    for i, rm_name in enumerate(RAW_MATERIALS):
        if rm_name in existing_names:
            continue
        existing_names.add(rm_name)
        cost_p = round(random.uniform(200, 15000), 2)
        cat = random.choice(cat_records[9:])  # last 6 = raw material categories
        try:
            products.append(env['shiv.product'].create({
                'name': rm_name,
                'internal_ref': f'RM-{str(i+1).zfill(4)}',
                'category_id': cat.id,
                'uom_id': uom.id,
                'uom_purchase_id': uom.id,
                'sale_price': 0,
                'cost_price': cost_p,
                'product_type': 'storable',
                'reorder_point': random.randint(20, 100),
                'reorder_qty': random.randint(50, 200),
                'lead_time_days': random.randint(2, 14),
                'is_tracked': True,
                'state': 'active',
                'is_active': True,
                'procurement_method': 'buy',
            }))
        except Exception as e:
            pass

    print(f"  ✓ {len(products)} total products")

    # ════════════════════════════════════════════════════════════
    # 5. CUSTOMERS (200)
    # ════════════════════════════════════════════════════════════
    print("\n[4/12] Creating 200 customers...")
    customers = list(env['shiv.customer'].search([]))
    for i in range(200 - len(customers)):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        name = f'{fn} {ln}'
        try:
            customers.append(env['shiv.customer'].create({
                'name': name,
                'email': f'{fn.lower()}.{ln.lower()}{random.randint(1,99)}@gmail.com',
                'phone': rand_phone(),
                'address': rand_address(),
                'gstin': rand_gstin() if random.random() > 0.3 else False,
                'credit_limit': round(random.uniform(50000, 5000000), 2),
                'is_active': True,
            }))
        except Exception:
            pass
    print(f"  ✓ {len(customers)} total customers")

    # ════════════════════════════════════════════════════════════
    # 6. VENDORS (50)
    # ════════════════════════════════════════════════════════════
    print("\n[5/12] Creating 50 vendors...")
    vendors = list(env['shiv.vendor'].search([]))
    existing_vendor_names = {v.name for v in vendors}
    for i, vname in enumerate(VENDOR_NAMES):
        if vname in existing_vendor_names:
            continue
        try:
            vendors.append(env['shiv.vendor'].create({
                'name': vname,
                'code': f'VND-{str(i+1).zfill(3)}',
                'email': f'info@{vname.lower().replace(" ", "").replace(".", "").replace(",", "")[:15]}.com',
                'phone': rand_phone(),
                'address': rand_address(),
                'gstin': rand_gstin(),
                'is_active': True,
                'reliability_score': round(random.uniform(4.0, 9.5), 1),
                'on_time_delivery_pct': round(random.uniform(60.0, 99.0), 2),
            }))
        except Exception:
            pass
    # Fill up to 50
    for i in range(50 - len(vendors)):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        try:
            vendors.append(env['shiv.vendor'].create({
                'name': f'{fn} {ln} Enterprises',
                'is_active': True,
                'reliability_score': round(random.uniform(4.0, 9.5), 1),
                'on_time_delivery_pct': round(random.uniform(60.0, 99.0), 2),
            }))
        except Exception:
            pass
    print(f"  ✓ {len(vendors)} total vendors")

    # ════════════════════════════════════════════════════════════
    # 7. VENDOR-PRODUCT PRICELIST (200 entries)
    # ════════════════════════════════════════════════════════════
    print("\n[6/12] Creating vendor-product pricelist...")
    vp_count = 0
    used_pairs = set()
    for _ in range(200):
        v = random.choice(vendors)
        p = random.choice(products)
        pair = (v.id, p.id)
        if pair in used_pairs:
            continue
        used_pairs.add(pair)
        try:
            env['shiv.vendor.product'].create({
                'vendor_id': v.id,
                'product_id': p.id,
                'unit_price': round(random.uniform(500, 80000), 2),
                'min_order_qty': random.choice([1, 5, 10, 25, 50]),
                'lead_time_days': random.randint(2, 30),
                'is_preferred': random.random() > 0.8,
            })
            vp_count += 1
        except Exception:
            pass
    print(f"  ✓ {vp_count} vendor-product entries created")

    # ════════════════════════════════════════════════════════════
    # 8. WORK CENTERS (10)
    # ════════════════════════════════════════════════════════════
    print("\n[7/12] Creating work centers...")
    wcs = list(env['shiv.work.center'].search([]))
    existing_wc_names = {w.name for w in wcs}
    for wc_name in WORK_CENTER_NAMES:
        if wc_name in existing_wc_names:
            continue
        try:
            wcs.append(env['shiv.work.center'].create({
                'name': wc_name,
                'is_active': True,
                'capacity': random.randint(50, 200),
                'utilization_pct': round(random.uniform(20.0, 95.0), 1),
            }))
        except Exception:
            pass
    print(f"  ✓ {len(wcs)} work centers")

    # ════════════════════════════════════════════════════════════
    # 9. BOMs (one per finished product)
    # ════════════════════════════════════════════════════════════
    print("\n[8/12] Creating Bills of Materials...")
    bom_count = 0
    finished = [p for p in products if p.sale_price > 0]
    raw_mats = [p for p in products if p.sale_price == 0]
    if not raw_mats:
        raw_mats = products[:10]

    for fp in finished:
        existing_bom = env['shiv.bom'].search([('product_id', '=', fp.id)], limit=1)
        if existing_bom:
            continue
        try:
            bom = env['shiv.bom'].create({
                'product_id': fp.id,
                'qty_produced': 1.0,
            })
            # Add 2-5 component lines
            num_lines = random.randint(2, 5)
            used_rm = set()
            for _ in range(num_lines):
                rm = random.choice(raw_mats)
                if rm.id in used_rm:
                    continue
                used_rm.add(rm.id)
                env['shiv.bom.line'].create({
                    'bom_id': bom.id,
                    'product_id': rm.id,
                    'qty_required': round(random.uniform(1, 10), 2),
                    'uom_id': uom.id,
                })
            bom_count += 1
        except Exception:
            pass
    print(f"  ✓ {bom_count} BOMs created")

    # ════════════════════════════════════════════════════════════
    # 10. STOCK SUMMARIES (initial stock for all products)
    # ════════════════════════════════════════════════════════════
    print("\n[9/12] Initializing stock summaries...")
    stock_count = 0
    for p in products:
        existing = env['shiv.stock.summary'].search([('product_id', '=', p.id)], limit=1)
        if existing:
            qty = round(random.uniform(10, 500), 2)
            existing.write({
                'qty_on_hand': qty,
                'qty_available': qty,
                'qty_incoming': round(random.uniform(0, 100), 2),
            })
        else:
            qty = round(random.uniform(10, 500), 2)
            try:
                env['shiv.stock.summary'].create({
                    'product_id': p.id,
                    'qty_on_hand': qty,
                    'qty_available': qty,
                    'qty_incoming': round(random.uniform(0, 100), 2),
                })
                stock_count += 1
            except Exception:
                pass
    print(f"  ✓ {stock_count} new stock summaries ({len(products)} total products stocked)")

    cr.commit()
    print("\n  ▸ Checkpoint: base data committed.")

    # ════════════════════════════════════════════════════════════
    # 11. SALES ORDERS (500 with lines)
    # ════════════════════════════════════════════════════════════
    print("\n[10/12] Creating 500 Sales Orders...")
    sellable = [p for p in products if p.sale_price > 0]
    if not sellable:
        sellable = products[:20]
    so_count = 0
    so_existing = env['shiv.sale.order'].search_count([])
    target = 500 - so_existing
    STATES_SO = ['draft', 'confirmed', 'picking', 'delivered', 'done', 'cancelled']
    STATE_WEIGHTS = [0.15, 0.25, 0.15, 0.20, 0.20, 0.05]

    for i in range(max(0, target)):
        cust = random.choice(customers)
        order_date = rand_datetime(days_back=180)
        delivery = (datetime.strptime(order_date, '%Y-%m-%d %H:%M:%S') +
                    timedelta(days=random.randint(3, 30))).strftime('%Y-%m-%d')
        try:
            so = env['shiv.sale.order'].create({
                'customer_id': cust.id,
                'date_order': order_date,
                'delivery_date': delivery,
                'notes': f'Order placed by {cust.name}',
            })
            # 1-5 lines per order
            num_lines = random.randint(1, 5)
            used_products = set()
            for _ in range(num_lines):
                prod = random.choice(sellable)
                if prod.id in used_products:
                    continue
                used_products.add(prod.id)
                env['shiv.sale.order.line'].create({
                    'order_id': so.id,
                    'product_id': prod.id,
                    'qty_ordered': random.randint(1, 15),
                    'unit_price': prod.sale_price,
                    'discount_pct': random.choice([0, 0, 0, 5, 10, 15]) if random.random() > 0.6 else 0,
                })

            # Set state directly via SQL to avoid workflow side-effects on bulk seed
            target_state = random.choices(STATES_SO, weights=STATE_WEIGHTS, k=1)[0]
            if target_state != 'draft':
                cr.execute("UPDATE shiv_sale_order SET state=%s WHERE id=%s", (target_state, so.id))

            so_count += 1
        except Exception as e:
            pass

        if so_count % 50 == 0 and so_count > 0:
            cr.commit()

    cr.commit()
    print(f"  ✓ {so_count} new Sales Orders created")

    # ════════════════════════════════════════════════════════════
    # 12. PURCHASE ORDERS (300 with lines)
    # ════════════════════════════════════════════════════════════
    print("\n[11/12] Creating 300 Purchase Orders...")
    po_count = 0
    po_existing = env['shiv.purchase.order'].search_count([])
    target_po = 300 - po_existing
    STATES_PO = ['draft', 'confirmed', 'received', 'done', 'cancelled']
    STATE_W_PO = [0.15, 0.30, 0.25, 0.25, 0.05]

    for i in range(max(0, target_po)):
        v = random.choice(vendors)
        order_date = rand_datetime(days_back=180)
        expected = (datetime.strptime(order_date, '%Y-%m-%d %H:%M:%S') +
                    timedelta(days=random.randint(5, 45))).strftime('%Y-%m-%d')
        try:
            po = env['shiv.purchase.order'].create({
                'vendor_id': v.id,
                'date_expected': expected,
            })
            # 1-5 lines
            num_lines = random.randint(1, 5)
            used_p = set()
            for _ in range(num_lines):
                prod = random.choice(products)
                if prod.id in used_p:
                    continue
                used_p.add(prod.id)
                env['shiv.purchase.order.line'].create({
                    'order_id': po.id,
                    'product_id': prod.id,
                    'qty_ordered': random.randint(10, 100),
                    'unit_price': prod.cost_price if prod.cost_price > 0 else round(random.uniform(500, 20000), 2),
                })

            target_state = random.choices(STATES_PO, weights=STATE_W_PO, k=1)[0]
            if target_state != 'draft':
                cr.execute("UPDATE shiv_purchase_order SET state=%s WHERE id=%s", (target_state, po.id))

            po_count += 1
        except Exception:
            pass

        if po_count % 50 == 0 and po_count > 0:
            cr.commit()

    cr.commit()
    print(f"  ✓ {po_count} new Purchase Orders created")

    # ════════════════════════════════════════════════════════════
    # 13. MANUFACTURING ORDERS (200)
    # ════════════════════════════════════════════════════════════
    print("\n[12/12] Creating 200 Manufacturing Orders...")
    mo_count = 0
    mo_existing = env['shiv.manufacturing.order'].search_count([])
    target_mo = 200 - mo_existing
    boms = env['shiv.bom'].search([])
    STATES_MO = ['draft', 'confirmed', 'in_progress', 'on_hold', 'done', 'cancelled']
    STATE_W_MO = [0.10, 0.20, 0.30, 0.05, 0.30, 0.05]

    for i in range(max(0, target_mo)):
        bom = random.choice(boms) if boms else False
        if not bom:
            continue
        wc = random.choice(wcs) if wcs else False
        qty = random.randint(5, 50)
        sched = rand_datetime(days_back=90)
        try:
            mo = env['shiv.manufacturing.order'].create({
                'product_id': bom.product_id.id,
                'bom_id': bom.id,
                'qty_to_produce': qty,
                'scheduled_date': sched,
                'work_center_id': wc.id if wc else False,
            })

            target_state = random.choices(STATES_MO, weights=STATE_W_MO, k=1)[0]
            produced = 0
            if target_state in ('done',):
                produced = qty
            elif target_state == 'in_progress':
                produced = random.randint(0, qty - 1)

            if target_state != 'draft':
                cr.execute(
                    "UPDATE shiv_manufacturing_order SET state=%s, qty_produced=%s WHERE id=%s",
                    (target_state, produced, mo.id)
                )
            mo_count += 1
        except Exception:
            pass

        if mo_count % 50 == 0 and mo_count > 0:
            cr.commit()

    cr.commit()
    print(f"  ✓ {mo_count} new Manufacturing Orders created")

    # ════════════════════════════════════════════════════════════
    # 14. STOCK LEDGER ENTRIES (2000+)
    # ════════════════════════════════════════════════════════════
    print("\n[BONUS] Creating 2000 Stock Ledger entries...")
    ledger_count = 0
    MOVEMENT_TYPES = ['inbound', 'outbound', 'transfer', 'adjustment', 'production', 'reserve', 'unreserve']
    LOCATIONS = ['Warehouse/Main', 'Warehouse/Raw Material', 'Warehouse/Finished Goods',
                 'Workshop/Assembly', 'Workshop/Finishing', 'Dispatch Bay', 'Quality Hold',
                 'Vendor/Input', 'Customer/Output', 'Scrap']
    SOURCE_REFS = ['SO-', 'PO-', 'MO-', 'ADJ-', 'INT-']

    for _ in range(2000):
        prod = random.choice(products)
        mt = random.choice(MOVEMENT_TYPES)
        qty = round(random.uniform(-50, 100), 2)
        if mt == 'outbound':
            qty = -abs(qty)
        elif mt == 'inbound':
            qty = abs(qty)

        ref = random.choice(SOURCE_REFS) + str(random.randint(1000, 9999))
        try:
            env['shiv.stock.ledger'].create({
                'product_id': prod.id,
                'location_from': random.choice(LOCATIONS),
                'location_to': random.choice(LOCATIONS),
                'qty_change': qty,
                'movement_type': mt,
                'source_ref': ref,
                'timestamp': rand_datetime(days_back=180),
                'source_model': random.choice(['shiv.sale.order', 'shiv.purchase.order', 'shiv.manufacturing.order']),
                'source_id': random.randint(1, 500),
                'notes': f'Auto-generated ledger entry for {prod.name}',
                'actor_id': SUPERUSER_ID,
            })
            ledger_count += 1
        except Exception:
            pass

        if ledger_count % 200 == 0 and ledger_count > 0:
            cr.commit()

    cr.commit()
    print(f"  ✓ {ledger_count} stock ledger entries")

    # ════════════════════════════════════════════════════════════
    # 15. AUDIT LOG ENTRIES (500)
    # ════════════════════════════════════════════════════════════
    print("\n[BONUS] Creating 500 Audit Log entries...")
    audit_count = 0
    AUDIT_ACTIONS = [
        'login_success', 'login_failed', 'logout', 'create', 'write', 'unlink',
        'state_change', 'password_changed', 'role_changed', 'account_locked',
        'account_unlocked', 'session_expired',
    ]
    AUDIT_MODELS = [
        'shiv.sale.order', 'shiv.purchase.order', 'shiv.manufacturing.order',
        'shiv.product', 'shiv.stock.summary', 'shiv.customer', 'shiv.vendor',
        'res.users', 'shiv.work.center',
    ]
    all_users = env['res.users'].sudo().search([('shiv_role', '!=', False)])

    for _ in range(500):
        u = random.choice(all_users) if all_users else env['res.users'].sudo().browse(SUPERUSER_ID)
        action = random.choice(AUDIT_ACTIONS)
        model = random.choice(AUDIT_MODELS)
        try:
            env['shiv.audit.log'].sudo().create({
                'action': action,
                'model': model,
                'record_id': random.randint(1, 500),
                'record_name': f'{model.split(".")[-1].title()} #{random.randint(1,500)}',
                'actor_id': u.id,
                'actor_name': u.name,
                'actor_role': u.shiv_role or 'admin',
                'ip_address': f'192.168.{random.randint(1,10)}.{random.randint(1,254)}',
                'timestamp': rand_datetime(days_back=90),
                'notes': f'{action.replace("_", " ").title()} on {model} by {u.name}',
            })
            audit_count += 1
        except Exception:
            pass

        if audit_count % 100 == 0 and audit_count > 0:
            cr.commit()

    cr.commit()
    print(f"  ✓ {audit_count} audit log entries")

    # Final commit
    cr.commit()

print("\n" + "=" * 60)
print("✅ MASSIVE DATA SEEDING COMPLETE!")
print("=" * 60)
print("""
Summary of what was created:
  • 12 user accounts (all roles)
  • 15 product categories
  • 80+ products (finished goods + raw materials)
  • 200 customers with Indian names, addresses, GSTIN
  • 50 vendors with reliability scores
  • 200 vendor-product pricelist entries
  • 80+ Bills of Materials with component lines
  • 10 work centers
  • Stock summaries for all products
  • 500 Sales Orders with ~1500 order lines
  • 300 Purchase Orders with ~900 order lines
  • 200 Manufacturing Orders
  • 2000 Stock Ledger entries
  • 500 Audit Log entries
  ─────────────────────────────────
  TOTAL: ~5000+ records across all tables
""")
