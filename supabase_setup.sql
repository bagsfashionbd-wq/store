-- ==============================================================================
-- COMPLETE MASTER DATABASE SETUP FOR NEW STORE DEPLOYMENTS
-- Single Clean Setup SQL (No Demo Products - Clean Slate Production Ready)
-- ==============================================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE CATEGORIES TABLE (Hierarchical with 3-tier parent_id support)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- 3. CREATE PRODUCTS TABLE (With buying_price / cost tracking)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    short_description VARCHAR(255) DEFAULT '',
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    old_price NUMERIC(10, 2) DEFAULT 0.00,
    buying_price NUMERIC(10, 2) DEFAULT 0.00, -- Internal wholesale cost (hidden from customers)
    stock INT NOT NULL DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    variations JSONB DEFAULT '{"options": []}'::JSONB,
    is_featured BOOLEAN DEFAULT FALSE,
    is_best_seller BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description VARCHAR(255) DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS buying_price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS old_price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '{"options": []}'::JSONB;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- 4. CREATE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT NULL, -- Optional user ID (guest checkout or authenticated customer)
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    shipping_address TEXT NOT NULL,
    shipping_provider VARCHAR(50) DEFAULT 'pathao', -- 'pathao', 'steadfast', or 'manual'
    city_id INT DEFAULT 0,
    zone_id INT DEFAULT 0,
    area_id INT DEFAULT 0,
    city_name VARCHAR(100) DEFAULT '',
    zone_name VARCHAR(100) DEFAULT '',
    area_name VARCHAR(100) DEFAULT '',
    delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 60.00,
    total_price NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'COD',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    order_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    payment_details JSONB DEFAULT '{}'::JSONB,
    pathao_consignment_id VARCHAR(255),
    pathao_status VARCHAR(100) DEFAULT 'pending',
    steadfast_consignment_id VARCHAR(255),
    steadfast_tracking_code VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_code_id UUID DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(100) DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS city_name VARCHAR(100) DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zone_name VARCHAR(100) DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS area_name VARCHAR(100) DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- 5. CREATE ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL,
    selected_variations JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 6. CREATE CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) DEFAULT '',
    subject VARCHAR(255) DEFAULT '',
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

-- 7. CREATE STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
    -- Store Branding
    store_name VARCHAR(255) NOT NULL DEFAULT 'My Store',
    store_tagline VARCHAR(255) DEFAULT 'Quality Products in Bangladesh',
    logo_url TEXT DEFAULT '/logo.jpeg',
    favicon_url TEXT DEFAULT '/logo.jpeg',
    watermark_enabled BOOLEAN DEFAULT FALSE,
    -- Hero Section Customizer
    hero_image_url TEXT DEFAULT '',
    hero_badge_text VARCHAR(255) DEFAULT 'Featured Store',
    hero_title VARCHAR(255) DEFAULT 'Discover Our',
    hero_subtitle VARCHAR(255) DEFAULT 'Exclusive Collection',
    hero_description TEXT DEFAULT 'Browse our curated collection with fast door-to-door delivery across Bangladesh.',
    -- Theme
    theme_color VARCHAR(50) DEFAULT 'emerald',
    -- Payment Options & bKash Credentials
    cod_enabled BOOLEAN DEFAULT TRUE,
    cod_prepay_delivery BOOLEAN DEFAULT TRUE,
    bkash_enabled BOOLEAN DEFAULT TRUE,
    bkash_api_url VARCHAR(255) DEFAULT 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    bkash_app_key VARCHAR(255) DEFAULT '',
    bkash_app_secret VARCHAR(255) DEFAULT '',
    bkash_username VARCHAR(255) DEFAULT '',
    bkash_password VARCHAR(255) DEFAULT '',
    -- Logistics & Courier Integrations
    pathao_enabled BOOLEAN DEFAULT TRUE,
    steadfast_enabled BOOLEAN DEFAULT TRUE,
    active_shipping_provider VARCHAR(50) DEFAULT 'pathao',
    pathao_api_url VARCHAR(255) DEFAULT 'https://courier-api-sandbox.pathao.com',
    pathao_client_id VARCHAR(255) DEFAULT '',
    pathao_client_secret VARCHAR(255) DEFAULT '',
    pathao_username VARCHAR(255) DEFAULT '',
    pathao_password VARCHAR(255) DEFAULT '',
    pathao_store_id VARCHAR(255) DEFAULT '',
    steadfast_api_key VARCHAR(255) DEFAULT '',
    steadfast_secret_key VARCHAR(255) DEFAULT '',
    steadfast_base_url VARCHAR(255) DEFAULT 'https://portal.steadfast.com.bd/api/v1',
    -- Flexible Shipping & Delivery Charges
    store_city_name VARCHAR(100) DEFAULT 'Dhaka',
    store_city_id INT DEFAULT 1,
    shipping_zone_1_label VARCHAR(100) DEFAULT 'Inside Dhaka',
    shipping_zone_2_label VARCHAR(100) DEFAULT 'Outside Dhaka',
    delivery_charge_inside_dhaka NUMERIC(10, 2) DEFAULT 60.00,
    delivery_charge_outside_dhaka NUMERIC(10, 2) DEFAULT 120.00,
    -- About & Contact Details
    about_enabled BOOLEAN DEFAULT TRUE,
    about_story TEXT DEFAULT '',
    contact_phone VARCHAR(50) DEFAULT '+880 1700-000000',
    contact_whatsapp VARCHAR(50) DEFAULT '',
    contact_email VARCHAR(255) DEFAULT 'support@store.com',
    contact_address TEXT DEFAULT 'Dhaka, Bangladesh',
    google_map_embed_url TEXT DEFAULT '',
    -- Social Media Links
    social_facebook TEXT DEFAULT '',
    social_instagram TEXT DEFAULT '',
    social_youtube TEXT DEFAULT '',
    social_tiktok TEXT DEFAULT '',
    social_twitter TEXT DEFAULT '',
    social_linkedin TEXT DEFAULT '',
    -- Marketing, Ads & Tracking Pixels
    meta_pixel_id VARCHAR(100) DEFAULT '',
    meta_conversions_api_token TEXT DEFAULT '',
    meta_test_event_code VARCHAR(100) DEFAULT '',
    meta_domain_verification VARCHAR(255) DEFAULT '',
    google_analytics_id VARCHAR(100) DEFAULT '',
    google_tag_manager_id VARCHAR(100) DEFAULT '',
    google_site_verification VARCHAR(255) DEFAULT '',
    tiktok_pixel_id VARCHAR(100) DEFAULT '',
    tiktok_events_api_token TEXT DEFAULT '',
    custom_head_scripts TEXT DEFAULT '',
    -- Special Collections (Featured, Best Seller, Trending)
    show_featured BOOLEAN DEFAULT TRUE,
    show_best_seller BOOLEAN DEFAULT TRUE,
    show_trending BOOLEAN DEFAULT TRUE,
    auto_best_seller BOOLEAN DEFAULT TRUE,
    auto_trending BOOLEAN DEFAULT TRUE,
    -- bKash Personal & Email Integration
    bkash_personal_enabled BOOLEAN DEFAULT FALSE,
    bkash_personal_number VARCHAR(50) DEFAULT '',
    bkash_personal_name VARCHAR(255) DEFAULT '',
    bkash_personal_qr_url TEXT DEFAULT '',
    resend_api_key VARCHAR(255) DEFAULT '',
    resend_from_email VARCHAR(255) DEFAULT '',
    email_invoice_enabled BOOLEAN DEFAULT TRUE,
    email_dispatched_enabled BOOLEAN DEFAULT TRUE,
    email_cancelled_enabled BOOLEAN DEFAULT TRUE,
    daily_digest_enabled BOOLEAN DEFAULT FALSE,
    daily_digest_time VARCHAR(10) DEFAULT '20:00',
    daily_digest_email VARCHAR(255) DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bkash_personal_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bkash_personal_number VARCHAR(50) DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bkash_personal_name VARCHAR(255) DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bkash_personal_qr_url TEXT DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS resend_api_key VARCHAR(255) DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS resend_from_email VARCHAR(255) DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS email_invoice_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS email_dispatched_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS email_cancelled_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS daily_digest_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS daily_digest_time VARCHAR(10) DEFAULT '20:00';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS daily_digest_email VARCHAR(255) DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS meta_conversions_api_token TEXT DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS meta_test_event_code VARCHAR(100) DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS meta_domain_verification VARCHAR(255) DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS google_tag_manager_id VARCHAR(100) DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS google_site_verification VARCHAR(255) DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS tiktok_events_api_token TEXT DEFAULT '';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS custom_head_scripts TEXT DEFAULT '';

-- Seed Initial Default Store Settings Row
INSERT INTO public.store_settings (
    id, store_name, store_tagline, hero_title, hero_subtitle, hero_badge_text,
    hero_description, theme_color, active_shipping_provider,
    delivery_charge_inside_dhaka, delivery_charge_outside_dhaka,
    about_enabled, about_story, contact_phone, contact_whatsapp, contact_email, contact_address
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'My Store',
    'Premium Quality Products in Bangladesh',
    'Discover Our',
    'Exclusive Collection',
    'Featured Store',
    'Browse our curated collection with fast door-to-door delivery across Bangladesh and secure checkout.',
    'emerald',
    'pathao',
    60.00,
    120.00,
    true,
    'Welcome to our store! We provide high-quality items curated with passion and attention to detail. Every product is backed by nationwide delivery and friendly support.',
    '+880 1700-000000',
    '',
    'sakib.samadhan@gmail.com',
    'Dhaka, Bangladesh'
) ON CONFLICT (id) DO NOTHING;

-- 8. CREATE STAFF MEMBERS & ROLE-BASED ACCESS CONTROL (RBAC)
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT NULL, -- Linked automatically upon login
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff', -- 'admin', 'shop_owner', 'staff'
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'suspended'
    phone VARCHAR(50) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.staff_members DROP CONSTRAINT IF EXISTS staff_members_user_id_fkey;
CREATE INDEX IF NOT EXISTS idx_staff_members_email ON public.staff_members(email);
CREATE INDEX IF NOT EXISTS idx_staff_members_user_id ON public.staff_members(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_role ON public.staff_members(role);

-- 9. CREATE AUTH ADMIN USER & STAFF RECORD (sakib.samadhan@gmail.com / Sakib@9700)
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    BEGIN
        -- Check if user already exists in auth.users
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sakib.samadhan@gmail.com') THEN
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                recovery_sent_at,
                last_sign_in_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                new_user_id,
                'authenticated',
                'authenticated',
                'sakib.samadhan@gmail.com',
                crypt('Sakib@9700', gen_salt('bf')),
                NOW(),
                NOW(),
                NOW(),
                '{"provider":"email","providers":["email"]}'::jsonb,
                '{"full_name":"Sakib Samadhan","role":"shop_owner"}'::jsonb,
                NOW(),
                NOW(),
                '',
                '',
                '',
                ''
            );

            -- Insert identity record (REQUIRED by Supabase GoTrue Auth)
            INSERT INTO auth.identities (
                id,
                user_id,
                identity_data,
                provider,
                provider_id,
                last_sign_in_at,
                created_at,
                updated_at
            ) VALUES (
                new_user_id,
                new_user_id,
                format('{"sub":"%s","email":"%s"}', new_user_id, 'sakib.samadhan@gmail.com')::jsonb,
                'email',
                new_user_id::text,
                NOW(),
                NOW(),
                NOW()
            );
        ELSE
            -- Update password if user already exists
            UPDATE auth.users
            SET encrypted_password = crypt('Sakib@9700', gen_salt('bf')),
                email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
                raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"shop_owner"'),
                updated_at = NOW()
            WHERE email = 'sakib.samadhan@gmail.com';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Auth user direct creation notice (can create via Supabase Auth UI if skipped): %', SQLERRM;
    END;

    -- Upsert in staff_members table
    BEGIN
        INSERT INTO public.staff_members (
            user_id,
            email,
            full_name,
            role,
            status
        )
        SELECT
            id,
            'sakib.samadhan@gmail.com',
            'Sakib Samadhan',
            'shop_owner',
            'active'
        FROM auth.users
        WHERE email = 'sakib.samadhan@gmail.com'
        ON CONFLICT (email) DO UPDATE
        SET role = 'shop_owner', status = 'active';
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.staff_members (
            email,
            full_name,
            role,
            status
        ) VALUES (
            'sakib.samadhan@gmail.com',
            'Sakib Samadhan',
            'shop_owner',
            'active'
        )
        ON CONFLICT (email) DO UPDATE
        SET role = 'shop_owner', status = 'active';
    END;
END $$;

-- 10. CREATE CUSTOMERS, WISHLISTS, PROMOTIONS & PROMO_CODES TABLES
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,
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

CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlists_customer_id ON public.wishlists(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);

CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) DEFAULT '',
    message TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    link_url TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON public.promotions(is_active);

CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    discount_type VARCHAR(50) NOT NULL,
    discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    min_order_amount NUMERIC(10,2) DEFAULT 0,
    max_discount NUMERIC(10,2) DEFAULT 0,
    usage_limit INT DEFAULT 0,
    per_user_limit INT DEFAULT 0,
    usage_count INT DEFAULT 0,
    included_product_ids UUID[] DEFAULT '{}',
    excluded_product_ids UUID[] DEFAULT '{}',
    included_category_ids UUID[] DEFAULT '{}',
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

-- 11. ENABLE ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Categories RLS
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin write categories" ON public.categories;
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow admin write categories" ON public.categories FOR ALL TO authenticated USING (true);

-- Products RLS
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Allow admin write products" ON public.products;
CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow admin write products" ON public.products FOR ALL TO authenticated USING (true);

-- Orders RLS
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users and admin read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin manage orders" ON public.orders;
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users and admin read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow admin manage orders" ON public.orders FOR ALL TO authenticated USING (true);

-- Order Items RLS
DROP POLICY IF EXISTS "Allow public insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public read order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow admin manage order items" ON public.order_items;
CREATE POLICY "Allow public insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow admin manage order items" ON public.order_items FOR ALL TO authenticated USING (true);

-- Contact Messages RLS
DROP POLICY IF EXISTS "Allow public insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow admin manage contact messages" ON public.contact_messages;
CREATE POLICY "Allow public insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin manage contact messages" ON public.contact_messages FOR ALL TO authenticated USING (true);

-- Store Settings RLS
DROP POLICY IF EXISTS "Allow public read settings" ON public.store_settings;
DROP POLICY IF EXISTS "Allow admin manage settings" ON public.store_settings;
CREATE POLICY "Allow public read settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin manage settings" ON public.store_settings FOR ALL TO authenticated USING (true);

-- Staff Members RLS
DROP POLICY IF EXISTS "Allow authenticated read staff" ON public.staff_members;
DROP POLICY IF EXISTS "Allow admin manage staff" ON public.staff_members;
CREATE POLICY "Allow authenticated read staff" ON public.staff_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage staff" ON public.staff_members FOR ALL TO authenticated USING (true);

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

-- 12. RPC FUNCTIONS TO SAFELY DECREMENT & INCREMENT PRODUCT STOCK
CREATE OR REPLACE FUNCTION decrement_product_stock(prod_id UUID, qty INT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET stock = GREATEST(0, stock - qty)
    WHERE id = prod_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_product_stock(prod_id UUID, qty INT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET stock = stock + qty
    WHERE id = prod_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
