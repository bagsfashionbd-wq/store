'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import ImageUploader from '@/components/ImageUploader'
import { useLanguage } from '@/context/LanguageContext'
import {
  Megaphone, Plus, Trash2, Edit2, Copy, Check, Calendar,
  Percent, DollarSign, Truck, AlertCircle, Eye, Mail,
  CheckCircle2, Loader2, Sparkles, Image as ImageIcon, Layout,
  X, Search, Users, Send
} from 'lucide-react'
import axios from 'axios'

interface Promotion {
  id: string
  type: 'banner' | 'ribbon'
  title: string
  message: string
  image_url: string
  link_url: string
  is_active: boolean
  start_date: string
  end_date: string | null
  created_at: string
}

interface PromoCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed' | 'free_shipping'
  discount_value: number
  min_order_amount: number
  max_discount: number
  usage_limit: number
  usage_count: number
  included_product_ids: string[]
  excluded_product_ids: string[]
  is_active: boolean
  start_date: string
  end_date: string | null
  created_at: string
}

interface ProductOption {
  id: string
  name: string
  price: number
  images?: string[]
}

interface CustomerOption {
  id: string
  email: string
  full_name: string
}

interface AdminPromotionsClientProps {
  initialPromotions: Promotion[]
  initialPromoCodes: PromoCode[]
  products: ProductOption[]
  customers: CustomerOption[]
}

export default function AdminPromotionsClient({
  initialPromotions,
  initialPromoCodes,
  products,
  customers
}: AdminPromotionsClientProps) {
  const router = useRouter()
  const { t, isBangla } = useLanguage()

  const [activeTab, setActiveTab] = useState<'banners' | 'promocodes' | 'email'>('banners')
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions)
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(initialPromoCodes)

  // Banner / Ribbon Modal State
  const [promoModalOpen, setPromoModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  const [promoType, setPromoType] = useState<'banner' | 'ribbon'>('banner')
  const [promoTitle, setPromoTitle] = useState('')
  const [promoMessage, setPromoMessage] = useState('')
  const [promoImageUrl, setPromoImageUrl] = useState('')
  const [promoLinkUrl, setPromoLinkUrl] = useState('')
  const [promoIsActive, setPromoIsActive] = useState(true)
  const [promoStartDate, setPromoStartDate] = useState(new Date().toISOString().slice(0, 16))
  const [promoEndDate, setPromoEndDate] = useState('')
  const [savingPromo, setSavingPromo] = useState(false)

  // Promo Code Modal State
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null)
  const [codeName, setCodeName] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage')
  const [discountValue, setDiscountValue] = useState<number>(10)
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0)
  const [maxDiscount, setMaxDiscount] = useState<number>(0)
  const [usageLimit, setUsageLimit] = useState<number>(0)
  const [includedProductIds, setIncludedProductIds] = useState<string[]>([])
  const [excludedProductIds, setExcludedProductIds] = useState<string[]>([])
  const [codeIsActive, setCodeIsActive] = useState(true)
  const [codeStartDate, setCodeStartDate] = useState(new Date().toISOString().slice(0, 16))
  const [codeEndDate, setCodeEndDate] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productFilterMode, setProductFilterMode] = useState<'all' | 'include' | 'exclude'>('all')
  const [savingCode, setSavingCode] = useState(false)

  // Email Campaign State
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailCtaText, setEmailCtaText] = useState('Shop Now')
  const [emailCtaUrl, setEmailCtaUrl] = useState('/')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState('')

  // UI state
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Open Promo Create / Edit Modal
  const openPromoModal = (promo?: Promotion, defaultType: 'banner' | 'ribbon' = 'banner') => {
    if (promo) {
      setEditingPromo(promo)
      setPromoType(promo.type)
      setPromoTitle(promo.title || '')
      setPromoMessage(promo.message || '')
      setPromoImageUrl(promo.image_url || '')
      setPromoLinkUrl(promo.link_url || '')
      setPromoIsActive(promo.is_active)
      setPromoStartDate(promo.start_date ? new Date(promo.start_date).toISOString().slice(0, 16) : '')
      setPromoEndDate(promo.end_date ? new Date(promo.end_date).toISOString().slice(0, 16) : '')
    } else {
      setEditingPromo(null)
      setPromoType(defaultType)
      setPromoTitle('')
      setPromoMessage('')
      setPromoImageUrl('')
      setPromoLinkUrl('')
      setPromoIsActive(true)
      setPromoStartDate(new Date().toISOString().slice(0, 16))
      setPromoEndDate('')
    }
    setPromoModalOpen(true)
  }

  // Save Banner / Ribbon
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPromo(true)
    try {
      const payload = {
        type: promoType,
        title: promoTitle,
        message: promoMessage,
        image_url: promoImageUrl,
        link_url: promoLinkUrl,
        is_active: promoIsActive,
        start_date: promoStartDate || new Date().toISOString(),
        end_date: promoEndDate || null
      }

      if (editingPromo) {
        const res = await axios.put('/api/admin/promotions', { id: editingPromo.id, ...payload })
        setPromotions(promotions.map((p) => (p.id === editingPromo.id ? res.data.data : p)))
        showToast('Promotion updated successfully!')
      } else {
        const res = await axios.post('/api/admin/promotions', payload)
        setPromotions([res.data.data, ...promotions])
        showToast('Promotion created successfully!')
      }
      setPromoModalOpen(false)
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to save promotion')
    } finally {
      setSavingPromo(false)
    }
  }

  // Delete Promotion
  const handleDeletePromo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return
    try {
      await axios.delete(`/api/admin/promotions?id=${id}`)
      setPromotions(promotions.filter((p) => p.id !== id))
      showToast('Promotion deleted.')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete promotion')
    }
  }

  // Toggle Promo Active
  const handleTogglePromoActive = async (promo: Promotion) => {
    try {
      const nextActive = !promo.is_active
      const res = await axios.put('/api/admin/promotions', { id: promo.id, is_active: nextActive })
      setPromotions(promotions.map((p) => (p.id === promo.id ? res.data.data : p)))
      showToast(nextActive ? 'Promotion activated' : 'Promotion paused')
    } catch (err: any) {
      alert('Failed to update status')
    }
  }

  // Open Promo Code Modal
  const openCodeModal = (code?: PromoCode) => {
    if (code) {
      setEditingCode(code)
      setCodeName(code.code)
      setDiscountType(code.discount_type)
      setDiscountValue(code.discount_value)
      setMinOrderAmount(code.min_order_amount || 0)
      setMaxDiscount(code.max_discount || 0)
      setUsageLimit(code.usage_limit || 0)
      setIncludedProductIds(code.included_product_ids || [])
      setExcludedProductIds(code.excluded_product_ids || [])
      setProductFilterMode(
        (code.included_product_ids && code.included_product_ids.length > 0)
          ? 'include'
          : (code.excluded_product_ids && code.excluded_product_ids.length > 0)
          ? 'exclude'
          : 'all'
      )
      setCodeIsActive(code.is_active)
      setCodeStartDate(code.start_date ? new Date(code.start_date).toISOString().slice(0, 16) : '')
      setCodeEndDate(code.end_date ? new Date(code.end_date).toISOString().slice(0, 16) : '')
    } else {
      setEditingCode(null)
      setCodeName('')
      setDiscountType('percentage')
      setDiscountValue(10)
      setMinOrderAmount(0)
      setMaxDiscount(0)
      setUsageLimit(0)
      setIncludedProductIds([])
      setExcludedProductIds([])
      setProductFilterMode('all')
      setCodeIsActive(true)
      setCodeStartDate(new Date().toISOString().slice(0, 16))
      setCodeEndDate('')
    }
    setCodeModalOpen(true)
  }

  // Save Promo Code
  const handleSaveCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeName.trim()) {
      alert('Please enter a promo code name')
      return
    }

    setSavingCode(true)
    try {
      const payload = {
        code: codeName,
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_amount: Number(minOrderAmount),
        max_discount: Number(maxDiscount),
        usage_limit: Number(usageLimit),
        included_product_ids: productFilterMode === 'include' ? includedProductIds : [],
        excluded_product_ids: productFilterMode === 'exclude' ? excludedProductIds : [],
        is_active: codeIsActive,
        start_date: codeStartDate || new Date().toISOString(),
        end_date: codeEndDate || null
      }

      if (editingCode) {
        const res = await axios.put('/api/admin/promo-codes', { id: editingCode.id, ...payload })
        setPromoCodes(promoCodes.map((c) => (c.id === editingCode.id ? res.data.data : c)))
        showToast('Promo code updated successfully!')
      } else {
        const res = await axios.post('/api/admin/promo-codes', payload)
        setPromoCodes([res.data.data, ...promoCodes])
        showToast('Promo code created successfully!')
      }
      setCodeModalOpen(false)
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to save promo code')
    } finally {
      setSavingCode(false)
    }
  }

  // Delete Promo Code
  const handleDeleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return
    try {
      await axios.delete(`/api/admin/promo-codes?id=${id}`)
      setPromoCodes(promoCodes.filter((c) => c.id !== id))
      showToast('Promo code deleted.')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete promo code')
    }
  }

  // Toggle Code Active
  const handleToggleCodeActive = async (code: PromoCode) => {
    try {
      const nextActive = !code.is_active
      const res = await axios.put('/api/admin/promo-codes', { id: code.id, is_active: nextActive })
      setPromoCodes(promoCodes.map((c) => (c.id === code.id ? res.data.data : c)))
      showToast(nextActive ? 'Promo code enabled' : 'Promo code disabled')
    } catch (err: any) {
      alert('Failed to update status')
    }
  }

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Send Email Blast
  const handleSendEmailBlast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert('Please fill in both subject and body.')
      return
    }

    if (!confirm(`Are you sure you want to broadcast this promotional email to ${customers.length} registered customers?`)) {
      return
    }

    setSendingEmail(true)
    setEmailStatus('')

    try {
      const res = await axios.post('/api/email/promo', {
        subject: emailSubject,
        body: emailBody,
        ctaText: emailCtaText,
        ctaUrl: emailCtaUrl
      })

      setEmailStatus(`Success! Broadcast sent to ${res.data?.sentCount || customers.length} customers.`)
      setEmailSubject('')
      setEmailBody('')
    } catch (err: any) {
      setEmailStatus(err.response?.data?.error || 'Failed to send email broadcast.')
    } finally {
      setSendingEmail(false)
    }
  }

  const banners = promotions.filter((p) => p.type === 'banner')
  const ribbons = promotions.filter((p) => p.type === 'ribbon')

  const filteredProducts = products.filter((prod) =>
    prod.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Megaphone className="h-4 w-4" />
              <span>Marketing & Promotions</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Promotions & Campaigns
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage popup discount banners, top header ribbons, coupons, and email broadcasts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openPromoModal(undefined, 'banner')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              <span>New Banner / Ribbon</span>
            </button>
            <button
              onClick={() => openCodeModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
            >
              <Percent className="h-4 w-4" />
              <span>New Promo Code</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Banners</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {banners.filter((b) => b.is_active).length}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Ribbons</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {ribbons.filter((r) => r.is_active).length}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Promo Codes</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {promoCodes.length}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Email Subscribers</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {customers.length}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-2xl px-4 shadow-sm">
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 py-4 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'banners'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Banners & Top Ribbons ({promotions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('promocodes')}
            className={`flex items-center gap-2 py-4 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'promocodes'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Percent className="h-4 w-4" />
            <span>Promo Codes ({promoCodes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 py-4 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'email'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Email Broadcast ({customers.length})</span>
          </button>
        </div>

        {/* TAB 1: BANNERS & RIBBONS */}
        {activeTab === 'banners' && (
          <div className="space-y-8">
            {/* Pop-up Promotional Banners Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">First-Visit Pop-up Banners</h2>
                  <p className="text-xs text-slate-500">
                    Image pop-up modal shown to customers on first arrival (24h cooldown).
                  </p>
                </div>
                <button
                  onClick={() => openPromoModal(undefined, 'banner')}
                  className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Banner
                </button>
              </div>

              {banners.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                  <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-500">No pop-up banners created yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {banners.map((banner) => (
                    <div key={banner.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col">
                      <div className="relative h-44 bg-slate-200">
                        {banner.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                            No Image
                          </div>
                        )}
                        <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          banner.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                        }`}>
                          {banner.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 truncate">{banner.title || 'Untitled Banner'}</h3>
                          {banner.link_url && (
                            <p className="text-[11px] text-brand-600 truncate mt-0.5">Link: {banner.link_url}</p>
                          )}
                          <div className="mt-2 text-[10px] text-slate-400 space-y-0.5">
                            <div>Start: {new Date(banner.start_date).toLocaleDateString()}</div>
                            {banner.end_date && <div>End: {new Date(banner.end_date).toLocaleDateString()}</div>}
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                          <button
                            onClick={() => handleTogglePromoActive(banner)}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900"
                          >
                            {banner.is_active ? 'Pause' : 'Activate'}
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openPromoModal(banner)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePromo(banner.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Header Ribbons Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Top Header Announcement Ribbons</h2>
                  <p className="text-xs text-slate-500">
                    A sleek banner strip across the very top of your store with a dismiss button.
                  </p>
                </div>
                <button
                  onClick={() => openPromoModal(undefined, 'ribbon')}
                  className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Ribbon
                </button>
              </div>

              {ribbons.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                  <Layout className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-500">No top announcement ribbons created yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ribbons.map((ribbon) => (
                    <div key={ribbon.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ribbon.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                          }`}>
                            {ribbon.is_active ? 'Active' : 'Paused'}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{ribbon.title || 'Ribbon Message'}</span>
                        </div>
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 font-medium">
                          {ribbon.message || 'No text message'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center">
                        <button
                          onClick={() => handleTogglePromoActive(ribbon)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700"
                        >
                          {ribbon.is_active ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => openPromoModal(ribbon)}
                          className="p-2 rounded-xl text-slate-500 hover:bg-slate-200"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePromo(ribbon.id)}
                          className="p-2 rounded-xl text-red-500 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PROMO CODES */}
        {activeTab === 'promocodes' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Promo Codes & Discounts</h2>
                <p className="text-xs text-slate-500">
                  Create percentage, fixed cash, or free delivery discount codes with usage limits.
                </p>
              </div>

              <button
                onClick={() => openCodeModal()}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Create Promo Code
              </button>
            </div>

            {promoCodes.length === 0 ? (
              <div className="text-center py-12">
                <Percent className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No promo codes found</p>
                <p className="text-xs text-slate-400 mt-1">Click above to create your first discount coupon.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Promo Code</th>
                      <th className="px-6 py-3.5">Discount</th>
                      <th className="px-6 py-3.5">Min Order / Cap</th>
                      <th className="px-6 py-3.5">Usage</th>
                      <th className="px-6 py-3.5">Validity</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {promoCodes.map((code) => (
                      <tr key={code.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              {code.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(code.code)}
                              className="p-1 text-slate-400 hover:text-brand-600 transition"
                              title="Copy code"
                            >
                              {copiedCode === code.code ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900">
                            {code.discount_type === 'percentage' && `${code.discount_value}% OFF`}
                            {code.discount_type === 'fixed' && `৳${code.discount_value} OFF`}
                            {code.discount_type === 'free_shipping' && `Free Shipping`}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          <div>Min: {code.min_order_amount > 0 ? `৳${code.min_order_amount}` : 'None'}</div>
                          {code.discount_type === 'percentage' && code.max_discount > 0 && (
                            <div className="text-[10px] text-slate-400">Cap: ৳{code.max_discount}</div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900">
                            {code.usage_count}
                          </span>
                          <span className="text-slate-400">
                            {code.usage_limit > 0 ? ` / ${code.usage_limit}` : ' (Unlimited)'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-500 text-[11px]">
                          <div>From: {new Date(code.start_date).toLocaleDateString()}</div>
                          {code.end_date ? (
                            <div>To: {new Date(code.end_date).toLocaleDateString()}</div>
                          ) : (
                            <span className="text-emerald-600 font-semibold">No expiry</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleCodeActive(code)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              code.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {code.is_active ? 'Active' : 'Disabled'}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openCodeModal(code)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCode(code.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EMAIL BROADCAST */}
        {activeTab === 'email' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Broadcast Promotional Email</h2>
                <p className="text-xs text-slate-500">
                  Send marketing offers and announcements to all registered customers with an email on file.
                </p>
              </div>

              {emailStatus && (
                <div className="p-3 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
                  {emailStatus}
                </div>
              )}

              <form onSubmit={handleSendEmailBlast} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. 🎉 Weekend Flash Sale: 20% OFF Everything!"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email Body / Message *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Write your exciting offer, promotional details, or announcement here..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Call to Action Button Text
                    </label>
                    <input
                      type="text"
                      value={emailCtaText}
                      onChange={(e) => setEmailCtaText(e.target.value)}
                      placeholder="Shop Now"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Button Link URL
                    </label>
                    <input
                      type="text"
                      value={emailCtaUrl}
                      onChange={(e) => setEmailCtaUrl(e.target.value)}
                      placeholder="/"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={sendingEmail || customers.length === 0}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending Broadcast...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send to {customers.length} Customers</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Email Preview Column */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-400">
                <Eye className="h-4 w-4 text-brand-600" />
                <span>Live Email Preview</span>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50 space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Subject</span>
                  <span className="font-bold text-sm text-slate-900 block mt-0.5">
                    {emailSubject || 'Your Subject Will Appear Here'}
                  </span>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[100px]">
                  {emailBody || 'Your message text will be rendered here for your customers.'}
                </div>

                <div className="pt-2">
                  <div className="inline-block px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm">
                    {emailCtaText || 'Shop Now'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: BANNER / RIBBON MODAL */}
        {promoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">
                  {editingPromo ? 'Edit Promotion' : 'New Promotion'}
                </h3>
                <button onClick={() => setPromoModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSavePromo} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Promotion Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPromoType('banner')}
                      className={`p-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition ${
                        promoType === 'banner'
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <ImageIcon className="h-4 w-4" /> Pop-up Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromoType('ribbon')}
                      className={`p-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition ${
                        promoType === 'ribbon'
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Layout className="h-4 w-4" /> Top Ribbon
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Title / Internal Name
                  </label>
                  <input
                    type="text"
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    placeholder="e.g. 30% Flat Eid Discount"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500"
                  />
                </div>

                {promoType === 'banner' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Banner Image *
                    </label>
                    <ImageUploader
                      value={promoImageUrl ? [promoImageUrl] : []}
                      onChange={(urls) => setPromoImageUrl(Array.isArray(urls) ? urls[0] || '' : urls || '')}
                      single={true}
                      maxImages={1}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Ribbon Text Message *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={promoMessage}
                      onChange={(e) => setPromoMessage(e.target.value)}
                      placeholder="e.g. 🚚 Free Delivery on orders over ৳1500! Use code FREESHIP at checkout."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Click Link URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={promoLinkUrl}
                    onChange={(e) => setPromoLinkUrl(e.target.value)}
                    placeholder="/category/sale or /product/slug"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={promoStartDate}
                      onChange={(e) => setPromoStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={promoEndDate}
                      onChange={(e) => setPromoEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="promoIsActive"
                    checked={promoIsActive}
                    onChange={(e) => setPromoIsActive(e.target.checked)}
                    className="h-4 w-4 rounded text-brand-600"
                  />
                  <label htmlFor="promoIsActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Enable and make active immediately
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPromoModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPromo}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {savingPromo ? 'Saving...' : 'Save Promotion'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: PROMO CODE MODAL */}
        {codeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">
                  {editingCode ? 'Edit Promo Code' : 'Create New Promo Code'}
                </h3>
                <button onClick={() => setCodeModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Coupon Code Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={codeName}
                    onChange={(e) => setCodeName(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER30, EIDSPECIAL, FREESHIP"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono font-bold tracking-wider outline-none focus:border-brand-500 uppercase"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={discountType}
                      onChange={(e: any) => setDiscountType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold outline-none focus:border-brand-500"
                    >
                      <option value="percentage">Percentage (% OFF)</option>
                      <option value="fixed">Fixed Cash (৳ OFF)</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>

                  {discountType !== 'free_shipping' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Discount Value ({discountType === 'percentage' ? '%' : '৳'}) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Min Order ৳
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                      placeholder="0 = No Min"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono"
                    />
                  </div>

                  {discountType === 'percentage' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Max Cap ৳
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={maxDiscount}
                        onChange={(e) => setMaxDiscount(Number(e.target.value))}
                        placeholder="0 = No Cap"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(Number(e.target.value))}
                      placeholder="0 = Unlimited"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                </div>

                {/* Product Inclusion / Exclusion Filter */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Product Applicability
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setProductFilterMode('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        productFilterMode === 'all'
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Products
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductFilterMode('include')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        productFilterMode === 'include'
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Only Specific Products ({includedProductIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductFilterMode('exclude')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        productFilterMode === 'exclude'
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Exclude Specific Products ({excludedProductIds.length})
                    </button>
                  </div>

                  {productFilterMode !== 'all' && (
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 max-h-48 overflow-y-auto">
                      <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                        <Search className="h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Filter products..."
                          className="w-full outline-none text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        {filteredProducts.map((prod) => {
                          const isSelected = productFilterMode === 'include'
                            ? includedProductIds.includes(prod.id)
                            : excludedProductIds.includes(prod.id)

                          const toggle = () => {
                            if (productFilterMode === 'include') {
                              setIncludedProductIds(
                                isSelected
                                  ? includedProductIds.filter((id) => id !== prod.id)
                                  : [...includedProductIds, prod.id]
                              )
                            } else {
                              setExcludedProductIds(
                                isSelected
                                  ? excludedProductIds.filter((id) => id !== prod.id)
                                  : [...excludedProductIds, prod.id]
                              )
                            }
                          }

                          return (
                            <label
                              key={prod.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-brand-500 cursor-pointer text-xs"
                            >
                              <span className="font-semibold text-slate-800 truncate pr-2">{prod.name}</span>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={toggle}
                                className="h-4 w-4 text-brand-600 rounded"
                              />
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={codeStartDate}
                      onChange={(e) => setCodeStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={codeEndDate}
                      onChange={(e) => setCodeEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="codeIsActive"
                    checked={codeIsActive}
                    onChange={(e) => setCodeIsActive(e.target.checked)}
                    className="h-4 w-4 rounded text-brand-600"
                  />
                  <label htmlFor="codeIsActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Enable promo code immediately
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCodeModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCode}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {savingCode ? 'Saving...' : 'Save Promo Code'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
