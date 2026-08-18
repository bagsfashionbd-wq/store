import { createAdminClient } from '@/utils/supabase/server'
import { getPublicSettings } from '@/utils/settings'
import { notFound } from 'next/navigation'
import CollectionPageClient from '@/components/CollectionPageClient'

export const revalidate = 0

export default async function FeaturedCollectionPage() {
  const settings = await getPublicSettings()
  if (!settings.show_featured) {
    notFound()
  }

  const supabase = createAdminClient()

  // Fetch Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // Fetch Featured Products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })

  return (
    <CollectionPageClient
      title="Featured Products"
      subtitle="Carefully curated and hand-picked showcase items recommended by our store."
      badgeText="Curated Showcase"
      badgeColorClass="bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
      products={products || []}
      categories={categories || []}
    />
  )
}
