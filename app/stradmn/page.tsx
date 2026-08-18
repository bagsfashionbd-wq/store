import { createAdminClient } from '@/utils/supabase/server'
import AdminDashboardClient from '@/components/AdminDashboardClient'

export const revalidate = 0 // Disable cache for live inventory & order queues

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  // Fetch orders and items
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name))')
    .order('created_at', { ascending: false })

  return <AdminDashboardClient initialOrders={orders || []} />
}
