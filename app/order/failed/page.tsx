import React from 'react'
import { createAdminClient } from '@/utils/supabase/server'
import OrderFailedClient from '@/components/OrderFailedClient'

interface FailedProps {
  searchParams: Promise<{ order_id?: string; reason?: string; is_retry?: string }>
}

export const revalidate = 0

export default async function OrderFailedPage({ searchParams }: FailedProps) {
  const { order_id, reason, is_retry } = await searchParams
  const supabase = createAdminClient()

  let orderData = null
  if (order_id) {
    const { data } = await supabase
      .from('orders')
      .select('id, customer_name, customer_phone, delivery_charge, total_price, payment_method, payment_status, shipping_address')
      .eq('id', order_id)
      .single()
    orderData = data
  }

  return (
    <OrderFailedClient
      order={orderData}
      reason={reason}
      isRetry={is_retry === 'true'}
    />
  )
}
