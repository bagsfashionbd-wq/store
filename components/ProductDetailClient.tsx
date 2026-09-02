'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, ChevronRight, Truck, Check, AlertCircle, ArrowLeft, ArrowRight, Play, Heart } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import { useCart } from '@/context/CartContext'
import { useCustomer } from '@/context/CustomerContext'
import { useStore } from '@/context/StoreContext'
import { parseProductVariations, VariationOption } from '@/components/AdminProductsClient'
import ProductCard from '@/components/ProductCard'
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
  created_at: string
  is_featured: boolean
  categories?: { name: string }
}

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductDetailClientProps {
  product: Product
  categories: Category[]
  relatedProducts?: Product[]
}

export default function ProductDetailClient({ product, categories, relatedProducts = [] }: ProductDetailClientProps) {
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useCustomer()
  const { settings } = useStore()
  const { t, toBengaliDigits, isBangla } = useLanguage()
  const [guestToast, setGuestToast] = useState(false)
  
  const isWishlisted = isInWishlist(product.id)

  const handleWishlistToggle = async () => {
    const res = await toggleWishlist(product.id)
    if (res.isGuest && res.added) {
      setGuestToast(true)
      setTimeout(() => setGuestToast(false), 3500)
    }
  }
  
  const parsedOptions: VariationOption[] = parseProductVariations(product.variations, product.stock)
  
  // Set default variations to the first available option of each group
  const initialVariations: Record<string, string> = {}
  parsedOptions.forEach((opt) => {
    if (opt.values.length > 0) {
      // Pick first in-stock value, or first value if all out of stock
      const firstInStock = opt.values.find((v) => v.stock > 0) || opt.values[0]
      initialVariations[opt.name] = firstInStock.label
    }
  })

  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>(initialVariations)
  const [selectedMedia, setSelectedMedia] = useState<string>(
    product.images[0] || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5'
  )
  const [quantity, setQuantity] = useState<number>(1)
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false)

  const isVideo = (url: string) => /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url)

  // Variation selection handler (also auto-swaps photo if variation has image)
  const handleVariationChange = (groupName: string, valueLabel: string) => {
    setSelectedVariations((prev) => ({ ...prev, [groupName]: valueLabel }))

    // Find if this value has a specific image
    const group = parsedOptions.find((o) => o.name === groupName)
    const valObj = group?.values.find((v) => v.label === valueLabel)
    if (valObj?.image_url) {
      setSelectedMedia(valObj.image_url)
    }
  }

  // Calculate effective stock for currently selected variations
  const computeSelectedStock = () => {
    if (parsedOptions.length === 0) {
      return product.stock
    }

    // Find the minimum stock among selected values
    let minStock = Infinity
    parsedOptions.forEach((opt) => {
      const selectedLabel = selectedVariations[opt.name]
      const valObj = opt.values.find((v) => v.label === selectedLabel)
      if (valObj) {
        minStock = Math.min(minStock, valObj.stock)
      }
    })

    return minStock === Infinity ? product.stock : minStock
  }

  // Calculate dynamic variant price override (if selected option specifies a custom price)
  const computeActivePrice = () => {
    let activePrice = Number(product.price)
    parsedOptions.forEach((opt) => {
      const selectedLabel = selectedVariations[opt.name]
      const valObj = opt.values.find((v) => v.label === selectedLabel)
      if (valObj && valObj.price !== undefined && valObj.price !== null && Number(valObj.price) > 0) {
        activePrice = Number(valObj.price)
      }
    })
    return activePrice
  }

  const currentStock = computeSelectedStock()
  const activePrice = computeActivePrice()
  const isAvailable = currentStock > 0

  const handleAddToCart = () => {
    if (!isAvailable) return

    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: activePrice,
      image: selectedMedia || product.images[0] || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5',
      selectedVariations
    }, quantity)
    
    setCartDrawerOpen(true)
  }

  const isRichDescription = product.description && /<[a-z][\s\S]*>/i.test(product.description)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onCartToggle={() => setCartDrawerOpen(true)} />

      {/* BREADCRUMB */}
      <nav className="bg-slate-100/80 py-3 border-b border-slate-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/#categories" className="hover:text-brand-600">Shop</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-800 line-clamp-1">{product.name}</span>
        </div>
      </nav>

      {/* PRODUCT DETAIL BODY */}
      <main className="flex-grow mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* MEDIA SECTION */}
          <div className="space-y-4">
            <div className="aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm flex items-center justify-center">
              {isVideo(selectedMedia) ? (
                <video
                  src={selectedMedia}
                  controls
                  autoPlay
                  className="h-full w-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedMedia}
                  alt={product.name}
                  className="h-full w-full object-cover object-center"
                />
              )}
            </div>
            
            {/* Thumbnails Gallery */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-2">
                {product.images.map((mediaUrl, idx) => {
                  const isMediaVideo = isVideo(mediaUrl)
                  const isSelected = selectedMedia === mediaUrl

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedMedia(mediaUrl)}
                      className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-slate-900 transition-all ${
                        isSelected ? 'border-brand-600 ring-2 ring-brand-500/20 shadow-md' : 'border-slate-200 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {isMediaVideo ? (
                        <div className="h-full w-full flex items-center justify-center text-white">
                          <video src={mediaUrl} className="h-full w-full object-cover opacity-60" />
                          <Play className="absolute h-6 w-6 text-white fill-current" />
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl} alt="" className="h-full w-full object-cover object-center" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* SPECIFICATION DETAILS */}
          <div className="flex flex-col space-y-6">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(() => {
                  const productCatIds: string[] = Array.isArray(product.variations?.category_ids)
                    ? product.variations.category_ids
                    : product.category_id ? [product.category_id] : []
                  return categories
                    .filter((cat) => productCatIds.includes(cat.id))
                    .map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        className="inline-block rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 hover:bg-brand-100 transition-colors uppercase tracking-wider"
                      >
                        {cat.name}
                      </Link>
                    ))
                })()}
              </div>
              <h1 className="text-3xl font-black text-slate-950 tracking-tight">{product.name}</h1>
            </div>

            {/* Price Box */}
            <div className="flex items-baseline gap-3 py-3 border-y border-slate-200">
              <span className="text-3xl font-black text-slate-950">৳{activePrice.toLocaleString()}</span>
              {product.old_price > 0 && (
                <span className="text-lg text-slate-400 line-through font-semibold">
                  ৳{Number(product.old_price).toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            {isRichDescription ? (
              <div
                className="prose prose-sm max-w-none text-slate-600 leading-relaxed font-normal"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            )}

            {/* Dynamic Variations Selectors */}
            {/* Dynamic Variations Selectors */}
            {parsedOptions.length > 0 && (
              <div className="space-y-5 pt-2">
                {parsedOptions.map((opt) => (
                  <div key={opt.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {isBangla ? `${opt.name} নির্বাচন করুন:` : `Select ${opt.name}:`}
                      </label>
                      {selectedVariations[opt.name] && (
                        <span className="text-xs font-bold text-brand-600">
                          {selectedVariations[opt.name]}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {opt.values.map((val) => {
                        const isSelected = selectedVariations[opt.name] === val.label
                        const isSoldOut = val.stock <= 0

                        return (
                          <button
                            key={val.label}
                            type="button"
                            onClick={() => handleVariationChange(opt.name, val.label)}
                            className={`relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                              isSelected
                                ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-600/10 shadow-sm'
                                : isSoldOut
                                ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-pointer'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {val.image_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={val.image_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                            )}
                            <span>{val.label}</span>
                            {isSoldOut && (
                              <span className="text-[9px] bg-slate-200 text-slate-500 px-1 py-0.2 rounded uppercase">
                                {t('product.out_of_stock')}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic Stock Indicator */}
            <div className="flex items-center gap-2 text-sm font-medium pt-2">
              {isAvailable ? (
                <>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="text-brand-700 font-bold">
                    {isBangla ? `${toBengaliDigits(currentStock)} টি পণ্য স্টকে উপলব্ধ রয়েছে` : `${currentStock} units available in stock`}
                  </span>
                </>
              ) : (
                <>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                  </span>
                  <span className="text-red-700 font-bold">
                    {isBangla ? 'এই অপশনটি বর্তমানে স্টক শেষ' : 'This option is currently out of stock'}
                  </span>
                </>
              )}
            </div>

            {/* Quantity & Buy Button */}
            {isAvailable && (
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                {/* Quantity input */}
                <div className="flex items-center justify-between border border-slate-200 rounded-xl bg-white w-full sm:w-32 h-12 px-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 hover:bg-slate-50 rounded text-slate-600 font-bold"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold text-slate-900">
                    {isBangla ? toBengaliDigits(quantity) : quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    className="p-1 hover:bg-slate-50 rounded text-slate-600 font-bold"
                  >
                    +
                  </button>
                </div>
                
                {/* Add to Cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-bold text-white shadow-lg hover:bg-brand-500 transition-all duration-200 h-12"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {t('product.add_to_cart')}
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={`flex items-center justify-center gap-2 px-4 rounded-xl border-2 transition h-12 font-bold text-xs ${
                    isWishlisted
                      ? 'border-pink-500 bg-pink-50 text-pink-600'
                      : 'border-slate-200 hover:border-pink-300 hover:bg-pink-50/50 text-slate-700'
                  }`}
                  title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current text-pink-600' : 'text-slate-500'}`} />
                  <span className="hidden sm:inline">
                    {isWishlisted
                      ? (isBangla ? 'পছন্দে রাখা আছে' : 'Wishlisted')
                      : (isBangla ? 'পছন্দে রাখুন' : 'Wishlist')}
                  </span>
                </button>
              </div>
            )}

            {/* Guest Wishlist Reminder Alert */}
            {guestToast && (
              <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Heart className="h-4 w-4 text-pink-400 fill-current" />
                <span>{isBangla ? 'পছন্দের তালিকায় যুক্ত হয়েছে! স্থায়ীভাবে সংরক্ষণ করতে লগইন করুন।' : 'Added to wishlist! Sign in to keep it saved permanently.'}</span>
              </div>
            )}

            {/* Delivery Policy Banner (Generic & Provider-Agnostic) */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mt-6 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Truck className="h-4 w-4 text-brand-600" />
                <span>{t('hero.fast_delivery')}</span>
              </div>
              <p className="leading-relaxed text-slate-500">
                {isBangla
                  ? `সারা বাংলাদেশে দ্রুত ও নিরাপদ হোম ডেলিভারি। ডেলিভারি চার্জ ঢাকার ভিতরে ৳${toBengaliDigits(settings.delivery_charge_inside_dhaka || 0)} এবং ঢাকার বাইরে ৳${toBengaliDigits(settings.delivery_charge_outside_dhaka || 0)}।`
                  : `Fast and reliable doorstep delivery across Bangladesh. Delivery charge is ৳${settings.delivery_charge_inside_dhaka} inside Dhaka, and ৳${settings.delivery_charge_outside_dhaka} outside Dhaka.`}
              </p>
            </div>

            <div className="pt-4">
              <Link href="/" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> {t('common.back')}
              </Link>
            </div>

          </div>
        </div>

        {/* YOU MAY ALSO LIKE SECTION */}
        {relatedProducts.length > 0 && (
          <div className="mt-14 sm:mt-20 pt-8 sm:pt-12 border-t border-slate-200 space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">{t('product.related_products')}</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  categories={categories}
                  onAddToCartSuccess={() => setCartDrawerOpen(true)}
                />
              ))}
            </div>
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
