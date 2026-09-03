import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { verifyStaffAuth } from '@/utils/auth'
import { checkSteadfastStatus, checkPathaoStatus } from '@/utils/courier'
import { restoreOrderInventory } from '@/utils/inventory'

export const dynamic = 'force-dynamic'

interface SyncResult {
  order_id: string
  provider: string
  consignment_id: string
  raw_status: string
  new_order_status: string
  status_changed: boolean
  error?: string
}

function mapCourierStatusToOrderStatus(rawStatus: string): {
  order_status?: 'Completed' | 'Delivered' | 'Cancelled' | 'Shipped'
  payment_status?: 'FullyPaid' | 'Failed' | 'Pending'
  pathao_status?: string
} {
  const s = rawStatus.toLowerCase().replace(/[-_]/g, ' ').trim()

  // 1. Delivered / Completed (Courier collected COD and handed over parcel)
  if (
    s.includes('delivered') ||
    s.includes('partial delivered') ||
    s.includes('payment invoice settled') ||
    s.includes('payment settled')
  ) {
    return {
      order_status: 'Completed',
      payment_status: 'FullyPaid',
      pathao_status: 'delivered'
    }
  }

  // 2. Cancelled / Returned
  if (
    s.includes('return') ||
    s.includes('cancelled') ||
    s.includes('canceled')
  ) {
    return {
      order_status: 'Cancelled',
      pathao_status: 'returned'
    }
  }

  // 3. In Transit / Shipped
  if (
    s.includes('transit') ||
    s.includes('picked') ||
    s.includes('in review') ||
    s.includes('pending') ||
    s.includes('hold') ||
    s.includes('on the way')
  ) {
    return {
      order_status: 'Shipped',
      pathao_status: 'in_transit'
    }
  }

  return {}
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin', 'staff'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json().catch(() => ({}))
    const { order_id, bulk } = body

    const adminDb = createAdminClient()
    let ordersToSync: any[] = []

    if (order_id) {
      const { data: order, error } = await adminDb
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single()

      if (error || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      ordersToSync = [order]
    } else if (bulk) {
      // Find orders with active consignments that aren't finalized yet
      const { data: orders, error } = await adminDb
        .from('orders')
        .select('*')
        .or('steadfast_consignment_id.not.is.null,pathao_consignment_id.not.is.null')
        .neq('status', 'Delivered')
        .neq('status', 'Completed')
        .neq('status', 'Cancelled')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      ordersToSync = orders || []
    } else {
      return NextResponse.json({ error: 'Please specify order_id or bulk: true' }, { status: 400 })
    }

    if (ordersToSync.length === 0) {
      return NextResponse.json({ success: true, message: 'No active booked orders to sync', results: [] })
    }

    const results: SyncResult[] = []

    for (const order of ordersToSync) {
      const provider = order.shipping_provider || (order.steadfast_consignment_id ? 'steadfast' : order.pathao_consignment_id ? 'pathao' : null)
      const consignmentId = order.steadfast_consignment_id || order.pathao_consignment_id

      if (!provider || !consignmentId) {
        results.push({
          order_id: order.id,
          provider: 'none',
          consignment_id: '',
          raw_status: '',
          new_order_status: order.order_status || order.status,
          status_changed: false,
          error: 'No consignment ID found'
        })
        continue
      }

      try {
        let rawStatus = ''
        if (provider === 'steadfast' || order.steadfast_consignment_id) {
          const res = await checkSteadfastStatus(order.steadfast_consignment_id, order.steadfast_tracking_code)
          rawStatus = res.delivery_status
        } else if (provider === 'pathao' || order.pathao_consignment_id) {
          const res = await checkPathaoStatus(order.pathao_consignment_id)
          rawStatus = res.delivery_status
        }

        const mapping = mapCourierStatusToOrderStatus(rawStatus)
        const oldStatus = order.order_status || order.status || 'Pending'
        const oldPaymentStatus = order.payment_status || 'Pending'
        const newStatus = mapping.order_status || oldStatus
        const newPaymentStatus = mapping.payment_status || oldPaymentStatus
        const statusChanged = Boolean((mapping.order_status && mapping.order_status !== oldStatus) || (mapping.payment_status && mapping.payment_status !== oldPaymentStatus))

        if (statusChanged) {
          // If status moved to Cancelled/Returned -> restore stock
          if (oldStatus !== 'Cancelled' && mapping.order_status === 'Cancelled') {
            await restoreOrderInventory(adminDb, order.id)
          }

          const updatePayload: Record<string, any> = {
            updated_at: new Date().toISOString()
          }
          if (mapping.order_status) {
            updatePayload.order_status = mapping.order_status
            updatePayload.status = mapping.order_status
          }
          if (mapping.payment_status) {
            updatePayload.payment_status = mapping.payment_status
          }
          if (mapping.pathao_status) {
            updatePayload.pathao_status = mapping.pathao_status
          }

          await adminDb
            .from('orders')
            .update(updatePayload)
            .eq('id', order.id)
        }

        results.push({
          order_id: order.id,
          provider,
          consignment_id: consignmentId,
          raw_status: rawStatus,
          new_order_status: newStatus,
          status_changed: statusChanged
        })
      } catch (syncErr: any) {
        console.error(`Sync error for order ${order.id}:`, syncErr.message)
        results.push({
          order_id: order.id,
          provider,
          consignment_id: consignmentId,
          raw_status: '',
          new_order_status: order.order_status,
          status_changed: false,
          error: syncErr.message || 'Courier API check failed'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${results.length} order(s)`,
      results
    })
  } catch (error: any) {
    console.error('Courier Sync Route Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
