'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Package, Truck, CheckCircle2, Clock, XCircle,
  FileText, ArrowRight, Loader2, AlertCircle, ShoppingBag, Phone, MapPin
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import { PublicStoreSettings } from '@/utils/settings'
import { useLanguage } from '@/context/LanguageContext'

interface TrackOrderClientProps {
  settings: PublicStoreSettings
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  selected_variations?: Record<string, string>
  products?: {
    name: string
    images?: string[]
  }
}

interface TrackedOrder {
  id: string
  customer_name: string
  customer_phone: string
  shipping_address: string
  shipping_provider?: string
  delivery_charge: number
  total_price: number
  payment_method: string
  payment_status: string
  order_status?: string
  pathao_consignment_id?: string
  pathao_status?: string
  steadfast_consignment_id?: string
  steadfast_tracking_code?: string
  payment_details?: any
  created_at: string
  order_items?: OrderItem[]
}

export default function TrackOrderClient({ settings }: TrackOrderClientProps) {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('id') || searchParams.get('phone') || searchParams.get('query') || ''
  const { t, toBengaliDigits, isBangla } = useLanguage()

  const [query, setQuery] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [orders, setOrders] = useState<TrackedOrder[]>([])
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)

  const handleSearch = async (searchVal: string) => {
    const trimmed = searchVal.trim()
    if (!trimmed) {
      setErrorMessage('Please enter your Order ID (Invoice ID) or Mobile Number.')
      return
    }

    setLoading(true)
    setErrorMessage('')
    setHasSearched(true)

    try {
      const res = await fetch(`/api/track?query=${encodeURIComponent(trimmed)}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to search for order')
      }

      setOrders(data.orders || [])
      if (!data.orders || data.orders.length === 0) {
        setErrorMessage('No orders found matching that Invoice ID or Phone Number.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error tracking order. Please try again.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Auto-search on mount if query param present
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusStep = (order: TrackedOrder) => {
    const status = (order.order_status || 'Pending').toLowerCase()
    if (status === 'cancelled') return -1
    if (status === 'delivered' || status === 'completed') return 4
    if (status === 'shipped' || order.pathao_status === 'dispatched' || order.pathao_consignment_id || order.steadfast_consignment_id) return 3
    if (status === 'confirmed') return 2
    return 1 // Pending
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <Navbar onCartToggle={() => setCartDrawerOpen(true)} />

      <main className="flex-grow mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
        
        {/* HEADER & SEARCH BOX */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-2">
            <Package className="h-6 w-6" />
          </div>
          
          <div className="max-w-md mx-auto space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {t('track.track_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('track.track_subtitle')}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch(query)
            }}
            className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder={t('track.search_placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-brand-500 disabled:bg-slate-400 transition-all flex items-center justify-center gap-2 flex-shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('common.loading')}</span>
                </>
              ) : (
                <>
                  <span>{t('track.search_button')}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {errorMessage && (
            <div className="max-w-xl mx-auto flex items-center justify-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* ORDER RESULTS */}
        {hasSearched && orders.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                {isBangla 
                  ? `${toBengaliDigits(orders.length)} টি অর্ডার পাওয়া গেছে` 
                  : `Found ${orders.length} ${orders.length === 1 ? 'Order' : 'Orders'}`}
              </h2>
            </div>

            {orders.map((order) => {
              const currentStep = getStatusStep(order)
              const isCancelled = (order.order_status || '').toLowerCase() === 'cancelled'
              const isCompletedOrDelivered = (order.order_status || '').toLowerCase() === 'delivered' || (order.order_status || '').toLowerCase() === 'completed' || order.pathao_status === 'delivered'
              const isFullyPaid = order.payment_status === 'FullyPaid' || isCompletedOrDelivered
              const isPartiallyPaid = !isFullyPaid && (order.payment_status === 'DeliveryChargePrePaid' || (order.payment_details?.advance_paid !== undefined && Number(order.payment_details.advance_paid) > 0))
              const advanceAmount = order.payment_details?.advance_paid !== undefined ? Number(order.payment_details.advance_paid) : (order.payment_status === 'DeliveryChargePrePaid' ? Number(order.delivery_charge || 0) : 0)
              const dueOnDelivery = Math.max(0, Number(order.total_price) - advanceAmount)

              const shortId = order.id.slice(0, 8).toUpperCase()
              const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })

              const providerLabel = order.shipping_provider === 'steadfast' 
                ? 'Steadfast Courier' 
                : order.shipping_provider === 'pathao'
                  ? 'Pathao Express'
                  : isBangla ? 'হোম ডেলিভারি' : 'Standard / Home Delivery'

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 transition hover:shadow-md"
                >
                  {/* Top Bar */}
                  <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Order ID:</span>
                        <span className="font-mono font-black text-slate-950 text-base">#{shortId}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 font-medium">{orderDate}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        {t('track.recipient')}: <strong className="text-slate-900">{order.customer_name}</strong> ({order.customer_phone})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/invoice/${order.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-bold text-brand-700 hover:bg-brand-100 transition shadow-sm"
                      >
                        <FileText className="h-4 w-4" />
                        <span>{t('track.view_invoice')}</span>
                      </Link>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="p-6 sm:p-8">
                    {isCancelled ? (
                      <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 border border-red-200 text-red-800">
                        <XCircle className="h-6 w-6 flex-shrink-0 text-red-600" />
                        <div>
                          <p className="text-sm font-bold text-red-950">{t('track.cancelled')}</p>
                          <p className="text-xs text-red-700 mt-0.5">
                            {t('track.cancelled_desc')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('track.order_progress')}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          
                          {/* Step 1: Placed */}
                          <div className={`p-3.5 rounded-2xl border ${
                            currentStep >= 1 ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200 bg-slate-50'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                currentStep >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
                              }`}>1</span>
                              <p className="text-xs font-bold text-slate-900">{t('track.placed')}</p>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1.5">{t('track.placed_desc')}</p>
                          </div>

                          {/* Step 2: Confirmed */}
                          <div className={`p-3.5 rounded-2xl border ${
                            currentStep >= 2 ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200 bg-slate-50'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                currentStep >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
                              }`}>2</span>
                              <p className="text-xs font-bold text-slate-900">{t('track.confirmed')}</p>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1.5">
                              {currentStep >= 2 ? t('track.confirmed_desc') : 'Awaiting review'}
                            </p>
                          </div>

                          {/* Step 3: Shipped / Dispatched */}
                          <div className={`p-3.5 rounded-2xl border ${
                            currentStep >= 3 ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200 bg-slate-50'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                currentStep >= 3 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
                              }`}>3</span>
                              <p className="text-xs font-bold text-slate-900">{t('track.dispatched')}</p>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1.5">
                              {currentStep >= 3 ? providerLabel : 'Packaging items'}
                            </p>
                          </div>

                          {/* Step 4: Delivered */}
                          <div className={`p-3.5 rounded-2xl border ${
                            currentStep >= 4 ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200 bg-slate-50'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                currentStep >= 4 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
                              }`}>4</span>
                              <p className="text-xs font-bold text-slate-900">{t('track.delivered')}</p>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1.5">
                              {currentStep >= 4 ? t('track.delivered_desc') : 'In transit'}
                            </p>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>

                  {/* Consignment & Delivery Info */}
                  <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                    <div>
                      <p className="font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-brand-600" /> {t('track.delivery_details')}
                      </p>
                      <p className="font-semibold text-slate-900 leading-relaxed">{order.shipping_address}</p>
                      <p className="text-slate-500 mt-1 font-medium">{t('track.courier_partner')}: <strong className="text-slate-800">{providerLabel}</strong></p>
                      
                      {order.steadfast_tracking_code && (
                        <p className="mt-1 font-mono text-blue-600 font-bold">
                          Steadfast Tracking: {order.steadfast_tracking_code}
                        </p>
                      )}
                      {order.pathao_consignment_id && (
                        <p className="mt-1 font-mono text-brand-700 font-bold">
                          Pathao Consignment: {order.pathao_consignment_id}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" /> {t('track.payment_charges')}
                      </p>
                      <div className="space-y-2 text-slate-600 font-medium">
                        <div className="flex justify-between">
                          <span>{t('common.total')}:</span>
                          <span className="font-black text-slate-950">৳{Number(order.total_price).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('checkout.payment_method')}:</span>
                          <span className="font-semibold text-slate-800">{order.payment_method === 'COD' ? t('checkout.cod_title') : order.payment_method}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                          <span>{t('track.payment_status')}:</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isFullyPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPartiallyPaid
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : order.payment_status === 'Failed'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {isCompletedOrDelivered
                              ? t('track.paid_on_delivery')
                              : order.payment_status === 'FullyPaid'
                                ? t('track.fully_paid')
                                : isPartiallyPaid
                                  ? `${t('track.advance_paid')} (৳${advanceAmount.toLocaleString()})`
                                  : order.payment_status === 'Failed'
                                    ? t('track.failed')
                                    : t('track.pending_cod')}
                          </span>
                        </div>
                        {!isFullyPaid && (
                          <div className="flex justify-between text-[11px] text-amber-800 font-bold bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                            <span>{t('track.due_amount')}:</span>
                            <span>৳{dueOnDelivery.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="p-6 sm:p-8 space-y-3 bg-slate-50/30">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordered Items</p>
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{item.products?.name || 'Product'}</p>
                              {item.selected_variations && typeof item.selected_variations === 'object' && (
                                <p className="text-[11px] text-slate-500">
                                  {Object.entries(item.selected_variations).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-900">
                                Qty {item.quantity} × ৳{Number(item.price).toLocaleString()} = ৳{(Number(item.price) * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}

      </main>

      <Footer />
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </div>
  )
}
