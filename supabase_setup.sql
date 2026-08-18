-- ==========================================
-- AQUASTORE / WHITE-LABEL E-COMMERCE DATABASE SETUP
-- Single Clean Setup SQL for New Store Deployments
-- ==========================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CREATE CATEGORIES TABLE (Hierarchical with parent_id)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- 3. CREATE PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    old_price NUMERIC(10, 2) DEFAULT 0.00,
    buying_price NUMERIC(10, 2) DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    variations JSONB DEFAULT '{"options": []}'::JSONB,
    is_featured BOOLEAN DEFAULT FALSE,
    is_best_seller BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    shipping_address TEXT NOT NULL,
    shipping_provider VARCHAR(50) DEFAULT 'pathao', -- 'pathao' or 'steadfast'
    city_id INT DEFAULT 0,
    zone_id INT DEFAULT 0,
    area_id INT DEFAULT 0,
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

-- 5. CREATE ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    selected_variations JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE CONTACT MESSAGES TABLE
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

-- 7. CREATE STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Branding
    store_name VARCHAR(255) NOT NULL DEFAULT 'My Store',
    store_tagline VARCHAR(500) DEFAULT 'Premium Quality Products',
    logo_url TEXT DEFAULT '',
    favicon_url TEXT DEFAULT '',
    -- Hero Section
    hero_image_url TEXT DEFAULT '',
    hero_badge_text VARCHAR(255) DEFAULT 'Premium Collection',
    hero_title VARCHAR(255) DEFAULT 'Discover Our Handpicked Selection',
    hero_subtitle VARCHAR(255) DEFAULT 'Quality & Excellence',
    hero_description TEXT DEFAULT 'Browse our curated catalog. Get fast delivery across Bangladesh and pay securely.',
    -- Theme Color Palette
    theme_color VARCHAR(50) DEFAULT 'emerald', -- emerald, blue, purple, rose, amber, teal, indigo, slate
    -- Payment Options
    cod_enabled BOOLEAN DEFAULT TRUE,
    cod_prepay_delivery BOOLEAN DEFAULT TRUE,
    bkash_enabled BOOLEAN DEFAULT TRUE,
    -- bKash Credentials
    bkash_api_url TEXT DEFAULT 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    bkash_app_key TEXT DEFAULT '',
    bkash_app_secret TEXT DEFAULT '',
    bkash_username TEXT DEFAULT '',
    bkash_password TEXT DEFAULT '',
    -- Courier Selection & Credentials
    pathao_enabled BOOLEAN DEFAULT TRUE,
    steadfast_enabled BOOLEAN DEFAULT TRUE,
    active_shipping_provider VARCHAR(50) DEFAULT 'pathao', -- 'pathao' or 'steadfast'
    pathao_api_url TEXT DEFAULT 'https://courier-api-sandbox.pathao.com',
    pathao_client_id TEXT DEFAULT '',
    pathao_client_secret TEXT DEFAULT '',
    pathao_username TEXT DEFAULT '',
    pathao_password TEXT DEFAULT '',
    pathao_store_id TEXT DEFAULT '',
    steadfast_api_key TEXT DEFAULT '',
    steadfast_secret_key TEXT DEFAULT '',
    steadfast_base_url TEXT DEFAULT 'https://portal.steadfast.com.bd/api/v1',
    -- Shipping Charges
    delivery_charge_inside_dhaka NUMERIC(10, 2) NOT NULL DEFAULT 60.00,
    delivery_charge_outside_dhaka NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
    -- About & Contact Info
    about_enabled BOOLEAN DEFAULT TRUE,
    about_story TEXT DEFAULT '',
    contact_phone VARCHAR(50) DEFAULT '',
    contact_email VARCHAR(255) DEFAULT '',
    contact_address TEXT DEFAULT '',
    google_map_embed_url TEXT DEFAULT '',
    -- Special Collections (Featured, Best Seller, Trending)
    show_featured BOOLEAN DEFAULT TRUE,
    show_best_seller BOOLEAN DEFAULT TRUE,
    show_trending BOOLEAN DEFAULT TRUE,
    auto_best_seller BOOLEAN DEFAULT TRUE,
    auto_trending BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial settings row if none exists
INSERT INTO public.store_settings (
    id, store_name, store_tagline, hero_title, hero_subtitle, hero_badge_text,
    hero_description, theme_color, active_shipping_provider,
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
    60.00,
    120.00,
    true,
    'Welcome to our store! We provide high-quality items curated with passion and attention to detail. Every product is backed by nationwide delivery and friendly support.',
    '+880 1700-000000',
    'support@store.com',
    'Dhaka, Bangladesh'
) ON CONFLICT (id) DO NOTHING;

-- 8. SET UP ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Categories
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow admin write categories" ON public.categories FOR ALL TO authenticated USING (true);

-- Products
CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow admin write products" ON public.products FOR ALL TO authenticated USING (true);

-- Orders
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users and admin read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow admin manage orders" ON public.orders FOR ALL TO authenticated USING (true);

-- Order Items
CREATE POLICY "Allow public insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow admin manage order items" ON public.order_items FOR ALL TO authenticated USING (true);

-- Contact Messages
CREATE POLICY "Allow public insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin manage contact messages" ON public.contact_messages FOR ALL TO authenticated USING (true);

-- Store Settings
CREATE POLICY "Allow public read settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin manage settings" ON public.store_settings FOR ALL TO authenticated USING (true);

-- 9. CREATE STAFF MEMBERS & RBAC TABLE
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff', -- 'admin', 'shop_owner', 'staff'
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'suspended'
    phone VARCHAR(50) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_members_email ON public.staff_members(email);
CREATE INDEX IF NOT EXISTS idx_staff_members_user_id ON public.staff_members(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_role ON public.staff_members(role);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read staff" ON public.staff_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage staff" ON public.staff_members FOR ALL TO authenticated USING (true);

-- Seed initial staff founder/admin
INSERT INTO public.staff_members (email, full_name, role, status)
VALUES 
    ('sakib.samadhan@gmail.com', 'Store Founder', 'shop_owner', 'active'),
    ('admin@example.com', 'System Administrator', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- 10. RPC FUNCTION TO SAFELY DECREMENT STOCK
CREATE OR REPLACE FUNCTION decrement_product_stock(prod_id UUID, qty INT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET stock = GREATEST(0, stock - qty)
    WHERE id = prod_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
