import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import CategoryPageClient from '@/components/CategoryPageClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 0 // Dynamic data load

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch target category by slug
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) {
    notFound()
  }

  // Fetch all categories for reference/navigation
  const { data: allCategories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // Fetch all products with their associated categories
  const { data: products } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .order('created_at', { ascending: false })

  return (
    <CategoryPageClient 
      category={category} 
      allCategories={allCategories || []} 
      initialProducts={products || []} 
    />
  )
}
