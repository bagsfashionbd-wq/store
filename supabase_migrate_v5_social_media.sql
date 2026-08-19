-- ==============================================================================
-- MIGRATION V5: SOCIAL MEDIA LINKS & SEPARATE WHATSAPP NUMBER
-- Adds social media channels and dedicated WhatsApp contact to store_settings
-- ==============================================================================

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS social_facebook TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS social_instagram TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS social_youtube TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS social_tiktok TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS social_twitter TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS social_linkedin TEXT DEFAULT '';
