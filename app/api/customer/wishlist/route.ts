import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// Helper: get customer id from session
async function getAuthenticatedCustomerId() {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return null

  const adminDb = createAdminClient()
  const cleanEmail = user.email?.toLowerCase().trim() || ''

  const { data: customer } = await adminDb
    .from('customers')
    .select('id')
    .or(`user_id.eq.${user.id},email.ilike.${cleanEmail}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (customer?.id) return customer.id

  // Create customer row on demand if missing
  const { data: newCust } = await adminDb
    .from('customers')
    .insert({
      user_id: user.id,
      email: cleanEmail,
      full_name: user.user_metadata?.full_name || cleanEmail.split('@')[0],
      phone: user.user_metadata?.phone || ''
    })
    .select('id')
    .maybeSingle()

  return newCust?.id || user.id
}

// GET: Fetch customer wishlist
export async function GET() {
  try {
    const customerId = await getAuthenticatedCustomerId()
    if (!customerId) {
      return NextResponse.json({ wishlistIds: [], items: [] })
    }

    const adminDb = createAdminClient()
    const { data: wishlists, error } = await adminDb
      .from('wishlists')
      .select('product_id, products(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const wishlistIds = (wishlists || []).map((w: any) => w.product_id)
    const items = (wishlists || []).map((w: any) => w.products).filter(Boolean)

    return NextResponse.json({ wishlistIds, items })
  } catch (error: any) {
    console.error('Wishlist fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch wishlist' }, { status: 500 })
  }
}

// POST: Add product to wishlist
export async function POST(request: NextRequest) {
  try {
    const customerId = await getAuthenticatedCustomerId()
    if (!customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { product_id } = body

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const { data, error } = await adminDb
      .from('wishlists')
      .insert({
        customer_id: customerId,
        product_id
      })
      .select()
      .single()

    if (error && error.code !== '23505') { // Ignore unique constraint violation
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Wishlist add error:', error)
    return NextResponse.json({ error: error.message || 'Failed to add to wishlist' }, { status: 500 })
  }
}

// DELETE: Remove product from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const customerId = await getAuthenticatedCustomerId()
    if (!customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get('product_id')

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const { error } = await adminDb
      .from('wishlists')
      .delete()
      .eq('customer_id', customerId)
      .eq('product_id', product_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Wishlist delete error:', error)
    return NextResponse.json({ error: error.message || 'Failed to remove from wishlist' }, { status: 500 })
  }
}
