'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import { useCustomer } from '@/context/CustomerContext'
import { useCart } from '@/context/CartContext'
import { useLanguage } from '@/context/LanguageContext'
import { useStore } from '@/context/StoreContext'
import {
  ShoppingBag, Heart, User, Lock, LogOut, Package,
  Truck, ArrowRight, CheckCircle2, Clock, AlertCircle,
  ExternalLink, FileText, Loader2, Sparkles, ChevronRight, Eye, EyeOff
} from 'lucide-react'
import axios from 'axios'

interface OrderItem {
  id: string
  quantity: number
  price: number
  selected_variations?: Record<string, string>
  products?: {
    name: string
    images?: string[]
    slug: string
  }
}

interface CustomerOrder {
  id: string
  created_at: string
  total_price: number
  delivery_charge: number
  discount_amount?: number
  order_status: string
  payment_method: string
  payment_status: string
  shipping_address: string
  shipping_provider?: string
  pathao_consignment_id?: string
  steadfast_tracking_code?: string
  order_items?: OrderItem[]
}

interface WishlistProduct {
  id: string
  name: string
  slug: string
  price: number
  old_price?: number
  images?: string[]
  stock: number
  variations?: any
}

export default function CustomerAccountClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { customer, isLoggedIn, loading, customerLogout, openAuthModal, refreshCustomer } = useCustomer()
  const { addToCart } = useCart()
  const { settings } = useStore()
  const { t, isBangla, toBengaliDigits } = useLanguage()

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const initialTab = (searchParams.get('tab') as 'orders' | 'wishlist' | 'profile' | 'password') || 'orders'
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile' | 'password'>(initialTab)

  // Orders State
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  // Wishlist State
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([])
  const [loadingWishlist, setLoadingWishlist] = useState(true)

  // Profile Form
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  // Password Form
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')

  // Sync tab from URL if present
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['orders', 'wishlist', 'profile', 'password'].includes(tabParam)) {
      setActiveTab(tabParam as any)
    }
  }, [searchParams])

  // Fill profile fields
  useEffect(() => {
    if (customer) {
      setFullName(customer.full_name || '')
      setPhone(customer.phone || '')
      setEmail(customer.email || '')
      setAddress(customer.address || '')
    }
  }, [customer])

  // Fetch orders when logged in
  useEffect(() => {
    if (!isLoggedIn) return
    async function loadOrders() {
      try {
        setLoadingOrders(true)
        const res = await axios.get('/api/customer/orders')
        if (Array.isArray(res.data?.orders)) {
          setOrders(res.data.orders)
        }
      } catch (err) {
        console.error('Failed to load customer orders', err)
      } finally {
        setLoadingOrders(false)
      }
    }
    loadOrders()
  }, [isLoggedIn])

  // Fetch wishlist when logged in
  useEffect(() => {
    if (!isLoggedIn) return
    async function loadWishlist() {
      try {
        setLoadingWishlist(true)
        const res = await axios.get('/api/customer/wishlist')
        if (Array.isArray(res.data?.items)) {
          setWishlistProducts(res.data.items)
        }
      } catch (err) {
        console.error('Failed to load customer wishlist', err)
      } finally {
        setLoadingWishlist(false)
      }
    }
    loadWishlist()
  }, [isLoggedIn])

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg('')
    try {
      await axios.patch('/api/customer/profile', { full_name: fullName, phone, address })
      await refreshCustomer()
      setProfileMsg(isBangla ? 'প্রোফাইল ও ঠিকানা সফলভাবে আপডেট হয়েছে!' : 'Profile & address updated successfully!')
      setTimeout(() => setProfileMsg(''), 3000)
    } catch (err: any) {
      setProfileMsg(err.response?.data?.error || 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  // Save Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg('')

    if (newPassword !== confirmPassword) {
      setPasswordMsg(isBangla ? 'পাসওয়ার্ড দুটি মিলছে না।' : 'Passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setPasswordMsg(isBangla ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.')
      return
    }

    setSavingPassword(true)
    try {
      await axios.post('/api/customer/password', { new_password: newPassword })
      setPasswordMsg(isBangla ? 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!' : 'Password changed successfully!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordMsg(''), 3000)
    } catch (err: any) {
      setPasswordMsg(err.response?.data?.error || 'Failed to change password.')
    } finally {
      setSavingPassword(false)
    }
  }

  // Remove Wishlist item
  const handleRemoveWishlist = async (productId: string) => {
    try {
      await axios.delete(`/api/customer/wishlist?product_id=${productId}`)
      setWishlistProducts((prev) => prev.filter((p) => p.id !== productId))
    } catch (err) {
      console.error(err)
    }
  }

  // Add to cart from wishlist & clear item from wishlist
  const handleAddToCart = (product: WishlistProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images?.[0] || '/logo.jpeg',
      selectedVariations: {}
    }, 1)
    setWishlistProducts((prev) => prev.filter((p) => p.id !== product.id))
    setCartDrawerOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'pending'
    if (s.includes('deliver') || s.includes('complete')) {
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Delivered</span>
    }
    if (s.includes('dispatch') || s.includes('transit') || s.includes('shipping')) {
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Dispatched</span>
    }
    if (s.includes('cancel')) {
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Cancelled</span>
    }
    if (s.includes('review') || s.includes('process')) {
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Processing</span>
    }
    return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Pending</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar onCartToggle={() => setCartDrawerOpen(true)} />
        <div className="flex-1 flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
        </div>
        <Footer />
      </div>
    )
  }

  // IF NOT LOGGED IN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar onCartToggle={() => setCartDrawerOpen(true)} />
        <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-xl">
            <div className="h-16 w-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <User className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isBangla ? 'কাস্টমার অ্যাকাউন্ট' : 'Customer Account'}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isBangla
                ? 'আপনার অর্ডার হিস্ট্রি দেখতে, পার্সেল ট্র্যাক করতে এবং উইশলিস্ট সংরক্ষণ করতে সাইন ইন করুন।'
                : 'Sign in to access your previous orders, live courier tracking, saved wishlist, and personal profile.'}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => openAuthModal('login')}
                className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition"
              >
                {isBangla ? 'লগইন করুন' : 'Sign In'}
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs transition"
              >
                {isBangla ? 'নতুন একাউন্ট' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    )
  }

  // LOGGED IN VIEW
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar onCartToggle={() => setCartDrawerOpen(true)} />
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {/* Header Breadcrumb */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <Link href="/" className="hover:text-slate-700">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-slate-800 font-bold">My Account</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {isBangla ? `স্বাগতম, ${customer?.full_name || 'গ্রাহক'}` : `Welcome back, ${customer?.full_name || 'Customer'}`}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {customer?.email} • {customer?.phone}
            </p>
          </div>

          <button
            onClick={() => customerLogout()}
            className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold text-xs transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{isBangla ? 'লগআউট' : 'Sign Out'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Nav */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm space-y-1 h-fit">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'orders'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-4 w-4" />
                <span>{isBangla ? 'আমার অর্ডারসমূহ' : 'My Orders'}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'wishlist'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className="h-4 w-4" />
                <span>{isBangla ? 'উইশলিস্ট' : 'Wishlist'}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'wishlist' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {wishlistProducts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'profile'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <User className="h-4 w-4" />
              <span>{isBangla ? 'প্রোফাইল তথ্য' : 'Profile Settings'}</span>
            </button>

            <button
              onClick={() => setActiveTab('password')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'password'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>{isBangla ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</span>
            </button>
          </div>

          {/* Main Tab Content */}
          <div className="lg:col-span-3">
            {/* TAB 1: ORDERS */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isBangla ? 'অর্ডার হিস্ট্রি ও ট্র্যাকিং' : 'Order History & Tracking'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isBangla
                      ? 'আপনার সমস্ত অতীতের অর্ডার, পেমেন্ট স্ট্যাটাস এবং লাইভ কুরিয়ার ট্র্যাকিং দেখুন।'
                      : 'View your previous purchases, download official invoices, and track live deliveries.'}
                  </p>
                </div>

                {loadingOrders ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="h-6 w-6 text-brand-600 animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
                    <Package className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">
                      {isBangla ? 'এখনো কোনো অর্ডার করা হয়নি' : 'No orders found'}
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
                    >
                      <span>{isBangla ? 'কেনাকাটা শুরু করুন' : 'Start Shopping'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-slate-900">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              {getStatusBadge(order.order_status)}
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {new Date(order.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/invoice/${order.id}`}
                              target="_blank"
                              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-bold text-slate-700 flex items-center gap-1 shadow-sm"
                            >
                              <FileText className="h-3.5 w-3.5 text-brand-600" />
                              <span>{isBangla ? 'ইনভয়েস' : 'Invoice'}</span>
                            </Link>

                            <Link
                              href={`/track?order_id=${order.id}&phone=${customer?.phone || ''}`}
                              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-[11px] font-bold text-white flex items-center gap-1 shadow-sm"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              <span>{isBangla ? 'ট্র্যাক' : 'Track'}</span>
                            </Link>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2.5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.products?.images?.[0] || '/logo.jpeg'}
                                  alt=""
                                  className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 block">{item.products?.name || 'Product'}</span>
                                  <span className="text-[11px] text-slate-400">Qty: {item.quantity}</span>
                                </div>
                              </div>
                              <span className="font-bold text-slate-900 font-mono">
                                ৳{(Number(item.price) * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Totals Bar */}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>
                            Payment: <span className="font-normal">{order.payment_method} ({order.payment_status})</span>
                          </span>
                          <span className="text-sm font-black text-brand-700">
                            Total: ৳{Number(order.total_price).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isBangla ? 'পছন্দের পণ্যসমূহ (উইশলিস্ট)' : 'My Saved Wishlist'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isBangla ? 'আপনার পছন্দের সব পণ্য এক জায়গায় সংরক্ষিত।' : 'Items you have saved for later.'}
                  </p>
                </div>

                {loadingWishlist ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="h-6 w-6 text-brand-600 animate-spin" />
                  </div>
                ) : wishlistProducts.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
                    <Heart className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">
                      {isBangla ? 'উইশলিস্ট খালি' : 'Your wishlist is empty'}
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
                    >
                      <span>{isBangla ? 'পণ্য ব্রাউজ করুন' : 'Explore Products'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {wishlistProducts.map((product) => (
                      <div key={product.id} className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col justify-between">
                        <Link href={`/product/${product.slug}`} className="block relative h-44 bg-slate-200 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.images?.[0] || '/logo.jpeg'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </Link>

                        <div className="p-4 space-y-2">
                          <Link href={`/product/${product.slug}`} className="font-bold text-xs text-slate-900 hover:text-brand-600 line-clamp-2">
                            {product.name}
                          </Link>

                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-black text-brand-700">
                              ৳{Number(product.price).toLocaleString()}
                            </span>
                            {product.old_price && Number(product.old_price) > Number(product.price) && (
                              <span className="text-[11px] text-slate-400 line-through">
                                ৳{Number(product.old_price).toLocaleString()}
                              </span>
                            )}
                          </div>

                          <div className="pt-2 flex items-center gap-2">
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                              <span>Add to Cart</span>
                            </button>
                            <button
                              onClick={() => handleRemoveWishlist(product.id)}
                              className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition"
                              title="Remove"
                            >
                              <Heart className="h-4 w-4 fill-current text-rose-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PROFILE */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-xl">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isBangla ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isBangla ? 'আপনার নাম ও যোগাযোগের তথ্য পরিবর্তন করুন।' : 'Update your personal details and contact info.'}
                  </p>
                </div>

                {profileMsg && (
                  <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    profileMsg.includes('success') || profileMsg.includes('সফল')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{profileMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      {isBangla ? 'পূর্ণ নাম' : 'Full Name'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      {isBangla ? 'মোবাইল নম্বর' : 'Mobile Number'} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      {isBangla ? 'ইমেইল (লগইন আইডি)' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Email is permanently linked to your login account.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      {isBangla ? 'ডিফল্ট ডেলিভারি ঠিকানা' : 'Default Delivery Address'}
                    </label>
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={isBangla ? 'যেমনঃ বাড়ি #১২, রোড #৫, সেক্টর #৩, উত্তরা, ঢাকা' : 'e.g. House 12, Road 5, Sector 3, Uttara, Dhaka'}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 font-medium resize-none leading-relaxed"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isBangla
                        ? 'চেকআউটের সময় এই ঠিকানাটি স্বয়ংক্রিয়ভাবে পূরণ হবে।'
                        : 'This address will automatically pre-fill your checkout form.'}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: PASSWORD */}
            {activeTab === 'password' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-xl">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isBangla ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Account Password'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isBangla ? 'সুরক্ষার জন্য একটি শক্তিশালী পাসওয়ার্ড দিন।' : 'Update your account login password.'}
                  </p>
                </div>

                {passwordMsg && (
                  <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    passwordMsg.includes('success') || passwordMsg.includes('সফল')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <AlertCircle className="h-4 w-4" />
                    <span>{passwordMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      {isBangla ? 'নতুন পাসওয়ার্ড' : 'New Password'} *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 pl-3.5 pr-10 py-2.5 text-xs outline-none focus:border-brand-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      {isBangla ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'} *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 pl-3.5 pr-10 py-2.5 text-xs outline-none focus:border-brand-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
