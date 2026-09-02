import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { getStoreSettings } from '@/utils/settings'
import { bookSteadfastConsignment } from '@/utils/courier'
import axios from 'axios'

export const dynamic = 'force-dynamic'

// POST: Manual dispatch from Admin
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { order_id } = await request.json()

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const codAmount = order.payment_method === 'COD'
      ? Number(order.total_price) - Number(order.delivery_charge)
      : 0

    const bookingResult = await bookSteadfastConsignment(order, codAmount)

    if (bookingResult) {
      await supabase
        .from('orders')
        .update({
          shipping_provider: 'steadfast',
          steadfast_consignment_id: bookingResult.consignment_id,
          steadfast_tracking_code: bookingResult.tracking_code,
          pathao_status: 'dispatched'
        })
        .eq('id', order_id)

      return NextResponse.json({
        success: true,
        consignment_id: bookingResult.consignment_id,
        tracking_code: bookingResult.tracking_code
      })
    } else {
      return NextResponse.json(
        { error: 'Steadfast booking failed. Verify API Key & Secret Key in Settings.' },
        { status: 400 }
      )
    }
  } catch (err: any) {
    console.error('Steadfast Route Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// GET: Check tracking status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cid = searchParams.get('cid')
  const trackingCode = searchParams.get('tracking_code')

  const settings = await getStoreSettings()
  const { steadfast_api_key, steadfast_secret_key, steadfast_base_url } = settings

  if (!steadfast_api_key || !steadfast_secret_key) {
    return NextResponse.json({ error: 'Steadfast credentials not configured' }, { status: 400 })
  }

  const baseUrl = steadfast_base_url?.replace(/\/$/, '') || 'https://portal.steadfast.com.bd/api/v1'

  try {
    let endpoint = ''
    if (cid) {
      endpoint = `${baseUrl}/status_by_cid/${cid}`
    } else if (trackingCode) {
      endpoint = `${baseUrl}/status_by_trackingcode/${trackingCode}`
    } else {
      return NextResponse.json({ error: 'Please provide cid or tracking_code' }, { status: 400 })
    }

    const response = await axios.get(endpoint, {
      headers: {
        'Api-Key': steadfast_api_key,
        'Secret-Key': steadfast_secret_key
      }
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Steadfast Track Error:', error.response?.data || error.message)
    return NextResponse.json({ error: 'Failed to fetch Steadfast status' }, { status: 500 })
  }
}
