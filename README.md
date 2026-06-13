# Mini ERP: From Demand to Delivery
### Built at Odoo Hackathon × Parul University

> A production-grade, fully auditable ERP module for **Shiv Furniture Works** — digitizing the
> complete demand-to-delivery cycle on the Odoo framework.

**Team**
- Manav Barot — UI/UX, Frontend
- Ashutosh Singh — Security, Scalability, Testing, DB Architecture, System Design

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Business Problem](#2-business-problem)
3. [System Architecture](#3-system-architecture)
4. [Backend Design](#4-backend-design)
5. [Data Models & Schema](#5-data-models--schema)
6. [API Design](#6-api-design)
7. [Security Architecture](#7-security-architecture)
8. [Scalability Design](#8-scalability-design)
9. [Time Complexity Analysis](#9-time-complexity-analysis)
10. [Tools & Technology Stack](#10-tools--technology-stack)
11. [Evaluated but Not Used](#11-evaluated-but-not-used)
12. [Testing Strategy](#12-testing-strategy)
13. [Correctness Properties](#13-correctness-properties)
14. [Error Handling](#14-error-handling)
15. [Setup & Installation](#15-setup--installation)

---

## 1. Project Overview

**Mini ERP: From Demand to Delivery** replaces Excel sheets, WhatsApp messages, and paper
registers at Shiv Furniture Works with a centralized, role-controlled, fully auditable ERP
system. It covers five interconnected business flows end-to-end:

```
Sales Order → Inventory Check → Procurement Automation → Manufacturing / Purchase → Delivery
```

The module is implemented as a single Odoo addon (`shiv_furniture_erp`) built on Python + Odoo
ORM + PostgreSQL, with XML-based views and a role-based access control layer enforced at every
layer of the stack.

**Key design pillars:**

| Pillar | Implementation |
|--------|---------------|
| Single source of truth | All modules share one product/stock model; no data duplication |
| Atomicity | Every state transition and inventory operation is a single DB transaction |
| Immutability | Stock Ledger and Audit Log records can never be modified or deleted |
| ORM-layer enforcement | All business rules enforced in Python models — not just the UI |
| Security by default | Authentication, hashing, HTTPS, and sessions delegated to Odoo's hardened framework |
| Parameterized SQL only | Zero string interpolation of user input into any SQL query |

---

## 2. Business Problem

Shiv Furniture Works was operating entirely on manual processes:

| Problem | Impact |
|---------|--------|
| Stock tracked in Excel | Discrepancies between actual and recorded inventory |
| Orders managed on WhatsApp | Missed deliveries, no delivery tracking |
| Procurement done manually | Stockouts go undetected until delivery fails |
| No visibility across departments | Sales didn't know what manufacturing was doing |
| Zero audit trail | No accountability for price or stock changes |

This ERP module eliminates all of these with a single system that enforces correct data flow
at the database level, not just through UI conventions.

---

## 3. System Architecture

### High-Level Component Map

```
┌────────────────────────────────────────────────────────────────────┐
│                     Odoo Web Client (XML views)                    │
│       Sales │ Purchase │ Manufacturing │ Inventory │ Dashboard     │
└───────────────────────────┬────────────────────────────────────────┘
                            │  JSON-RPC / XML-RPC (HTTPS only)
┌───────────────────────────▼────────────────────────────────────────┐
│                      Odoo Server (Python)                          │
│                                                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐            │
│  │ Sales Module│  │Purchase Mod. │  │  Mfg Module   │            │
│  │ (sfw.sale)  │  │(sfw.purchase)│  │  (sfw.mfg)    │            │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘            │
│         │                │                  │                     │
│  ┌──────▼────────────────▼──────────────────▼──────────┐         │
│  │                  Core Services Layer                 │         │
│  │  InventoryService │ ProcurementAutomation            │         │
│  │  AuditLogger      │ StockLedgerService               │         │
│  └──────────────────────────────────────────────────────┘         │
│                                                                    │
│  ┌──────────────────────────────────────────────────────┐         │
│  │              Odoo ORM (Model Layer)                  │         │
│  │  sfw.product  sfw.bom  sfw.stock.ledger              │         │
│  │  sfw.audit.log  sfw.work.center  sfw.work.order      │         │
│  └──────────────────────────────────────────────────────┘         │
│                                                                    │
│  ┌──────────────────────────────────────────────────────┐         │
│  │        RBAC Layer (ir.model.access + ir.rule)        │         │
│  └──────────────────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────────┐
│                      PostgreSQL Database                            │
│   Indexed on: status, order_date, product_id, creation timestamp   │
└────────────────────────────────────────────────────────────────────┘
```

### Module File Structure

```
shiv_furniture_erp/
├── __manifest__.py
├── models/
│   ├── sfw_product.py             # Product catalog + inventory fields
│   ├── sfw_bom.py                 # Bill of Materials
│   ├── sfw_sale_order.py          # Sales Order lifecycle
│   ├── sfw_purchase_order.py      # Purchase Order lifecycle
│   ├── sfw_manufacturing_order.py # Manufacturing Order lifecycle
│   ├── sfw_work_center.py         # Work Center definitions
│   ├── sfw_work_order.py          # Work Order execution tracking
│   ├── sfw_stock_ledger.py        # Append-only stock ledger
│   ├── sfw_audit_log.py           # Append-only audit log
│   ├── sfw_procurement.py         # Procurement automation service
│   └── sfw_dashboard.py           # Dashboard KPI computation
├── security/
│   ├── ir.model.access.csv        # CRUD permissions per role
│   └── ir.rule.xml                # Record-level rules + audit log filter
├── views/
│   ├── sfw_product_views.xml
│   ├── sfw_sale_order_views.xml
│   ├── sfw_purchase_order_views.xml
│   ├── sfw_mfg_order_views.xml
│   ├── sfw_inventory_views.xml
│   └── sfw_dashboard_views.xml
├── data/
│   └── sfw_groups.xml             # Role group definitions
└── tests/
    ├── test_product.py
    ├── test_sale_order.py
    ├── test_purchase_order.py
    ├── test_mfg_order.py
    ├── test_inventory.py
    ├── test_procurement.py
    ├── test_rbac.py
    ├── test_security.py           # Auth, HTTPS, session handling
    └── test_properties.py         # Property-based tests (Hypothesis)
```

### State Machines

**Sales Order**
```
Draft ──confirm──► Confirmed ──partial delivery──► Partially_Delivered ──full delivery──► Fully_Delivered
  │                    │                                                                        ▲
  │                    └──────────────────full delivery (direct)──────────────────────────────┘
  └──cancel──► Cancelled     Confirmed ──cancel──► Cancelled
```

**Purchase Order**
```
Draft ──confirm──► Confirmed ──partial receipt──► Partially_Received ──full receipt──► Fully_Received
  └──cancel──► Cancelled     Confirmed ──cancel──► Cancelled
```

**Manufacturing Order**
```
Draft ──confirm──► Confirmed ──start──► In_Progress ──(all WOs done)──► Completed
  └──cancel──► Cancelled    Confirmed ──cancel──► Cancelled
  [In_Progress cannot be cancelled]
```

**Work Order**
```
Pending ──start──► In_Progress ──complete──► Completed
```

---

## 4. Backend Design

### Core Design Decisions

#### 1. Single Odoo Addon (Monorepo Pattern)
All modules live in one Python package. This allows cross-model database transactions without
any inter-service RPC calls. Consistency is guaranteed at the PostgreSQL transaction boundary,
not via eventual consistency or compensating transactions.

**Why:** Odoo's ORM transaction model is designed for this. Splitting into micro-addons would
introduce distributed transaction complexity with no benefit at this scale.

#### 2. ORM-Layer Business Rule Enforcement
Every validation — quantity guards, status transitions, immutability checks — lives in the
Python model layer using `@api.constrains` and method overrides. Rules apply identically
whether the request arrives via the UI, JSON-RPC, or XML-RPC.

**Why:** UI-only validation is trivially bypassed via direct API calls. ORM enforcement is the
only way to make rules truly non-bypassable.

#### 3. `Free_To_Use_Qty` as a Stored Computed Field
`free_to_use_qty = on_hand_qty - reserved_qty` is stored in the database with `store=True`
and recomputed within the same transaction on every change to either source field.

**Why:** Storing it enables fast SQL WHERE clauses and dashboard aggregations. Without storing
it, every availability check would require a runtime subtraction in Python — fine for one
record, expensive for batch list queries over 10,000 rows.

#### 4. Procurement Automation as Synchronous In-Transaction Service
The `evaluate_and_replenish()` service runs inside the SO confirmation transaction. If it
creates a Draft PO or MO, that record is committed atomically with the SO confirmation.

**Why:** Asynchronous procurement (e.g., via a queue/cron) would create a window where the SO
is confirmed but no replenishment has been triggered — a silent failure mode unacceptable in
a production ERP.

#### 5. Append-Only Immutability via Method Override
Both `sfw.stock.ledger` and `sfw.audit.log` override `write()` and `unlink()` to unconditionally
raise `UserError`. No code path — not even Admin — can modify or delete these records.

**Why:** Audit trails and stock ledgers derive their value from being tamper-proof. Making
immutability a Python-level invariant (not just a permission) means it cannot be accidentally
removed by a future permission change.

#### 6. `SELECT FOR UPDATE` on Inventory Mutations
Every operation that mutates `on_hand_qty` or `reserved_qty` acquires a row-level lock on
the product row before reading the current value.

**Why:** Without this, two concurrent SO confirmations for the same product could both read
the same `free_to_use_qty`, both decide stock is sufficient, and both reserve it — creating
a negative free stock situation (classic TOCTOU race condition).

#### 7. Procurement No-Op Fast Path
`evaluate_and_replenish()` returns immediately with no DB writes when `shortage_qty <= 0`.

**Why:** SO confirmation should not pay any overhead for lines that are fully covered by
existing stock. This keeps the happy-path confirmation time well within the 2-second SLA.

### Component Interfaces

#### `sfw.product` — Product Catalog
```python
# Key method signatures
def write(self, vals) -> bool
    # Triggers: _recompute_free_to_use_qty(), _log_price_change_audit()

def action_archive(self) -> None
    # Guard: raises ValidationError if reserved_qty > 0

def _recompute_free_to_use_qty(self) -> None
    # Sets free_to_use_qty = on_hand_qty - reserved_qty
    # Raises ValidationError if result < 0

@api.constrains('ref_code')
def _check_unique_ref_code(self)
    # Rejects duplicate codes across active + archived products

@api.constrains('procurement_type', 'procure_on_demand', 'vendor_id', 'bom_id')
def _check_procurement_config(self)
    # Validates completeness of procurement configuration
```

#### `sfw.sale.order` — Sales Order Lifecycle
```python
def action_confirm(self) -> None
    # Draft → Confirmed
    # Reserves stock, triggers procurement automation

def action_deliver(self, delivery_lines: list[dict]) -> None
    # Records partial/full delivery
    # Validates no over-delivery; writes Stock_Ledger entries

def action_cancel(self) -> None
    # Releases reservations; rejects if Partially/Fully Delivered
```

#### `sfw.procurement` — Procurement Automation Service
```python
def evaluate_and_replenish(self, so_line, shortage_qty: float) -> dict:
    """
    Returns:
      {'action': 'po_created'|'mo_created'|'warning_logged'|'no_action',
       'record_id': int|None}

    Decision tree:
      shortage_qty <= 0          → no_action (zero DB writes)
      procure_on_demand == False → warning_logged (audit entry only)
      procurement_type == Purchase, vendor exists  → Draft PO created
      procurement_type == Mfg,    bom exists       → Draft MO created
      misconfiguration           → audit entry, SO confirmation continues
    """
```

#### `sfw.dashboard` — Business KPI Engine
```python
def action_get_dashboard_data(self) -> dict:
    """
    Returns 6 KPI values + computed_at timestamp.
    All queries run in parallel via ThreadPoolExecutor(max_workers=6).
    3-second wall-clock timeout per tile.
    Failing tiles return {'error': True} without crashing the page.
    """
```

---

## 5. Data Models & Schema

### Entity-Relationship Overview

```
sfw.product ◄──────────────── sfw.bom (product_id)
     │                              │
     │ vendor_id                    │ line_ids
     ▼                              ▼
res.partner              sfw.bom.line (component_id → sfw.product)
                         sfw.bom.operation (work_center_id → sfw.work.center)

sfw.sale.order ──────────► sfw.sale.order.line (product_id → sfw.product)
      │ origin_so_id ◄──── sfw.purchase.order
      │ origin_so_id ◄──── sfw.mfg.order ──► sfw.mfg.component.line
                                    │
                                    └──► sfw.work.order (work_center_id → sfw.work.center)

sfw.stock.ledger (product_id → sfw.product)   [APPEND-ONLY]
sfw.audit.log                                 [APPEND-ONLY]
```

### Complete Field Reference

#### `sfw.product`
| Field | Type | Constraint |
|-------|------|-----------|
| `ref_code` | Char | unique (active+archived), required |
| `name` | Char | required, non-empty |
| `description` | Text | optional |
| `uom_id` | Many2one(uom.uom) | required |
| `sales_price` | Float | ≥ 0 |
| `cost_price` | Float | ≥ 0 |
| `category_id` | Many2one(product.category) | required |
| `active` | Boolean | default True |
| `on_hand_qty` | Float | ≥ 0, default 0 |
| `reserved_qty` | Float | ≥ 0, default 0 |
| `free_to_use_qty` | Float | stored computed; ≥ 0 enforced |
| `procure_on_demand` | Boolean | default False |
| `procurement_type` | Selection[Purchase, Manufacturing] | required if procure_on_demand |
| `vendor_id` | Many2one(res.partner) | required if Purchase + procure_on_demand |
| `bom_id` | Many2one(sfw.bom) | required if Manufacturing + procure_on_demand |
**DB Indexes:** `ref_code` (unique btree), `active` (btree)

#### `sfw.bom` / `sfw.bom.line` / `sfw.bom.operation`
| Field | Type | Constraint |
|-------|------|-----------|
| `product_id` | Many2one(sfw.product) | required |
| `version` | Char | unique per product (active+archived) |
| `effective_date` | Date | required |
| `active` | Boolean | default True |
| `line_ids` | One2many(sfw.bom.line) | min 1 |
| `operation_ids` | One2many(sfw.bom.operation) | optional |
| *(line)* `component_id` | Many2one(sfw.product) | required |
| *(line)* `qty_per_unit` | Float | > 0 |
| *(op)* `work_center_id` | Many2one(sfw.work.center) | required |
| *(op)* `duration_minutes` | Float | > 0 |

#### `sfw.sale.order` / `sfw.sale.order.line`
| Field | Type | Constraint |
|-------|------|-----------|
| `so_number` | Char | auto-generated, unique |
| `customer_name` | Char | required |
| `order_date` | Date | system-set, non-editable |
| `status` | Selection | Draft/Confirmed/Partially_Delivered/Fully_Delivered/Cancelled |
| *(line)* `ordered_qty` | Float | > 0 |
| *(line)* `delivered_qty` | Float | ≥ 0; never > ordered_qty |
| *(line)* `unit_price` | Float | ≥ 0 |
**DB Indexes:** `status`, `order_date`

#### `sfw.purchase.order` / `sfw.purchase.order.line`
| Field | Type | Constraint |
|-------|------|-----------|
| `po_number` | Char | auto-generated, unique |
| `vendor_id` | Many2one(res.partner) | required |
| `status` | Selection | Draft/Confirmed/Partially_Received/Fully_Received/Cancelled |
| `origin_so_id` | Many2one(sfw.sale.order) | optional |
| *(line)* `ordered_qty` | Float | > 0 |
| *(line)* `received_qty` | Float | ≥ 0; accumulated; never > ordered_qty |
**DB Indexes:** `status`, `vendor_id`

#### `sfw.mfg.order`
| Field | Type | Constraint |
|-------|------|-----------|
| `mo_number` | Char | auto-generated, unique |
| `product_id` | Many2one(sfw.product) | required |
| `produce_qty` | Float | > 0 |
| `bom_id` | Many2one(sfw.bom) | required; must be active at creation |
| `status` | Selection | Draft/Confirmed/In_Progress/Completed/Cancelled |
| `origin_so_id` | Many2one(sfw.sale.order) | optional |
**DB Indexes:** `status`, `product_id`

#### `sfw.work.order`
| Field | Type | Constraint |
|-------|------|-----------|
| `mo_id` | Many2one(sfw.mfg.order) | required |
| `work_center_id` | Many2one(sfw.work.center) | required |
| `planned_duration` | Float | > 0 (minutes) |
| `actual_duration` | Float | computed on completion: (end−start) in minutes |
| `start_timestamp` | Datetime | null until started |
| `end_timestamp` | Datetime | null until completed |
| `status` | Selection | Pending/In_Progress/Completed |

#### `sfw.stock.ledger` — Append-Only
| Field | Type | Constraint |
|-------|------|-----------|
| `product_id` | Many2one(sfw.product) | required |
| `movement_type` | Selection | Sale/Purchase_Receipt/Manufacturing_Consumption/Manufacturing_Production/Manual_Adjustment |
| `quantity` | Float | positive=inbound, negative=outbound |
| `reference_doc` | Char | SO/PO/MO number; null for Manual_Adjustment |
| `reason` | Text | required + ≤ 500 chars for Manual_Adjustment |
| `create_date` | Datetime | system UTC, non-editable |
| `create_uid` | Many2one(res.users) | system-set |
**DB Indexes:** `product_id`, `movement_type`, `create_date`

#### `sfw.audit.log` — Append-Only
| Field | Type | Constraint |
|-------|------|-----------|
| `entity_type` | Selection | product/sale_order/purchase_order/mfg_order/work_order/user_role/auth |
| `entity_id` | Integer | ID of affected record |
| `change_type` | Selection | status_transition/quantity_change/price_change/procurement_event/role_assignment/auth_failure |
| `value_before` | Text | JSON-serialized; nullable |
| `value_after` | Text | JSON-serialized; nullable |
| `user_id` | Many2one(res.users) | system-set; null for auth_failure |
| `username_attempted` | Char | auth_failure only; **password never stored** |
| `create_date` | Datetime | system UTC, non-editable |
**DB Indexes:** `entity_type`, `entity_id`, `change_type`, `create_date`, `user_id`
**Query limits:** max 1,000 records/response; cursor pagination; max 12-month timestamp range

---

## 6. API Design

The system exposes no custom REST API. All client-server communication uses Odoo's built-in
**JSON-RPC 2.0** and **XML-RPC** protocols over HTTPS. This is a deliberate design choice —
see [§11 Evaluated but Not Used](#11-evaluated-but-not-used) for why a custom REST API was
rejected.

### JSON-RPC Endpoint Pattern

All calls go to `/web/dataset/call_kw` with this payload structure:

```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "model": "sfw.sale.order",
    "method": "action_confirm",
    "args": [[<record_id>]],
    "kwargs": {}
  }
}
```

### Key Business Action Endpoints

| Action | Model | Method | Description |
|--------|-------|--------|-------------|
| Confirm SO | `sfw.sale.order` | `action_confirm` | Draft → Confirmed + stock reservation + procurement |
| Record Delivery | `sfw.sale.order` | `action_deliver` | Partial/full delivery + stock deduction |
| Cancel SO | `sfw.sale.order` | `action_cancel` | Release reservations → Cancelled |
| Confirm PO | `sfw.purchase.order` | `action_confirm` | Draft → Confirmed |
| Receive Goods | `sfw.purchase.order` | `action_receive` | Goods receipt + stock increase |
| Confirm MO | `sfw.mfg.order` | `action_confirm` | Component availability check + reservation |
| Start MO | `sfw.mfg.order` | `action_start` | Create Work Orders → In_Progress |
| Complete MO | `sfw.mfg.order` | `action_complete` | Stock update + ledger entries |
| Start Work Order | `sfw.work.order` | `action_start` | Pending → In_Progress + timestamp |
| Complete Work Order | `sfw.work.order` | `action_complete` | → Completed + duration computation |
| Manual Stock Adj. | `sfw.stock.ledger` | `create` | Inventory_Manager only; reason required |
| Dashboard KPIs | `sfw.dashboard` | `action_get_dashboard_data` | Returns 6 KPIs + timestamp |

### Response Shape (Dashboard)

```json
{
  "total_so": 142,
  "pending_deliveries": 23,
  "active_manufacturing_orders": 8,
  "delayed_orders": 4,
  "total_po": 67,
  "partial_receipts": 5,
  "computed_at": "2026-06-13T10:42:00Z"
}
```

### Error Response Shape

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": 200,
    "message": "Odoo Server Error",
    "data": {
      "name": "odoo.exceptions.ValidationError",
      "message": "Insufficient stock for component Wood. Required: 50.0, Available: 30.0."
    }
  }
}
```

---

## 7. Security Architecture

Security is the deepest layer of this system. Every decision was made with the assumption
that the UI can be bypassed and any API endpoint can be called directly.

### 7.1 Authentication

**Mechanism:** Odoo's built-in session-based authentication (`res.users`, `ir.http`).

- Sessions are managed server-side with secure HTTP-only cookies
- Session tokens are opaque random strings; they carry no user data that can be forged
- Expired or invalid session → HTTP 401 + session cleared + redirect to login
- **Password storage:** bcrypt via Odoo's `_crypt_context` (12 rounds minimum). Plaintext
  passwords are never stored, logged, transmitted, or returned — anywhere in the stack
- **Auth failure logging:** Every failed login creates an immutable `sfw.audit.log` entry
  recording the attempted username and UTC timestamp. The attempted password is never recorded
  in any form, including hashed form

### 7.2 Transport Security (HTTPS)

- All client-server communication is HTTPS-only in production
- Plain HTTP connections are rejected before any authentication credentials are processed
- Enforced via Odoo server configuration with `--proxy-mode` and nginx/reverse proxy TLS
  termination
- HSTS headers recommended in production nginx config

### 7.3 Role-Based Access Control (RBAC)

Six mutually exclusive roles, each enforced at two independent layers:

**Layer 1 — `ir.model.access.csv`:** Table-level CRUD permissions
**Layer 2 — `ir.rule.xml`:** Record-level domain filters

```
Role              │ Product │ BoM │ SO  │ PO  │ MO/WO │ Ledger      │ Audit Log   │ Users │ Dashboard
──────────────────┼─────────┼─────┼─────┼─────┼───────┼─────────────┼─────────────┼───────┼──────────
Admin             │   RW    │ RW  │ RW  │ RW  │  RW   │ R           │ R (all)     │ RW    │ R
Sales_User        │   R     │  —  │ RW  │  —  │   —   │ —           │ —           │  —    │ —
Purchase_User     │   R     │  —  │  —  │ RW  │   —   │ —           │ —           │  —    │ —
Manufacturing_User│   R     │  R  │  —  │  —  │  RW   │ —           │ —           │  —    │ —
Inventory_Manager │   R     │  —  │  R  │  R  │   R   │ R+ManualAdj │ —           │  —    │ —
Business_Owner    │   RW    │  R  │  R  │  R  │   R   │ R           │ R (filtered)│  —    │ R
```

**Exactly-one-role invariant:** A `@api.constrains('groups_id')` on `res.users` raises
`ValidationError` if any user has zero or more than one SFW role assigned. This is enforced
at the ORM layer — it applies to every user creation/modification regardless of how it arrives.

### 7.4 Audit Log — Filtered Read for Business_Owner

Business_Owner reads the audit log through an `ir.rule` domain filter:
```python
[('change_type', 'in', ['status_transition', 'quantity_change'])]
```
Records of type `price_change`, `procurement_event`, `role_assignment`, and `auth_failure`
are silently omitted — the Business_Owner sees an empty result for those types, not an error.
This prevents information leakage about system internals while giving business visibility.

### 7.5 SQL Injection Prevention

**Zero string interpolation policy.** All raw SQL uses parameterized execution:

```python
# CORRECT — always
self.env.cr.execute(
    "SELECT COUNT(*) FROM sfw_sale_order WHERE status IN %s",
    (('confirmed', 'partially_delivered'),)
)

# FORBIDDEN — never in this codebase
self.env.cr.execute(f"SELECT ... WHERE status = '{user_input}'")  # SQL injection vector
```

This applies to every raw SQL query in the codebase, including the dashboard KPI queries.
Odoo's ORM domain syntax is used for all standard record queries, which parameterizes
automatically.

### 7.6 Concurrency Safety — `SELECT FOR UPDATE`

All inventory mutations acquire a pessimistic row-level lock before reading the current
stock values:

```python
# Inside action_confirm(), action_deliver(), action_receive(), action_complete()
product = self.env['sfw.product'].browse(product_id)
product._cr.execute(
    'SELECT id FROM sfw_product WHERE id = %s FOR UPDATE NOWAIT',
    (product.id,)
)
# Now safe to read on_hand_qty / reserved_qty and compute the new values
```

`NOWAIT` means: if the lock cannot be acquired immediately, raise an error (don't deadlock).
The transaction rolls back and the user receives a retry-safe error message.

### 7.7 Data Integrity Invariants

| Invariant | Enforcement |
|-----------|------------|
| `free_to_use_qty` never negative | `_recompute_free_to_use_qty()` raises `ValidationError` if result < 0 |
| Stock ledger sum = `on_hand_qty` | `_validate_stock_integrity()` runs after every ledger write |
| Stock Ledger immutable | `write()` / `unlink()` unconditionally raise `UserError` |
| Audit Log immutable | `write()` / `unlink()` unconditionally raise `UserError` |
| Exactly one role per user | `@api.constrains('groups_id')` on `res.users` |
| No over-delivery | `action_deliver()` validates cumulative `delivered_qty ≤ ordered_qty` |
| No over-receipt | `action_receive()` validates cumulative `received_qty ≤ ordered_qty` |

### 7.8 What Was Not Done (and Why)

| Approach Considered | Decision | Reason |
|---------------------|----------|--------|
| Custom JWT authentication | Rejected | Odoo's session auth is hardened; JWT adds complexity with no benefit inside an Odoo deployment |
| IP allowlisting | Out of scope | Valid for production hardening but outside the ERP module boundary |
| Field-level encryption | Rejected | PostgreSQL's encryption-at-rest covers data files; column encryption would break ORM indexing |
| Rate limiting on auth | Deferred | Should be configured at nginx layer, not in application code |
| 2FA | Deferred | Odoo supports TOTP natively; enable via server config |

---

## 8. Scalability Design

### 8.1 Database Indexing Strategy

Every query-critical field has an explicit index:

| Table | Indexed Fields | Query Pattern |
|-------|---------------|---------------|
| `sfw_sale_order` | `status`, `order_date` | List views, dashboard, delayed order query |
| `sfw_purchase_order` | `status`, `vendor_id` | List views, vendor-filtered queries |
| `sfw_mfg_order` | `status`, `product_id` | List views, active MO count |
| `sfw_stock_ledger` | `product_id`, `movement_type`, `create_date` | Stock integrity check, ledger filter |
| `sfw_audit_log` | `entity_type`, `entity_id`, `change_type`, `create_date`, `user_id` | Audit filter queries |
| `sfw_product` | `ref_code` (unique), `active` | Product lookup, uniqueness check |

**Target SLA:** All list views return < 2 seconds at 10,000 records per model.

### 8.2 Stored Computed Fields

`free_to_use_qty` is stored rather than computed at query time. This allows:

```sql
-- Efficient: uses stored value
SELECT id, name, free_to_use_qty FROM sfw_product WHERE free_to_use_qty < 10;

-- What it avoids (expensive at scale):
SELECT id, name, (on_hand_qty - reserved_qty) AS ftq FROM sfw_product WHERE (on_hand_qty - reserved_qty) < 10;
-- The second form cannot use an index on the expression without a partial index.
```

### 8.3 Parallel Dashboard Queries

The six dashboard KPI queries run in parallel:

```python
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
    futures = {name: executor.submit(run_query, q, p) for name, q, p in queries}
    results = {}
    for name, future in futures.items():
        try:
            results[name] = future.result(timeout=3.0)
        except concurrent.futures.TimeoutError:
            results[name] = {'error': True, 'value': None}
```

Sequential execution would take up to 3s × 6 = 18s in the worst case. Parallel execution
brings this to 3s maximum — matching the dashboard SLA.

### 8.4 Concurrency at 50 Simultaneous Users

- `SELECT FOR UPDATE NOWAIT` on product rows prevents double-reservation under concurrent SO confirmations
- Odoo's worker-based process model (gunicorn workers) handles concurrent requests at the
  process level — no shared mutable state between workers
- PostgreSQL connection pooling via `pgbouncer` (recommended for production) handles 50+
  concurrent DB connections efficiently
- Target: < 2s per form operation at 50 concurrent users

### 8.5 Non-Fatal Procurement Automation

Procurement automation failures (misconfigured products) do not block SO confirmation.
The failure is logged to the audit trail and the SO confirms successfully. This prevents
one misconfigured product from making the entire sales flow unavailable.

### 8.6 Horizontal Scalability Path

The current design is optimized for a single Odoo instance + single PostgreSQL instance,
which handles the expected load. The path to horizontal scaling if needed:

1. **Read replicas:** Odoo supports read-only cursor routing for list/search operations
2. **Worker scaling:** Increase Odoo gunicorn worker count; each is independent
3. **Database scaling:** PostgreSQL streaming replication for read scaling; Citus for
   partition-based write scaling if the ledger table grows very large
4. **Dashboard caching:** The 6 KPI values can be cached for 30–60 seconds in
   `ir.config_parameter` or Redis without user-visible staleness

---

## 9. Time Complexity Analysis

### Core Operations

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Product lookup by `ref_code` | O(log n) | B-tree index on `ref_code` |
| SO/PO/MO list view (paginated) | O(log n + k) | Index on `status`; k = page size (typically 80) |
| `free_to_use_qty` read | O(1) | Stored field; direct column read |
| SO confirmation (n lines) | O(n × log p) | n = SO lines; p = products; each product uses indexed lookup + lock |
| Procurement automation (n lines) | O(n) | One `evaluate_and_replenish()` call per SO line; each is O(1) amortized |
| Stock integrity check | O(m) | m = ledger entries for one product; full SUM aggregate; mitigated by `product_id` index |
| Dashboard KPI queries | O(log n) each | All 6 use indexed WHERE clauses; run in parallel |
| Audit log filtered read | O(log a + k) | Compound index on `(entity_type, change_type, create_date)`; k = result size |
| BoM active version lookup | O(log b) | Index on `product_id`; sorted by `effective_date`, `version` |
| Work Order completion + MO check | O(w) | w = work orders in MO; check if all completed |

### Bottleneck Analysis

**SO confirmation** is the most complex operation. For a SO with n lines:
1. Lock n product rows: O(n × log p)
2. Recompute `free_to_use_qty` for n products: O(n)
3. Run procurement automation for up to n lines: O(n)
4. Write n stock ledger entries: O(n × log m) where m = existing ledger rows for each product
5. Write n+ audit log entries: O(n × log a)

**Total:** O(n × log(max(p, m, a)))

At n=50 SO lines, p=10,000 products, m=100,000 ledger entries per product:
- All indexed lookups complete in microseconds per row
- Entire operation stays well within 5-second SLA
- Bottleneck is typically network round-trip + Odoo ORM Python overhead, not SQL

---

## 10. Tools & Technology Stack

### Core Stack

| Layer | Technology | Version | Why Chosen |
|-------|-----------|---------|-----------|
| **Framework** | Odoo | 16/17 CE | Provides ORM, security layer, view system, RPC out of the box; avoids building auth, permissions, and UI from scratch |
| **Language** | Python | 3.10+ | Odoo's native language; mature ecosystem; excellent DB drivers |
| **Database** | PostgreSQL | 14+ | ACID transactions, row-level locking (`SELECT FOR UPDATE`), robust indexing, JSON field support |
| **ORM** | Odoo ORM | Built-in | Parameterized queries by default; integrates with Odoo's security layer; handles migrations |
| **Frontend** | Odoo XML Views + OWL | Built-in | Eliminates need for a separate frontend framework; consistent with Odoo patterns |
| **Transport** | JSON-RPC 2.0 over HTTPS | Built-in | Standard Odoo API; battle-tested; no custom API layer needed |

### Testing

| Tool | Purpose |
|------|---------|
| `odoo.tests.TransactionCase` | Unit + integration tests; each test runs in a DB transaction that rolls back after the test |
| `odoo.tests.SavepointCase` | Tests requiring multiple savepoints within one transaction |
| [Hypothesis](https://hypothesis.readthedocs.io/) | Property-based testing; generates 100+ random inputs per property |
| Performance test suite (custom) | Loads 10,000 records per model; measures SLA compliance |

### Infrastructure (Recommended Production Stack)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Reverse proxy / TLS | nginx | HTTPS termination, HSTS, connection limits |
| Connection pooling | pgbouncer | Manages PostgreSQL connection pool for 50+ concurrent users |
| Process manager | gunicorn (via Odoo) | Multiple worker processes for concurrent request handling |
| OS | Ubuntu 22.04 LTS | Stable, well-supported for Odoo deployments |

---

## 11. Evaluated but Not Used

These technologies and patterns were explicitly considered and rejected. Understanding why
they were not used is as important as understanding what was chosen.

### Custom REST API (FastAPI / Flask)

**Considered:** Building a separate REST API layer using FastAPI or Flask, with Odoo as only
the ORM backend.

**Rejected because:**
- Odoo's JSON-RPC already provides a complete, HTTPS-secured, authenticated API. Building
  a parallel REST layer would duplicate the authentication and permission logic — two places
  for security bugs to live.
- Odoo's ORM-layer `@api.constrains` would still need to be the enforcement point, making
  the REST layer a pass-through with overhead but no added correctness.
- For an internal ERP with known clients (Odoo web client), REST adds no interoperability value.

### Message Queues (Celery / RabbitMQ / Redis Queue)

**Considered:** Asynchronous procurement automation — confirm the SO, then trigger procurement
via a background task queue.

**Rejected because:**
- Asynchronous procurement creates a consistency gap: the SO is confirmed, but the Draft PO/MO
  may not exist yet. If the worker fails, the replenishment is silently lost.
- The synchronous in-transaction approach guarantees that procurement either happens atomically
  with the SO confirmation or not at all — no partial states.
- Procurement automation completes within the 5-second SLA without async processing.

### Redis / Memcached for Caching

**Considered:** Caching `free_to_use_qty` and dashboard KPIs in Redis.

**Rejected because:**
- `free_to_use_qty` is a stored computed field in PostgreSQL, already O(1) to read. Caching
  it in Redis would add a consistency problem: a Redis value and a PostgreSQL value that can
  diverge under concurrent writes.
- Dashboard KPIs are already computed in parallel in < 3 seconds. Caching is the correct
  scaling step if this becomes a bottleneck, but it is premature at the current scale.

### Django / SQLAlchemy ORM

**Considered:** Building on Django + SQLAlchemy instead of Odoo.

**Rejected because:**
- Odoo provides RBAC, view generation, authentication, migrations, and an API layer out of
  the box. Replicating these in Django for an ERP module would have consumed the entire
  hackathon timeline.
- The customer (Shiv Furniture Works) benefits from the existing Odoo ecosystem (accounting,
  HR, etc.) that can be activated later without rebuilding the data layer.

### JWT Authentication

**Considered:** Replacing Odoo's session auth with stateless JWT tokens.

**Rejected because:**
- Odoo's session-based auth is hardened and well-tested. JWT adds complexity (token revocation
  problem, refresh token management) with no benefit inside a single-origin Odoo deployment.
- JWT token revocation is non-trivial — a compromised token cannot be invalidated without
  a server-side blacklist, which re-introduces statefulness anyway.

### Event Sourcing for Inventory

**Considered:** Treating the Stock Ledger as an event source and deriving `on_hand_qty`
by replaying events at read time (pure event sourcing).

**Rejected because:**
- Replaying an unbounded event log on every stock read is O(m) per product. With m = 100,000
  ledger entries, this becomes the primary bottleneck.
- The hybrid approach (stored `on_hand_qty` + append-only ledger + integrity check) gives
  the auditability benefits of event sourcing with O(1) read performance.

### Microservices Architecture

**Considered:** Splitting Sales, Purchase, Manufacturing, and Inventory into separate services
with an API gateway.

**Rejected because:**
- Cross-service transactions (SO confirmation triggering stock reservation + procurement creation)
  would require distributed transaction protocols (2PC/Saga). These add significant complexity
  and failure modes for a system that needs atomic consistency.
- At Shiv Furniture Works' scale, a monolithic Odoo addon is faster to build, easier to test,
  and simpler to operate.

---

## 12. Testing Strategy

### Dual-Layer Testing

Every behavioral guarantee in this system is tested at two levels:

1. **Unit/Integration tests** — specific examples covering happy paths, edge cases, and RBAC
2. **Property-based tests** — Hypothesis generates 100+ random inputs to verify universal
   invariants hold across the entire input space

### Property-Based Tests (16 Properties)

```python
# Example property test — Free_To_Use_Qty invariant
@settings(max_examples=100)
@given(
    on_hand=st.floats(min_value=0, max_value=1e6),
    reserved=st.floats(min_value=0, max_value=1e6),
)
def test_free_to_use_invariant(self, on_hand, reserved):
    # Feature: mini-erp-demand-to-delivery, Property 1
    product = self.env['sfw.product'].create({...})
    product.write({'on_hand_qty': on_hand, 'reserved_qty': reserved})
    if reserved <= on_hand:
        self.assertEqual(product.free_to_use_qty, on_hand - reserved)
    else:
        # Write should have been rejected
        self.assertGreaterEqual(product.free_to_use_qty, 0)
```

Full property test matrix:

| Test | Property Verified |
|------|-----------------|
| `test_free_to_use_invariant` | `free_to_use_qty` always = `on_hand - reserved`, never negative |
| `test_stock_ledger_integrity` | SUM(ledger.quantity) always = `on_hand_qty` |
| `test_stock_ledger_immutability` | `write()`/`unlink()` always raise `UserError` |
| `test_audit_log_immutability` | Same for audit log |
| `test_so_reservation_correctness` | `reserved_qty` increases by `min(Q, F)`; never goes negative |
| `test_delivery_qty_round_trip` | Cumulative `delivered_qty` never exceeds `ordered_qty` |
| `test_mo_component_balance` | Stock deltas match exactly on MO completion |
| `test_po_receipt_accumulation` | Cumulative `received_qty` never exceeds `ordered_qty` |
| `test_procurement_determinism` | Exactly one Draft PO created for valid shortage |
| `test_rbac_denial` | Every out-of-matrix operation is denied regardless of request origin |
| `test_bom_version_uniqueness` | Duplicate version per product always rejected |
| `test_work_order_duration` | `actual_duration` = `(end - start).total_seconds() / 60` |
| `test_exactly_one_role` | 0 or 2+ roles always rejected; exactly 1 always accepted |
| `test_business_owner_audit_filter` | Business_Owner never sees price/auth/role audit entries |
| `test_procurement_no_op_fast_path` | No shortage → zero new PO/MO records created |
| `test_auth_failure_audit_trail` | Every failed login → exactly one audit entry, no password |

### Running Tests

```bash
# Full test suite (unit + integration + property)
python odoo-bin -i shiv_furniture_erp --test-enable --stop-after-init

# Property tests only (faster during development)
cd shiv_furniture_erp
python -m pytest tests/test_properties.py -v

# Performance / SLA tests
python -m pytest tests/test_performance.py -v
```

### Performance SLA Targets

| Metric | Target | Test Method |
|--------|--------|------------|
| Form save (create/write) | < 2 seconds | 10,000 records loaded; timed CRUD |
| List view load | < 2 seconds | Paginated query with indexed filters |
| SO confirmation + procurement | < 5 seconds | End-to-end with Draft PO/MO creation |
| Dashboard render | < 3 seconds | All 6 KPIs; parallel query execution |
| Concurrent users | 50 simultaneous | `ThreadPoolExecutor` load simulation |

---

## 13. Correctness Properties

The system is formally specified with 16 machine-verifiable correctness properties. Each
is tested via property-based testing (Hypothesis, 100+ random examples per property).

| # | Property | Validates |
|---|----------|----------|
| 1 | `free_to_use_qty` always equals `on_hand_qty - reserved_qty` and is never negative | Req 1.2, 1.6, 12.6 |
| 2 | SUM of all stock ledger quantities for a product always equals its `on_hand_qty` | Req 7.4 |
| 3 | Any `write()`/`unlink()` on a stock ledger record raises an error | Req 7.2 |
| 4 | Any `write()`/`unlink()` on an audit log record raises an error | Req 10.6, 9.9 |
| 5 | SO reservation increases `reserved_qty` by `min(Q, F)`; `free_to_use_qty` never negative | Req 3.5, 3.6, 12.6 |
| 6 | Cumulative `delivered_qty` per SO line never exceeds `ordered_qty` | Req 3.7, 3.8, 12.4 |
| 7 | On MO completion: finished product stock +`produce_qty`; each component stock −`required_qty` | Req 5.7, 5.8, 5.12, 5.13 |
| 8 | Cumulative `received_qty` per PO line never exceeds `ordered_qty` | Req 4.6, 4.7, 12.5 |
| 9 | One and only one Draft PO created per shortage SO line with valid procurement config | Req 8.1, 8.2 |
| 10 | Every out-of-RBAC-matrix operation is denied regardless of request origin (UI/API/RPC) | Req 9.8, 14.2 |
| 11 | Duplicate BoM version per product always rejected | Req 2.7 |
| 12 | `actual_duration = (end_timestamp − start_timestamp)` in minutes, rounded to 2 decimal places | Req 6.5 |
| 13 | Every user account has exactly one SFW role at all times | Req 9.1, 9.10 |
| 14 | Business_Owner read of audit log never returns `price_change`, `auth_failure`, or `role_assignment` entries | Req 10.7, 10.8 |
| 15 | SO confirmation with no shortage (ordered ≤ free_to_use) triggers zero new PO/MO writes | Req 8.1, 13.6 |
| 16 | Every failed authentication creates exactly one audit log entry with username but no password | Req 14.6 |

---

## 14. Error Handling

### Validation Errors (HTTP 400 / `ValidationError`)

Raised at the ORM layer. Entire transaction rolls back. No partial state is possible.

```
"Vendor is required when Procurement Type is Purchase and Procure on Demand is enabled."
"Bill of Materials is required when Procurement Type is Manufacturing and Procure on Demand is enabled."
"A Bill of Materials must contain at least one component."
"Component quantity must be greater than zero."
"Operation duration must be greater than zero minutes."
"A BoM with this version already exists for the selected product."
"Insufficient stock for component [Name]. Required: [X], Available: [Y]."
"Cannot archive a product with reserved stock. Release all reservations first."
"Stock Ledger records are immutable and cannot be modified or deleted."
"Audit Log records are immutable."
"Stock integrity check failed. Transaction rolled back."
"A Sales Order must contain at least one product line before it can be confirmed."
"Order lines cannot be modified after the order is confirmed."
"Delivery has already started or completed. SO cannot be cancelled."
"Receipt has already started or completed. PO cannot be cancelled."
"Only a Draft Purchase Order can be confirmed."
"Manufacturing is in progress. MO cannot be cancelled."
"Only a Pending Work Order can be started."
"Work Order must be In Progress before it can be completed."
"Cannot delete a BoM that is referenced by an active Manufacturing Order."
"A role must be assigned to every user account."
"A user can only have one role assigned at a time."
"The delivered quantity cannot exceed the remaining undelivered quantity for this line."
"The received quantity cannot exceed the remaining unreceived quantity for this line."
```

### Permission Errors (HTTP 403 / `AccessError`)

Raised by `ir.model.access` rules. No data about the restricted resource is revealed.

### Concurrency Conflicts

`SELECT FOR UPDATE NOWAIT` — if a lock cannot be acquired, the transaction rolls back
immediately with a user-friendly error. No deadlocks are possible because locks are
always acquired in a consistent order (by product ID).

### Procurement Automation Failures

Non-fatal by design. SO confirmation succeeds. Audit log records the failure reason.
The Admin or Business_Owner can review and manually create the PO/MO.

### Dashboard Tile Failures

Each KPI tile has an independent 3-second timeout. A failing tile shows an error indicator.
Other tiles show their computed values. The page never crashes.

---

## 15. Setup & Installation

### Prerequisites

- Python 3.10+
- Odoo 16 or 17 Community Edition
- PostgreSQL 14+
- pip packages: `hypothesis` (for property tests)

### Installation

```bash
# 1. Clone into your Odoo addons directory
git clone <repo-url> /path/to/odoo/addons/shiv_furniture_erp

# 2. Add to Odoo addons path in odoo.conf
addons_path = /path/to/odoo/addons

# 3. Install the module
python odoo-bin -i shiv_furniture_erp -d your_database

# 4. Install test dependency
pip install hypothesis

# 5. Run the full test suite
python odoo-bin -i shiv_furniture_erp --test-enable --stop-after-init -d your_database
```

### Production Hardening Checklist

- [ ] Configure nginx with TLS (cert + key), HSTS header, HTTP → HTTPS redirect
- [ ] Set `proxy_mode = True` in `odoo.conf`
- [ ] Configure pgbouncer for connection pooling (pool_size ≥ workers × 2)
- [ ] Set Odoo worker count: `workers = (2 × CPU cores) + 1`
- [ ] Enable PostgreSQL connection encryption (`ssl = on` in `postgresql.conf`)
- [ ] Set `admin_passwd` to a strong random string in `odoo.conf`
- [ ] Configure log rotation for Odoo server logs
- [ ] Enable PostgreSQL `log_min_duration_statement = 1000` to catch slow queries

---

*Built at Odoo Hackathon × Parul University — June 2026*
