-- ==============================================================================
-- MIGRATION: INVOICE EMAIL TOGGLE & DAILY PENDING ORDERS SUMMARY SCHEDULE
-- ==============================================================================

-- 1. Extend store_settings for customer invoice toggle and daily digest scheduling
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS email_invoice_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS daily_digest_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS daily_digest_time VARCHAR(10) DEFAULT '20:00';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS daily_digest_email VARCHAR(255) DEFAULT '';
