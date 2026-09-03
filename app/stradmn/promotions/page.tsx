import { createAdminClient } from '@/utils/supabase/server'
import AdminPromotionsClient from '@/components/AdminPromotionsClient'

export const revalidate = 0

export default async function AdminPromotionsPage() {
  const supabase = createAdminClient()

  // Fetch promotions, promo codes, products, categories, and customer email count in parallel
  const [promotionsRes, promoCodesRes, productsRes, categoriesRes, customersRes] = await Promise.all([
    supabase.from('promotions').select('*').order('created_at', { ascending: false }),
    supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('id, name, price, images, is_hidden').order('name', { ascending: true }),
    supabase.from('categories').select('id, name').order('name', { ascending: true }),
    supabase.from('customers').select('id, email, full_name').neq('email', '')
  ])

  return (
    <AdminPromotionsClient
      initialPromotions={promotionsRes.data || []}
      initialPromoCodes={promoCodesRes.data || []}
      products={productsRes.data || []}
      categories={categoriesRes.data || []}
      customers={customersRes.data || []}
    />
  )
}
