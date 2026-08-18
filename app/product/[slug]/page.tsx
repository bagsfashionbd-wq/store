import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/ProductDetailClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 0 // Get live stock status

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch product by slug
  const { data: product } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('slug', slug)
    .single()

  if (!product) {
    notFound()
  }

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')

  // Fetch Related / Trending Products
  let relatedProducts: any[] = []
  
  // 1. Try fetching products in the same category
  const { data: sameCategoryProducts } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .eq('is_hidden', false)
    .limit(4)

  if (sameCategoryProducts && sameCategoryProducts.length > 0) {
    relatedProducts = [...sameCategoryProducts]
  }

  // 2. If fewer than 4, fill with trending / other catalog products
  if (relatedProducts.length < 4) {
    const { data: trendingProducts } = await supabase
      .from('products')
      .select('*')
      .neq('id', product.id)
      .eq('is_hidden', false)
      .limit(4)

    if (trendingProducts) {
      const existingIds = new Set(relatedProducts.map((p) => p.id))
      trendingProducts.forEach((p) => {
        if (!existingIds.has(p.id) && relatedProducts.length < 4) {
          relatedProducts.push(p)
          existingIds.add(p.id)
        }
      })
    }
  }

  return (
    <ProductDetailClient 
      product={product} 
      categories={categories || []} 
      relatedProducts={relatedProducts}
    />
  )
}

