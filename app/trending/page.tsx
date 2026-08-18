import { createAdminClient } from '@/utils/supabase/server'
import { getPublicSettings } from '@/utils/settings'
import { notFound } from 'next/navigation'
import CollectionPageClient from '@/components/CollectionPageClient'

export const revalidate = 0

export default async function TrendingCollectionPage() {
  const settings = await getPublicSettings()
  if (!settings.show_trending) {
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

  let trendingProducts = allProducts || []

  if (settings.auto_trending !== false) {
    // 30-day sales calculation
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentItems } = await supabase
      .from('order_items')
      .select('product_id, quantity, orders!inner(created_at, order_status)')
      .gte('orders.created_at', thirtyDaysAgo)
      .neq('orders.order_status', 'Cancelled')

    const salesMap: Record<string, number> = {}
    if (recentItems) {
      recentItems.forEach((item: any) => {
        const pid = item.product_id
        if (pid) {
          salesMap[pid] = (salesMap[pid] || 0) + Number(item.quantity || 1)
        }
      })
    }

    trendingProducts = [...trendingProducts]
      .filter((p) => (salesMap[p.id] || 0) > 0 || Boolean(p.is_trending))
      .sort((a, b) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0))
  } else {
    trendingProducts = trendingProducts.filter((p) => p.is_trending)
  }

  return (
    <CollectionPageClient
      title="Trending Products"
      subtitle="The hottest products generating the most interest and sales over the past 30 days."
      badgeText="Hot Right Now"
      badgeColorClass="bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30"
      products={trendingProducts}
      categories={categories || []}
    />
  )
}
