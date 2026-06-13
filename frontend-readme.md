# Mini ERP Frontend README

## Overview

This document is the frontend counterpart to the backend ERP README. It defines the frontend architecture, design system, UI/UX rules, and production standards for the **Mini ERP: From Demand to Delivery** system for **Shiv Furniture Works**. The goal is to replace spreadsheet-based and paper-based operations with a centralized ERP that gives real-time visibility across Products, Sales, Purchase, Manufacturing, Bill of Materials (BoM), Inventory, Procurement, Audit Logs, and Role-Based Access.[cite:1]

The ERP revolves around **inventory movement**. Sales decrease stock, Purchase increases stock, Manufacturing consumes components and produces finished goods, and Procurement replenishes shortages. That inventory-first model should shape the frontend information architecture, screen states, interaction logic, and real-time UI behavior.[cite:1]

## Product Objective

The frontend must support the following core business outcomes and make them visible at a glance:

- Centralized inventory visibility across all modules.[cite:1]
- Real-time stock awareness using On Hand, Reserved, and Free-to-Use quantities.[cite:1]
- Support for both Make To Stock (MTS) and Make To Order (MTO) procurement flows.[cite:1]
- Automated procurement triggers from customer demand shortages.[cite:1]
- Manufacturing execution using BoMs, work orders, operations, and work centers.[cite:1]
- Role-based visibility for Admin, Sales User, Purchase User, Manufacturing User, Inventory Manager, and Business Owner.[cite:1]
- Dashboard visibility for pending deliveries, delayed orders, purchase activity, manufacturing load, and audit logs.[cite:1]

## Actual Pages Needed

These are the pages and screens the frontend should actually include so it matches the backend scope and supports the day-to-day work of each role.[cite:1]

### Public and access pages

- Login page.[cite:1]
- Forgot password page.[cite:1]
- Reset password page.[cite:1]
- Session expired and access denied states.[cite:1]

### Core application pages

- Dashboard.[cite:1]
- Products list page.[cite:1]
- Product detail page.[cite:1]
- Product create and edit page.[cite:1]
- Sales list page.[cite:1]
- Sales order detail page.[cite:1]
- Sales order create and edit page.[cite:1]
- Purchase list page.[cite:1]
- Purchase order detail page.[cite:1]
- Purchase order create and edit page.[cite:1]
- Goods receipt or receiving page.[cite:1]
- Manufacturing list page.[cite:1]
- Manufacturing order detail page.[cite:1]
- Manufacturing order create and edit page.[cite:1]
- Work order execution page.[cite:1]
- Inventory overview page.[cite:1]
- Stock ledger page.[cite:1]
- Stock movement and transfer page.[cite:1]
- Bill of Materials list page.[cite:1]
- Bill of Materials detail page.[cite:1]
- Procurement shortage queue page.[cite:1]
- Audit logs page.[cite:1]
- Reports and analytics page.[cite:1]
- Users and roles page.[cite:1]
- Settings page.[cite:1]

### Supporting screens

- Confirmation dialogs.[cite:1]
- Inline validation banners.[cite:1]
- Empty states.[cite:1]
- Loading skeletons.[cite:1]
- Notification toasts.[cite:1]
- Print or export views for operational records.[cite:1]

## Enterprise Benchmarks Followed

The frontend architecture follows patterns commonly found in modern enterprise systems:

- **SAP Fiori Object Page**: record-centric pages with grouped sections, related tables, and structured content areas for business objects.[cite:15]
- **Salesforce Lightning Quick Actions**: action-oriented modal workflows and contextual record actions for high-frequency tasks.[cite:17]
- **Tailwind Application UI patterns**: application shells, tables, forms, dialogs, sidebars, and dense workflow layouts suitable for admin products.[cite:21]
- **Odoo manufacturing and inventory views**: Kanban and status-oriented views for production flow visibility and manufacturing order tracking.[cite:2][cite:3]
- **NetSuite inventory workflow principles**: tightly linked purchasing, receiving, selling, manufacturing, fulfilling, and replenishing flows.[cite:8]

These benchmarks were chosen because the Mini ERP needs high-density tables, nested forms, transaction history, linked records, and deterministic state transitions across multiple modules.[cite:1]

## Recommended Frontend Tech Stack

### Core stack

- **React + TypeScript** for scalable, component-driven interface development.
- **Tailwind CSS** for tokenized styling, high consistency, and rapid enterprise UI implementation.[cite:21]
- **shadcn/ui** for accessible, composable primitives aligned with keyboard navigation and design token customization.
- **TanStack Table** for high-density data tables with sorting, filtering, pagination, column visibility, and row selection.
- **React Hook Form + Zod** for structured form validation and schema-safe data entry.
- **TanStack Query** for server state synchronization, cache invalidation, optimistic previews, and background refresh.

### Why this stack

This stack is recommended because the Mini ERP is not a marketing site. It is a dense transactional web application with large tables, editable records, role-sensitive navigation, and state-heavy forms. Tailwind application UI patterns map directly to ERP shells and app layouts, while React and TypeScript keep the growing set of shared business components maintainable.[cite:21][cite:1]

Real-time updates should behave as follows:

- Confirming a Sales Order immediately reserves stock and recalculates Free-to-Use quantity in the UI.[cite:1]
- If shortages exist, the system should preview or create a Purchase Order or Manufacturing Order depending on procurement configuration.[cite:1]
- Confirming a Manufacturing Order reserves components; completing it consumes component stock and produces finished goods.[cite:1]
- Receiving a Purchase Order increases On Hand stock and updates the Stock Ledger instantly.[cite:1]

## Information Architecture

### Global application shell

The recommended application shell is:

- Left sidebar navigation.
- Top utility bar.
- Breadcrumbs in page headers.
- Status tracker at the top of record forms.
- Summary cards before editable tables.
- Related documents after core form sections.
- Audit trail at the bottom of record pages.

This structure aligns with enterprise object-page patterns and supports fast orientation in multi-step workflows.[cite:15][cite:1]

### Sidebar modules

The sidebar should include:

- Dashboard
- Products
- Sales
- Purchase
- Manufacturing
- Inventory
- Audit Logs
- Settings

Modules must be hidden or disabled according to role-based access rights defined in the brief.[cite:1]

## Page And Feature Map

This section ties the actual pages to the features they should expose so the UI stays grounded in operations rather than looking like a generic admin template.[cite:1]

### Dashboard

- KPI cards for stock, orders, deliveries, purchase status, and manufacturing load.[cite:1]
- Exception tables for shortages, delays, and overdue actions.[cite:1]
- Quick actions for creating Sales Orders, Purchase Orders, and Manufacturing Orders.[cite:1]
- Audit and activity summary for recent changes.[cite:1]

### Products

- Searchable product master list.[cite:1]
- Product detail view with stock snapshot, vendor links, and BoM links.[cite:1]
- Create and edit form for product master data.[cite:1]
- Procurement settings for MTS and MTO logic.[cite:1]
- Recent stock movement history.[cite:1]

### Sales

- Sales order list with status filters.[cite:1]
- Sales order create and edit form.[cite:1]
- Customer selector and line-item editor.[cite:1]
- Live reservation preview and shortage warning.[cite:1]
- Delivery timeline and linked procurement or manufacturing actions.[cite:1]

### Purchase

- Purchase order list with supplier and receipt status.[cite:1]
- Purchase order create and edit form.[cite:1]
- Goods receipt workflow with partial receipt handling.[cite:1]
- Backorder and damaged quantity capture.[cite:1]
- Vendor performance and overdue order visibility.[cite:1]

### Manufacturing

- Manufacturing order list with status-first navigation.[cite:1]
- Manufacturing order create and edit form.[cite:1]
- Work order execution screen with step-by-step actions.[cite:1]
- Component reservation and shortage panel.[cite:1]
- Work center assignment and completion flow.[cite:1]

### Inventory

- Stock overview with On Hand, Reserved, and Free-to-Use quantities.[cite:1]
- Stock ledger with immutable movement history.[cite:1]
- Internal transfer page.[cite:1]
- Inventory adjustment page.[cite:1]
- Low-stock and overstock alerts.[cite:1]

### BoM and procurement

- Bill of Materials list and detail pages.[cite:1]
- Component structure view for nested manufacturing inputs.[cite:1]
- Replenishment queue generated from customer demand and shortages.[cite:1]
- MTS and MTO procurement decision visibility.[cite:1]

### Audit, reports, and admin

- Audit log page with searchable history.[cite:1]
- Reports page for sales, inventory, manufacturing, and purchasing trends.[cite:1]
- Users and roles page for access control management.[cite:1]
- Settings page for system-wide configuration.[cite:1]

## Design System Tokens

### Typography scale

| Token | Size | Use |
|---|---:|---|
| `text-xs` | 12px | Dense metadata, timestamps, table helpers |
| `text-sm` | 14px | Buttons, nav items, table cell text |
| `text-base` | 16px | Default body, forms, touch-friendly workflows |
| `text-lg` | 18px | Section headings, emphasized labels |
| `text-xl` | 24px | Page titles, major panel headers |
| `text-2xl` | 30px | KPI headline numbers |

Typography rules:

- Use **Inter**, **IBM Plex Sans**, or **Roboto** for interface text.
- Use a monospace font for SKU values, barcodes, serials, and ledger references.
- Use tabular numerals for quantities, lead times, and currency.
- Minimum 16px text on factory-floor and touch-first layouts.[cite:1]

### Interactive state palette

This palette is optimized for WCAG 2.1 AA and supports inventory, shortage, draft, and completion flows across tables, forms, badges, and status trackers. ERP systems rely on clearly structured surfaces and semantic highlights, so the palette uses neutral backgrounds with restrained, meaningful accents rather than decorative gradients.[cite:15][cite:21]

| Token | Color Name | HEX | Usage |
|---|---|---:|---|
| Primary | ERP Indigo | `#4F46E5` | Primary CTA, active nav, selected tabs |
| Primary Hover | Deep Indigo | `#4338CA` | Hover and pressed primary actions |
| Focus Ring | Focus Blue | `#2563EB` | Keyboard focus, scan field focus, accessibility outline |
| Draft / Neutral | Slate Gray | `#6B7280` | Draft states, neutral statuses, inactive chips |
| Draft BG | Soft Slate | `#E5E7EB` | Draft badge background |
| Success | Forest Green | `#15803D` | Fully delivered, fully received, in-stock increase |
| Success BG | Mint Tint | `#DCFCE7` | Success badge background |
| Warning | Amber Brown | `#B45309` | Delayed order, partial receipt, pending issue |
| Warning BG | Pale Amber | `#FEF3C7` | Warning badge background |
| Alert | Brick Red | `#B91C1C` | Shortage, blocked action, failed sync |
| Alert BG | Soft Red | `#FEE2E2` | Error banner and inline warning background |
| Info | Industrial Blue | `#0369A1` | Linked records, system notices, informational states |
| Info BG | Pale Sky | `#E0F2FE` | Informational chip background |
| Surface Base | App Gray | `#F8FAFC` | Global app background |
| Surface Card | White | `#FFFFFF` | Cards, forms, tables, dialogs |
| Surface Muted | Light Slate | `#F1F5F9` | Row hover, filter areas, grouped sections |
| Border | Border Gray | `#CBD5E1` | Dividers, table lines, input borders |
| Text Strong | Deep Slate | `#0F172A` | Primary text |
| Text Muted | Cool Gray | `#475569` | Secondary text, helper labels |

### Comprehensive Color & Typography Scheme Table

To ensure accessibility under WCAG 2.1 AA and align with Odoo-inspired enterprise patterns, the UI requires a cohesive visual system tailored to **Shiv Furniture Works**. This palette blends wood and industrial tones with standard ERP semantic status indicators.[cite:2][cite:3][cite:1]

| UI Element | Color Name | HEX Code | Usage Rules & Context |
|---|---|---:|---|
| Primary Brand | Odoo Purple / Wood Brown | `#714B67` / `#5C4033` | Used for primary actions, active sidebar links, top navigation headers, and selected module tabs |
| Surface / Background | Off-White | `#F9F9F9` | Used for application background, dashboard canvas, and low-fatigue work surfaces |
| Card / Form Base | Pure White | `#FFFFFF` | Used for cards, data grids, forms, drawers, and detailed breakdown panels |
| Success / Positive | Forest Green | `#2E7D32` | Indicates fully delivered, fully received, successful completion, or stock increase |
| Warning / Alert | Amber | `#F57F17` | Highlights delayed orders, partial receipts, overdue tasks, and pending approvals |
| Danger / Error | Brick Red | `#D32F2F` | Used for stock shortages, cancelled orders, permission denial, or critical failures |
| Neutral / Draft | Industrial Gray | `#6B7280` | Used for draft records, inactive states, placeholders, and muted metadata |
| Inventory Info | Steel Blue | `#2563EB` | Used for linked records, stock info chips, sync indicators, and focus rings |
| Border / Divider | Soft Gray | `#D1D5DB` | Used for table borders, input outlines, and panel separators |
| Typography Base | Inter / Roboto | N/A | Clean sans-serif type for dense ERP UI and long-duration readability |
| Data Typography | Monospace | N/A | Used for SKUs, barcodes, stock references, ledger rows, and machine-readable identifiers |

## State Model and Real-Time Behavior

The ERP frontend must expose deterministic business states clearly. The workflow states described in the business brief should be shown as structured trackers on each object page.[cite:1]

### Sales Order states

- Draft
- Confirmed
- Partially Delivered
- Fully Delivered
- Cancelled

### Purchase Order states

- Draft
- Confirmed
- Partially Received
- Fully Received

### Manufacturing Order states

- Draft
- Confirmed
- In Progress
- Completed
- Cancelled

### Real-time UI behaviors

- Stock counters must show On Hand, Reserved, and Free-to-Use near the action area.[cite:1]
- Sales Order quantity edits should immediately show reservation impact and shortage preview.[cite:1]
- Procurement recommendation should preview the downstream path: direct fulfillment, Purchase Order creation, or Manufacturing Order creation.[cite:1]
- Manufacturing completion must trigger visible stock movement feedback for both consumed components and produced finished goods.[cite:1]
- Purchase receipt must visibly increase stock and log movement in ledger-linked UI.[cite:1]

## Pillars of Enterprise Frontend Design

### 1. Consistency

Every module should follow the same interaction grammar:

- Search bar at top-left.
- Primary action at top-right.
- Filters above tables.
- Status badges in the same location across records.
- Related-record chips placed below summaries.
- Audit logs at the bottom of detail views.

Consistency reduces cognitive switching between Products, Sales, Purchase, Manufacturing, and Inventory.[cite:1]

### 2. Durability

The frontend must work across office desktops and rugged manufacturing devices.

Required durability rules:

- Minimum 44x44px tap targets.[cite:1]
- Strong color contrast in bright and dim environments.[cite:1]
- Button lock after submit to prevent duplicate mutation actions.
- Sticky action bars in manufacturing workflows.
- Skeleton screens instead of unstructured spinners.
- Offline queue indicators and reconnect-safe mutation states.

### 3. Active Responsiveness and Validation

All critical validation must occur inline and before commit.

Examples:

- If Reserved Quantity exceeds Free-to-Use, show an immediate row-level alert.
- If stock shortage occurs, show “Shortage: X units” and explain whether Purchase or Manufacturing will resolve it.[cite:1]
- If a user lacks access, display an explicit permission lock state rather than a broken screen.[cite:1]
- If bulk actions are running, show progress banners with processed counts and retryable failures.

## Module-by-Module Frontend Requirements

### Dashboard

The dashboard should prioritize operational action, not vanity metrics. It must surface pending deliveries, delayed orders, open manufacturing work, partial receipts, and audit events in real time.[cite:1]

Recommended layout:

- KPI cards on top.
- Exception tables in the middle.
- Audit stream on the side.
- Trend charts at the bottom.

### Products

Products are the inventory master records and must combine master data with stock context.[cite:1]

Required components:

- Product form.
- Procurement settings.
- BoM linkage.
- Vendor linkage.
- Stock snapshot.
- Recent movements.
- Attachment area.
- Duplicate SKU validation.

### Sales

Sales is the demand entry module. It must preview stock effects before confirmation.[cite:1]

Required components:

- Customer section.
- Editable line-item table.
- Per-line live stock chips.
- Reservation impact preview.
- Procurement preview.
- Sticky totals footer.
- Fulfillment timeline.
- Related PO/MO chips.

### Purchase

Purchase must support replenishment speed and receipt accuracy.[cite:1]

Required components:

- Vendor panel.
- Item table.
- Receiving action section.
- Partial receipt handling.
- Backorder creation.
- Damaged quantity capture.
- Overdue banners.
- Receiving log export.

### Manufacturing

Manufacturing is the highest-friction module and should be designed as an execution interface, not a basic form.[cite:1]

Required components:

- Status-first header.
- Work order step cards.
- Component reservation panel.
- Work center assignment.
- Barcode-ready inputs.
- Sticky bottom actions.
- Delay reason modal.
- Material shortage banner.
- Offline sync state.

## Production Standards Checklist

### Accessibility

- WCAG 2.1 AA contrast minimum for all core text and actions.
- Status must never rely only on color.
- Full keyboard navigation for forms, dialogs, and tables.
- Visible focus states on all interactive elements.
- Proper labels for all inputs.
- Text-specific validation messages.

### Tables and data density

- Sorting
- Filtering
- Pagination
- Column visibility
- Bulk actions
- Export support
- Saved views
- Sticky headers for long datasets

### Security and permissions

- Role-based module visibility.[cite:1]
- Read-only vs edit mode separation.
- Permission lock overlays.
- Auditability for all major state changes.[cite:1]

### Reliability

- Optimistic preview, server-confirmed final mutation.
- Conflict handling for concurrent edits.
- Offline-safe queueing for manufacturing devices.
- Background refresh for dashboard and stock counters.

## Why This Frontend Architecture Fits Shiv Furniture Works

Shiv Furniture Works is moving from spreadsheets, WhatsApp messages, manual stock registers, and paper-based manufacturing notes into a connected operational system. The frontend therefore has to reduce ambiguity, show cause-and-effect across modules, and give fast feedback for stock-sensitive actions.[cite:1]

This architecture fits that need because it keeps inventory visibility at the center of every transaction, aligns screens to real roles, hardens manufacturing UX for rough environments, and uses enterprise-proven screen patterns rather than generic dashboard styling.[cite:1][cite:15][cite:21]

## Final Implementation Principles

- Inventory truth before action.[cite:1]
- Role-based progressive disclosure.[cite:1]
- Workflow-first forms with visible state transitions.[cite:1]
- Consistent table and object-page grammar.[cite:1]
- Durable touch-friendly manufacturing interactions.[cite:1]
- Inline validation before irreversible mutations.[cite:1]
- Real-time synchronization across all inventory-affecting modules.[cite:1]
- Auditability and traceability built into every major transaction.[cite:1]
