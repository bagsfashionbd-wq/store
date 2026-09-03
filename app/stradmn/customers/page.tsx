import { createAdminClient } from '@/utils/supabase/server'
import AdminCustomersClient from '@/components/AdminCustomersClient'

export const revalidate = 0

export default async function AdminCustomersPage() {
  const supabase = createAdminClient()

  // Fetch registered customers, orders (to aggregate stats and order history), and contact messages
  const [customersRes, ordersRes, messagesRes] = await Promise.all([
    supabase.from('customers').select('*').order('created_at', { ascending: false }),
    supabase.from('orders').select('id, customer_name, customer_phone, customer_email, total_amount, status, created_at, user_id').order('created_at', { ascending: false }),
    supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
  ])

  return (
    <AdminCustomersClient
      initialCustomers={customersRes.data || []}
      initialOrders={ordersRes.data || []}
      initialMessages={messagesRes.data || []}
    />
  )
}
