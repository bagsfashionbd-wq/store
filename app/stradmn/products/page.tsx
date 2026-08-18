import { createAdminClient } from '@/utils/supabase/server'
import AdminProductsClient from '@/components/AdminProductsClient'

export const revalidate = 0 // Disable cache for live inventory & product lists

export default async function AdminProductsPage() {
  const supabase = createAdminClient()

  // Fetch products
  const { data: products } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <AdminProductsClient 
      initialProducts={products || []} 
      initialCategories={categories || []} 
    />
  )
}
