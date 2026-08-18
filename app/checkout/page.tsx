'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag, Truck, ShieldCheck, ArrowLeft, Loader2,
  MapPin, AlertCircle, CheckCircle2, CreditCard
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import CartDrawer from '@/components/CartDrawer'
import { useCart } from '@/context/CartContext'
import { useStore } from '@/context/StoreContext'
import axios from 'axios'

interface City {
  city_id: number
  city_name: string
}

interface Zone {
  zone_id: number
  zone_name: string
}

interface Area {
  area_id: number
  area_name: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, cartTotal, clearCart } = useCart()
  const { settings } = useStore()

  // Form Fields
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [deliveryRegion, setDeliveryRegion] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka')

  // Pathao Locations
  const [cities, setCities] = useState<City[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [selectedArea, setSelectedArea] = useState<string>('')

  // State Management
  const isCodAllowed = settings.cod_enabled !== false
  const isPureBkashAllowed = settings.bkash_enabled !== false
  const requireDeliveryPrepay = isCodAllowed && settings.cod_prepay_delivery !== false

  const [deliveryCharge, setDeliveryCharge] = useState<number>(settings.delivery_charge_inside_dhaka || 60)
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH'>(() => {
    return isCodAllowed ? 'COD' : 'BKASH'
  })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)

  const isPathaoActive = settings.pathao_enabled === true
  const isSteadfastActive = settings.steadfast_enabled === true
  const defaultProvider = isPathaoActive ? 'pathao' : isSteadfastActive ? 'steadfast' : 'manual'

  // Sync payment method if settings change
  useEffect(() => {
    if (!isCodAllowed && isPureBkashAllowed) {
      setPaymentMethod('BKASH')
    } else if (isCodAllowed) {
      setPaymentMethod('COD')
    }
  }, [isCodAllowed, isPureBkashAllowed])

  // Update delivery charge for Simple Region mode (when Pathao is off)
  useEffect(() => {
    if (!isPathaoActive) {
      const charge = deliveryRegion === 'inside_dhaka'
        ? Number(settings.delivery_charge_inside_dhaka || 60)
        : Number(settings.delivery_charge_outside_dhaka || 120)
      setDeliveryCharge(charge)
    }
  }, [deliveryRegion, isPathaoActive, settings])

  // Fetch Cities for Pathao on mount ONLY if Pathao is active
  useEffect(() => {
    if (!isPathaoActive) return
    async function loadCities() {
      try {
        const response = await axios.get('/api/pathao?action=cities')
        if (Array.isArray(response.data)) setCities(response.data)
      } catch (err) {
        console.error('Failed to load Pathao cities', err)
      }
    }
    loadCities()
  }, [isPathaoActive])

  // Fetch Zones for Pathao
  useEffect(() => {
    if (!isPathaoActive || !selectedCity) {
      setZones([])
      setAreas([])
      setSelectedZone('')
      setSelectedArea('')
      return
    }

    async function loadZones() {
      try {
        const response = await axios.get(`/api/pathao?city_id=${selectedCity}`)
        if (Array.isArray(response.data)) setZones(response.data)
      } catch (err) {
        console.error('Failed to load zones', err)
      }
    }
    loadZones()
  }, [isPathaoActive, selectedCity])

  // Fetch Areas for Pathao
  useEffect(() => {
    if (!isPathaoActive || !selectedZone) {
      setAreas([])
      setSelectedArea('')
      return
    }

    async function loadAreas() {
      try {
        const response = await axios.get(`/api/pathao?zone_id=${selectedZone}`)
        if (Array.isArray(response.data)) setAreas(response.data)
      } catch (err) {
        console.error('Failed to load areas', err)
      }
    }
    loadAreas()
  }, [isPathaoActive, selectedZone])

  // Update Pathao dynamic delivery charge when city changes
  useEffect(() => {
    if (!isPathaoActive) return
    if (!selectedCity) {
      setDeliveryCharge(settings.delivery_charge_inside_dhaka || 60)
      return
    }

    // City ID 1 in Pathao is Dhaka
    if (String(selectedCity) === '1') {
      setDeliveryCharge(settings.delivery_charge_inside_dhaka || 60)
    } else {
      setDeliveryCharge(settings.delivery_charge_outside_dhaka || 120)
    }
  }, [isPathaoActive, selectedCity, settings])

  // Form Submit Handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      setErrorMessage('Please fill in all the required customer details.')
      return
    }

    if (customerPhone.length < 11) {
      setErrorMessage('Please enter a valid 11-digit mobile number (e.g. 017XXXXXXXX).')
      return
    }

    if (shippingAddress.trim().length < 6) {
      setErrorMessage('Please provide a complete delivery address.')
      return
    }

    if (isPathaoActive) {
      if (!selectedCity || !selectedZone || !selectedArea) {
        setErrorMessage('Please select your City, Zone, and Area for Pathao delivery.')
        return
      }
    }

    if (cartItems.length === 0) {
      setErrorMessage('Your shopping cart is empty.')
      return
    }

    setLoading(true)

    try {
      let cityName = ''
      let zoneName = ''
      let areaName = ''

      if (isPathaoActive) {
        cityName = cities.find((c) => String(c.city_id) === String(selectedCity))?.city_name || ''
        zoneName = zones.find((z) => String(z.zone_id) === String(selectedZone))?.zone_name || ''
        areaName = areas.find((a) => String(a.area_id) === String(selectedArea))?.area_name || ''
      } else {
        cityName = deliveryRegion === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka'
      }

      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        shipping_address: shippingAddress,
        shipping_provider: defaultProvider,
        city_id: Number(selectedCity || (deliveryRegion === 'inside_dhaka' ? 1 : 2)),
        zone_id: Number(selectedZone || 1),
        area_id: Number(selectedArea || 1),
        city_name: cityName,
        zone_name: zoneName,
        area_name: areaName,
        delivery_charge: deliveryCharge,
        total_price: cartTotal + deliveryCharge,
        payment_method: paymentMethod,
        cartItems: cartItems
      }

      const response = await axios.post('/api/bkash', payload)

      if (response.data?.checkoutUrl) {
        clearCart()
        window.location.href = response.data.checkoutUrl
      } else {
        throw new Error('Failed to fetch payment portal link')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.response?.data?.error || err.message || 'Something went wrong during checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <Navbar onCartToggle={() => setCartDrawerOpen(true)} />

      <main className="flex-grow mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 max-w-md mx-auto shadow-sm">
            <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
            <p className="mt-1 text-xs text-slate-500">Please add items to your cart before proceeding to checkout.</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-500 transition"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* LEFT: CHECKOUT FORM */}
            <div className="lg:col-span-7 space-y-8">
              <form onSubmit={handlePlaceOrder} className="space-y-8">

                {/* 1. CUSTOMER CONTACT */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-xs font-bold">1</span>
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">Customer Contact Information</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 uppercase">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 uppercase">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="017XXXXXXXX"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase">Email Address (Optional for Invoice)</label>
                    <input
                      type="email"
                      placeholder="customer@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* 2. SHIPPING ADDRESS (Adaptive Provider UI) */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-xs font-bold">2</span>
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      Delivery Destination
                    </h2>
                  </div>

                  {/* If Pathao is OFF: Simple Region Selector */}
                  {!isPathaoActive ? (
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-slate-600 uppercase block">Select Delivery Location *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition ${deliveryRegion === 'inside_dhaka'
                          ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/10'
                          : 'border-slate-200 hover:border-slate-300'
                          }`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="deliveryRegion"
                              checked={deliveryRegion === 'inside_dhaka'}
                              onChange={() => setDeliveryRegion('inside_dhaka')}
                              className="text-brand-600"
                            />
                            <span className="text-xs font-bold text-slate-900">Inside Dhaka City</span>
                          </div>
                          <span className="text-xs font-black text-brand-700">৳{settings.delivery_charge_inside_dhaka}</span>
                        </label>

                        <label className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition ${deliveryRegion === 'outside_dhaka'
                          ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/10'
                          : 'border-slate-200 hover:border-slate-300'
                          }`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="deliveryRegion"
                              checked={deliveryRegion === 'outside_dhaka'}
                              onChange={() => setDeliveryRegion('outside_dhaka')}
                              className="text-brand-600"
                            />
                            <span className="text-xs font-bold text-slate-900">Outside Dhaka (All BD)</span>
                          </div>
                          <span className="text-xs font-black text-brand-700">৳{settings.delivery_charge_outside_dhaka}</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    /* If Pathao: Cascading Dropdowns */
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase">City *</label>
                        <select
                          value={selectedCity}
                          onChange={(e) => setSelectedCity(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-xs outline-none focus:border-brand-500"
                        >
                          <option value="">Select City</option>
                          {cities.map((city) => (
                            <option key={city.city_id} value={city.city_id}>{city.city_name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase">Zone *</label>
                        <select
                          disabled={!selectedCity || zones.length === 0}
                          value={selectedZone}
                          onChange={(e) => setSelectedZone(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-xs outline-none disabled:bg-slate-50 focus:border-brand-500"
                        >
                          <option value="">Select Zone</option>
                          {zones.map((zone) => (
                            <option key={zone.zone_id} value={zone.zone_id}>{zone.zone_name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase">Area *</label>
                        <select
                          disabled={!selectedZone || areas.length === 0}
                          value={selectedArea}
                          onChange={(e) => setSelectedArea(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-xs outline-none disabled:bg-slate-50 focus:border-brand-500"
                        >
                          <option value="">Select Area</option>
                          {areas.map((area) => (
                            <option key={area.area_id} value={area.area_id}>{area.area_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 pt-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase">Detailed Delivery Address *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="House No, Road No, Flat / Floor, Landmark..."
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* 3. PAYMENT METHOD */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-xs font-bold">3</span>
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">Select Payment Method</h2>
                  </div>

                  <div className={`grid gap-4 ${isCodAllowed && isPureBkashAllowed ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* COD Option */}
                    {isCodAllowed && (
                      <label className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'COD'
                        ? 'border-brand-600 bg-brand-50/30 ring-2 ring-brand-500/10'
                        : 'border-slate-200 hover:border-slate-300'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === 'COD'}
                              onChange={() => setPaymentMethod('COD')}
                              className="text-brand-600"
                            />
                            <span className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</span>
                          </div>
                          <Truck className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                          {requireDeliveryPrepay ? (
                            <>
                              Pay delivery charge (<strong>৳{deliveryCharge}</strong>) upfront via bKash to confirm order. Pay product balance (<strong>৳{cartTotal.toLocaleString()}</strong>) upon doorstep arrival.
                            </>
                          ) : (
                            <>
                              100% Cash on Delivery. Pay full amount (<strong>৳{(cartTotal + deliveryCharge).toLocaleString()}</strong>) at your doorstep when you receive the parcel.
                            </>
                          )}
                        </p>
                      </label>
                    )}

                    {/* bKash Full Payment */}
                    {isPureBkashAllowed && (
                      <label className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'BKASH'
                        ? 'border-brand-600 bg-brand-50/30 ring-2 ring-brand-500/10'
                        : 'border-slate-200 hover:border-slate-300'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === 'BKASH'}
                              onChange={() => setPaymentMethod('BKASH')}
                              className="text-brand-600"
                            />
                            <span className="text-xs font-bold text-slate-900">Full Online Payment (bKash)</span>
                          </div>
                          <CreditCard className="h-4 w-4 text-pink-600" />
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                          Pay the complete order amount (<strong>৳{(cartTotal + deliveryCharge).toLocaleString()}</strong>) now securely via official bKash Tokenized portal.
                        </p>
                      </label>
                    )}
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-4 text-base font-bold text-white shadow-xl hover:bg-brand-500 disabled:bg-slate-400 transition-all duration-200 h-14"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>
                        {paymentMethod === 'COD' && !requireDeliveryPrepay
                          ? 'Placing Order...'
                          : 'Connecting to bKash Gateway...'
                        }
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      <span>
                        {paymentMethod === 'COD'
                          ? requireDeliveryPrepay
                            ? `Pay Advance Delivery Fee ৳${deliveryCharge} via bKash & Confirm Order`
                            : `Confirm & Place Order (৳${(cartTotal + deliveryCharge).toLocaleString()} Due on Delivery)`
                          : `Pay Total ৳${(cartTotal + deliveryCharge).toLocaleString()} via bKash`
                        }
                      </span>
                    </>
                  )}
                </button>

              </form>
            </div>

            {/* RIGHT: ORDER SUMMARY */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-slate-950 pb-3 border-b border-slate-100">
                  Order Summary ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)
                </h3>

                {/* Items List */}
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${JSON.stringify(item.selectedVariations)}`} className="py-3 flex gap-3">
                      <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 text-xs">
                        <p className="font-bold text-slate-900 line-clamp-1">{item.name}</p>
                        {Object.entries(item.selectedVariations).map(([k, v]) => (
                          <span key={k} className="text-[10px] text-slate-400 block">{k}: {v}</span>
                        ))}
                        <p className="text-slate-500 mt-0.5">Qty: {item.quantity} × ৳{item.price.toLocaleString()}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-900">৳{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing Summary */}
                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Products Subtotal</span>
                    <span className="font-bold text-slate-900">৳{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge {isPathaoActive ? '(Pathao)' : isSteadfastActive ? '(Steadfast)' : '(Standard)'}</span>
                    <span className="font-bold text-brand-700">৳{deliveryCharge}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t border-slate-100">
                    <span>Total Order Amount</span>
                    <span className="text-base text-brand-700">৳{(cartTotal + deliveryCharge).toLocaleString()}</span>
                  </div>
                </div>

                {/* Security Note */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                  <CheckCircle2 className="h-4 w-4 text-brand-600 flex-shrink-0" />
                  <span>Secure automated bKash tokenized gateway checkout.</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </div>
  )
}
