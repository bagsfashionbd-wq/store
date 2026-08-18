import { createAdminClient } from '@/utils/supabase/server'
import AdminStatsClient from '@/components/AdminStatsClient'

export const revalidate = 0

export default async function AdminStatsPage() {
  const supabase = createAdminClient()

  // Fetch all orders with items and products (including buying_price for profit calculation)
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, products(id, name, price, buying_price, stock, images))')
    .order('created_at', { ascending: false })

  // Fetch all products for inventory valuation
  const { data: products } = await supabase
    .from('products')
    .select('*')

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')

  return (
    <AdminStatsClient 
      initialOrders={orders || []} 
      initialProducts={products || []}
      initialCategories={categories || []}
    />
  )
}
