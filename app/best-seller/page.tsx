import { createAdminClient } from '@/utils/supabase/server'
import { getPublicSettings } from '@/utils/settings'
import { notFound } from 'next/navigation'
import CollectionPageClient from '@/components/CollectionPageClient'

export const revalidate = 0

export default async function BestSellerCollectionPage() {
  const settings = await getPublicSettings()
  if (!settings.show_best_seller) {
    notFound()
  }

  const supabase = createAdminClient()

  // Fetch Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // Fetch Products
  const { data: allProducts } = await supabase
    .from('products')
    .select('*')
    .eq('is_hidden', false)

  let bestSellerProducts = allProducts || []

  if (settings.auto_best_seller !== false) {
    // All-time sales calculation from non-cancelled orders
    const { data: allTimeItems } = await supabase
      .from('order_items')
      .select('product_id, quantity, orders!inner(created_at, order_status)')
      .neq('orders.order_status', 'Cancelled')

    const salesMap: Record<string, number> = {}
    if (allTimeItems) {
      allTimeItems.forEach((item: any) => {
        const pid = item.product_id
        if (pid) {
          salesMap[pid] = (salesMap[pid] || 0) + Number(item.quantity || 1)
        }
      })
    }

    bestSellerProducts = [...bestSellerProducts]
      .filter((p) => (salesMap[p.id] || 0) > 0 || Boolean(p.is_best_seller))
      .sort((a, b) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0))
  } else {
    bestSellerProducts = bestSellerProducts.filter((p) => p.is_best_seller)
  }

  return (
    <CollectionPageClient
      title="All-Time Best Sellers"
      subtitle="Our most loved, highest-rated, and frequently ordered aquascaping essentials."
      badgeText="Customer Favorites"
      badgeColorClass="bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30"
      products={bestSellerProducts}
      categories={categories || []}
    />
  )
}
