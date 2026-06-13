-- ============================================================
-- Shiv Furniture Works ERP — PostgreSQL Init Script
-- Runs once on first container start
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Trigram indexes for ILIKE search
CREATE EXTENSION IF NOT EXISTS "btree_gin";    -- GIN indexes for composite search
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- Cryptographic functions

-- ── Performance settings for this session ────────────────────
SET synchronous_commit = on;
SET checkpoint_completion_target = 0.9;

-- ── Audit log immutability — DB-level protection ─────────────
-- After Odoo creates the shiv_audit_log table, this trigger
-- prevents any UPDATE or DELETE at the PostgreSQL level.
-- This runs as a migration after module install.

-- NOTE: This function is called by a trigger created in
-- 02_audit_protection.sql which runs after Odoo module install.

CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION
        'SECURITY VIOLATION: Audit log records are immutable. '
        'Attempted % on shiv_audit_log by session user %. '
        'This event has been logged.',
        TG_OP, session_user
    USING ERRCODE = 'restrict_violation';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Stock ledger immutability ─────────────────────────────────
CREATE OR REPLACE FUNCTION prevent_stock_ledger_modification()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION
        'SECURITY VIOLATION: Stock ledger entries are immutable. '
        'Attempted % on shiv_stock_ledger.',
        TG_OP
    USING ERRCODE = 'restrict_violation';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Non-negative inventory constraint helper ──────────────────
-- Will be applied to shiv_product_stock after module install
-- via 02_constraints.sql

COMMENT ON FUNCTION prevent_audit_log_modification() IS
    'Trigger function: blocks all UPDATE/DELETE on audit log. Part of 7-year immutability guarantee.';
