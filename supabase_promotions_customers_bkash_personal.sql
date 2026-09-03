-- ==============================================================================
-- MIGRATION: PROMOTIONS, CUSTOMERS, WISHLIST, BKASH PERSONAL & EMAIL SETTINGS
-- ==============================================================================

-- 1. EXTEND STORE_SETTINGS FOR BKASH PERSONAL & EMAIL SERVICE
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bkash_personal_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bkash_personal_number VARCHAR(50) DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bkash_personal_name VARCHAR(255) DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bkash_personal_qr_url TEXT DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS resend_api_key VARCHAR(255) DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS resend_from_email VARCHAR(255) DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS email_invoice_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS daily_digest_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS daily_digest_time VARCHAR(10) DEFAULT '20:00';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS daily_digest_email VARCHAR(255) DEFAULT '';

-- 2. CREATE CUSTOMERS TABLE (Customer accounts separated from staff)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,                 -- Links to Supabase auth.users
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    avatar_url TEXT DEFAULT '',
    address TEXT DEFAULT '',
    city_id INT DEFAULT 0,
    zone_id INT DEFAULT 0,
    area_id INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS city_id INT DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS zone_id INT DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS area_id INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- 3. CREATE WISHLISTS TABLE
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlists_customer_id ON public.wishlists(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);

-- 4. CREATE PROMOTIONS TABLE (Banners & Top Ribbons with scheduling)
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,           -- 'banner' or 'ribbon'
    title VARCHAR(255) DEFAULT '',
    message TEXT DEFAULT '',
    image_url TEXT DEFAULT '',           -- Banner image
    link_url TEXT DEFAULT '',            -- Optional CTA link
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ DEFAULT NULL,   -- NULL = indefinite until toggled off
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON public.promotions(is_active);

-- 5. CREATE PROMO_CODES TABLE (Discounts with rules & usage limits)
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    discount_type VARCHAR(50) NOT NULL,        -- 'percentage', 'fixed', 'free_shipping'
    discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    min_order_amount NUMERIC(10,2) DEFAULT 0,
    max_discount NUMERIC(10,2) DEFAULT 0,      -- 0 = no cap for percentage
    usage_limit INT DEFAULT 0,                 -- 0 = unlimited store-wide
    per_user_limit INT DEFAULT 0,              -- 0 = unlimited per customer, 1 = single-use
    usage_count INT DEFAULT 0,
    included_product_ids UUID[] DEFAULT '{}',   -- Empty = applies to all products
    excluded_product_ids UUID[] DEFAULT '{}',
    included_category_ids UUID[] DEFAULT '{}',  -- Empty = applies to all categories
    excluded_category_ids UUID[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS per_user_limit INT DEFAULT 0;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS included_category_ids UUID[] DEFAULT '{}';
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS excluded_category_ids UUID[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON public.promo_codes(is_active);

-- 6. EXTEND ORDERS TABLE FOR CUSTOMER & PROMOTION TRACKING
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_code_id UUID DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(100) DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- 7. ENABLE ROW LEVEL SECURITY (RLS) FOR NEW TABLES
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Customers RLS
DROP POLICY IF EXISTS "Allow public read customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public insert customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated manage own customer" ON public.customers;
DROP POLICY IF EXISTS "Allow admin manage all customers" ON public.customers;
CREATE POLICY "Allow public read customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated manage own customer" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow admin manage all customers" ON public.customers FOR ALL TO authenticated USING (true);

-- Wishlists RLS
DROP POLICY IF EXISTS "Allow public read wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Allow public manage wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Allow admin manage wishlists" ON public.wishlists;
CREATE POLICY "Allow public read wishlists" ON public.wishlists FOR SELECT USING (true);
CREATE POLICY "Allow public manage wishlists" ON public.wishlists FOR ALL USING (true);
CREATE POLICY "Allow admin manage wishlists" ON public.wishlists FOR ALL TO authenticated USING (true);

-- Promotions RLS
DROP POLICY IF EXISTS "Allow public read promotions" ON public.promotions;
DROP POLICY IF EXISTS "Allow admin manage promotions" ON public.promotions;
CREATE POLICY "Allow public read promotions" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Allow admin manage promotions" ON public.promotions FOR ALL TO authenticated USING (true);

-- Promo Codes RLS
DROP POLICY IF EXISTS "Allow public read promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow admin manage promo codes" ON public.promo_codes;
CREATE POLICY "Allow public read promo codes" ON public.promo_codes FOR SELECT USING (true);
CREATE POLICY "Allow admin manage promo codes" ON public.promo_codes FOR ALL TO authenticated USING (true);
