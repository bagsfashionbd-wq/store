'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useCustomer } from '@/context/CustomerContext'
import { useLanguage } from '@/context/LanguageContext'
import { createClient } from '@/utils/supabase/client'
import { UserCheck, Sparkles, Lock, Mail, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import axios from 'axios'

interface OrderClaimAccountProps {
  orderId: string
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  shippingAddress: string
  cityId?: number
  zoneId?: number
  areaId?: number
}

export default function OrderClaimAccountCard({
  orderId,
  customerName,
  customerPhone,
  customerEmail = '',
  shippingAddress,
  cityId = 0,
  zoneId = 0,
  areaId = 0
}: OrderClaimAccountProps) {
  const { customer, refreshCustomer } = useCustomer()
  const { isBangla } = useLanguage()
  const supabase = createClient()

  const [email, setEmail] = useState(customerEmail || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(false)

  // If already logged in, no need to show the signup prompt
  if (customer) {
    return null
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError(isBangla ? 'অনুগ্রহ করে একটি সঠিক ইমেইল অ্যাড্রেস লিখুন।' : 'Please provide a valid email address.')
      return
    }

    if (password.length < 6) {
      setError(isBangla ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/customer/auth', {
        action: 'signup',
        order_id: orderId,
        full_name: customerName,
        phone: customerPhone,
        email: cleanEmail,
        password,
        address: shippingAddress,
        city_id: cityId,
        zone_id: zoneId,
        area_id: areaId
      })

      if (res.data?.session) {
        await supabase.auth.setSession(res.data.session)
      }

      await refreshCustomer()
      setCreated(true)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.error || err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (created) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-300 p-6 text-left space-y-4 animate-scale-up">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isBangla ? 'অভিনন্দন! অ্যাকাউন্ট তৈরি সফল হয়েছে 🎉' : 'Account Created Successfully! 🎉'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {isBangla ? 'আপনার এই অর্ডারটি স্বয়ংক্রিয়ভাবে আপনার প্রোফাইলে যুক্ত করা হয়েছে।' : 'This order has been linked to your account. You can track it anytime.'}
            </p>
          </div>
        </div>

        <div className="pt-1 flex justify-end">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition"
          >
            <span>{isBangla ? 'আমার অ্যাকাউন্ট ও অর্ডার ট্র্যাকিং দেখুন' : 'Go to My Account & Orders'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-gradient-to-r from-brand-50/80 via-white to-indigo-50/80 border border-brand-200/90 p-5 sm:p-6 text-left shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3.5">
        <div className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-950">
              {isBangla ? 'অ্যাকাউন্ট তৈরি করে অর্ডারটি ট্র্যাক করুন' : 'Create an Account & Track this Order'}
            </h3>
            <span className="bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
              {isBangla ? '১-ক্লিকে' : '1-Click'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {isBangla 
              ? 'আপনার নাম ও ঠিকানা আমরা স্বয়ংক্রিয়ভাবে সংরক্ষণ করব, যাতে পরবর্তীতে এক ক্লিকে অর্ডার করতে পারেন।' 
              : 'Save your address for future 1-click checkouts and easily track all your deliveries in real-time.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Quick Sign-Up Form with prefilled details */}
      <form onSubmit={handleCreateAccount} className="space-y-3 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {isBangla ? 'ইমেইল অ্যাড্রেস *' : 'Email Address *'}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand-500 pl-8 font-medium"
              />
              <Mail className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {isBangla ? 'একটি পাসওয়ার্ড তৈরি করুন *' : 'Set a Password *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isBangla ? 'কমপক্ষে ৬ অক্ষর' : 'Min 6 characters'}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand-500 pl-8 pr-8"
              />
              <Lock className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
          <p className="text-[10px] text-slate-400">
            {isBangla 
              ? `নাম: ${customerName} | ফোন: ${customerPhone}` 
              : `Name: ${customerName} • Phone: ${customerPhone}`}
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            <UserCheck className="h-4 w-4" />
            <span>{loading ? (isBangla ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating Account...') : (isBangla ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account & Save Order')}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
