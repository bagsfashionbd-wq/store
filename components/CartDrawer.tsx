'use client'

import React from 'react'
import Link from 'next/link'
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useLanguage } from '@/context/LanguageContext'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart()
  const { t, toBengaliDigits, isBangla } = useLanguage()

  if (!isOpen) return null

  const totalQuantity = cartItems.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        {/* Background Overlay */}
        <div 
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        />

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-md">
            <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl">
              
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-6 sm:px-6">
                <h2 className="text-base font-bold text-slate-900" id="slide-over-title">
                  {t('cart.shopping_cart')} ({isBangla ? toBengaliDigits(totalQuantity) : totalQuantity})
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* CART CONTENT */}
              <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                {cartItems.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="rounded-full bg-slate-100 p-6 text-slate-400 mb-4">
                      <ShoppingBag className="h-10 w-10" />
                    </div>
                    <p className="text-base font-bold text-slate-900">{t('cart.empty_cart')}</p>
                    <p className="mt-1 text-xs text-slate-500">{t('cart.empty_subtitle')}</p>
                    <button
                      onClick={onClose}
                      className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-brand-500 transition"
                    >
                      {t('cart.start_shopping')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div 
                        key={`${item.id}-${JSON.stringify(item.selectedVariations)}`}
                        className="flex py-4 border-b border-slate-100 items-start"
                      >
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5'}
                            alt={item.name}
                            className="h-full w-full object-cover object-center"
                          />
                        </div>

                        <div className="ml-3 flex flex-1 flex-col">
                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-900">
                              <h3 className="line-clamp-1">
                                <Link 
                                  href={`/product/${item.slug}`}
                                  onClick={onClose}
                                  className="hover:text-brand-600 transition"
                                >
                                  {item.name}
                                </Link>
                              </h3>
                              <p className="ml-2 font-black">৳{(item.price * item.quantity).toLocaleString()}</p>
                            </div>

                            {/* Selected variations */}
                            {Object.entries(item.selectedVariations).map(([key, value]) => (
                              <p key={key} className="mt-0.5 text-[11px] text-slate-500">
                                <strong>{key}:</strong> {value}
                              </p>
                            ))}
                          </div>
                          
                          <div className="flex flex-1 items-center justify-between pt-2 text-xs">
                            {/* Quantity Selector */}
                            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                              <button
                                onClick={() => updateQuantity(item.id, item.selectedVariations, item.quantity - 1)}
                                className="px-2 py-0.5 hover:bg-slate-100 rounded-l-lg transition text-slate-600 font-bold"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-2 text-xs text-slate-900 font-bold">
                                {isBangla ? toBengaliDigits(item.quantity) : item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.selectedVariations, item.quantity + 1)}
                                className="px-2 py-0.5 hover:bg-slate-100 rounded-r-lg transition text-slate-600 font-bold"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => removeFromCart(item.id, item.selectedVariations)}
                              className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                              title={t('cart.remove_item')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FOOTER */}
              {cartItems.length > 0 && (
                <div className="border-t border-slate-200 px-4 py-6 sm:px-6 bg-slate-50">
                  <div className="flex justify-between text-sm font-bold text-slate-900">
                    <p>{t('cart.subtotal')}</p>
                    <p className="text-base font-black">৳{cartTotal.toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {isBangla 
                      ? 'ডেলিভারি লোকেশন অনুযায়ী চেকআউটে ডেলিভারি চার্জ হিসাব করা হবে।'
                      : 'Shipping is calculated at checkout based on delivery location.'}
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/checkout"
                      onClick={onClose}
                      className="flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-brand-500 transition-all"
                    >
                      {t('cart.proceed_to_checkout')}
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
