import { createAdminClient } from '@/utils/supabase/server'

export interface StoreSettings {
  id?: string
  // Branding
  store_name: string
  store_tagline: string
  logo_url: string
  favicon_url: string
  watermark_enabled: boolean
  // Hero Section
  hero_image_url: string
  hero_badge_text: string
  hero_title: string
  hero_subtitle: string
  hero_description: string
  // Theme
  theme_color: string
  // Payment Options & Methods
  cod_enabled: boolean
  cod_prepay_delivery: boolean
  bkash_enabled: boolean
  // bKash Personal (Send Money)
  bkash_personal_enabled: boolean
  bkash_personal_number: string
  bkash_personal_name: string
  bkash_personal_qr_url: string
  // Email Integration (Resend)
  resend_api_key: string
  resend_from_email: string
  email_invoice_enabled: boolean
  daily_digest_enabled: boolean
  daily_digest_time: string
  daily_digest_email: string
  // bKash Credentials
  bkash_api_url: string
  bkash_app_key: string
  bkash_app_secret: string
  bkash_username: string
  bkash_password: string
  // Courier Providers (Both can be active, one, or neither)
  pathao_enabled: boolean
  steadfast_enabled: boolean
  active_shipping_provider: 'pathao' | 'steadfast'
  pathao_api_url: string
  pathao_client_id: string
  pathao_client_secret: string
  pathao_username: string
  pathao_password: string
  pathao_store_id: string
  steadfast_api_key: string
  steadfast_secret_key: string
  steadfast_base_url: string
  // Flexible Shipping & Delivery Charges
  store_city_name: string
  store_city_id: number
  shipping_zone_1_label: string
  shipping_zone_2_label: string
  delivery_charge_inside_dhaka: number
  delivery_charge_outside_dhaka: number
  // About & Contact Details
  about_enabled: boolean
  about_story: string
  contact_phone: string
  contact_whatsapp: string
  contact_email: string
  contact_address: string
  google_map_embed_url: string
  // Social Media Channels
  social_facebook: string
  social_instagram: string
  social_youtube: string
  social_tiktok: string
  social_twitter: string
  social_linkedin: string
  // Marketing & Tracking Pixels
  meta_pixel_id: string
  google_analytics_id: string
  tiktok_pixel_id: string
  // Special Collections
  show_featured: boolean
  show_best_seller: boolean
  show_trending: boolean
  auto_best_seller: boolean
  auto_trending: boolean
  updated_at?: string
}

export interface PublicStoreSettings {
  store_name: string
  store_tagline: string
  logo_url: string
  favicon_url: string
  watermark_enabled: boolean
  hero_image_url: string
  hero_badge_text: string
  hero_title: string
  hero_subtitle: string
  hero_description: string
  theme_color: string
  cod_enabled: boolean
  cod_prepay_delivery: boolean
  bkash_enabled: boolean
  bkash_personal_enabled: boolean
  bkash_personal_number: string
  bkash_personal_name: string
  bkash_personal_qr_url: string
  pathao_enabled: boolean
  steadfast_enabled: boolean
  active_shipping_provider: 'pathao' | 'steadfast'
  store_city_name: string
  store_city_id: number
  shipping_zone_1_label: string
  shipping_zone_2_label: string
  delivery_charge_inside_dhaka: number
  delivery_charge_outside_dhaka: number
  about_enabled: boolean
  about_story: string
  contact_phone: string
  contact_whatsapp: string
  contact_email: string
  contact_address: string
  google_map_embed_url: string
  social_facebook: string
  social_instagram: string
  social_youtube: string
  social_tiktok: string
  social_twitter: string
  social_linkedin: string
  meta_pixel_id: string
  google_analytics_id: string
  tiktok_pixel_id: string
  show_featured: boolean
  show_best_seller: boolean
  show_trending: boolean
  auto_best_seller: boolean
  auto_trending: boolean
}

export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'Verdant Aquatics',
  store_tagline: 'Premium Aquariums, Accessories & Aquatic Plants in Bangladesh',
  logo_url: '/logo.jpeg',
  favicon_url: '/logo.jpeg',
  watermark_enabled: false,
  hero_image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1600',
  hero_badge_text: 'Premium Aquascaping Shop',
  hero_title: 'Create Your Own',
  hero_subtitle: 'Underwater Paradise',
  hero_description: 'Explore our curated selection of high-clarity rimless aquariums, smart filtration systems, full-spectrum lights, and natural plants. Get delivery all over Bangladesh and pay securely with bKash.',
  theme_color: 'emerald',
  cod_enabled: true,
  cod_prepay_delivery: true,
  bkash_enabled: true,
  bkash_personal_enabled: false,
  bkash_personal_number: '',
  bkash_personal_name: '',
  bkash_personal_qr_url: '',
  resend_api_key: process.env.RESEND_API_KEY || '',
  resend_from_email: process.env.RESEND_FROM_EMAIL || '',
  email_invoice_enabled: true,
  daily_digest_enabled: false,
  daily_digest_time: '20:00',
  daily_digest_email: '',
  bkash_api_url: process.env.BKASH_API_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
  bkash_app_key: process.env.BKASH_APP_KEY || '',
  bkash_app_secret: process.env.BKASH_APP_SECRET || '',
  bkash_username: process.env.BKASH_USERNAME || '',
  bkash_password: process.env.BKASH_PASSWORD || '',
  pathao_enabled: true,
  steadfast_enabled: true,
  active_shipping_provider: 'pathao',
  pathao_api_url: process.env.PATHAO_API_URL || 'https://courier-api-sandbox.pathao.com',
  pathao_client_id: process.env.PATHAO_CLIENT_ID || '',
  pathao_client_secret: process.env.PATHAO_CLIENT_SECRET || '',
  pathao_username: process.env.PATHAO_USERNAME || '',
  pathao_password: process.env.PATHAO_PASSWORD || '',
  pathao_store_id: process.env.PATHAO_STORE_ID || '',
  steadfast_api_key: process.env.STEADFAST_API_KEY || '',
  steadfast_secret_key: process.env.STEADFAST_SECRET_KEY || '',
  steadfast_base_url: process.env.STEADFAST_BASE_URL || 'https://portal.steadfast.com.bd/api/v1',
  store_city_name: 'Dhaka',
  store_city_id: 1,
  shipping_zone_1_label: 'Inside Dhaka',
  shipping_zone_2_label: 'Outside Dhaka',
  delivery_charge_inside_dhaka: 60,
  delivery_charge_outside_dhaka: 120,
  about_enabled: true,
  about_story: '',
  contact_phone: '',
  contact_whatsapp: '',
  contact_email: '',
  contact_address: '',
  google_map_embed_url: '',
  social_facebook: '',
  social_instagram: '',
  social_youtube: '',
  social_tiktok: '',
  social_twitter: '',
  social_linkedin: '',
  meta_pixel_id: '',
  google_analytics_id: '',
  tiktok_pixel_id: '',
  show_featured: true,
  show_best_seller: true,
  show_trending: true,
  auto_best_seller: true,
  auto_trending: true
}

// In-memory caching for server requests (TTL: 30 seconds)
let cachedSettings: StoreSettings | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 30 * 1000

export async function getStoreSettings(forceFresh = false): Promise<StoreSettings> {
  const now = Date.now()
  if (!forceFresh && cachedSettings && (now - cacheTimestamp < CACHE_TTL_MS)) {
    return cachedSettings
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .single()

    if (error || !data) {
      return cachedSettings || DEFAULT_SETTINGS
    }

    const resolved: StoreSettings = {
      ...DEFAULT_SETTINGS,
      ...data,
      watermark_enabled: data.watermark_enabled !== undefined ? Boolean(data.watermark_enabled) : DEFAULT_SETTINGS.watermark_enabled,
      cod_enabled: data.cod_enabled !== undefined ? Boolean(data.cod_enabled) : DEFAULT_SETTINGS.cod_enabled,
      cod_prepay_delivery: data.cod_prepay_delivery !== undefined ? Boolean(data.cod_prepay_delivery) : DEFAULT_SETTINGS.cod_prepay_delivery,
      bkash_enabled: data.bkash_enabled !== undefined ? Boolean(data.bkash_enabled) : DEFAULT_SETTINGS.bkash_enabled,
      bkash_personal_enabled: data.bkash_personal_enabled !== undefined ? Boolean(data.bkash_personal_enabled) : DEFAULT_SETTINGS.bkash_personal_enabled,
      bkash_personal_number: data.bkash_personal_number || '',
      bkash_personal_name: data.bkash_personal_name || '',
      bkash_personal_qr_url: data.bkash_personal_qr_url || '',
      resend_api_key: data.resend_api_key || DEFAULT_SETTINGS.resend_api_key,
      resend_from_email: data.resend_from_email || DEFAULT_SETTINGS.resend_from_email,
      email_invoice_enabled: data.email_invoice_enabled !== undefined ? Boolean(data.email_invoice_enabled) : DEFAULT_SETTINGS.email_invoice_enabled,
      daily_digest_enabled: data.daily_digest_enabled !== undefined ? Boolean(data.daily_digest_enabled) : DEFAULT_SETTINGS.daily_digest_enabled,
      daily_digest_time: data.daily_digest_time || DEFAULT_SETTINGS.daily_digest_time,
      daily_digest_email: data.daily_digest_email || DEFAULT_SETTINGS.daily_digest_email,
      pathao_enabled: data.pathao_enabled !== undefined ? Boolean(data.pathao_enabled) : DEFAULT_SETTINGS.pathao_enabled,
      steadfast_enabled: data.steadfast_enabled !== undefined ? Boolean(data.steadfast_enabled) : DEFAULT_SETTINGS.steadfast_enabled,
      store_city_name: data.store_city_name || DEFAULT_SETTINGS.store_city_name,
      store_city_id: Number(data.store_city_id ?? DEFAULT_SETTINGS.store_city_id),
      shipping_zone_1_label: data.shipping_zone_1_label || DEFAULT_SETTINGS.shipping_zone_1_label,
      shipping_zone_2_label: data.shipping_zone_2_label || DEFAULT_SETTINGS.shipping_zone_2_label,
      delivery_charge_inside_dhaka: Number(data.delivery_charge_inside_dhaka ?? DEFAULT_SETTINGS.delivery_charge_inside_dhaka),
      delivery_charge_outside_dhaka: Number(data.delivery_charge_outside_dhaka ?? DEFAULT_SETTINGS.delivery_charge_outside_dhaka),
      about_enabled: data.about_enabled !== undefined ? Boolean(data.about_enabled) : DEFAULT_SETTINGS.about_enabled,
      about_story: data.about_story ?? '',
      contact_phone: data.contact_phone ?? '',
      contact_whatsapp: data.contact_whatsapp ?? '',
      contact_email: data.contact_email ?? '',
      contact_address: data.contact_address ?? '',
      google_map_embed_url: data.google_map_embed_url ?? '',
      social_facebook: data.social_facebook ?? '',
      social_instagram: data.social_instagram ?? '',
      social_youtube: data.social_youtube ?? '',
      social_tiktok: data.social_tiktok ?? '',
      social_twitter: data.social_twitter ?? '',
      social_linkedin: data.social_linkedin ?? '',
      meta_pixel_id: data.meta_pixel_id ?? '',
      google_analytics_id: data.google_analytics_id ?? '',
      tiktok_pixel_id: data.tiktok_pixel_id ?? '',
      show_featured: data.show_featured !== undefined ? Boolean(data.show_featured) : DEFAULT_SETTINGS.show_featured,
      show_best_seller: data.show_best_seller !== undefined ? Boolean(data.show_best_seller) : DEFAULT_SETTINGS.show_best_seller,
      show_trending: data.show_trending !== undefined ? Boolean(data.show_trending) : DEFAULT_SETTINGS.show_trending,
      auto_best_seller: data.auto_best_seller !== undefined ? Boolean(data.auto_best_seller) : DEFAULT_SETTINGS.auto_best_seller,
      auto_trending: data.auto_trending !== undefined ? Boolean(data.auto_trending) : DEFAULT_SETTINGS.auto_trending
    }
    cachedSettings = resolved
    cacheTimestamp = now
    return resolved
  } catch (err) {
    console.error('Error fetching store_settings:', err)
    return cachedSettings || DEFAULT_SETTINGS
  }
}

export async function getPublicSettings(): Promise<PublicStoreSettings> {
  const full = await getStoreSettings()
  return {
    store_name: full.store_name,
    store_tagline: full.store_tagline,
    logo_url: full.logo_url || DEFAULT_SETTINGS.logo_url,
    favicon_url: full.favicon_url || full.logo_url || DEFAULT_SETTINGS.favicon_url,
    watermark_enabled: full.watermark_enabled,
    hero_image_url: full.hero_image_url || DEFAULT_SETTINGS.hero_image_url,
    hero_badge_text: full.hero_badge_text,
    hero_title: full.hero_title,
    hero_subtitle: full.hero_subtitle,
    hero_description: full.hero_description,
    theme_color: full.theme_color || 'emerald',
    cod_enabled: full.cod_enabled,
    cod_prepay_delivery: full.cod_prepay_delivery,
    bkash_enabled: full.bkash_enabled,
    bkash_personal_enabled: full.bkash_personal_enabled,
    bkash_personal_number: full.bkash_personal_number,
    bkash_personal_name: full.bkash_personal_name,
    bkash_personal_qr_url: full.bkash_personal_qr_url,
    pathao_enabled: full.pathao_enabled,
    steadfast_enabled: full.steadfast_enabled,
    active_shipping_provider: full.active_shipping_provider || 'pathao',
    store_city_name: full.store_city_name,
    store_city_id: full.store_city_id,
    shipping_zone_1_label: full.shipping_zone_1_label,
    shipping_zone_2_label: full.shipping_zone_2_label,
    delivery_charge_inside_dhaka: full.delivery_charge_inside_dhaka,
    delivery_charge_outside_dhaka: full.delivery_charge_outside_dhaka,
    about_enabled: full.about_enabled,
    about_story: full.about_story,
    contact_phone: full.contact_phone,
    contact_whatsapp: full.contact_whatsapp,
    contact_email: full.contact_email,
    contact_address: full.contact_address,
    google_map_embed_url: full.google_map_embed_url,
    social_facebook: full.social_facebook,
    social_instagram: full.social_instagram,
    social_youtube: full.social_youtube,
    social_tiktok: full.social_tiktok,
    social_twitter: full.social_twitter,
    social_linkedin: full.social_linkedin,
    meta_pixel_id: full.meta_pixel_id,
    google_analytics_id: full.google_analytics_id,
    tiktok_pixel_id: full.tiktok_pixel_id,
    show_featured: full.show_featured,
    show_best_seller: full.show_best_seller,
    show_trending: full.show_trending,
    auto_best_seller: full.auto_best_seller,
    auto_trending: full.auto_trending
  }
}

export function invalidateSettingsCache() {
  cachedSettings = null
  cacheTimestamp = 0
}

export { formatExternalUrl } from '@/utils/url'
export { type ThemePalette, THEME_PALETTES } from '@/utils/theme'
