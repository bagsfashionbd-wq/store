-- ==========================================
-- SUPABASE MIGRATION SCRIPT (PHASE 2 UPDATE)
-- Run this in Supabase SQL Editor to upgrade an existing DB
-- ==========================================

-- 1. Add Parent ID to Categories for hierarchy
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- 2. Add Steadfast courier support to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_provider VARCHAR(50) DEFAULT 'pathao',
ADD COLUMN IF NOT EXISTS steadfast_consignment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS steadfast_tracking_code VARCHAR(255);

-- 3. Add is_hidden, is_best_seller, is_trending columns to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;

-- 4. Create the contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    subject VARCHAR(255) DEFAULT 'General Inquiry',
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin manage contact messages" ON public.contact_messages FOR ALL TO authenticated USING (true);

-- 5. Create the store_settings table (or update if already exists)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name VARCHAR(255) NOT NULL DEFAULT 'My Store',
    store_tagline VARCHAR(500) DEFAULT 'Premium Quality Products',
    logo_url TEXT DEFAULT '',
    favicon_url TEXT DEFAULT '',
    hero_image_url TEXT DEFAULT '',
    hero_badge_text VARCHAR(255) DEFAULT 'Premium Collection',
    hero_title VARCHAR(255) DEFAULT 'Discover Our Handpicked Selection',
    hero_subtitle VARCHAR(255) DEFAULT 'Quality & Excellence',
    hero_description TEXT DEFAULT 'Browse our curated catalog. Get fast delivery across Bangladesh and pay securely.',
    theme_color VARCHAR(50) DEFAULT 'emerald',
    bkash_api_url TEXT DEFAULT 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    bkash_app_key TEXT DEFAULT '',
    bkash_app_secret TEXT DEFAULT '',
    bkash_username TEXT DEFAULT '',
    bkash_password TEXT DEFAULT '',
    active_shipping_provider VARCHAR(50) DEFAULT 'pathao',
    pathao_api_url TEXT DEFAULT 'https://courier-api-sandbox.pathao.com',
    pathao_client_id TEXT DEFAULT '',
    pathao_client_secret TEXT DEFAULT '',
    pathao_username TEXT DEFAULT '',
    pathao_password TEXT DEFAULT '',
    pathao_store_id TEXT DEFAULT '',
    steadfast_api_key TEXT DEFAULT '',
    steadfast_secret_key TEXT DEFAULT '',
    steadfast_base_url TEXT DEFAULT 'https://portal.steadfast.com.bd/api/v1',
    delivery_charge_inside_dhaka NUMERIC(10, 2) NOT NULL DEFAULT 60.00,
    delivery_charge_outside_dhaka NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
    about_enabled BOOLEAN DEFAULT TRUE,
    about_story TEXT DEFAULT '',
    contact_phone VARCHAR(50) DEFAULT '',
    contact_email VARCHAR(255) DEFAULT '',
    contact_address TEXT DEFAULT '',
    google_map_embed_url TEXT DEFAULT '',
    show_featured BOOLEAN DEFAULT TRUE,
    show_best_seller BOOLEAN DEFAULT TRUE,
    show_trending BOOLEAN DEFAULT TRUE,
    auto_best_seller BOOLEAN DEFAULT TRUE,
    auto_trending BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add order_status column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'Pending';

-- In case store_settings already exists, add any missing new columns
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS cod_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS cod_prepay_delivery BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS bkash_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS pathao_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS steadfast_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS about_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS about_story TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50) DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS google_map_embed_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS show_featured BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_best_seller BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_trending BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS auto_best_seller BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS auto_trending BOOLEAN DEFAULT TRUE;

-- Seed initial settings
INSERT INTO public.store_settings (
    id, store_name, store_tagline, hero_title, hero_subtitle, hero_badge_text,
    hero_description, theme_color, active_shipping_provider,
    bkash_api_url, bkash_app_key, bkash_app_secret, bkash_username, bkash_password,
    pathao_api_url, pathao_client_id, pathao_client_secret, pathao_username, pathao_password, pathao_store_id,
    delivery_charge_inside_dhaka, delivery_charge_outside_dhaka,
    about_enabled, about_story, contact_phone, contact_email, contact_address
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Verdant Aquatics',
    'Premium Aquariums, Accessories & Aquatic Plants in Bangladesh',
    'Create Your Own',
    'Underwater Paradise',
    'Premium Aquascaping Shop',
    'Explore our curated selection of high-clarity rimless aquariums, smart filtration systems, full-spectrum lights, and natural plants. Get delivery all over Bangladesh via Courier and pay securely with bKash.',
    'emerald',
    'pathao',
    'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    '4f6o0cjiki2rfm34kfdadl1eqq',
    '2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b',
    'sandboxTokenizedUser02',
    'sandboxTokenizedUser02@12345',
    'https://courier-api-sandbox.pathao.com',
    '7N1aMJQbWm',
    'wRcaibZkUdSNz2EI9ZyuXLlNrnAv0TdPUPXMnD39',
    'test@pathao.com',
    'lovePathao',
    '150506',
    60.00,
    120.00,
    true,
    'Welcome to our store! We provide high-quality items curated with passion and attention to detail. Every product is backed by nationwide delivery and friendly support.',
    '+880 1700-000000',
    'support@store.com',
    'Dhaka, Bangladesh'
) ON CONFLICT (id) DO NOTHING;

-- 6. Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated admin manage settings" ON public.store_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow public read settings" ON public.store_settings FOR SELECT USING (true);
