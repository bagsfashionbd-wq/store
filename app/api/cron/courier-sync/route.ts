import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { checkSteadfastStatus, checkPathaoStatus } from '@/utils/courier'
import { restoreOrderInventory } from '@/utils/inventory'

export const dynamic = 'force-dynamic'

interface SyncItemResult {
  order_id: string
  provider: 'steadfast' | 'pathao'
  consignment_id: string
  tracking_code?: string
  raw_status: string
  old_order_status: string
  new_order_status: string
  old_payment_status: string
  new_payment_status: string
  status_changed: boolean
  collected_amount?: number
  delivery_fee?: number
  error?: string
}

function normalizeCourierStatus(rawStatus: string): {
  order_status?: 'Completed' | 'Delivered' | 'Cancelled' | 'Shipped'
  payment_status?: 'FullyPaid' | 'Failed' | 'Pending'
  courier_status_slug: string
} {
  const s = (rawStatus || '').toLowerCase().replace(/[-_]/g, ' ').trim()

  // 1. Delivered / Collected
  if (
    s.includes('delivered') ||
    s.includes('partial delivered') ||
    s.includes('payment invoice settled') ||
    s.includes('payment settled')
  ) {
    return {
      order_status: 'Completed',
      payment_status: 'FullyPaid',
      courier_status_slug: 'delivered'
    }
  }

  // 2. Returned / Cancelled
  if (
    s.includes('return') ||
    s.includes('cancelled') ||
    s.includes('canceled')
  ) {
    return {
      order_status: 'Cancelled',
      courier_status_slug: 'returned'
    }
  }

  // 3. Shipped / In-Transit / Picked
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
      courier_status_slug: 'in_transit'
    }
  }

  return { courier_status_slug: s || 'unknown' }
}

async function performCourierSync(): Promise<{
  success: boolean
  total_checked: number
  total_updated: number
  results: SyncItemResult[]
  timestamp: string
}> {
  const supabase = createAdminClient()

  // Fetch all active orders with courier consignments that are not finalized
  const { data: activeOrders, error } = await supabase
    .from('orders')
    .select('*')
    .or('steadfast_consignment_id.not.is.null,pathao_consignment_id.not.is.null')
    .neq('status', 'Delivered')
    .neq('status', 'Completed')
    .neq('status', 'Cancelled')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error(`Failed to query active courier orders: ${error.message}`)
  }

  const orders = activeOrders || []
  if (orders.length === 0) {
    return {
      success: true,
      total_checked: 0,
      total_updated: 0,
      results: [],
      timestamp: new Date().toISOString()
    }
  }

  const syncPromises = orders.map(async (order): Promise<SyncItemResult> => {
    const isSteadfast = Boolean(order.steadfast_consignment_id)
    const isPathao = Boolean(order.pathao_consignment_id)
    const provider: 'steadfast' | 'pathao' = isSteadfast ? 'steadfast' : 'pathao'
    const consignmentId = order.steadfast_consignment_id || order.pathao_consignment_id || ''
    const trackingCode = order.steadfast_tracking_code || ''

    const currentOrderStatus = order.order_status || order.status || 'Pending'
    const currentPaymentStatus = order.payment_status || 'Pending'

    try {
      let rawStatus = ''
      let collectedAmount: number | undefined
      let deliveryFee: number | undefined
      let rawResponse: any = {}

      if (isSteadfast) {
        const res = await checkSteadfastStatus(order.steadfast_consignment_id, trackingCode)
        rawStatus = res.delivery_status
        rawResponse = res.raw
      } else if (isPathao) {
        const res = await checkPathaoStatus(order.pathao_consignment_id)
        rawStatus = res.delivery_status
        rawResponse = res.raw
        if (res.raw?.collected_amount !== undefined) {
          collectedAmount = Number(res.raw.collected_amount)
        }
        if (res.raw?.delivery_fee !== undefined) {
          deliveryFee = Number(res.raw.delivery_fee)
        }
      }

      const mapping = normalizeCourierStatus(rawStatus)
      const newOrderStatus = mapping.order_status || currentOrderStatus
      const newPaymentStatus = mapping.payment_status || currentPaymentStatus

      const statusChanged = Boolean(
        (mapping.order_status && mapping.order_status !== currentOrderStatus) ||
        (mapping.payment_status && mapping.payment_status !== currentPaymentStatus)
      )

      if (statusChanged) {
        // If order returned/cancelled -> automatically restore inventory
        if (currentOrderStatus !== 'Cancelled' && mapping.order_status === 'Cancelled') {
          try {
            await restoreOrderInventory(supabase, order.id)
          } catch (invErr) {
            console.error(`Failed to restore inventory for order ${order.id}:`, invErr)
          }
        }

        const updatedPaymentDetails = {
          ...(order.payment_details || {}),
          courier_sync: {
            provider,
            raw_status: rawStatus,
            courier_status_slug: mapping.courier_status_slug,
            collected_amount: collectedAmount,
            delivery_fee: deliveryFee,
            last_synced_at: new Date().toISOString()
          }
        }

        const updatePayload: Record<string, any> = {
          order_status: newOrderStatus,
          status: newOrderStatus,
          payment_details: updatedPaymentDetails
        }

        if (mapping.payment_status) {
          updatePayload.payment_status = mapping.payment_status
        }
        if (mapping.courier_status_slug) {
          updatePayload.pathao_status = mapping.courier_status_slug
        }

        await supabase
          .from('orders')
          .update(updatePayload)
          .eq('id', order.id)
      }

      return {
        order_id: order.id,
        provider,
        consignment_id: consignmentId,
        tracking_code: trackingCode || undefined,
        raw_status: rawStatus,
        old_order_status: currentOrderStatus,
        new_order_status: newOrderStatus,
        old_payment_status: currentPaymentStatus,
        new_payment_status: newPaymentStatus,
        status_changed: statusChanged,
        collected_amount: collectedAmount,
        delivery_fee: deliveryFee
      }
    } catch (err: any) {
      console.error(`Error syncing order ${order.id} with ${provider}:`, err.message)
      return {
        order_id: order.id,
        provider,
        consignment_id: consignmentId,
        raw_status: '',
        old_order_status: currentOrderStatus,
        new_order_status: currentOrderStatus,
        old_payment_status: currentPaymentStatus,
        new_payment_status: currentPaymentStatus,
        status_changed: false,
        error: err.message || 'Courier API query failed'
      }
    }
  })

  const settledResults = await Promise.all(syncPromises)
  const totalUpdated = settledResults.filter((r) => r.status_changed).length

  return {
    success: true,
    total_checked: settledResults.length,
    total_updated: totalUpdated,
    results: settledResults,
    timestamp: new Date().toISOString()
  }
}

// GET: Handled by Cron runner (e.g. cron-job.org / Vercel / External Scheduler)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 })
      }
    }

    const summary = await performCourierSync()
    return NextResponse.json(summary)
  } catch (err: any) {
    console.error('Courier sync cron GET error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Courier sync failed' }, { status: 500 })
  }
}

// POST: Triggered on-demand by Admin or Webhooks
export async function POST(request: NextRequest) {
  try {
    const summary = await performCourierSync()
    return NextResponse.json(summary)
  } catch (err: any) {
    console.error('Courier sync cron POST error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Courier sync failed' }, { status: 500 })
  }
}
