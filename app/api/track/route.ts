import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { checkSteadfastStatus, checkPathaoStatus } from '@/utils/courier'
import { restoreOrderInventory } from '@/utils/inventory'

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

    // Live Sync with Courier for active shipments
    if (orders.length > 0) {
      for (const order of orders) {
        const isCompleted = order.order_status === 'Completed' || order.order_status === 'Delivered' || order.order_status === 'Cancelled'
        const hasConsignment = order.steadfast_consignment_id || order.pathao_consignment_id

        if (!isCompleted && hasConsignment) {
          try {
            let deliveryStatus = ''
            if (order.steadfast_consignment_id) {
              const res = await checkSteadfastStatus(order.steadfast_consignment_id, order.steadfast_tracking_code)
              deliveryStatus = res.delivery_status
            } else if (order.pathao_consignment_id) {
              const res = await checkPathaoStatus(order.pathao_consignment_id)
              deliveryStatus = res.delivery_status
            }

            const s = deliveryStatus.toLowerCase().replace(/[-_]/g, ' ').trim()

            if (s.includes('delivered') || s.includes('partial delivered') || s.includes('payment invoice settled') || s.includes('payment settled')) {
              order.order_status = 'Completed'
              order.payment_status = 'FullyPaid'
              order.pathao_status = 'delivered'
              await adminDb.from('orders').update({
                order_status: 'Completed',
                payment_status: 'FullyPaid',
                pathao_status: 'delivered'
              }).eq('id', order.id)
            } else if (s.includes('return') || s.includes('cancelled') || s.includes('canceled')) {
              if (order.order_status !== 'Cancelled') {
                await restoreOrderInventory(adminDb, order.id)
              }
              order.order_status = 'Cancelled'
              order.pathao_status = 'returned'
              await adminDb.from('orders').update({
                order_status: 'Cancelled',
                pathao_status: 'returned'
              }).eq('id', order.id)
            }
          } catch (err: any) {
            console.warn(`Track live courier sync failed for ${order.id}:`, err.message)
          }
        }
      }
    }

    return NextResponse.json({ success: true, orders })

  } catch (error: any) {
    console.error('Order tracking API error:', error)
    return NextResponse.json({ error: error.message || 'Error looking up order' }, { status: 500 })
  }
}
