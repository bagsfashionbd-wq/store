import { createAdminClient } from '@/utils/supabase/server'
import AdminCategoriesClient from '@/components/AdminCategoriesClient'

export const revalidate = 0

export default async function AdminCategoriesPage() {
  const supabase = createAdminClient()

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  return <AdminCategoriesClient initialCategories={categories || []} />
}
