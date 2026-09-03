import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { verifyStaffAuth } from '@/utils/auth'

export const dynamic = 'force-dynamic'

// GET: Fetch all promo codes
export async function GET() {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Failed to fetch promo codes:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch promo codes' }, { status: 500 })
  }
}

// POST: Create promo code
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const {
      code,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount,
      usage_limit,
      per_user_limit,
      included_product_ids,
      excluded_product_ids,
      included_category_ids,
      excluded_category_ids,
      is_active,
      start_date,
      end_date
    } = body

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Promo code string is required' }, { status: 400 })
    }

    if (!discount_type || !['percentage', 'fixed', 'free_shipping'].includes(discount_type)) {
      return NextResponse.json({ error: 'Valid discount type (percentage, fixed, free_shipping) is required' }, { status: 400 })
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '')

    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        code: cleanCode,
        discount_type,
        discount_value: Number(discount_value || 0),
        min_order_amount: Number(min_order_amount || 0),
        max_discount: Number(max_discount || 0),
        usage_limit: Number(usage_limit || 0),
        per_user_limit: Number(per_user_limit || 0),
        usage_count: 0,
        included_product_ids: Array.isArray(included_product_ids) ? included_product_ids : [],
        excluded_product_ids: Array.isArray(excluded_product_ids) ? excluded_product_ids : [],
        included_category_ids: Array.isArray(included_category_ids) ? included_category_ids : [],
        excluded_category_ids: Array.isArray(excluded_category_ids) ? excluded_category_ids : [],
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        start_date: start_date ? new Date(start_date).toISOString() : new Date().toISOString(),
        end_date: end_date ? new Date(end_date).toISOString() : null
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A promo code with this name already exists' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Failed to create promo code:', error)
    return NextResponse.json({ error: error.message || 'Failed to create promo code' }, { status: 500 })
  }
}

// PUT: Update promo code
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const {
      id,
      code,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount,
      usage_limit,
      per_user_limit,
      included_product_ids,
      excluded_product_ids,
      included_category_ids,
      excluded_category_ids,
      is_active,
      start_date,
      end_date
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Promo code ID is required' }, { status: 400 })
    }

    const updates: Record<string, any> = {}

    if (code !== undefined) updates.code = code.trim().toUpperCase().replace(/\s+/g, '')
    if (discount_type !== undefined) updates.discount_type = discount_type
    if (discount_value !== undefined) updates.discount_value = Number(discount_value)
    if (min_order_amount !== undefined) updates.min_order_amount = Number(min_order_amount)
    if (max_discount !== undefined) updates.max_discount = Number(max_discount)
    if (usage_limit !== undefined) updates.usage_limit = Number(usage_limit)
    if (per_user_limit !== undefined) updates.per_user_limit = Number(per_user_limit)
    if (included_product_ids !== undefined) updates.included_product_ids = Array.isArray(included_product_ids) ? included_product_ids : []
    if (excluded_product_ids !== undefined) updates.excluded_product_ids = Array.isArray(excluded_product_ids) ? excluded_product_ids : []
    if (included_category_ids !== undefined) updates.included_category_ids = Array.isArray(included_category_ids) ? included_category_ids : []
    if (excluded_category_ids !== undefined) updates.excluded_category_ids = Array.isArray(excluded_category_ids) ? excluded_category_ids : []
    if (is_active !== undefined) updates.is_active = Boolean(is_active)
    if (start_date !== undefined) updates.start_date = start_date ? new Date(start_date).toISOString() : new Date().toISOString()
    if (end_date !== undefined) updates.end_date = end_date ? new Date(end_date).toISOString() : null

    const { data, error } = await supabase
      .from('promo_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Failed to update promo code:', error)
    return NextResponse.json({ error: error.message || 'Failed to update promo code' }, { status: 500 })
  }
}

// DELETE: Delete promo code
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Promo code ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete promo code:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete promo code' }, { status: 500 })
  }
}
