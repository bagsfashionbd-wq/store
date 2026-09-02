import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { code, cartItems = [], deliveryCharge = 60 } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Please enter a promo code.' }, { status: 400 })
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '')

    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', cleanCode)
      .single()

    if (error || !promo) {
      return NextResponse.json({ error: 'Invalid promo code. Please check and try again.' }, { status: 404 })
    }

    if (!promo.is_active) {
      return NextResponse.json({ error: 'This promo code is no longer active.' }, { status: 400 })
    }

    const now = new Date()
    if (promo.start_date && new Date(promo.start_date) > now) {
      return NextResponse.json({ error: 'This promo code campaign has not started yet.' }, { status: 400 })
    }

    if (promo.end_date && new Date(promo.end_date) < now) {
      return NextResponse.json({ error: 'This promo code has expired.' }, { status: 400 })
    }

    if (promo.usage_limit > 0 && promo.usage_count >= promo.usage_limit) {
      return NextResponse.json({ error: 'This promo code has reached its maximum usage limit.' }, { status: 400 })
    }

    // Filter cart items for eligible products
    const includedIds = Array.isArray(promo.included_product_ids) ? promo.included_product_ids : []
    const excludedIds = Array.isArray(promo.excluded_product_ids) ? promo.excluded_product_ids : []

    let eligibleItems = cartItems
    if (includedIds.length > 0) {
      eligibleItems = eligibleItems.filter((item: any) => includedIds.includes(item.id))
      if (eligibleItems.length === 0) {
        return NextResponse.json({
          error: 'This promo code is not applicable to the items currently in your cart.'
        }, { status: 400 })
      }
    }

    if (excludedIds.length > 0) {
      eligibleItems = eligibleItems.filter((item: any) => !excludedIds.includes(item.id))
      if (eligibleItems.length === 0) {
        return NextResponse.json({
          error: 'The items in your cart are excluded from this promotion.'
        }, { status: 400 })
      }
    }

    const eligibleSubtotal = eligibleItems.reduce(
      (sum: number, item: any) => sum + Number(item.price || 0) * (item.quantity || 1),
      0
    )

    const fullSubtotal = cartItems.reduce(
      (sum: number, item: any) => sum + Number(item.price || 0) * (item.quantity || 1),
      0
    )

    if (promo.min_order_amount > 0 && fullSubtotal < promo.min_order_amount) {
      return NextResponse.json({
        error: `Minimum order amount of ৳${promo.min_order_amount} required to use this code.`
      }, { status: 400 })
    }

    let discountAmount = 0
    if (promo.discount_type === 'percentage') {
      discountAmount = eligibleSubtotal * (Number(promo.discount_value) / 100)
      if (promo.max_discount > 0 && discountAmount > promo.max_discount) {
        discountAmount = Number(promo.max_discount)
      }
    } else if (promo.discount_type === 'fixed') {
      discountAmount = Math.min(eligibleSubtotal, Number(promo.discount_value))
    } else if (promo.discount_type === 'free_shipping') {
      discountAmount = Number(deliveryCharge || 0)
    }

    discountAmount = Math.round(discountAmount * 100) / 100

    return NextResponse.json({
      valid: true,
      code: promo.code,
      promoId: promo.id,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      discountAmount,
      message: promo.discount_type === 'free_shipping'
        ? 'Free shipping applied!'
        : `৳${discountAmount} discount applied successfully!`
    })
  } catch (err: any) {
    console.error('Validate promo error:', err)
    return NextResponse.json({ error: err.message || 'Failed to validate promo code.' }, { status: 500 })
  }
}
