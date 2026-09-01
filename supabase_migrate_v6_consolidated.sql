-- ========================================================================
-- MIGRATION V6: CONSOLIDATED SETTINGS, TRACKING PIXELS & PRODUCT ENHANCEMENTS
-- Run this migration in Supabase SQL Editor for new and existing stores
-- ========================================================================

-- 1. Add short_description and ensure all product columns exist
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS short_description VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS buying_price NUMERIC(10, 2) DEFAULT 0.00;

-- 2. Add Tracking Pixels, Watermark & Flexible Shipping to Store Settings
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS meta_pixel_id VARCHAR(100) DEFAULT '',
ADD COLUMN IF NOT EXISTS google_analytics_id VARCHAR(100) DEFAULT '',
ADD COLUMN IF NOT EXISTS tiktok_pixel_id VARCHAR(100) DEFAULT '',
ADD COLUMN IF NOT EXISTS watermark_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS store_city_name VARCHAR(100) DEFAULT 'Dhaka',
ADD COLUMN IF NOT EXISTS store_city_id INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS shipping_zone_1_label VARCHAR(100) DEFAULT 'Inside Dhaka',
ADD COLUMN IF NOT EXISTS shipping_zone_2_label VARCHAR(100) DEFAULT 'Outside Dhaka';

-- 3. Update existing default row if needed
UPDATE public.store_settings
SET 
    store_city_name = COALESCE(store_city_name, 'Dhaka'),
    store_city_id = COALESCE(store_city_id, 1),
    shipping_zone_1_label = COALESCE(shipping_zone_1_label, 'Inside Dhaka'),
    shipping_zone_2_label = COALESCE(shipping_zone_2_label, 'Outside Dhaka'),
    watermark_enabled = COALESCE(watermark_enabled, FALSE),
    meta_pixel_id = COALESCE(meta_pixel_id, ''),
    google_analytics_id = COALESCE(google_analytics_id, ''),
    tiktok_pixel_id = COALESCE(tiktok_pixel_id, '')
WHERE id IS NOT NULL;

-- 4. RPC Functions for safe stock increment and decrement
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
