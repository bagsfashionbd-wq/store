import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { verifyStaffAuth } from '@/utils/auth'
import { restoreOrderInventory, deductOrderInventory, restoreProductStock, deductProductStock } from '@/utils/inventory'
import { sendOrderDispatchedEmail, sendOrderCancelledEmail } from '@/utils/email'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin', 'staff'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
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

    const oldStatus = existingOrder.order_status || 'Pending'
    const newStatus = order_status || oldStatus

    // 2. INVENTORY RESTORATION / DEDUCTION ON STATUS CHANGE
    if (oldStatus !== 'Cancelled' && newStatus === 'Cancelled') {
      // Order cancelled -> Restore all item stocks to inventory
      await restoreOrderInventory(adminDb, id)
    } else if (oldStatus === 'Cancelled' && newStatus !== 'Cancelled') {
      // Order re-activated from Cancelled -> Deduct item stocks from inventory
      await deductOrderInventory(adminDb, id)
    } else if (newStatus !== 'Cancelled') {
      // Order is active and items are being edited:

      // A. Restore stock for deleted item lines
      if (Array.isArray(deleted_item_ids) && deleted_item_ids.length > 0) {
        for (const delId of deleted_item_ids) {
          const delItem = existingOrder.order_items?.find((it: any) => it.id === delId)
          if (delItem) {
            await restoreProductStock(
              adminDb,
              delItem.product_id,
              Number(delItem.quantity) || 0,
              delItem.selected_variations
            )
          }
        }
      }

      // B. Adjust stock difference for modified item quantities
      if (Array.isArray(items) && items.length > 0) {
        for (const it of items) {
          if (it.id) {
            const existingItem = existingOrder.order_items?.find((x: any) => x.id === it.id)
            if (existingItem) {
              const oldQty = Number(existingItem.quantity) || 0
              const newQty = Math.max(1, Number(it.quantity || 1))
              const diff = newQty - oldQty

              if (diff > 0) {
                await deductProductStock(adminDb, existingItem.product_id, diff, existingItem.selected_variations)
              } else if (diff < 0) {
                await restoreProductStock(adminDb, existingItem.product_id, Math.abs(diff), existingItem.selected_variations)
              }
            }
          }
        }
      }
    }

    // 3. Handle deleted item IDs in database
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

    // 4. Update existing item quantities & prices
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
    const discountAmount = Number(existingOrder.discount_amount || 0)
    const newTotalPrice = Math.max(0, itemsSubtotal + parsedDeliveryCharge - discountAmount)

    // 5. Update payment_details with shipping metadata and custom advance_paid
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

    // 6. Update the main order row
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

    // 7. Fetch complete updated order with items and products
    const { data: updatedOrder, error: reloadError } = await adminDb
      .from('orders')
      .select('*, order_items(*, products(name))')
      .eq('id', id)
      .single()

    if (reloadError || !updatedOrder) {
      return NextResponse.json({ error: 'Failed to reload updated order' }, { status: 500 })
    }

    // 8. Trigger customer email notification on status change
    const targetEmail = updatedOrder.customer_email || existingOrder.customer_email
    if (targetEmail && oldStatus !== newStatus) {
      if (newStatus === 'Cancelled') {
        sendOrderCancelledEmail({
          toEmail: targetEmail,
          customerName: updatedOrder.customer_name,
          orderId: updatedOrder.id,
          totalPrice: Number(updatedOrder.total_price)
        }).catch(err => console.error('[Email] Order cancelled email error:', err))
      } else if (newStatus === 'Shipped') {
        const courierLabel = updatedOrder.shipping_provider === 'pathao'
          ? 'Pathao Courier'
          : updatedOrder.shipping_provider === 'steadfast'
          ? 'Steadfast Courier'
          : 'Store Courier / Local Delivery'

        let codAmount = 0
        if (updatedOrder.payment_status === 'FullyPaid') {
          codAmount = 0
        } else if (updatedOrder.payment_details?.advance_paid !== undefined) {
          codAmount = Math.max(0, Number(updatedOrder.total_price) - Number(updatedOrder.payment_details.advance_paid))
        } else if (updatedOrder.payment_status === 'DeliveryChargePrePaid') {
          codAmount = Math.max(0, Number(updatedOrder.total_price) - Number(updatedOrder.delivery_charge))
        } else {
          codAmount = Number(updatedOrder.total_price)
        }

        sendOrderDispatchedEmail({
          toEmail: targetEmail,
          customerName: updatedOrder.customer_name,
          orderId: updatedOrder.id,
          courierName: courierLabel,
          consignmentId: updatedOrder.pathao_consignment_id || updatedOrder.steadfast_consignment_id,
          trackingCode: updatedOrder.steadfast_tracking_code,
          shippingAddress: updatedOrder.shipping_address,
          totalPrice: Number(updatedOrder.total_price),
          codAmount,
          paymentStatus: updatedOrder.payment_status
        }).catch(err => console.error('[Email] Order dispatched email error:', err))
      }
    }

    return NextResponse.json({ success: true, data: updatedOrder })

  } catch (error: any) {
    console.error('Order Update Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin', 'staff'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing order ID parameter' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // 1. Fetch order status before deletion
    const { data: existingOrder } = await adminDb
      .from('orders')
      .select('order_status')
      .eq('id', id)
      .single()

    // 2. Restore inventory if deleting an active (non-cancelled) order
    if (existingOrder && existingOrder.order_status !== 'Cancelled') {
      await restoreOrderInventory(adminDb, id)
    }

    // 3. Delete order_items first
    const { error: itemsError } = await adminDb
      .from('order_items')
      .delete()
      .eq('order_id', id)

    if (itemsError) {
      console.error('Failed to delete order items:', itemsError)
    }

    // 4. Delete the order
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
