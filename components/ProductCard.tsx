'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Eye, X, Check, ArrowRight, Heart } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useCustomer } from '@/context/CustomerContext'
import { useLanguage } from '@/context/LanguageContext'

export interface VariationValue {
  label: string
  stock: number
  image_url?: string
}

export interface VariationOption {
  name: string
  values: VariationValue[]
}

export interface Product {
  id: string
  category_id: string
  name: string
  slug: string
  short_description?: string
  description?: string
  price: number
  old_price?: number
  buying_price?: number
  stock: number
  images: string[]
  variations?: any
  is_featured?: boolean
  is_best_seller?: boolean
  is_trending?: boolean
  is_hidden?: boolean
}

export interface Category {
  id: string
  parent_id?: string | null
  name: string
  slug: string
}

// Clean helper to extract valid variation groups from any schema format
export function extractProductOptions(variations: any, fallbackStock = 0): VariationOption[] {
  if (!variations || typeof variations !== 'object') return []

  if (Array.isArray(variations.options)) {
    return variations.options.map((opt: any) => ({
      name: opt.name || 'Option',
      values: Array.isArray(opt.values)
        ? opt.values.map((v: any) => ({
            label: typeof v === 'object' ? v.label || '' : String(v),
            stock: typeof v === 'object' && typeof v.stock === 'number' ? v.stock : fallbackStock,
            image_url: typeof v === 'object' ? v.image_url || '' : '',
            price: typeof v === 'object' && v.price !== undefined && v.price !== null && v.price !== '' ? Number(v.price) : undefined
          }))
        : []
    }))
  }

  const options: VariationOption[] = []
  Object.entries(variations).forEach(([key, values]) => {
    if (key === 'category_ids' || key === 'options') return
    if (Array.isArray(values) && values.length > 0) {
      const cleanName = key.charAt(0).toUpperCase() + key.slice(1).replace(/s$/, '')
      const stockPerVal = Math.max(1, Math.floor(fallbackStock / values.length))
      options.push({
        name: cleanName,
        values: values.map((v: any) => ({
          label: String(v),
          stock: stockPerVal,
          image_url: '',
          price: undefined
        }))
      })
    }
  })

  return options
}

interface ProductCardProps {
  product: Product
  categories?: Category[]
  onAddToCartSuccess?: () => void
}

export default function ProductCard({ product, categories = [], onAddToCartSuccess }: ProductCardProps) {
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useCustomer()
  const { t, toBengaliDigits, isBangla } = useLanguage()
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({})
  const [guestToast, setGuestToast] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const isFavorited = isInWishlist(product.id)

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const res = await toggleWishlist(product.id)
    if (res.isGuest && res.added) {
      setGuestToast(true)
      setTimeout(() => setGuestToast(false), 3500)
    }
  }

  const parsedOptions = extractProductOptions(product.variations, product.stock)
  const hasOptions = parsedOptions.length > 0

  // Initialize first values when opening modal
  useEffect(() => {
    if (hasOptions && Object.keys(selectedVariations).length === 0) {
      const initial: Record<string, string> = {}
      parsedOptions.forEach((opt) => {
        if (opt.values.length > 0) {
          initial[opt.name] = opt.values[0].label
        }
      })
      setSelectedVariations(initial)
    }
  }, [hasOptions, parsedOptions])

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowVariantModal(false)
      }
    }
    if (showVariantModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showVariantModal])

  // Compute stock for chosen variation
  const getSelectedStock = (): number => {
    if (!hasOptions) return product.stock
    const firstOpt = parsedOptions[0]
    if (!firstOpt) return product.stock
    const chosenVal = selectedVariations[firstOpt.name]
    const match = firstOpt.values.find((v) => v.label === chosenVal)
    return match ? match.stock : product.stock
  }

  const currentStock = getSelectedStock()

  // Handle Cart Button Click
  const handleCartButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (hasOptions) {
      setShowVariantModal((prev) => !prev)
    } else {
      // Direct Add to Cart
      addToCart({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        image: product.images[0] || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5',
        selectedVariations: {}
      }, 1)
      if (onAddToCartSuccess) onAddToCartSuccess()
    }
  }

  // Handle Modal Confirm Add
  const handleConfirmVariantAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      image: product.images[0] || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5',
      selectedVariations
    }, 1)

    setShowVariantModal(false)
    if (onAddToCartSuccess) onAddToCartSuccess()
  }

  // Find Category Name
  const productCatIds: string[] = Array.isArray(product.variations?.category_ids)
    ? product.variations.category_ids
    : product.category_id ? [product.category_id] : []

  const categoryName = categories
    .filter((c) => productCatIds.includes(c.id))
    .map((c) => c.name)
    .join(', ') || (isBangla ? 'পণ্য' : 'Aquatics')

  return (
    <div className="group relative flex flex-col overflow-visible rounded-xl sm:rounded-2xl border border-slate-200 bg-white hover:shadow-xl hover:border-brand-300 transition-all duration-300">
      
      {/* Image wrapper */}
      <Link href={`/product/${product.slug}`} className="relative aspect-square w-full overflow-hidden rounded-t-xl sm:rounded-t-2xl bg-slate-100 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5'}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        
        {product.old_price && product.old_price > 0 ? (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 rounded-full bg-red-600 px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white shadow">
            {t('product.discount')}
          </span>
        ) : null}

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-white/95 text-slate-900 font-black text-[10px] sm:text-xs px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full uppercase tracking-wider shadow">
              {t('product.out_of_stock')}
            </span>
          </div>
        )}

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-slate-500 hover:text-pink-600 hover:bg-white transition shadow-md"
          aria-label="Save to wishlist"
          title={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFavorited ? 'fill-pink-600 text-pink-600' : ''}`} />
        </button>

        {/* Guest Wishlist Reminder Toast */}
        {guestToast && (
          <div className="absolute inset-x-2 bottom-2 z-20 rounded-xl bg-slate-900/90 text-white p-2 text-[10px] font-bold text-center backdrop-blur-sm animate-in fade-in">
            {isBangla ? 'পছন্দের তালিকায় যুক্ত হয়েছে! স্থায়ীভাবে রাখতে লগইন করুন।' : 'Saved to wishlist! Sign in to save permanently.'}
          </div>
        )}
      </Link>

      {/* Body Info */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <p className="text-[9px] sm:text-[10px] font-bold text-brand-600 tracking-wider uppercase mb-0.5 sm:mb-1 truncate">
          {categoryName}
        </p>

        <Link href={`/product/${product.slug}`}>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 sm:line-clamp-1 leading-snug group-hover:text-brand-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.short_description && product.short_description.trim() ? (
          <p className="hidden sm:block mt-1 text-xs text-slate-500 line-clamp-2 sm:line-clamp-3 flex-grow leading-relaxed">
            {product.short_description.trim()}
          </p>
        ) : null}

        {/* Price & Action button bar */}
        <div className="mt-2.5 sm:mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex flex-col justify-center">
            {product.old_price && product.old_price > 0 ? (
              <span className="text-[10px] sm:text-xs text-slate-400 line-through font-medium leading-none mb-0.5">
                ৳{Number(product.old_price).toLocaleString()}
              </span>
            ) : null}
            <span className="text-xs sm:text-sm font-extrabold text-slate-950 leading-none">
              ৳{Number(product.price).toLocaleString()}
            </span>
          </div>

          {/* DUAL ACTIONS: Details & Add To Cart */}
          <div className="relative flex items-center gap-1 sm:gap-1.5">
            {/* 1. Details Button */}
            <Link
              href={`/product/${product.slug}`}
              className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50/50 text-[11px] sm:text-xs font-bold transition-colors"
              title={t('product.view_product')}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t('common.view')}</span>
            </Link>

            {/* 2. Add To Cart Button */}
            {product.stock > 0 ? (
              <button
                type="button"
                onClick={handleCartButtonClick}
                className="flex items-center gap-1 rounded-lg sm:rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-2 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">{t('nav.cart')}</span>
              </button>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg sm:rounded-xl border border-red-100">
                {t('product.out_of_stock')}
              </span>
            )}

            {/* COMIC DIALOGUE BOX / VARIANT SELECTION POPOVER */}
            {showVariantModal && (
              <div
                ref={modalRef}
                className="absolute right-0 sm:right-0 bottom-full mb-3 z-50 w-64 sm:w-72 max-w-[85vw] rounded-2xl bg-white p-3.5 sm:p-4 shadow-2xl border-2 border-brand-500 animate-fade-in-up"
                style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}
              >
                {/* Comic Speech Bubble Triangle Pointer */}
                <div className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 border-b-2 border-r-2 border-brand-500 bg-white" />

                {/* Popover Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">{t('product.options')}</span>
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">{t('product.select_variant')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowVariantModal(false)
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Option Pickers */}
                <div className="space-y-3 py-3 max-h-48 overflow-y-auto">
                  {parsedOptions.map((opt) => (
                    <div key={opt.name} className="space-y-1.5 text-left">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        {opt.name}:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {opt.values.map((val) => {
                          const isSelected = selectedVariations[opt.name] === val.label
                          const isOutOfStock = val.stock <= 0

                          return (
                            <button
                              key={val.label}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedVariations((prev) => ({ ...prev, [opt.name]: val.label }))
                              }}
                              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                                isSelected
                                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                  : isOutOfStock
                                  ? 'bg-slate-50 text-slate-300 border-slate-200 line-through cursor-not-allowed'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-brand-400'
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

                {/* Stock info & Confirm Add Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500">
                    {currentStock > 0 ? (
                      <span className="text-emerald-700">✓ {isBangla ? toBengaliDigits(currentStock) : currentStock} {t('product.in_stock')}</span>
                    ) : (
                      <span className="text-red-600">✕ {t('product.out_of_stock')}</span>
                    )}
                  </span>

                  <button
                    type="button"
                    disabled={currentStock <= 0}
                    onClick={handleConfirmVariantAdd}
                    className="flex items-center gap-1 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 text-white px-3 py-1.5 text-xs font-bold shadow transition"
                  >
                    <span>{t('product.add_to_cart')}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
