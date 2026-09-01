'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Search, Filter } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import ProductCard from '@/components/ProductCard'
import ShowcaseSection from '@/components/ShowcaseSection'
import { useStore } from '@/context/StoreContext'
import { useLanguage } from '@/context/LanguageContext'

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

interface HomePageClientProps {
  products: Product[]
  categories: Category[]
  allTimeSales?: Record<string, number>
  last30DaysSales?: Record<string, number>
}

export default function HomePageClient({ products, categories, allTimeSales = {}, last30DaysSales = {} }: HomePageClientProps) {
  const router = useRouter()
  const { settings } = useStore()
  const { t, toBengaliDigits, isBangla } = useLanguage()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false)

  // Visible products
  const visibleProducts = products.filter((p) => !p.is_hidden)

  // 1. Featured Collection (Manual)
  const featuredProducts = visibleProducts.filter((p) => p.is_featured)

  // 2. Trending Collection (Auto vs Manual)
  const trendingProducts = [...visibleProducts]
    .filter((p) => {
      if (settings.auto_trending === false) {
        return Boolean(p.is_trending)
      }
      return (last30DaysSales[p.id] || 0) > 0 || Boolean(p.is_trending)
    })
    .sort((a, b) => {
      if (settings.auto_trending !== false) {
        const salesA = last30DaysSales[a.id] || 0
        const salesB = last30DaysSales[b.id] || 0
        if (salesB !== salesA) return salesB - salesA
      }
      return 0
    })

  // 3. Best Seller Collection (Auto vs Manual)
  const bestSellerProducts = [...visibleProducts]
    .filter((p) => {
      if (settings.auto_best_seller === false) {
        return Boolean(p.is_best_seller)
      }
      return (allTimeSales[p.id] || 0) > 0 || Boolean(p.is_best_seller)
    })
    .sort((a, b) => {
      if (settings.auto_best_seller !== false) {
        const salesA = allTimeSales[a.id] || 0
        const salesB = allTimeSales[b.id] || 0
        if (salesB !== salesA) return salesB - salesA
      }
      return 0
    })

  // Filter products for the main catalog by search, visibility, and category
  const filteredProducts = visibleProducts.filter((product) => {
    // 1. Search Query Match
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    // 2. Category Match (including child categories)
    if (selectedCategoryId === 'all') return true

    // Find all children of the selected category
    const matchingCategoryIds = [
      selectedCategoryId,
      ...categories.filter((c) => c.parent_id === selectedCategoryId).map((c) => c.id)
    ]

    const productCatIds: string[] = Array.isArray(product.variations?.category_ids)
      ? product.variations.category_ids
      : product.category_id ? [product.category_id] : []

    if (product.is_featured && !productCatIds.includes('c0000000-0000-0000-0000-000000000008')) {
      productCatIds.push('c0000000-0000-0000-0000-000000000008')
    }

    return matchingCategoryIds.some((id) => productCatIds.includes(id))
  })

  // Top level categories for the pill bar
  const parentCategories = categories.filter((c) => !c.parent_id)

  const renderProductCard = (product: Product) => (
    <ProductCard
      key={product.id}
      product={product}
      categories={categories}
      onAddToCartSuccess={() => setCartDrawerOpen(true)}
    />
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onCartToggle={() => setCartDrawerOpen(true)} />
      
      {/* DYNAMIC HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-24 sm:py-32">
        {settings.hero_image_url && (
          <div 
            className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
            style={{ backgroundImage: `url(${settings.hero_image_url})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent z-0" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            {settings.hero_badge_text && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-bold text-brand-400 ring-1 ring-inset ring-brand-500/20 mb-6 uppercase tracking-wider">
                {settings.hero_badge_text}
              </span>
            )}
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl text-white leading-tight">
              {settings.hero_title}{' '}
              {settings.hero_subtitle && (
                <span className="text-brand-400">{settings.hero_subtitle}</span>
              )}
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-300">
              {settings.hero_description}
            </p>
            <div className="mt-8 flex items-center gap-x-4">
              <Link
                href="#catalog"
                className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-brand-500 transition-all"
              >
                {t('hero.shop_now')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SHOWCASE SECTION 1: FEATURED */}
      {settings.show_featured && featuredProducts.length > 0 && (
        <ShowcaseSection
          title={isBangla ? 'ফিচার্ড কালেকশন' : 'Featured Collection'}
          subtitle={isBangla ? 'সেরা বাছাইকৃত পণ্য' : 'Hand-Picked Selections'}
          badgeText={isBangla ? 'সেরা বাছাইকৃত' : 'Hand-Picked Selections'}
          type="featured"
          viewAllHref="/featured"
          products={featuredProducts}
          categories={categories}
          bgStyle="bg-white"
        />
      )}

      {/* SHOWCASE SECTION 2: TRENDING */}
      {settings.show_trending && trendingProducts.length > 0 && (
        <ShowcaseSection
          title={isBangla ? 'এই মাসের ট্রেন্ডিং' : 'Trending This Month'}
          subtitle={isBangla ? 'জনপ্রিয় পণ্যসমূহ' : 'Hot Right Now'}
          badgeText={isBangla ? 'জনপ্রিয় ট্রেন্ড' : 'Hot Right Now'}
          type="trending"
          viewAllHref="/trending"
          products={trendingProducts}
          categories={categories}
          bgStyle="bg-slate-50/70"
        />
      )}

      {/* SHOWCASE SECTION 3: BEST SELLERS */}
      {settings.show_best_seller && bestSellerProducts.length > 0 && (
        <ShowcaseSection
          title={isBangla ? 'সর্বকালের সেরা বিক্রিত' : 'All-Time Best Sellers'}
          subtitle={isBangla ? 'গ্রাহকদের পছন্দের পণ্য' : 'Customer Favorites'}
          badgeText={isBangla ? 'গ্রাহকদের পছন্দ' : 'Customer Favorites'}
          type="best_seller"
          viewAllHref="/best-seller"
          products={bestSellerProducts}
          categories={categories}
          bgStyle="bg-white"
        />
      )}

      {/* ALL PRODUCTS MAIN CATALOG SECTION */}
      <main id="catalog" className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        
        {/* Search & Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">{t('nav.all_products')}</h2>
            <p className="mt-0.5 sm:mt-1 text-xs text-slate-500">
              {isBangla 
                ? `${toBengaliDigits(filteredProducts.length)} টি পণ্য প্রদর্শিত হচ্ছে` 
                : `Showing ${filteredProducts.length} items`}
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 py-4 sm:py-6 overflow-x-auto">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold tracking-wide transition-all border ${
              selectedCategoryId === 'all'
                ? 'bg-brand-600 text-white border-transparent shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            {t('nav.all_products')}
          </button>
          {parentCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold tracking-wide transition-all border ${
                selectedCategoryId === category.id
                  ? 'bg-brand-600 text-white border-transparent shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* PRODUCTS GRID (2 columns on mobile, 4 on desktop) */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <Filter className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm sm:text-base font-bold text-slate-900">{isBangla ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}</p>
            <p className="mt-1 text-xs text-slate-500">{isBangla ? 'অনুগ্রহ করে অন্য ক্যাটাগরি বা অনুসন্ধানী শব্দ দিয়ে চেষ্টা করুন।' : 'Try matching a different category or search term.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map(renderProductCard)}
          </div>
        )}
      </main>

      {/* DYNAMIC FOOTER */}
      <Footer />

      {/* Cart Slide-out Drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </div>
  )
}
