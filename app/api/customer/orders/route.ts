import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const userClient = await createClient()
    const { data: { user }, error: authErr } = await userClient.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = createAdminClient()
    const cleanEmail = user.email?.toLowerCase().trim() || ''

    // 1. Get customer record to also know customer phone
    const { data: customer } = await adminDb
      .from('customers')
      .select('*')
      .or(`user_id.eq.${user.id},email.ilike.${cleanEmail}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const conditions: string[] = [`user_id.eq.${user.id}`, `customer_email.ilike.${cleanEmail}`]

    if (customer?.id) {
      conditions.push(`customer_id.eq.${customer.id}`)
    }
    if (customer?.phone) {
      conditions.push(`customer_phone.eq.${customer.phone}`)
    }

    // 2. Fetch orders
    const { data: orders, error: ordersErr } = await adminDb
      .from('orders')
      .select('*, order_items(*, products(name, images, slug))')
      .or(conditions.join(','))
      .order('created_at', { ascending: false })

    if (ordersErr) throw ordersErr

    return NextResponse.json({ orders: orders || [] })
  } catch (error: any) {
    console.error('Customer orders fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch customer orders' }, { status: 500 })
  }
}
