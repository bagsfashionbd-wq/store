'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, ChevronRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import ProductCard from '@/components/ProductCard'
import { useStore } from '@/context/StoreContext'

interface Product {
  id: string
  category_id: string
  name: string
  slug: string
  description: string
  price: number
  old_price: number
  stock: number
  images: string[]
  variations: any
  is_featured: boolean
  is_best_seller?: boolean
  is_trending?: boolean
  is_hidden?: boolean
}

interface Category {
  id: string
  parent_id?: string | null
  name: string
  slug: string
  description?: string | null
}

interface CategoryPageClientProps {
  category: Category
  allCategories: Category[]
  initialProducts: Product[]
}

export default function CategoryPageClient({ category, allCategories, initialProducts }: CategoryPageClientProps) {
  const { settings } = useStore()
  const [products] = useState<Product[]>(initialProducts)
  const [categories] = useState<Category[]>(allCategories)
  
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false)

  // Subcategories of current category
  const subcategories = categories.filter((c) => c.parent_id === category.id)
  
  // Is this category itself a child?
  const parentCategory = category.parent_id ? categories.find((c) => c.id === category.parent_id) : null

  // Filter products based on search and category hierarchy
  const filteredProducts = products.filter((product) => {
    if (product.is_hidden) return false

    const productCatIds: string[] = Array.isArray(product.variations?.category_ids)
      ? product.variations.category_ids
      : product.category_id ? [product.category_id] : []
      
    if (product.is_featured && !productCatIds.includes('c0000000-0000-0000-0000-000000000008')) {
      productCatIds.push('c0000000-0000-0000-0000-000000000008')
    }

    // Determine target category IDs
    let targetCategoryIds: string[] = []
    if (activeSubcategoryId !== 'all') {
      targetCategoryIds = [activeSubcategoryId]
    } else {
      // Include this category + all its subcategories
      targetCategoryIds = [category.id, ...subcategories.map((s) => s.id)]
    }

    const matchesCategory = targetCategoryIds.some((id) => productCatIds.includes(id))
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar onCartToggle={() => setCartDrawerOpen(true)} />
      
      {/* HEADER SECTION */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-16 sm:py-20">
        <div className="absolute inset-0 z-0 opacity-25 bg-cover bg-center" style={{ backgroundImage: `url(${settings.hero_image_url || '/logo.jpeg'})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent z-0" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              <Link href="/" className="hover:text-brand-400">Home</Link>
              <ChevronRight className="h-3 w-3" />
              {parentCategory && (
                <>
                  <Link href={`/category/${parentCategory.slug}`} className="hover:text-brand-400">{parentCategory.name}</Link>
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
              <span className="text-brand-400">{category.name}</span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-5xl text-white">
              {category.name}
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300">
              {category.description || `Browse our full inventory of ${category.name}.`}
            </p>
          </div>
        </div>
      </section>

      {/* CATALOG SECTION */}
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        
        {/* Search & Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">Products in {category.name}</h2>
            <p className="mt-1 text-xs text-slate-500">Showing {filteredProducts.length} items</p>
          </div>
          
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search in ${category.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
            />
          </div>
        </div>

        {/* Subcategory Pills (if this category has child categories) */}
        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 py-6 overflow-x-auto">
            <button
              onClick={() => setActiveSubcategoryId('all')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition-all border ${
                activeSubcategoryId === 'all'
                  ? 'bg-brand-600 text-white border-transparent shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              All {category.name}
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSubcategoryId(sub.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition-all border ${
                  activeSubcategoryId === sub.id
                    ? 'bg-brand-600 text-white border-transparent shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 my-6">
            <Filter className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-900">No products found</p>
            <p className="mt-1 text-xs text-slate-500">There are no items currently listed in this category selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 my-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
                onAddToCartSuccess={() => setCartDrawerOpen(true)}
              />
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <Footer />

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </div>
  )
}
