import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const userClient = await createClient()

    // Check if user is authenticated and is admin
    const { data: { user } } = await userClient.auth.getUser()
    const adminEmail = 'admin@example.com'
    if (!user || (user.email !== adminEmail && !user.email?.includes('admin') && user.email !== 'sakib.samadhan@gmail.com')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      id, 
      customer_name, 
      customer_phone, 
      customer_email,
      shipping_address, 
      city_id, 
      zone_id, 
      area_id,
      city_name,
      zone_name,
      area_name,
      delivery_charge,
      order_status,
      payment_status,
      advance_paid,
      items, // array of { id, quantity, price }
      deleted_item_ids // array of string IDs to remove
    } = body

    if (!id || !customer_name || !customer_phone || !shipping_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // 1. Fetch existing order
    const { data: existingOrder, error: fetchError } = await adminDb
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single()

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 2. Handle deleted item IDs
    if (Array.isArray(deleted_item_ids) && deleted_item_ids.length > 0) {
      const { error: deleteError } = await adminDb
        .from('order_items')
        .delete()
        .in('id', deleted_item_ids)
        .eq('order_id', id)

      if (deleteError) {
        console.error('Failed to delete order items:', deleteError)
      }
    }

    // 3. Update existing item quantities & prices
    let itemsSubtotal = 0
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const qty = Math.max(1, Number(item.quantity || 1))
        const price = Number(item.price || 0)
        itemsSubtotal += price * qty

        if (item.id) {
          await adminDb
            .from('order_items')
            .update({
              quantity: qty,
              price: price
            })
            .eq('id', item.id)
            .eq('order_id', id)
        }
      }
    } else {
      // If items array not provided, calculate subtotal from existing order_items
      itemsSubtotal = (existingOrder.order_items || []).reduce((sum: number, it: any) => {
        if (deleted_item_ids?.includes(it.id)) return sum
        return sum + Number(it.price) * Number(it.quantity)
      }, 0)
    }

    const parsedDeliveryCharge = Number(delivery_charge !== undefined ? delivery_charge : existingOrder.delivery_charge)
    const newTotalPrice = itemsSubtotal + parsedDeliveryCharge

    // 4. Update payment_details with shipping metadata and custom advance_paid
    const paymentDetails = existingOrder.payment_details || {}
    paymentDetails.shipping_metadata = {
      ...(paymentDetails.shipping_metadata || {}),
      city_name: city_name || paymentDetails.shipping_metadata?.city_name || '',
      zone_name: zone_name || paymentDetails.shipping_metadata?.zone_name || '',
      area_name: area_name || paymentDetails.shipping_metadata?.area_name || ''
    }

    if (advance_paid !== undefined) {
      paymentDetails.advance_paid = Number(advance_paid)
    }

    // 5. Update the main order row
    const updatePayload: Record<string, any> = {
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      shipping_address,
      delivery_charge: parsedDeliveryCharge,
      total_price: newTotalPrice,
      payment_details: paymentDetails
    }

    if (city_id !== undefined) updatePayload.city_id = Number(city_id)
    if (zone_id !== undefined) updatePayload.zone_id = Number(zone_id)
    if (area_id !== undefined) updatePayload.area_id = Number(area_id)
    if (order_status) updatePayload.order_status = order_status
    if (payment_status) updatePayload.payment_status = payment_status

    const { error: updateError } = await adminDb
      .from('orders')
      .update(updatePayload)
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update order:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 6. Fetch complete updated order with items and products
    const { data: updatedOrder, error: reloadError } = await adminDb
      .from('orders')
      .select('*, order_items(*, products(name))')
      .eq('id', id)
      .single()

    if (reloadError || !updatedOrder) {
      return NextResponse.json({ error: 'Failed to reload updated order' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updatedOrder })

  } catch (error: any) {
    console.error('Order Update Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userClient = await createClient()

    // Check if user is authenticated and is admin
    const { data: { user } } = await userClient.auth.getUser()
    const adminEmail = 'admin@example.com'
    if (!user || (user.email !== adminEmail && !user.email?.includes('admin') && user.email !== 'sakib.samadhan@gmail.com')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing order ID parameter' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // 1. Delete order_items first
    const { error: itemsError } = await adminDb
      .from('order_items')
      .delete()
      .eq('order_id', id)

    if (itemsError) {
      console.error('Failed to delete order items:', itemsError)
    }

    // 2. Delete the order
    const { error: orderError } = await adminDb
      .from('orders')
      .delete()
      .eq('id', id)

    if (orderError) {
      console.error('Failed to delete order:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Order deleted successfully' })
  } catch (error: any) {
    console.error('Order Delete Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
