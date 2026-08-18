import { createAdminClient } from '@/utils/supabase/server'
import HomePageClient from '@/components/HomePageClient'

export const revalidate = 0 // Disable cache to get live inventory status

export default async function HomePage() {
  const supabase = createAdminClient()

  // Fetch Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // Fetch Products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch non-cancelled order items for Best Seller & Trending calculations
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: allTimeItems } = await supabase
    .from('order_items')
    .select('product_id, quantity, orders!inner(created_at, order_status)')
    .neq('orders.order_status', 'Cancelled')

  // Aggregate all-time quantities
  const allTimeSales: Record<string, number> = {}
  const last30DaysSales: Record<string, number> = {}

  if (allTimeItems) {
    allTimeItems.forEach((item: any) => {
      const pid = item.product_id
      const qty = Number(item.quantity || 1)
      if (pid) {
        allTimeSales[pid] = (allTimeSales[pid] || 0) + qty
        if (item.orders?.created_at && new Date(item.orders.created_at) >= new Date(thirtyDaysAgo)) {
          last30DaysSales[pid] = (last30DaysSales[pid] || 0) + qty
        }
      }
    })
  }

  return (
    <HomePageClient 
      products={products || []} 
      categories={categories || []}
      allTimeSales={allTimeSales}
      last30DaysSales={last30DaysSales}
    />
  )
}

