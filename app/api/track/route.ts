import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawQuery = (searchParams.get('query') || '').trim()

    if (!rawQuery || rawQuery.length < 3) {
      return NextResponse.json({ error: 'Please enter a valid Order ID or Phone number' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Clean phone query if numeric
    const isNumericQuery = /^[\d\s+\-()]{6,}$/.test(rawQuery)
    const digitsOnly = rawQuery.replace(/\D/g, '')

    let orders: any[] = []

    if (isNumericQuery && digitsOnly.length >= 6) {
      // Search by phone number (e.g. 017XXXXXXXX or last 6+ digits)
      const { data, error } = await adminDb
        .from('orders')
        .select('*, order_items(*, products(name, images))')
        .ilike('customer_phone', `%${digitsOnly}%`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Track by phone error:', error)
      } else if (data) {
        orders = data
      }
    } else {
      // Check if full UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawQuery)

      if (isUUID) {
        const { data, error } = await adminDb
          .from('orders')
          .select('*, order_items(*, products(name, images))')
          .eq('id', rawQuery)
          .limit(1)

        if (error) {
          console.error('Track by UUID error:', error)
        } else if (data) {
          orders = data
        }
      } else {
        // Short ID prefix search (e.g. 8 characters)
        const cleanQuery = rawQuery.toLowerCase()
        const { data, error } = await adminDb
          .from('orders')
          .select('*, order_items(*, products(name, images))')
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) {
          console.error('Track prefix error:', error)
        } else if (data) {
          orders = data.filter((o: any) => 
            o.id.toLowerCase().startsWith(cleanQuery) || 
            o.id.replace(/-/g, '').toLowerCase().startsWith(cleanQuery) ||
            (o.customer_phone && o.customer_phone.includes(rawQuery))
          )
        }
      }
    }

    return NextResponse.json({ success: true, orders })

  } catch (error: any) {
    console.error('Order tracking API error:', error)
    return NextResponse.json({ error: error.message || 'Error looking up order' }, { status: 500 })
  }
}
