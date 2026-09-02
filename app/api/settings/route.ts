import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { getStoreSettings, invalidateSettingsCache, DEFAULT_SETTINGS, StoreSettings } from '@/utils/settings'
import { formatExternalUrl } from '@/utils/url'
import { verifyStaffAuth } from '@/utils/auth'

export const dynamic = 'force-dynamic'

// GET: Return current settings for admin panel
// Note: Sensitive fields can be masked for viewing if desired, but we provide full value or placeholders
export async function GET() {
  try {
    const settings = await getStoreSettings(true)
    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Failed to get settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT: Update settings (Shop Owner & Admin only)
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const body: Partial<StoreSettings> = await request.json()

    // Fetch existing settings
    const current = await getStoreSettings(true)

    // Build updated payload preserving untouched fields
    const updatedPayload = {
      store_name: body.store_name?.trim() || current.store_name,
      store_tagline: body.store_tagline !== undefined ? body.store_tagline : current.store_tagline,
      logo_url: body.logo_url !== undefined ? body.logo_url : current.logo_url,
      favicon_url: body.favicon_url !== undefined ? body.favicon_url : current.favicon_url,
      watermark_enabled: body.watermark_enabled !== undefined ? Boolean(body.watermark_enabled) : current.watermark_enabled,
      hero_image_url: body.hero_image_url !== undefined ? body.hero_image_url : current.hero_image_url,
      hero_badge_text: body.hero_badge_text !== undefined ? body.hero_badge_text : current.hero_badge_text,
      hero_title: body.hero_title !== undefined ? body.hero_title : current.hero_title,
      hero_subtitle: body.hero_subtitle !== undefined ? body.hero_subtitle : current.hero_subtitle,
      hero_description: body.hero_description !== undefined ? body.hero_description : current.hero_description,
      theme_color: body.theme_color || current.theme_color || 'emerald',
      cod_enabled: body.cod_enabled !== undefined ? Boolean(body.cod_enabled) : current.cod_enabled,
      cod_prepay_delivery: body.cod_prepay_delivery !== undefined ? Boolean(body.cod_prepay_delivery) : current.cod_prepay_delivery,
      bkash_enabled: body.bkash_enabled !== undefined ? Boolean(body.bkash_enabled) : current.bkash_enabled,
      bkash_personal_enabled: body.bkash_personal_enabled !== undefined ? Boolean(body.bkash_personal_enabled) : current.bkash_personal_enabled,
      bkash_personal_number: body.bkash_personal_number !== undefined ? body.bkash_personal_number : current.bkash_personal_number,
      bkash_personal_name: body.bkash_personal_name !== undefined ? body.bkash_personal_name : current.bkash_personal_name,
      bkash_personal_qr_url: body.bkash_personal_qr_url !== undefined ? body.bkash_personal_qr_url : current.bkash_personal_qr_url,
      resend_api_key: body.resend_api_key !== undefined ? body.resend_api_key : current.resend_api_key,
      resend_from_email: body.resend_from_email !== undefined ? body.resend_from_email : current.resend_from_email,
      bkash_api_url: body.bkash_api_url !== undefined ? body.bkash_api_url : current.bkash_api_url,
      bkash_app_key: body.bkash_app_key !== undefined ? body.bkash_app_key : current.bkash_app_key,
      bkash_app_secret: body.bkash_app_secret !== undefined ? body.bkash_app_secret : current.bkash_app_secret,
      bkash_username: body.bkash_username !== undefined ? body.bkash_username : current.bkash_username,
      bkash_password: body.bkash_password !== undefined ? body.bkash_password : current.bkash_password,
      pathao_enabled: body.pathao_enabled !== undefined ? Boolean(body.pathao_enabled) : current.pathao_enabled,
      steadfast_enabled: body.steadfast_enabled !== undefined ? Boolean(body.steadfast_enabled) : current.steadfast_enabled,
      active_shipping_provider: body.active_shipping_provider || current.active_shipping_provider || 'pathao',
      pathao_api_url: body.pathao_api_url !== undefined ? body.pathao_api_url : current.pathao_api_url,
      pathao_client_id: body.pathao_client_id !== undefined ? body.pathao_client_id : current.pathao_client_id,
      pathao_client_secret: body.pathao_client_secret !== undefined ? body.pathao_client_secret : current.pathao_client_secret,
      pathao_username: body.pathao_username !== undefined ? body.pathao_username : current.pathao_username,
      pathao_password: body.pathao_password !== undefined ? body.pathao_password : current.pathao_password,
      pathao_store_id: body.pathao_store_id !== undefined ? body.pathao_store_id : current.pathao_store_id,
      steadfast_api_key: body.steadfast_api_key !== undefined ? body.steadfast_api_key : current.steadfast_api_key,
      steadfast_secret_key: body.steadfast_secret_key !== undefined ? body.steadfast_secret_key : current.steadfast_secret_key,
      steadfast_base_url: body.steadfast_base_url !== undefined ? body.steadfast_base_url : current.steadfast_base_url,
      store_city_name: body.store_city_name !== undefined ? body.store_city_name : current.store_city_name,
      store_city_id: Number(body.store_city_id ?? current.store_city_id),
      shipping_zone_1_label: body.shipping_zone_1_label !== undefined ? body.shipping_zone_1_label : current.shipping_zone_1_label,
      shipping_zone_2_label: body.shipping_zone_2_label !== undefined ? body.shipping_zone_2_label : current.shipping_zone_2_label,
      delivery_charge_inside_dhaka: Number(body.delivery_charge_inside_dhaka ?? current.delivery_charge_inside_dhaka),
      delivery_charge_outside_dhaka: Number(body.delivery_charge_outside_dhaka ?? current.delivery_charge_outside_dhaka),
      about_enabled: body.about_enabled !== undefined ? Boolean(body.about_enabled) : current.about_enabled,
      about_story: body.about_story !== undefined ? body.about_story : current.about_story,
      contact_phone: body.contact_phone !== undefined ? body.contact_phone : current.contact_phone,
      contact_whatsapp: body.contact_whatsapp !== undefined ? body.contact_whatsapp : current.contact_whatsapp,
      contact_email: body.contact_email !== undefined ? body.contact_email : current.contact_email,
      contact_address: body.contact_address !== undefined ? body.contact_address : current.contact_address,
      google_map_embed_url: body.google_map_embed_url !== undefined ? body.google_map_embed_url : current.google_map_embed_url,
      social_facebook: body.social_facebook !== undefined ? formatExternalUrl(body.social_facebook) : current.social_facebook,
      social_instagram: body.social_instagram !== undefined ? formatExternalUrl(body.social_instagram) : current.social_instagram,
      social_youtube: body.social_youtube !== undefined ? formatExternalUrl(body.social_youtube) : current.social_youtube,
      social_tiktok: body.social_tiktok !== undefined ? formatExternalUrl(body.social_tiktok) : current.social_tiktok,
      social_twitter: body.social_twitter !== undefined ? formatExternalUrl(body.social_twitter) : current.social_twitter,
      social_linkedin: body.social_linkedin !== undefined ? formatExternalUrl(body.social_linkedin) : current.social_linkedin,
      meta_pixel_id: body.meta_pixel_id !== undefined ? body.meta_pixel_id.trim() : current.meta_pixel_id,
      google_analytics_id: body.google_analytics_id !== undefined ? body.google_analytics_id.trim() : current.google_analytics_id,
      tiktok_pixel_id: body.tiktok_pixel_id !== undefined ? body.tiktok_pixel_id.trim() : current.tiktok_pixel_id,
      show_featured: body.show_featured !== undefined ? Boolean(body.show_featured) : current.show_featured,
      show_best_seller: body.show_best_seller !== undefined ? Boolean(body.show_best_seller) : current.show_best_seller,
      show_trending: body.show_trending !== undefined ? Boolean(body.show_trending) : current.show_trending,
      auto_best_seller: body.auto_best_seller !== undefined ? Boolean(body.auto_best_seller) : current.auto_best_seller,
      auto_trending: body.auto_trending !== undefined ? Boolean(body.auto_trending) : current.auto_trending,
      updated_at: new Date().toISOString()
    }

    // Check if a settings row already exists
    const { data: existingRow } = await supabase
      .from('store_settings')
      .select('id')
      .limit(1)
      .single()

    let savedData
    if (existingRow?.id) {
      const { data, error } = await supabase
        .from('store_settings')
        .update(updatedPayload)
        .eq('id', existingRow.id)
        .select()
        .single()
      if (error) throw error
      savedData = data
    } else {
      const { data, error } = await supabase
        .from('store_settings')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          ...updatedPayload
        })
        .select()
        .single()
      if (error) throw error
      savedData = data
    }

    // Clear server in-memory cache
    invalidateSettingsCache()

    return NextResponse.json({ success: true, data: savedData })
  } catch (error: any) {
    console.error('Failed to update settings:', error)
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 })
  }
}
