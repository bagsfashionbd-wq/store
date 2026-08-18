-- SQL Script to set up database schema and seed data in Supabase (PostgreSQL)

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    old_price NUMERIC(10, 2) DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    variations JSONB DEFAULT '{}'::JSONB, -- E.g. {"sizes": ["1.5ft", "2ft"], "colors": ["black", "white"]}
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for guest checkouts
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    shipping_address TEXT NOT NULL,
    city_id INT NOT NULL,
    zone_id INT NOT NULL,
    area_id INT NOT NULL,
    delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'COD', -- 'COD' or 'BKASH'
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'DeliveryChargePrePaid', 'FullyPaid', 'Failed'
    payment_details JSONB DEFAULT '{}'::JSONB, -- bkash payment transaction id, number, payload etc
    pathao_consignment_id VARCHAR(255), -- Pathao parcel tracking code
    pathao_status VARCHAR(100) DEFAULT 'pending', -- Pathao status (e.g. pending, dispatched, delivered)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    selected_variations JSONB DEFAULT '{}'::JSONB, -- E.g. {"size": "2ft", "color": "black"}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SET UP ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Categories: Read for everyone, Write for authenticated Admins only
CREATE POLICY "Allow public read categories" ON public.categories 
    FOR SELECT USING (true);

CREATE POLICY "Allow admin write categories" ON public.categories 
    FOR ALL TO authenticated USING (auth.jwt()->>'email' = 'admin@example.com' OR auth.jwt()->>'role' = 'service_role');

-- Products: Read for everyone, Write for authenticated Admins only
CREATE POLICY "Allow public read products" ON public.products 
    FOR SELECT USING (true);

CREATE POLICY "Allow admin write products" ON public.products 
    FOR ALL TO authenticated USING (auth.jwt()->>'email' = 'admin@example.com' OR auth.jwt()->>'role' = 'service_role');

-- Orders: Users can view their own orders, Admins can view/edit all orders
CREATE POLICY "Allow users to insert their own orders" ON public.orders
    FOR INSERT WITH CHECK (true); -- Anyone can place an order (guest checkouts)

CREATE POLICY "Allow users to view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id OR auth.jwt()->>'email' = 'admin@example.com');

CREATE POLICY "Allow admin to manage all orders" ON public.orders
    FOR ALL TO authenticated USING (auth.jwt()->>'email' = 'admin@example.com');

-- Order Items: Users can view/insert their own items, Admins can manage all
CREATE POLICY "Allow anyone to insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to view their own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR auth.jwt()->>'email' = 'admin@example.com')
        )
    );

CREATE POLICY "Allow admin to manage order items" ON public.order_items
    FOR ALL TO authenticated USING (auth.jwt()->>'email' = 'admin@example.com');

-- 7. SEED DATA GENERATION

-- Insert Categories
INSERT INTO public.categories (id, name, slug, description) VALUES
('c0000000-0000-0000-0000-000000000001', 'Aquariums', 'aquariums', 'High-quality glass and acrylic tanks for fish and aquascaping.'),
('c0000000-0000-0000-0000-000000000002', 'Filters & Pumps', 'filters-pumps', 'Essential filtration systems and aeration pumps to keep water clean and healthy.'),
('c0000000-0000-0000-0000-000000000003', 'Lighting', 'lighting', 'Full spectrum LED grow lights and waterproof lighting solutions.'),
('c0000000-0000-0000-0000-000000000004', 'Substrates & Decor', 'substrates-decor', 'Natural sands, planted soils, wood, and stones to decorate your tank.'),
('c0000000-0000-0000-0000-000000000005', 'Accessories', 'accessories', 'Maintenance tools, heaters, nets, and automatic feeders.'),
('c0000000-0000-0000-0000-000000000006', 'Live Plants', 'live-plants', 'Beautiful freshwater aquarium plants for aquascapes.'),
('c0000000-0000-0000-0000-000000000007', 'Fish Food & Care', 'fish-food-care', 'Nutritious foods and water conditioners for fish health.')
ON CONFLICT (slug) DO NOTHING;

-- Insert 30 Seed Products
INSERT INTO public.products (category_id, name, slug, description, price, old_price, stock, is_featured, variations, images) VALUES
-- Aquariums (5)
('c0000000-0000-0000-0000-000000000001', 'Standard Glass Aquarium', 'standard-glass-aquarium', 'Classic high-strength glass aquarium, silicon sealed. Available in multiple sizes.', 1800.00, 2000.00, 15, true, '{"sizes": ["1.5 Feet", "2 Feet", "3 Feet"]}', ARRAY['https://images.unsplash.com/photo-1544551763-46a013bb70d5']),
('c0000000-0000-0000-0000-000000000001', 'Rimless Ultra Clear Glass Tank', 'rimless-ultra-clear-glass-tank', 'Premium low-iron rimless glass tank for maximum visibility and modern design.', 4500.00, 5000.00, 8, true, '{"sizes": ["30cm Cube", "45cm Rectangular", "60cm Rectangular"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000001', 'Nano Desktop Aquarium Cube', 'nano-desktop-aquarium-cube', 'Compact glass cube perfect for small spaces, bettas, or shrimp keeping.', 1200.00, 0.00, 20, false, '{"colors": ["Black Base", "White Base"]}', ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e']),
('c0000000-0000-0000-0000-000000000001', 'Hexagonal Glass Tank', 'hexagonal-glass-tank', 'Elegant 6-sided glass tank providing a unique multi-angle view of your aquascape.', 3200.00, 3500.00, 5, false, '{"capacity": ["10 Gallons", "15 Gallons"]}', ARRAY['https://images.unsplash.com/photo-1534447677768-be436bb09401']),
('c0000000-0000-0000-0000-000000000001', 'Planted Aquascape Starter Tank', 'planted-aquascape-starter-tank', 'Specifically designed shallow tank ideal for creating detailed miniature land-waterscapes.', 2800.00, 3000.00, 10, true, '{"sizes": ["45cm Long", "60cm Long"]}', ARRAY['https://images.unsplash.com/photo-1544551763-46a013bb70d5']),

-- Filters & Pumps (5)
('c0000000-0000-0000-0000-000000000002', 'Submersible Bio-Sponge Filter', 'submersible-bio-sponge-filter', 'Easy to install air-driven sponge filter, excellent for biological filtration in shrimp and fry tanks.', 250.00, 300.00, 50, false, '{"sizes": ["Small", "Medium"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000002', 'Internal Power Filter 15W', 'internal-power-filter-15w', 'Powerful 3-in-1 internal filter providing mechanical filtration, biological media space, and oxygenation.', 650.00, 750.00, 25, true, '{"flow_rates": ["500 L/H", "800 L/H"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000002', 'Slim Hang-On-Back HOB Filter', 'slim-hang-on-back-hob-filter', 'Quiet, space-saving external filter that mounts on the tank rim, adjustable flow control.', 850.00, 950.00, 30, false, '{"capacity": ["Suitable for 1-1.5ft tanks", "Suitable for 2ft tanks"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000002', 'External Canister Filter', 'external-canister-filter', 'Heavy-duty multi-stage external filtration system for crystal clear water in larger setups.', 3800.00, 4200.00, 12, true, '{"flow_rates": ["1000 L/H", "1500 L/H"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000002', 'Silent Aquarium Air Pump', 'silent-aquarium-air-pump', 'Whisper-quiet air pump for driving sponges, air stones, and bubblers.', 350.00, 400.00, 40, false, '{"outlets": ["Single Outlet", "Dual Outlet"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),

-- Lighting (4)
('c0000000-0000-0000-0000-000000000003', 'Full Spectrum LED Plant Light', 'full-spectrum-led-plant-light', 'Slim profile LED light promoting vigorous plant growth and vivid fish colors.', 1500.00, 1800.00, 20, true, '{"sizes": ["1.5 Feet", "2 Feet", "3 Feet"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000003', 'Clip-on Nano Aquarium Light', 'clip-on-nano-aquarium-light', 'Flexible gooseneck LED light, easily clips on rimless tanks. Ideal for small desktop cubes.', 600.00, 700.00, 35, false, '{"colors": ["Black Shell", "White Shell"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000003', 'Submersible RGB LED Bar', 'submersible-rgb-led-bar', 'Waterproof lighting tube with remote control, offers color-changing modes and underwater mount.', 450.00, 0.00, 30, false, '{"sizes": ["30cm", "60cm"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000003', 'Smart Wi-Fi LED Light Panel', 'smart-wi-fi-led-light-panel', 'App-controlled customizable aquarium lighting featuring sunrise/sunset simulation presets.', 3500.00, 4000.00, 8, true, '{"sizes": ["2 Feet", "3 Feet"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),

-- Substrates & Decor (4)
('c0000000-0000-0000-0000-000000000004', 'Black Quartz Silica Sand', 'black-quartz-silica-sand', 'Inert, triple-washed fine sand. Looks stunning and is safe for bottom-dwelling fish.', 180.00, 200.00, 100, false, '{"pack_size": ["1 kg", "5 kg"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000004', 'Active Plant Aqua Soil', 'active-plant-aqua-soil', 'Nutrient-rich substrate optimal for planted tanks, buffers pH and promotes root growth.', 450.00, 500.00, 60, true, '{"pack_size": ["1 kg", "3 kg", "9 kg"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000004', 'Natural Driftwood Hardwood', 'natural-driftwood-hardwood', 'Unique natural driftwood pieces, releases beneficial tannins. Perfect anchor for mosses.', 300.00, 0.00, 25, false, '{"sizes": ["Small (15-20cm)", "Medium (20-30cm)"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000004', 'Dragon Stone Hardscape Rock', 'dragon-stone-hardscape-rock', 'Beautiful textured rock, safe for water chemistry, popular in Iwagumi aquascapes.', 220.00, 250.00, 80, false, '{"weight": ["1 kg Pack", "5 kg Pack"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),

-- Accessories (4)
('c0000000-0000-0000-0000-000000000005', 'Glass Magnetic Algae Scraper', 'glass-magnetic-algae-scraper', 'Strong magnetic scrubber to clean algae off aquarium walls without getting hands wet.', 280.00, 320.00, 40, false, '{"strength": ["Small (Up to 6mm)", "Medium (Up to 10mm)"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000005', 'Digital LCD Thermometer', 'digital-lcd-thermometer', 'Precise electronic temperature monitor with submersed probe sensor.', 120.00, 150.00, 50, false, '{}'::JSONB, ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000005', 'Automatic Digital Fish Feeder', 'automatic-digital-fish-feeder', 'Programmable feeder with LCD screen, up to 4 feeding times daily. Ideal for vacation periods.', 1100.00, 1300.00, 15, true, '{}'::JSONB, ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000005', 'Aquarium Water Heater 100W', 'aquarium-water-heater-100w', 'Submersible quartz glass heater with adjustable thermostat scale, maintains steady warmth.', 600.00, 700.00, 20, false, '{"wattage": ["50W", "100W", "200W"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),

-- Live Plants (4)
('c0000000-0000-0000-0000-000000000006', 'Anubias Barteri on Lava Rock', 'anubias-barteri-on-lava-rock', 'Extremely hardy, slow-growing plant pre-anchored onto natural black volcanic rock.', 350.00, 0.00, 15, true, '{}'::JSONB, ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000006', 'Java Fern Microsorum Pteropus', 'java-fern-microsorum-pteropus', 'Classic low-light plant with long leaves, anchors easily to driftwood and rocks.', 120.00, 150.00, 30, false, '{"variant": ["Single Bunch", "Grown on wood"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000006', 'Rotala Rotundifolia Stem plant', 'rotala-rotundifolia-stem-plant', 'Popular background plant, leaves turn reddish/pink under strong lighting and CO2.', 80.00, 100.00, 40, false, '{"pack": ["5 Stems Bunch", "10 Stems Bunch"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000006', 'Java Moss (Taxiphyllum barbieri)', 'java-moss-taxiphyllum-barbieri', 'Fast-growing carpeting moss, provides hiding places for shrimp and fry.', 150.00, 180.00, 25, false, '{"portions": ["Small cup", "Mesh mat (5x5cm)"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),

-- Fish Food & Care (4)
('c0000000-0000-0000-0000-000000000007', 'Premium Tropical Fish Flakes', 'premium-tropical-fish-flakes', 'Nutritionally balanced daily food for active community tropical fish.', 280.00, 320.00, 40, false, '{"sizes": ["50g Can", "100g Can"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000007', 'Sinking Algae Wafers (Shrimp/Pleco)', 'sinking-algae-wafers-shrimp-pleco', 'Hard sinking food tablets rich in spirulina, ideal for bottom eaters.', 240.00, 280.00, 30, false, '{"sizes": ["40g Bag", "80g Bag"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000007', 'Water Dechlorinator / Conditioner', 'water-dechlorinator-conditioner', 'Instantly removes toxic chlorine, chloramines, and heavy metals from tap water.', 350.00, 400.00, 50, true, '{"volume": ["100ml Bottle", "250ml Bottle"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5']),
('c0000000-0000-0000-0000-000000000007', 'Liquid Micro & Macro Plant Fertilizer', 'liquid-micro-macro-plant-fertilizer', 'All-in-one liquid fertilizer supplying essential minerals to aquarium plants.', 450.00, 500.00, 35, false, '{"volume": ["150ml Bottle", "300ml Bottle"]}', ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5'])
ON CONFLICT (slug) DO NOTHING;

-- 8. CREATE DECREMENT STOCK FUNCTION FOR ORDER PROCESSING
CREATE OR REPLACE FUNCTION decrement_product_stock(prod_id UUID, qty INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - qty)
  WHERE id = prod_id;
END;
$$ LANGUAGE plpgsql;

