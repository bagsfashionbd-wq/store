import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { verifyStaffAuth } from '@/utils/auth'
import { getStoreSettings } from '@/utils/settings'
import { getPathaoToken, bookSteadfastConsignment } from '@/utils/courier'
import { sendOrderDispatchedEmail } from '@/utils/email'
import axios from 'axios'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin', 'staff'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const adminDb = createAdminClient()
    const { order_id, provider: requestedProvider } = await request.json()

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Fetch order
    const { data: order, error } = await adminDb
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const settings = await getStoreSettings()
    const shippingProvider = requestedProvider || order.shipping_provider || (settings.pathao_enabled ? 'pathao' : settings.steadfast_enabled ? 'steadfast' : 'manual')

    // Compute precise COD amount to collect
    let codAmount = 0
    if (order.payment_status === 'FullyPaid') {
      codAmount = 0
    } else if (order.payment_details?.advance_paid !== undefined) {
      codAmount = Math.max(0, Number(order.total_price) - Number(order.payment_details.advance_paid))
    } else if (order.payment_status === 'DeliveryChargePrePaid') {
      codAmount = Math.max(0, Number(order.total_price) - Number(order.delivery_charge))
    } else {
      // 100% COD or Unpaid
      codAmount = Number(order.total_price)
    }

    // Manual Dispatch Mode
    if (shippingProvider === 'manual') {
      await adminDb
        .from('orders')
        .update({
          shipping_provider: 'manual',
          pathao_status: 'dispatched',
          order_status: 'Shipped'
        })
        .eq('id', order.id)

      if (order.customer_email) {
        sendOrderDispatchedEmail({
          toEmail: order.customer_email,
          customerName: order.customer_name,
          orderId: order.id,
          courierName: 'Local Courier / Store Delivery',
          shippingAddress: order.shipping_address,
          totalPrice: Number(order.total_price),
          codAmount,
          paymentStatus: order.payment_status
        }).catch(err => console.error('[Email] Dispatch email error:', err))
      }

      return NextResponse.json({
        success: true,
        provider: 'manual'
      })
    }

    if (order.pathao_consignment_id || order.steadfast_consignment_id) {
      return NextResponse.json({ error: 'Consignment already booked for this order' }, { status: 400 })
    }

    // Steadfast Courier Dispatch
    if (shippingProvider === 'steadfast') {
      const steadfastResult = await bookSteadfastConsignment(order, codAmount)
      if (steadfastResult) {
        await adminDb
          .from('orders')
          .update({
            shipping_provider: 'steadfast',
            steadfast_consignment_id: steadfastResult.consignment_id,
            steadfast_tracking_code: steadfastResult.tracking_code,
            pathao_status: 'dispatched',
            order_status: 'Shipped'
          })
          .eq('id', order.id)

        if (order.customer_email) {
          sendOrderDispatchedEmail({
            toEmail: order.customer_email,
            customerName: order.customer_name,
            orderId: order.id,
            courierName: 'Steadfast Courier',
            consignmentId: steadfastResult.consignment_id,
            trackingCode: steadfastResult.tracking_code,
            shippingAddress: order.shipping_address,
            totalPrice: Number(order.total_price),
            codAmount,
            paymentStatus: order.payment_status
          }).catch(err => console.error('[Email] Steadfast dispatch email error:', err))
        }

        return NextResponse.json({
          success: true,
          provider: 'steadfast',
          consignment_id: steadfastResult.consignment_id,
          tracking_code: steadfastResult.tracking_code,
          cod_amount: codAmount
        })
      } else {
        return NextResponse.json(
          { error: 'Steadfast booking failed. Verify API Key and Secret Key in Settings.' },
          { status: 400 }
        )
      }
    }

    // Pathao Courier Dispatch
    const pathao_api_url = (settings.pathao_api_url || process.env.PATHAO_API_URL || 'https://courier-api-sandbox.pathao.com').replace(/\/$/, '')
    const pathao_store_id = settings.pathao_store_id || process.env.PATHAO_STORE_ID
    if (!pathao_store_id) {
      return NextResponse.json({ error: 'Pathao Store ID is missing. Select your store in Settings > Shipping.' }, { status: 400 })
    }

    const token = await getPathaoToken()

    const specialInstruction = codAmount > 0 
      ? `Collect COD ৳${codAmount} upon doorstep delivery.` 
      : 'Fully Prepaid Order. Collect ৳0 COD.'

    const response = await axios.post(`${pathao_api_url}/aladdin/api/v1/orders`, {
      store_id: Number(pathao_store_id),
      merchant_order_id: order.id,
      recipient_name: order.customer_name,
      recipient_phone: order.customer_phone,
      recipient_address: order.shipping_address,
      recipient_city: Number(order.city_id || 1),
      recipient_zone: Number(order.zone_id || 1),
      recipient_area: Number(order.area_id || 1),
      delivery_type: 48,
      item_type: 2,
      item_quantity: 1,
      item_weight: 0.5,
      amount_to_collect: codAmount,
      special_instruction: specialInstruction
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    if (response.data?.data?.consignment_id) {
      const consignmentId = response.data.data.consignment_id
      
      await adminDb
        .from('orders')
        .update({
          shipping_provider: 'pathao',
          pathao_consignment_id: consignmentId,
          pathao_status: 'dispatched',
          order_status: 'Shipped'
        })
        .eq('id', order.id)

      if (order.customer_email) {
        sendOrderDispatchedEmail({
          toEmail: order.customer_email,
          customerName: order.customer_name,
          orderId: order.id,
          courierName: 'Pathao Courier',
          consignmentId: consignmentId,
          shippingAddress: order.shipping_address,
          totalPrice: Number(order.total_price),
          codAmount,
          paymentStatus: order.payment_status
        }).catch(err => console.error('[Email] Pathao dispatch email error:', err))
      }

      return NextResponse.json({ 
        success: true, 
        provider: 'pathao', 
        consignment_id: consignmentId,
        cod_amount: codAmount
      })
    }

    return NextResponse.json({ error: 'Pathao API did not return consignment id' }, { status: 500 })

  } catch (error: any) {
    console.error('Manual Dispatch Error:', error.response?.data || error.message)
    let errorMessage = error.message || 'Dispatch failed'
    if (error.response?.data?.errors) {
      const validationErrors = Object.entries(error.response.data.errors)
        .map(([field, msgs]: any) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join('; ')
      errorMessage = `Courier validation failed: ${validationErrors}`
    } else if (error.response?.data?.message) {
      errorMessage = `Courier Error: ${error.response.data.message}`
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
