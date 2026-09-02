'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  ShoppingBag, Eye, X, Check, ArrowRight, ChevronLeft, 
  ChevronRight, Sparkles, TrendingUp, Award, Flame, Tag 
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useLanguage } from '@/context/LanguageContext'
import ProductCard, { Product, Category, extractProductOptions } from '@/components/ProductCard'

interface ShowcaseSectionProps {
  title: string
  subtitle?: string
  badgeText: string
  type: 'featured' | 'trending' | 'best_seller'
  viewAllHref: string
  products: Product[]
  categories: Category[]
  bgStyle?: string
}

// 1. CAROUSEL HERO BANNER (Full Bleed Background + Centered Editorial Typography)
function CarouselHeroBanner({
  products,
  categories,
  type
}: {
  products: Product[]
  categories: Category[]
  type: 'featured' | 'trending' | 'best_seller'
}) {
  const { addToCart } = useCart()
  const { t, toBengaliDigits, isBangla } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({})
  const [isHovered, setIsHovered] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Carousel items: top 3 products in the collection
  const heroProducts = products.slice(0, 3)
  const activeProduct = heroProducts[currentIndex] || products[0]

  const parsedOptions = extractProductOptions(activeProduct.variations, activeProduct.stock)
  const hasOptions = parsedOptions.length > 0

  // Auto slide every 6 seconds if not hovered or interacting with modal
  useEffect(() => {
    if (heroProducts.length <= 1 || isHovered || showVariantModal) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroProducts.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [heroProducts.length, isHovered, showVariantModal])

  // Reset selected variations when active product changes
  useEffect(() => {
    if (hasOptions) {
      const initial: Record<string, string> = {}
      parsedOptions.forEach((opt) => {
        if (opt.values.length > 0) initial[opt.name] = opt.values[0].label
      })
      setSelectedVariations(initial)
    } else {
      setSelectedVariations({})
    }
    setShowVariantModal(false)
  }, [activeProduct.id, hasOptions])

  // Click outside variant modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowVariantModal(false)
      }
    }
    if (showVariantModal) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showVariantModal])

  const prevSlide = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? heroProducts.length - 1 : prev - 1))
  }, [heroProducts.length])

  const nextSlide = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % heroProducts.length)
  }, [heroProducts.length])

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasOptions) {
      setShowVariantModal((prev) => !prev)
    } else {
      addToCart({
        id: activeProduct.id,
        name: activeProduct.name,
        slug: activeProduct.slug,
        price: Number(activeProduct.price),
        image: activeProduct.images[0] || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5',
        selectedVariations: {}
      }, 1)
    }
  }

  const handleConfirmVariantAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart({
      id: activeProduct.id,
      name: activeProduct.name,
      slug: activeProduct.slug,
      price: Number(activeProduct.price),
      image: activeProduct.images[0] || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5',
      selectedVariations
    }, 1)
    setShowVariantModal(false)
  }

  const productCatIds: string[] = Array.isArray(activeProduct.variations?.category_ids)
    ? activeProduct.variations.category_ids
    : activeProduct.category_id ? [activeProduct.category_id] : []

  const categoryName = categories
    .filter((c) => productCatIds.includes(c.id))
    .map((c) => c.name)
    .join(', ') || (isBangla ? 'পণ্য' : 'Aquatics')

  const heroBadge = type === 'featured'
    ? { text: isBangla ? 'স্পেশাল ফিচার্ড' : 'Featured Spotlight', bg: 'bg-amber-500 text-white' }
    : type === 'trending'
    ? { text: isBangla ? 'জনপ্রিয় পণ্য' : 'Trending This Month', bg: 'bg-purple-600 text-white' }
    : { text: isBangla ? 'সর্বোচ্চ বিক্রিত' : 'Top Best Seller', bg: 'bg-blue-600 text-white' }

  return (
    <div 
      className="relative w-full h-[360px] sm:h-[440px] md:h-[480px] rounded-3xl overflow-hidden shadow-2xl group border border-slate-200/80 bg-slate-950"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* 1. BACKGROUND IMAGE (Full-Bleed with strict frame height & zoom effect) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={activeProduct.id}
          src={activeProduct.images[0] || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5'}
          alt={activeProduct.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-1000 ease-out animate-fadeIn"
        />
        
        {/* High-contrast multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30" />
        <div className="absolute inset-0 bg-black/10 backdrop-brightness-95" />
      </div>

      {/* 2. TOP BADGE & SALE PILL */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2">
        <span className={`inline-flex items-center px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg ${heroBadge.bg}`}>
          {heroBadge.text}
        </span>
        {activeProduct.old_price && activeProduct.old_price > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white shadow-lg">
            <Tag className="h-3 w-3" />
            {isBangla ? `সাশ্রয় ৳${toBengaliDigits((Number(activeProduct.old_price) - Number(activeProduct.price)).toLocaleString())}` : `Save ৳${(Number(activeProduct.old_price) - Number(activeProduct.price)).toLocaleString()}`}
          </span>
        )}
      </div>

      {/* 3. CENTERED EDITORIAL CONTENT */}
      <div className="relative z-20 h-full flex flex-col items-center justify-end pb-8 sm:pb-12 px-4 sm:px-8 text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto">
        
        <div className="space-y-1 sm:space-y-2">
          {/* Category Tag */}
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-brand-300 drop-shadow">
            {categoryName}
          </p>

          {/* Large Editorial Title */}
          <Link href={`/product/${activeProduct.slug}`}>
            <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-white hover:text-brand-300 transition-colors drop-shadow-md tracking-tight leading-tight line-clamp-2 font-serif">
              {activeProduct.name}
            </h3>
          </Link>

          {/* Subtitle / Description Teaser */}
          {(activeProduct.short_description || activeProduct.description) && (
            <p className="text-xs sm:text-sm md:text-base text-slate-200/90 line-clamp-2 leading-relaxed drop-shadow max-w-xl mx-auto">
              {activeProduct.short_description
                ? activeProduct.short_description
                : activeProduct.description?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
            </p>
          )}
        </div>

        {/* Action Buttons & Price */}
        <div className="relative flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 pt-1 sm:pt-2">
          
          {/* PRIMARY "BUY NOW / SHOP NOW AT ৳..." BUTTON */}
          {activeProduct.stock > 0 ? (
            <button
              type="button"
              onClick={handleCartClick}
              className="group/btn relative flex items-center gap-2 rounded-xl bg-white hover:bg-brand-50 text-slate-950 px-5 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-black uppercase tracking-wider shadow-2xl transition-all active:scale-95 border border-white/80"
            >
              <ShoppingBag className="h-4 w-4 text-brand-600 group-hover/btn:scale-110 transition-transform" />
              <span>
                {t('product.buy_now')} • ৳{Number(activeProduct.price).toLocaleString()}
              </span>
              {activeProduct.old_price && activeProduct.old_price > 0 && (
                <span className="text-[11px] text-slate-400 line-through font-normal ml-1 hidden sm:inline">
                  ৳{Number(activeProduct.old_price).toLocaleString()}
                </span>
              )}
            </button>
          ) : (
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-red-600/90 px-4 py-2.5 rounded-xl backdrop-blur-md">
              {t('product.out_of_stock')}
            </span>
          )}

          {/* SECONDARY "VIEW DETAILS" BUTTON */}
          <Link
            href={`/product/${activeProduct.slug}`}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-black/40 hover:bg-black/60 text-white text-xs sm:text-sm font-bold border border-white/30 backdrop-blur-md transition-all shadow-lg"
          >
            <Eye className="h-4 w-4" />
            <span>{t('common.view')}</span>
          </Link>

          {/* Comic Dialogue Variant Popover */}
          {showVariantModal && (
            <div
              ref={modalRef}
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-50 w-72 sm:w-80 max-w-[90vw] rounded-2xl bg-white p-4 shadow-2xl border-2 border-brand-500 animate-fade-in-up text-left"
              style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.3))' }}
            >
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-4 rotate-45 border-b-2 border-r-2 border-brand-500 bg-white" />
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">{t('product.select_variant')}</span>
                <button onClick={() => setShowVariantModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto py-1">
                {parsedOptions.map((opt) => (
                  <div key={opt.name} className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{opt.name}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {opt.values.map((val) => {
                        const isSelected = selectedVariations[opt.name] === val.label
                        return (
                          <button
                            key={val.label}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSelectedVariations((prev) => ({ ...prev, [opt.name]: val.label }))
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                              isSelected ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {val.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleConfirmVariantAdd}
                  className="w-full rounded-xl bg-brand-600 hover:bg-brand-500 text-white py-2.5 text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition"
                >
                  <Check className="h-4 w-4" />
                  <span>{t('product.add_to_cart')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 4. CAROUSEL PREV / NEXT ARROWS */}
      {heroProducts.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all shadow-xl hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all shadow-xl hover:scale-110 active:scale-95"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </>
      )}

      {/* 5. CAROUSEL SLIDE DOTS */}
      {heroProducts.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
          {heroProducts.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === i ? 'w-6 bg-white shadow-md' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

    </div>
  )
}

// 2. MAIN SHOWCASE SECTION (Carousel Hero Banner + 4 Products Grid on Desktop, 2 on Mobile)
export default function ShowcaseSection({
  title,
  subtitle,
  badgeText,
  type,
  viewAllHref,
  products,
  categories,
  bgStyle = 'bg-white'
}: ShowcaseSectionProps) {
  const { t } = useLanguage()
  if (!products || products.length === 0) return null

  // Top 4 products for desktop grid (including #1)
  const desktopProducts = products.slice(0, 4)
  // Top 2 products for mobile grid (to keep scrolling light)
  const mobileProducts = products.slice(0, 2)

  return (
    <section className={`border-b border-slate-200/80 ${bgStyle} py-8 sm:py-14`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-600 mb-0.5">
              {badgeText}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight">
              {title}
            </h2>
          </div>

          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 border border-brand-200/60 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition shadow-sm"
          >
            <span>{t('product.view_all')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* TOP ROW: CAROUSEL HERO BANNER */}
        <CarouselHeroBanner
          products={products}
          categories={categories}
          type={type}
        />

        {/* SECOND ROW: DESKTOP 4-PRODUCT GRID (>= 1024px) */}
        {desktopProducts.length > 0 && (
          <div className="hidden lg:grid lg:grid-cols-4 gap-6 pt-2 sm:pt-4">
            {desktopProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
              />
            ))}
          </div>
        )}

        {/* SECOND ROW: MOBILE 2-PRODUCT GRID (< 1024px) */}
        {mobileProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:hidden pt-2">
            {mobileProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  )
}
