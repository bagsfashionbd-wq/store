import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { code, cartItems = [], deliveryCharge = 60, customer_phone, customer_email, user_id } = body

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

    // Check global store-wide usage limit
    if (promo.usage_limit > 0 && promo.usage_count >= promo.usage_limit) {
      return NextResponse.json({ error: 'This promo code has reached its maximum global usage limit.' }, { status: 400 })
    }

    // Check per-user / per-customer redemption limit
    if (promo.per_user_limit > 0) {
      const cleanPhone = (customer_phone || '').trim().replace(/[^0-9]/g, '')
      const cleanEmail = (customer_email || '').trim().toLowerCase()
      const cleanUserId = (user_id || '').trim()

      const orFilters: string[] = []
      if (cleanUserId) orFilters.push(`user_id.eq.${cleanUserId}`)
      if (cleanEmail) orFilters.push(`customer_email.ilike.${cleanEmail}`)
      if (cleanPhone && cleanPhone.length >= 10) {
        orFilters.push(`customer_phone.ilike.%${cleanPhone.slice(-10)}%`)
      }

      if (orFilters.length > 0) {
        const { count: priorUsageCount } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .or(`promo_code_id.eq.${promo.id},promo_code.ilike.${cleanCode}`)
          .neq('status', 'Cancelled')
          .or(orFilters.join(','))

        if (priorUsageCount !== null && priorUsageCount >= promo.per_user_limit) {
          return NextResponse.json({
            error: `You have already redeemed this promo code the maximum allowed limit (${promo.per_user_limit} time${promo.per_user_limit > 1 ? 's' : ''}).`
          }, { status: 400 })
        }
      }
    }

    // Filter cart items for eligible products & categories
    const includedProdIds = Array.isArray(promo.included_product_ids) ? promo.included_product_ids : []
    const excludedProdIds = Array.isArray(promo.excluded_product_ids) ? promo.excluded_product_ids : []
    const includedCatIds = Array.isArray(promo.included_category_ids) ? promo.included_category_ids : []
    const excludedCatIds = Array.isArray(promo.excluded_category_ids) ? promo.excluded_category_ids : []

    // Fetch category mapping from DB if category rules are present
    const itemIds = cartItems.map((it: any) => it.id).filter(Boolean)
    const productCategoryMap: Record<string, string> = {}
    if (itemIds.length > 0 && (includedCatIds.length > 0 || excludedCatIds.length > 0)) {
      const { data: dbProducts } = await supabase
        .from('products')
        .select('id, category_id')
        .in('id', itemIds)
      if (dbProducts) {
        dbProducts.forEach((p: any) => {
          if (p.category_id) productCategoryMap[p.id] = p.category_id
        })
      }
    }

    let eligibleItems = cartItems

    // 1. Included Products Rule
    if (includedProdIds.length > 0) {
      eligibleItems = eligibleItems.filter((item: any) => includedProdIds.includes(item.id))
    }

    // 2. Included Categories Rule
    if (includedCatIds.length > 0) {
      eligibleItems = eligibleItems.filter((item: any) => {
        const catId = item.category_id || productCategoryMap[item.id]
        return catId && includedCatIds.includes(catId)
      })
    }

    if ((includedProdIds.length > 0 || includedCatIds.length > 0) && eligibleItems.length === 0) {
      return NextResponse.json({
        error: 'This promo code is not applicable to the items currently in your cart.'
      }, { status: 400 })
    }

    // 3. Excluded Products Rule
    if (excludedProdIds.length > 0) {
      eligibleItems = eligibleItems.filter((item: any) => !excludedProdIds.includes(item.id))
    }

    // 4. Excluded Categories Rule
    if (excludedCatIds.length > 0) {
      eligibleItems = eligibleItems.filter((item: any) => {
        const catId = item.category_id || productCategoryMap[item.id]
        return !catId || !excludedCatIds.includes(catId)
      })
    }

    if (eligibleItems.length === 0) {
      return NextResponse.json({
        error: 'The items in your cart are excluded from this promotion.'
      }, { status: 400 })
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
