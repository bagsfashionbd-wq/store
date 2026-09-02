import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { getStoreSettings } from '@/utils/settings'
import { bookPathaoConsignment, bookSteadfastConsignment } from '@/utils/courier'
import { sendInvoiceEmail } from '@/utils/email'
import axios from 'axios'

export const dynamic = 'force-dynamic'

// 1. GET BKASH AUTHENTICATION TOKEN (Using DB Settings)
async function getBkashToken() {
  const settings = await getStoreSettings()
  const BKASH_API_URL = settings.bkash_api_url || process.env.BKASH_API_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
  const BKASH_APP_KEY = settings.bkash_app_key || process.env.BKASH_APP_KEY
  const BKASH_APP_SECRET = settings.bkash_app_secret || process.env.BKASH_APP_SECRET
  const BKASH_USERNAME = settings.bkash_username || process.env.BKASH_USERNAME
  const BKASH_PASSWORD = settings.bkash_password || process.env.BKASH_PASSWORD

  if (!BKASH_APP_KEY || !BKASH_APP_SECRET || !BKASH_USERNAME || !BKASH_PASSWORD) {
    throw new Error('bKash credentials are not configured in settings.')
  }

  try {
    const response = await axios.post(`${BKASH_API_URL}/tokenized/checkout/token/grant`, {
      app_key: BKASH_APP_KEY,
      app_secret: BKASH_APP_SECRET
    }, {
      headers: {
        username: BKASH_USERNAME,
        password: BKASH_PASSWORD,
        'Content-Type': 'application/json'
      }
    })
    return response.data.id_token
  } catch (error: any) {
    console.error('bKash Token Grant Error:', error.response?.data || error.message)
    throw new Error('bKash Authentication Failed')
  }
}

// 2. API POST: CREATE OR RETRY BKASH PAYMENT
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const settings = await getStoreSettings()
    const body = await request.json()

    // Branch 1: RETRY PAYMENT FOR EXISTING ORDER
    if (body.action === 'retry' && body.order_id) {
      const { data: existingOrder, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', body.order_id)
        .single()

      if (fetchErr || !existingOrder) {
        return NextResponse.json({ error: 'Order not found for payment retry' }, { status: 404 })
      }

      const paymentAmount = existingOrder.payment_method === 'COD' 
        ? existingOrder.delivery_charge 
        : existingOrder.total_price

      const BKASH_API_URL = settings.bkash_api_url || process.env.BKASH_API_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
      const BKASH_APP_KEY = settings.bkash_app_key || process.env.BKASH_APP_KEY
      const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const token = await getBkashToken()

      const bkashResponse = await axios.post(`${BKASH_API_URL}/tokenized/checkout/create`, {
        mode: '0011',
        payerReference: existingOrder.customer_phone,
        callbackURL: `${NEXT_PUBLIC_APP_URL}/api/bkash?order_id=${existingOrder.id}&method=${existingOrder.payment_method}&is_retry=true`,
        amount: Number(paymentAmount).toFixed(2),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: existingOrder.id
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-app-key': BKASH_APP_KEY
        }
      })

      if (bkashResponse.data?.bkashURL) {
        return NextResponse.json({ 
          checkoutUrl: bkashResponse.data.bkashURL, 
          orderId: existingOrder.id 
        })
      }

      return NextResponse.json({ error: 'Failed to generate bKash payment URL' }, { status: 500 })
    }

    // Branch 2: NEW ORDER CREATION
    const { 
      customer_id,
      customer_name, 
      customer_phone, 
      customer_email, 
      shipping_address, 
      shipping_provider = settings.active_shipping_provider || 'pathao',
      city_id = 0, 
      zone_id = 0, 
      area_id = 0, 
      city_name,
      zone_name,
      area_name,
      delivery_charge, 
      total_price, 
      payment_method,
      promo_code,
      promo_code_id,
      discount_amount = 0,
      sender_number,
      transaction_id,
      cartItems 
    } = body

    if (!customer_name || !customer_phone || !shipping_address || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Missing required order details' }, { status: 400 })
    }

    const isBkashPersonal = payment_method === 'BKASH_PERSONAL'
    const initialPaymentStatus = isBkashPersonal ? 'Pending Verification' : 'Pending'

    // Step A: Insert order in Supabase database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customer_id || null,
        customer_name,
        customer_phone,
        customer_email,
        shipping_address,
        shipping_provider,
        city_id: Number(city_id || 0),
        zone_id: Number(zone_id || 0),
        area_id: Number(area_id || 0),
        delivery_charge,
        total_price,
        payment_method,
        payment_status: initialPaymentStatus,
        promo_code: promo_code || '',
        promo_code_id: promo_code_id || null,
        discount_amount: Number(discount_amount || 0),
        payment_details: {
          sender_number: sender_number || '',
          transaction_id: transaction_id || '',
          shipping_metadata: {
            city_name,
            zone_name,
            area_name,
            shipping_provider
          }
        }
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order record' }, { status: 500 })
    }

    // Auto-save delivery address for logged-in customer
    if (customer_id && shipping_address) {
      await supabase
        .from('customers')
        .update({
          address: shipping_address,
          city_id: Number(city_id || 0),
          zone_id: Number(zone_id || 0),
          area_id: Number(area_id || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', customer_id)
    }

    // Step B: Save order items
    const orderItemsPayload = cartItems.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
      selected_variations: item.selectedVariations
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload)

    if (itemsError) {
      console.error('Order items insertion error:', itemsError)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    // Step C: If promo code used, increment usage_count
    if (promo_code_id) {
      try {
        const { data: promoData } = await supabase.from('promo_codes').select('usage_count').eq('id', promo_code_id).single()
        if (promoData) {
          await supabase.from('promo_codes').update({ usage_count: (promoData.usage_count || 0) + 1 }).eq('id', promo_code_id)
        }
      } catch (err) {
        console.error('Failed to increment promo code usage count:', err)
      }
    }

    // Step D: Helper to decrement inventory stock
    const decrementInventory = async () => {
      for (const item of cartItems) {
        if (!item.id) continue
        const { data: prod } = await supabase
          .from('products')
          .select('id, stock, variations')
          .eq('id', item.id)
          .single()

        if (prod) {
          let updatedVariations = prod.variations
          if (updatedVariations && typeof updatedVariations === 'object' && Array.isArray(updatedVariations.options)) {
            const selectedVar = item.selectedVariations as Record<string, string> || {}
            updatedVariations.options = updatedVariations.options.map((opt: any) => {
              const selectedVal = selectedVar[opt.name] || selectedVar[opt.name?.toLowerCase()]
              if (selectedVal && Array.isArray(opt.values)) {
                opt.values = opt.values.map((v: any) => {
                  if (v.label === selectedVal && typeof v.stock === 'number') {
                    v.stock = Math.max(0, v.stock - item.quantity)
                  }
                  return v
                })
              }
              return opt
            })

            const primaryOpt = updatedVariations.options[0]
            const totalStock = primaryOpt && Array.isArray(primaryOpt.values)
              ? primaryOpt.values.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
              : Math.max(0, prod.stock - item.quantity)

            await supabase
              .from('products')
              .update({ stock: totalStock, variations: updatedVariations })
              .eq('id', item.id)
          } else {
            await supabase.rpc('decrement_product_stock', {
              prod_id: item.id,
              qty: item.quantity
            })
          }
        }
      }
    }

    // Step E: If bKash Personal (Send Money)
    if (isBkashPersonal) {
      await decrementInventory()

      // Send invoice confirmation email
      if (customer_email) {
        sendInvoiceEmail({
          toEmail: customer_email,
          customerName: customer_name,
          orderId: order.id,
          createdAt: order.created_at,
          shippingAddress: shipping_address,
          customerPhone: customer_phone,
          paymentMethod: 'bKash Personal (Send Money)',
          paymentStatus: 'Pending Verification',
          deliveryCharge: Number(delivery_charge),
          totalPrice: Number(total_price),
          discountAmount: Number(discount_amount || 0),
          items: cartItems.map((c: any) => ({
            name: c.name,
            quantity: c.quantity,
            price: Number(c.price),
            selectedVariations: c.selectedVariations
          }))
        }).catch((err) => console.error('Error sending bKash Personal invoice email:', err))
      }

      return NextResponse.json({
        checkoutUrl: `/order/confirmation?order_id=${order.id}`,
        orderId: order.id
      })
    }

    // Step F: If COD (without prepayment OR with bKash Personal advance prepay):
    const isPersonalPrepay = payment_method === 'COD' && settings.cod_prepay_delivery && (sender_number || transaction_id || (settings.bkash_personal_enabled && !settings.bkash_enabled))
    if (payment_method === 'COD' && (!settings.cod_prepay_delivery || isPersonalPrepay)) {
      await decrementInventory()

      // If advance delivery prepayment was sent via bKash Personal, update advance_paid in order row
      if (isPersonalPrepay) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'Pending Verification',
            payment_details: {
              sender_number: sender_number || '',
              transaction_id: transaction_id || '',
              advance_paid: Number(delivery_charge),
              shipping_metadata: {
                city_name,
                zone_name,
                area_name,
                shipping_provider
              }
            }
          })
          .eq('id', order.id)
      }

      // Send immediate invoice email for COD orders
      if (customer_email) {
        sendInvoiceEmail({
          toEmail: customer_email,
          customerName: customer_name,
          orderId: order.id,
          createdAt: order.created_at,
          shippingAddress: shipping_address,
          customerPhone: customer_phone,
          paymentMethod: isPersonalPrepay ? 'Cash on Delivery (Advance Paid via bKash)' : 'Cash on Delivery (100%)',
          paymentStatus: isPersonalPrepay ? 'Advance Paid (Pending Verification)' : 'Pending',
          deliveryCharge: Number(delivery_charge),
          totalPrice: Number(total_price),
          discountAmount: Number(discount_amount || 0),
          items: cartItems.map((c: any) => ({
            name: c.name,
            quantity: c.quantity,
            price: Number(c.price),
            selectedVariations: c.selectedVariations
          }))
        }).catch((err) => console.error('Error sending COD invoice email:', err))
      }

      return NextResponse.json({
        checkoutUrl: `/order/confirmation?order_id=${order.id}`,
        orderId: order.id
      })
    }

    // Step G: Determine bKash Merchant payment amount (delivery charge for COD with prepayment, full amount for BKASH)
    const paymentAmount = payment_method === 'COD' ? delivery_charge : total_price

    // Step E: Create bKash Payment link
    const BKASH_API_URL = settings.bkash_api_url || process.env.BKASH_API_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
    const BKASH_APP_KEY = settings.bkash_app_key || process.env.BKASH_APP_KEY
    const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const token = await getBkashToken()

    const bkashResponse = await axios.post(`${BKASH_API_URL}/tokenized/checkout/create`, {
      mode: '0011',
      payerReference: customer_phone,
      callbackURL: `${NEXT_PUBLIC_APP_URL}/api/bkash?order_id=${order.id}&method=${payment_method}`,
      amount: Number(paymentAmount).toFixed(2),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: order.id
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-app-key': BKASH_APP_KEY
      }
    })

    if (bkashResponse.data?.bkashURL) {
      return NextResponse.json({ 
        checkoutUrl: bkashResponse.data.bkashURL, 
        orderId: order.id 
      })
    }

    return NextResponse.json({ error: 'Failed to generate bKash payment URL' }, { status: 500 })

  } catch (error: any) {
    console.error('Create Payment Error:', error.message)
    return NextResponse.json({ error: error.message || 'Payment initiation failed' }, { status: 500 })
  }
}

// 3. API GET: BKASH REDIRECT CALLBACK & EXECUTE PAYMENT
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const paymentID = searchParams.get('paymentID')
  const status = searchParams.get('status')
  const orderId = searchParams.get('order_id')
  const method = searchParams.get('method')
  const isRetry = searchParams.get('is_retry') === 'true'

  const settings = await getStoreSettings()
  const BKASH_API_URL = settings.bkash_api_url || process.env.BKASH_API_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
  const BKASH_APP_KEY = settings.bkash_app_key || process.env.BKASH_APP_KEY
  const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const supabase = createAdminClient()

  if (!orderId) {
    return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/order/failed?error=MissingOrderId`)
  }

  if (status !== 'success' || !paymentID) {
    await supabase.from('orders').update({ payment_status: 'Failed' }).eq('id', orderId)
    return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/order/failed?order_id=${orderId}&reason=${status || 'PaymentCancelled'}&is_retry=${isRetry}`)
  }

  try {
    const token = await getBkashToken()

    const executeResponse = await axios.post(`${BKASH_API_URL}/tokenized/checkout/execute`, {
      paymentID
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-app-key': BKASH_APP_KEY
      }
    })

    const result = executeResponse.data

    if (result.statusCode === '0000' && result.transactionStatus === 'Completed') {
      const paymentStatus = method === 'COD' ? 'DeliveryChargePrePaid' : 'FullyPaid'

      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      const codAmount = method === 'COD' 
        ? Number(order.total_price) - Number(order.delivery_charge) 
        : 0

      const shippingProvider = order.shipping_provider || settings.active_shipping_provider || 'pathao'
      let pathaoConsignmentId: string | null = null
      let steadfastConsignmentId: string | null = null
      let steadfastTrackingCode: string | null = null

      if (shippingProvider === 'steadfast') {
        const steadfastResult = await bookSteadfastConsignment(order, codAmount)
        if (steadfastResult) {
          steadfastConsignmentId = steadfastResult.consignment_id
          steadfastTrackingCode = steadfastResult.tracking_code
        }
      } else {
        pathaoConsignmentId = await bookPathaoConsignment(order, codAmount)
      }

      await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          shipping_provider: shippingProvider,
          payment_details: {
            ...(order.payment_details || {}),
            trx_id: result.trxID,
            payment_id: result.paymentID,
            amount: result.amount,
            customer_bkash_number: result.customerMsisdn,
            payload: result
          },
          pathao_consignment_id: pathaoConsignmentId,
          pathao_status: (pathaoConsignmentId || steadfastConsignmentId) ? 'dispatched' : 'pending',
          steadfast_consignment_id: steadfastConsignmentId,
          steadfast_tracking_code: steadfastTrackingCode
        })
        .eq('id', orderId)

      // Decrement stock
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, quantity, selected_variations')
        .eq('order_id', orderId)

      if (items) {
        for (const item of items) {
          if (!item.product_id) continue

          const { data: prod } = await supabase
            .from('products')
            .select('id, stock, variations')
            .eq('id', item.product_id)
            .single()

          if (prod) {
            let updatedVariations = prod.variations

            if (updatedVariations && typeof updatedVariations === 'object' && Array.isArray(updatedVariations.options)) {
              const selectedVar = item.selected_variations as Record<string, string> || {}
              updatedVariations.options = updatedVariations.options.map((opt: any) => {
                const selectedVal = selectedVar[opt.name] || selectedVar[opt.name?.toLowerCase()]
                if (selectedVal && Array.isArray(opt.values)) {
                  opt.values = opt.values.map((v: any) => {
                    if (v.label === selectedVal && typeof v.stock === 'number') {
                      v.stock = Math.max(0, v.stock - item.quantity)
                    }
                    return v
                  })
                }
                return opt
              })

              const primaryOpt = updatedVariations.options[0]
              const totalStock = primaryOpt && Array.isArray(primaryOpt.values)
                ? primaryOpt.values.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
                : Math.max(0, prod.stock - item.quantity)

              await supabase
                .from('products')
                .update({
                  stock: totalStock,
                  variations: updatedVariations
                })
                .eq('id', item.product_id)
            } else {
              await supabase.rpc('decrement_product_stock', {
                prod_id: item.product_id,
                qty: item.quantity
              })
            }
          }
        }
      }

      // Send invoice email asynchronously if customer provided email
      if (order?.customer_email) {
        const { data: fullItems } = await supabase
          .from('order_items')
          .select('*, products(name)')
          .eq('order_id', orderId)

        sendInvoiceEmail({
          toEmail: order.customer_email,
          customerName: order.customer_name,
          orderId: order.id,
          createdAt: order.created_at,
          shippingAddress: order.shipping_address,
          customerPhone: order.customer_phone,
          paymentMethod: `bKash Online (${paymentStatus})`,
          paymentStatus: paymentStatus,
          deliveryCharge: Number(order.delivery_charge),
          totalPrice: Number(order.total_price),
          discountAmount: Number(order.discount_amount || 0),
          items: (fullItems || []).map((c: any) => ({
            name: c.products?.name || 'Product',
            quantity: c.quantity,
            price: Number(c.price),
            selectedVariations: c.selected_variations
          }))
        }).catch((err) => console.error('Error sending invoice email in bKash callback:', err))
      }

      return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/order/confirmation?order_id=${orderId}&trx_id=${result.trxID}`)

    } else {
      console.error('bKash Execution Failure Status:', result)
      await supabase.from('orders').update({ payment_status: 'Failed', payment_details: result }).eq('id', orderId)
      return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/order/failed?order_id=${orderId}&reason=${result.statusMessage || 'ExecutionFailed'}&is_retry=${isRetry}`)
    }

  } catch (error: any) {
    console.error('bKash Execute Callback Exception:', error.message)
    await supabase.from('orders').update({ payment_status: 'Failed' }).eq('id', orderId)
    return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/order/failed?order_id=${orderId}&reason=ServerError&is_retry=${isRetry}`)
  }
}
