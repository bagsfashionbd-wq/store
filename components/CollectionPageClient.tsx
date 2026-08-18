'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Filter } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import ProductCard from '@/components/ProductCard'

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
}

interface CollectionPageClientProps {
  title: string
  subtitle: string
  badgeText: string
  badgeColorClass: string
  products: Product[]
  categories: Category[]
}

export default function CollectionPageClient({
  title,
  subtitle,
  badgeText,
  badgeColorClass,
  products,
  categories
}: CollectionPageClientProps) {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false)

  const visibleProducts = products.filter((p) => !p.is_hidden)

  const filteredProducts = visibleProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onCartToggle={() => setCartDrawerOpen(true)} />

      {/* COLLECTION HEADER */}
      <section className="bg-slate-900 text-white py-14 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>

          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${badgeColorClass}`}>
              {badgeText}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white">{title}</h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">{subtitle}</p>
          </div>
        </div>
      </section>

      {/* COLLECTION PRODUCTS */}
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        
        {/* Search & Count Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Showing {filteredProducts.length} Items in this collection
          </p>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search within collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition"
            />
          </div>
        </div>

        {/* PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 my-8">
            <Filter className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-900">No products found</p>
            <p className="mt-1 text-xs text-slate-500">There are currently no items matching this collection filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 pt-6 sm:pt-8">
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

      <Footer />
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </div>
  )
}
