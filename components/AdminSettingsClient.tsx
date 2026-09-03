'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useLanguage } from '@/context/LanguageContext'
import { StoreSettings } from '@/utils/settings'
import { formatExternalUrl } from '@/utils/url'
import { THEME_PALETTES } from '@/utils/theme'
import { formatGoogleMapsEmbedUrl } from '@/utils/map'
import ImageUploader from '@/components/ImageUploader'
import AdminSidebar from '@/components/AdminSidebar'
import {
  BarChart3, ShoppingBag, Package, LogOut, Settings, Save,
  Check, AlertCircle, RefreshCw, Upload, Sparkles, Truck,
  CreditCard, Palette, Layout, ExternalLink, Layers, Info, MapPin, Phone, Mail, MessageSquare, Eye, EyeOff,
  Share2, MessageCircle, Globe, Smartphone, X, Clock, Send, Loader2, Code, ShieldCheck, CheckCircle2
} from 'lucide-react'
import axios from 'axios'

interface AdminSettingsClientProps {
  initialSettings: StoreSettings
}

export default function AdminSettingsClient({ initialSettings }: AdminSettingsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const { t, isBangla } = useLanguage()

  const [settings, setSettings] = useState<StoreSettings>(initialSettings)
  const [activeTab, setActiveTab] = useState<'branding' | 'hero' | 'collections' | 'payment' | 'shipping' | 'emails' | 'tracking' | 'about'>('branding')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [bkashWarningModal, setBkashWarningModal] = useState(false)
  const [testDigestLoading, setTestDigestLoading] = useState(false)

  // Password Visibility Toggles
  const [showBkashPassword, setShowBkashPassword] = useState(false)
  const [showPathaoPassword, setShowPathaoPassword] = useState(false)

  // Pathao Dynamic Store Fetching
  const [pathaoStores, setPathaoStores] = useState<Array<{ store_id: number; store_name: string; store_address?: string }>>([])
  const [loadingPathaoStores, setLoadingPathaoStores] = useState(false)
  const [pathaoVerifyError, setPathaoVerifyError] = useState('')
  const [pathaoVerifySuccess, setPathaoVerifySuccess] = useState(false)

  const handleFetchPathaoStores = async () => {
    setLoadingPathaoStores(true)
    setPathaoVerifyError('')
    setPathaoVerifySuccess(false)
    try {
      const res = await axios.post('/api/pathao', {
        pathao_api_url: settings.pathao_api_url,
        pathao_client_id: settings.pathao_client_id,
        pathao_client_secret: settings.pathao_client_secret,
        pathao_username: settings.pathao_username,
        pathao_password: settings.pathao_password,
      })
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPathaoStores(res.data.data)
        setPathaoVerifySuccess(true)
        if (res.data.data.length > 0 && !settings.pathao_store_id) {
          setSettings(prev => ({ ...prev, pathao_store_id: String(res.data.data[0].store_id) }))
        }
        setTimeout(() => setPathaoVerifySuccess(false), 5000)
      } else {
        throw new Error(res.data?.error || 'Failed to fetch Pathao stores')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to connect to Pathao.'
      setPathaoVerifyError(errorMsg)
    } finally {
      setLoadingPathaoStores(false)
    }
  }

  const handleSendTestDailyDigest = async () => {
    setTestDigestLoading(true)
    try {
      const target = (settings.daily_digest_email || settings.contact_email || '').trim()
      const res = await axios.post('/api/cron/daily-digest', { email: target })
      if (res.data?.success) {
        alert(`Daily pending orders summary successfully sent to ${res.data.result?.recipient || target || 'configured email'}!`)
      } else {
        alert(res.data?.error || 'Failed to send test summary.')
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to send test summary.')
    } finally {
      setTestDigestLoading(false)
    }
  }

  const handleSave = async (customPayload?: Partial<StoreSettings>) => {
    setSaving(true)
    setErrorMsg('')
    setSaveSuccess(false)

    try {
      const payloadToSend = customPayload ? { ...settings, ...customPayload } : settings
      const response = await axios.put('/api/settings', payloadToSend)

      if (response.data?.success) {
        setSettings(response.data.data)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        router.refresh()
      } else {
        throw new Error(response.data?.error || 'Failed to update settings')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to save store settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/stradmn/login')
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100 text-slate-800">

      {/* UNIFIED SIDEBAR */}
      <AdminSidebar />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-brand-600 flex-shrink-0" />
            <h1 className="text-sm sm:text-lg font-bold text-slate-950 truncate">Store Settings</h1>
          </div>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-3 sm:px-4 py-2 shadow-sm transition disabled:bg-slate-400"
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </>
            )}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">

          {errorMsg && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB NAVIGATION (Mobile Scrollable Pills) */}
          <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-2 sm:px-4 gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('branding')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition ${activeTab === 'branding'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              <Palette className="h-4 w-4" /> Branding & Theme
            </button>
            <button
              onClick={() => setActiveTab('hero')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition ${activeTab === 'hero'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              <Layout className="h-4 w-4" /> Hero Banner
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition ${activeTab === 'collections'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              <Sparkles className="h-4 w-4" /> Collections & Showcase
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition ${activeTab === 'payment'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              <CreditCard className="h-4 w-4" /> Payment
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition ${activeTab === 'shipping'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              <Truck className="h-4 w-4" /> Courier & Shipping
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition ${activeTab === 'emails'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              <Mail className="h-4 w-4" /> Automated Emails
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition ${activeTab === 'tracking'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              <Share2 className="h-4 w-4" /> Ads & Social
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition ${activeTab === 'about'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              <Info className="h-4 w-4" /> About & Contact
            </button>
          </div>

          {/* TAB 1: BRANDING & THEME */}
          {activeTab === 'branding' && (
            <div className="bg-white rounded-b-lg border border-t-0 border-slate-200 p-6 space-y-8 shadow-sm">
              <div className="max-w-2xl space-y-6">

                {/* Store Name & Tagline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      value={settings.store_name}
                      onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                      placeholder="e.g. Verdant Aquatics"
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Store Tagline
                    </label>
                    <input
                      type="text"
                      value={settings.store_tagline}
                      onChange={(e) => setSettings({ ...settings, store_tagline: e.target.value })}
                      placeholder="e.g. Premium Quality Products in BD"
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Logo & Favicon Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Site Logo
                    </label>
                    <p className="text-[11px] text-slate-500">Visible in navbar, mobile drawer, and printable invoices.</p>
                    <ImageUploader
                      value={settings.logo_url ? [settings.logo_url] : []}
                      maxImages={1}
                      single={true}
                      allowVideo={false}
                      onChange={(urls) => setSettings({ ...settings, logo_url: Array.isArray(urls) ? (urls[0] || '') : (urls || '') })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Favicon (Browser Tab Icon)
                    </label>
                    <p className="text-[11px] text-slate-500">Square image (PNG / ICO / JPG) used as browser tab icon.</p>
                    <ImageUploader
                      value={settings.favicon_url ? [settings.favicon_url] : []}
                      maxImages={1}
                      single={true}
                      allowVideo={false}
                      onChange={(urls) => setSettings({ ...settings, favicon_url: Array.isArray(urls) ? (urls[0] || '') : (urls || '') })}
                    />
                  </div>
                </div>

                {/* Optional Watermark Toggle */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Product Photo Logo Watermark</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Automatically stamp your store logo watermark in the bottom-right corner of new product photos upon upload.
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.watermark_enabled}
                    onClick={() => setSettings({ ...settings, watermark_enabled: !settings.watermark_enabled })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.watermark_enabled ? 'bg-brand-600' : 'bg-slate-300'
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.watermark_enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>

                {/* 8 Curated Theme Color Palettes */}
                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Store Theme Color Palette
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Pick a curated theme palette. All buttons, badges, navigation highlights, and borders will dynamically match this theme.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {Object.values(THEME_PALETTES).map((palette) => (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => setSettings({ ...settings, theme_color: palette.id })}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition ${settings.theme_color === palette.id
                          ? 'border-slate-900 bg-slate-50 shadow-sm ring-2 ring-slate-900/10'
                          : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <span
                          className="h-6 w-6 rounded-full flex-shrink-0 shadow-inner border border-black/10"
                          style={{ backgroundColor: palette.previewHex }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{palette.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{palette.id}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: HERO BANNER */}
          {activeTab === 'hero' && (
            <div className="bg-white rounded-b-lg border border-t-0 border-slate-200 p-6 space-y-8 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Inputs (Left 7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Hero Badge Text
                    </label>
                    <input
                      type="text"
                      value={settings.hero_badge_text}
                      onChange={(e) => setSettings({ ...settings, hero_badge_text: e.target.value })}
                      placeholder="e.g. Premium Aquascaping Shop"
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Hero Main Title *
                      </label>
                      <input
                        type="text"
                        value={settings.hero_title}
                        onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                        placeholder="e.g. Create Your Own"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Hero Subtitle (Gradient Accent) *
                      </label>
                      <input
                        type="text"
                        value={settings.hero_subtitle}
                        onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                        placeholder="e.g. Underwater Paradise"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Hero Description Text
                    </label>
                    <textarea
                      rows={3}
                      value={settings.hero_description}
                      onChange={(e) => setSettings({ ...settings, hero_description: e.target.value })}
                      placeholder="Describe your shop's mission and value proposition..."
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Hero Banner Background Image
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">High-resolution banner background image (auto-compressed on upload).</p>
                    <ImageUploader
                      value={settings.hero_image_url ? [settings.hero_image_url] : []}
                      maxImages={1}
                      single={true}
                      allowVideo={false}
                      onChange={(urls) => setSettings({ ...settings, hero_image_url: Array.isArray(urls) ? (urls[0] || '') : (urls || '') })}
                    />
                  </div>
                </div>

                {/* Live Hero Preview (Right 5 Cols) */}
                <div className="lg:col-span-5 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-brand-600" /> Live Hero Preview
                  </span>

                  <div className="relative overflow-hidden rounded-xl bg-slate-950 text-white p-6 shadow-xl aspect-[4/3] flex flex-col justify-end border border-slate-800">
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-40"
                      style={{ backgroundImage: `url(${settings.hero_image_url || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1600'})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                    <div className="relative z-10 space-y-2">
                      {settings.hero_badge_text && (
                        <span className="inline-block rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                          {settings.hero_badge_text}
                        </span>
                      )}
                      <h2 className="text-lg font-black leading-tight text-white">
                        {settings.hero_title || 'Store Title'}{' '}
                        <span className="text-brand-400 block">{settings.hero_subtitle || 'Accent Title'}</span>
                      </h2>
                      <p className="text-[11px] text-slate-300 line-clamp-2">
                        {settings.hero_description}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: COLLECTIONS & SHOWCASE (Featured, Best Seller, Trending) */}
          {activeTab === 'collections' && (
            <div className="bg-white rounded-b-lg border border-t-0 border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                {/* LEFT COLUMN: TOGGLES & AUTOMATION RULES */}
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Featured, Best Seller & Trending Collections</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Control how the three core showcase collections are displayed across your store navbar, home page rows, and automated calculation rules.
                    </p>
                  </div>

                  <div className="space-y-4">

                    {/* COLLECTION 1: FEATURED */}
                    <div className={`rounded-xl border p-4 space-y-3 transition-all ${settings.show_featured ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 bg-slate-50/50 opacity-80'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-amber-500" /> Featured Collection
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Display a dedicated Featured row on the homepage and a Featured link in the navbar.
                          </span>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={settings.show_featured}
                          onClick={() => setSettings({ ...settings, show_featured: !settings.show_featured })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.show_featured ? 'bg-brand-600' : 'bg-slate-300'
                            }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.show_featured ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500 bg-white p-3 rounded-lg border border-slate-200/80">
                        💡 Products flagged as <strong>Featured</strong> in the product inventory manager will be displayed here.
                      </div>
                    </div>

                    {/* COLLECTION 2: BEST SELLER */}
                    <div className={`rounded-xl border p-4 space-y-4 transition-all ${settings.show_best_seller ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200 bg-slate-50/50 opacity-80'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-blue-600" /> Best Seller Collection
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Display a Best Seller showcase row on the homepage and in the storefront navigation.
                          </span>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={settings.show_best_seller}
                          onClick={() => setSettings({ ...settings, show_best_seller: !settings.show_best_seller })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.show_best_seller ? 'bg-brand-600' : 'bg-slate-300'
                            }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.show_best_seller ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                        </button>
                      </div>

                      {settings.show_best_seller && (
                        <div className="pt-3 border-t border-slate-200 space-y-3 bg-white p-3.5 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Automatic Calculation Mode</span>
                              <span className="text-[11px] text-slate-500 block mt-0.5">
                                {settings.auto_best_seller
                                  ? 'Auto mode active: Products with highest all-time sales will be calculated automatically.'
                                  : 'Manual mode active: Only products you manually tag as Best Seller will be displayed.'}
                              </span>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={settings.auto_best_seller}
                              onClick={() => setSettings({ ...settings, auto_best_seller: !settings.auto_best_seller })}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.auto_best_seller ? 'bg-brand-600' : 'bg-slate-300'
                                }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.auto_best_seller ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* COLLECTION 3: TRENDING */}
                    <div className={`rounded-xl border p-4 space-y-4 transition-all ${settings.show_trending ? 'border-purple-200 bg-purple-50/20' : 'border-slate-200 bg-slate-50/50 opacity-80'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <BarChart3 className="h-4 w-4 text-purple-600" /> Trending Collection
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Display a Trending showcase row on the homepage and in the storefront navigation.
                          </span>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={settings.show_trending}
                          onClick={() => setSettings({ ...settings, show_trending: !settings.show_trending })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.show_trending ? 'bg-brand-600' : 'bg-slate-300'
                            }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.show_trending ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                        </button>
                      </div>

                      {settings.show_trending && (
                        <div className="pt-3 border-t border-slate-200 space-y-3 bg-white p-3.5 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Automatic Calculation Mode (Last 30 Days)</span>
                              <span className="text-[11px] text-slate-500 block mt-0.5">
                                {settings.auto_trending
                                  ? 'Auto mode active: Products with the most sales in the last 30 days are automatically featured.'
                                  : 'Manual mode active: Only products you manually tag as Trending will be displayed.'}
                              </span>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={settings.auto_trending}
                              onClick={() => setSettings({ ...settings, auto_trending: !settings.auto_trending })}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.auto_trending ? 'bg-brand-600' : 'bg-slate-300'
                                }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.auto_trending ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* RIGHT COLUMN: LIVE STOREFRONT SHOWCASE & LAYOUT PREVIEW */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-brand-600" /> Live Homepage Structure
                    </span>
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                      Live Preview
                    </span>
                  </div>

                  {/* MINI STOREFRONT WIREFRAME */}
                  <div className="rounded-2xl border border-slate-300/80 bg-slate-900 p-3.5 space-y-3 shadow-inner text-white font-sans text-xs">

                    {/* 1. Mini Navbar */}
                    <div className="rounded-xl bg-slate-800/90 border border-slate-700/80 p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="h-3.5 w-3.5 rounded-full bg-brand-500" />
                        <span className="text-[10px] font-bold text-slate-200 truncate max-w-[90px]">
                          {settings.store_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-semibold">
                        <span className={`px-1.5 py-0.5 rounded transition ${settings.show_featured ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-600 line-through'}`}>
                          Featured
                        </span>
                        <span className={`px-1.5 py-0.5 rounded transition ${settings.show_trending ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-600 line-through'}`}>
                          Trending
                        </span>
                        <span className={`px-1.5 py-0.5 rounded transition ${settings.show_best_seller ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-600 line-through'}`}>
                          Best
                        </span>
                      </div>
                    </div>

                    {/* 2. Mini Hero Banner */}
                    <div className="rounded-xl bg-slate-800/80 border border-slate-700/60 p-3 text-center space-y-1">
                      <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-brand-500 text-white">
                        {settings.hero_badge_text || 'Hero Banner'}
                      </span>
                      <p className="text-[11px] font-bold text-white truncate">{settings.hero_title || 'Main Store Headline'}</p>
                    </div>

                    {/* 3. SHOWCASE ROW 1: FEATURED */}
                    {settings.show_featured ? (
                      <div className="rounded-xl bg-amber-950/40 border border-amber-500/40 p-2.5 space-y-1.5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Featured Showcase
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-amber-400 bg-amber-900/60 px-1.5 py-0.5 rounded">
                            Visible
                          </span>
                        </div>
                        <div className="rounded-lg bg-amber-900/30 border border-amber-500/20 p-2 flex items-center justify-between text-[9px] text-slate-300">
                          <span>Carousel Spotlight (Top #1)</span>
                          <span className="font-bold text-amber-200">BUY NOW • ৳</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 pt-0.5">
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="h-6 rounded bg-amber-900/20 border border-amber-500/20 flex items-center justify-center text-[7px] text-amber-300/70 font-mono">
                              Card #{n}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-2 text-center text-[10px] text-slate-500">
                        ✕ Featured Row Hidden from Homepage
                      </div>
                    )}

                    {/* 4. SHOWCASE ROW 2: TRENDING */}
                    {settings.show_trending ? (
                      <div className="rounded-xl bg-purple-950/40 border border-purple-500/40 p-2.5 space-y-1.5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" /> Trending Showcase
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-purple-400 bg-purple-900/60 px-1.5 py-0.5 rounded">
                            {settings.auto_trending ? 'Auto (30D)' : 'Manual'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-purple-900/30 border border-purple-500/20 p-2 flex items-center justify-between text-[9px] text-slate-300">
                          <span>Carousel Spotlight (Top #1)</span>
                          <span className="font-bold text-purple-200">BUY NOW • ৳</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 pt-0.5">
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="h-6 rounded bg-purple-900/20 border border-purple-500/20 flex items-center justify-center text-[7px] text-purple-300/70 font-mono">
                              Card #{n}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-2 text-center text-[10px] text-slate-500">
                        ✕ Trending Row Hidden from Homepage
                      </div>
                    )}

                    {/* 5. SHOWCASE ROW 3: BEST SELLER */}
                    {settings.show_best_seller ? (
                      <div className="rounded-xl bg-blue-950/40 border border-blue-500/40 p-2.5 space-y-1.5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-300 flex items-center gap-1">
                            <Package className="h-3 w-3" /> Best Seller Showcase
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-blue-400 bg-blue-900/60 px-1.5 py-0.5 rounded">
                            {settings.auto_best_seller ? 'Auto All-Time' : 'Manual'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-blue-900/30 border border-blue-500/20 p-2 flex items-center justify-between text-[9px] text-slate-300">
                          <span>Carousel Spotlight (Top #1)</span>
                          <span className="font-bold text-blue-200">BUY NOW • ৳</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 pt-0.5">
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="h-6 rounded bg-blue-900/20 border border-blue-500/20 flex items-center justify-center text-[7px] text-blue-300/70 font-mono">
                              Card #{n}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-2 text-center text-[10px] text-slate-500">
                        ✕ Best Seller Row Hidden from Homepage
                      </div>
                    )}

                    {/* 6. Main Catalog Row */}
                    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-2 text-center">
                      <span className="text-[9px] font-bold text-slate-400">
                        Explore All Products (Full Filterable Catalog)
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT OPTIONS & GATEWAY */}
          {activeTab === 'payment' && (
            <div className="bg-white rounded-b-lg border border-t-0 border-slate-200 p-6 space-y-8 shadow-sm">
              <div className="max-w-2xl space-y-6">

                <div>
                  <h2 className="text-sm font-bold text-slate-900">Payment Methods & Checkout Rules</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enable the payment methods available to customers at checkout and configure security/prepayment rules.
                  </p>
                </div>

                {/* PAYMENT METHOD TOGGLES */}
                <div className="space-y-4">

                  {/* OPTION 1: CASH ON DELIVERY (COD) */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Cash on Delivery (COD)</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Allow customers to place orders with payment due upon parcel arrival.
                        </span>
                      </div>

                      {/* Switch Toggle */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.cod_enabled}
                        onClick={() => {
                          const nextVal = !settings.cod_enabled
                          setSettings({ ...settings, cod_enabled: nextVal })
                        }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.cod_enabled ? 'bg-brand-600' : 'bg-slate-300'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.cod_enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Sub-option: Require Delivery Prepayment */}
                    {settings.cod_enabled && (
                      <div className="pt-3 border-t border-slate-200/80 pl-3 sm:pl-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              Require Advance Delivery Charge via bKash
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-0.5 max-w-md">
                              Customer must prepay the delivery charge (৳{settings.delivery_charge_inside_dhaka} / ৳{settings.delivery_charge_outside_dhaka}) upfront via bKash to confirm order. Product price is collected on delivery.
                            </span>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={settings.cod_prepay_delivery}
                            onClick={() => {
                              const nextPrepay = !settings.cod_prepay_delivery
                              if (nextPrepay) {
                                // Check if at least one bKash method is active and configured
                                const hasBkash = settings.bkash_enabled || (settings.bkash_personal_enabled && settings.bkash_personal_number?.trim().length >= 11)
                                if (!hasBkash) {
                                  setBkashWarningModal(true)
                                  return
                                }
                                setSettings({
                                  ...settings,
                                  cod_prepay_delivery: true
                                })
                              } else {
                                setSettings({
                                  ...settings,
                                  cod_prepay_delivery: false
                                })
                              }
                            }}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.cod_prepay_delivery ? 'bg-brand-600' : 'bg-slate-300'
                              }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.cod_prepay_delivery ? 'translate-x-4' : 'translate-x-0'
                                }`}
                            />
                          </button>
                        </div>

                        {settings.cod_prepay_delivery && (
                          <div className="text-[11px] font-semibold text-brand-700 bg-brand-50 p-2.5 rounded-lg border border-brand-100 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 flex-shrink-0 text-brand-600" />
                            <span>
                              {settings.bkash_enabled
                                ? 'bKash Merchant Gateway will collect the advance delivery charge online.'
                                : 'bKash Personal is active. Customers will be prompted to Send Money for the advance delivery charge at checkout.'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* OPTION 2: BKASH ONLINE PAYMENT GATEWAY */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">bKash Online Payment Gateway</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Accept instant 100% online prepaid payments via official bKash Tokenized Checkout.
                        </span>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.bkash_enabled}
                        onClick={() => {
                          const nextBkash = !settings.bkash_enabled
                          setSettings({ ...settings, bkash_enabled: nextBkash })
                        }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.bkash_enabled ? 'bg-brand-600' : 'bg-slate-300'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.bkash_enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>

                    {/* BKASH MERCHANT CONFIGURATION (Directly inside Option 2 under toggle) */}
                    {settings.bkash_enabled && (
                      <div className="pt-4 border-t border-slate-200 space-y-4">
                        {/* Merchant Notice Warning Banner */}
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 space-y-1">
                          <div className="flex items-center gap-2 font-bold text-amber-950">
                            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            <span>bKash Merchant Account Requirement</span>
                          </div>
                          <p className="text-amber-800 text-[11px] leading-relaxed pl-6">
                            Only official <strong>bKash Merchant Accounts</strong> with Tokenized Checkout API credentials are used for automatic payment gateway checkout. If you do not have a merchant account, use <strong>bKash Personal (Send Money)</strong> below instead!
                          </p>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            bKash Tokenized Checkout API Credentials
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Provided in your official bKash Merchant Onboarding / Developer Portal email.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            bKash API Endpoint URL
                          </label>
                          <input
                            type="text"
                            value={settings.bkash_api_url}
                            onChange={(e) => setSettings({ ...settings, bkash_api_url: e.target.value })}
                            placeholder="https://tokenized.sandbox.bka.sh/v1.2.0-beta or https://tokenized.pay.bka.sh/v1.2.0-beta"
                            className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono bg-white"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Sandbox: <code className="text-brand-600">https://tokenized.sandbox.bka.sh/v1.2.0-beta</code> • Live: <code className="text-brand-600">https://tokenized.pay.bka.sh/v1.2.0-beta</code>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">App Key *</label>
                            <input
                              type="password"
                              value={settings.bkash_app_key}
                              onChange={(e) => setSettings({ ...settings, bkash_app_key: e.target.value })}
                              className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">App Secret *</label>
                            <input
                              type="password"
                              value={settings.bkash_app_secret}
                              onChange={(e) => setSettings({ ...settings, bkash_app_secret: e.target.value })}
                              className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Merchant Username *</label>
                            <input
                              type="text"
                              value={settings.bkash_username}
                              onChange={(e) => setSettings({ ...settings, bkash_username: e.target.value })}
                              className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password *</label>
                            <div className="relative">
                              <input
                                type={showBkashPassword ? 'text' : 'password'}
                                value={settings.bkash_password}
                                onChange={(e) => setSettings({ ...settings, bkash_password: e.target.value })}
                                className="w-full rounded border border-slate-200 pl-3 pr-9 py-2 text-xs outline-none focus:border-brand-500 font-mono bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => setShowBkashPassword(!showBkashPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                title={showBkashPassword ? 'Hide password' : 'Show password'}
                              >
                                {showBkashPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OPTION 3: BKASH PERSONAL (SEND MONEY & QR) */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">bKash Personal (Send Money & QR Code)</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          For small shops without a merchant account. Customers send money directly to your personal bKash number or scan your QR code at checkout.
                        </span>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.bkash_personal_enabled}
                        onClick={() => setSettings({ ...settings, bkash_personal_enabled: !settings.bkash_personal_enabled })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.bkash_personal_enabled ? 'bg-pink-600' : 'bg-slate-300'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.bkash_personal_enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>

                    {settings.bkash_personal_enabled && (
                      <div className="pt-4 border-t border-slate-200 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Personal bKash Number *
                            </label>
                            <input
                              type="text"
                              value={settings.bkash_personal_number || ''}
                              onChange={(e) => setSettings({ ...settings, bkash_personal_number: e.target.value })}
                              placeholder="e.g. 01712345678"
                              className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono bg-white"
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Customers will see this number and be instructed to Send Money.
                            </span>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Account Holder Name (Optional)
                            </label>
                            <input
                              type="text"
                              value={settings.bkash_personal_name || ''}
                              onChange={(e) => setSettings({ ...settings, bkash_personal_name: e.target.value })}
                              placeholder="e.g. Sadman Sakib"
                              className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            bKash QR Code Image (Optional)
                          </label>
                          <p className="text-[11px] text-slate-500 mb-2">
                            Upload a screenshot of your personal bKash QR code from your bKash app. Customers can scan it to send money instantly.
                          </p>
                          <ImageUploader
                            value={settings.bkash_personal_qr_url ? [settings.bkash_personal_qr_url] : []}
                            onChange={(urls) => setSettings({ ...settings, bkash_personal_qr_url: Array.isArray(urls) ? urls[0] || '' : urls || '' })}
                            single={true}
                            maxImages={1}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 4: COURIER & SHIPPING (Independent Provider Toggles & Dynamic Credentials) */}
          {activeTab === 'shipping' && (
            <div className="bg-white rounded-b-lg border border-t-0 border-slate-200 p-6 space-y-8 shadow-sm">
              <div className="max-w-2xl space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Courier Logistics & Shipping Charges</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure your standard delivery fees across Bangladesh and connect automated courier APIs (Pathao / Steadfast).
                  </p>
                </div>

                {/* 1. STANDARD SHIPPING CHARGES (TOP) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Flexible Shipping Zones & Base Delivery Charges
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Configure your shop's primary city and customized zone names. Checkout will automatically match the customer's city and calculate the correct fee.
                    </p>
                  </div>

                  {/* Store Primary City */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Store Base / Origin City
                    </label>
                    <input
                      type="text"
                      value={settings.store_city_name || 'Dhaka'}
                      onChange={(e) => setSettings({ ...settings, store_city_name: e.target.value })}
                      placeholder="e.g. Dhaka, Chittagong, Sylhet, Khulna, Rajshahi"
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Orders destined for this city will receive the Zone 1 (Local) rate.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Zone 1 (Local Area) Label
                        </label>
                        <input
                          type="text"
                          value={settings.shipping_zone_1_label || 'Inside Dhaka'}
                          onChange={(e) => setSettings({ ...settings, shipping_zone_1_label: e.target.value })}
                          placeholder="e.g. Inside Dhaka"
                          className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                          Zone 1 Delivery Fee (৳)
                        </label>
                        <input
                          type="number"
                          value={settings.delivery_charge_inside_dhaka}
                          onChange={(e) => setSettings({ ...settings, delivery_charge_inside_dhaka: Number(e.target.value) })}
                          className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Zone 2 (Nationwide / Out of City) Label
                        </label>
                        <input
                          type="text"
                          value={settings.shipping_zone_2_label || 'Outside Dhaka'}
                          onChange={(e) => setSettings({ ...settings, shipping_zone_2_label: e.target.value })}
                          placeholder="e.g. Outside Dhaka"
                          className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                          Zone 2 Delivery Fee (৳)
                        </label>
                        <input
                          type="number"
                          value={settings.delivery_charge_outside_dhaka}
                          onChange={(e) => setSettings({ ...settings, delivery_charge_outside_dhaka: Number(e.target.value) })}
                          className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. LOGISTICS PROVIDER TOGGLES & CREDENTIALS */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <Truck className="h-4 w-4 text-brand-600" /> Automated Courier Integrations
                    </h3>
                    <span className="text-[11px] text-slate-400">Optional API Booking</span>
                  </div>

                  {/* PATHAO TOGGLE */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Pathao Courier Service</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Enables Pathao Aladdin API automated parcel booking & cascading City → Zone → Area selector at checkout.
                        </span>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.pathao_enabled}
                        onClick={() => {
                          const nextVal = !settings.pathao_enabled
                          setSettings({ ...settings, pathao_enabled: nextVal })
                        }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.pathao_enabled ? 'bg-brand-600' : 'bg-slate-300'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.pathao_enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>

                    {/* PATHAO CREDENTIALS (RENDERED WHEN PATHAO IS ON) */}
                    {settings.pathao_enabled && (
                      <div className="space-y-4 pt-4 border-t border-slate-200/80 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <Truck className="h-4 w-4 text-brand-600" /> Pathao Aladdin API Credentials
                          </h3>
                          <a
                            href="https://merchant.pathao.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-brand-600 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Pathao Merchant Portal</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        {/* Environment selector */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Pathao API Environment *
                          </label>
                          <select
                            value={settings.pathao_api_url || 'https://api-hermes.pathao.com'}
                            onChange={(e) => setSettings({ ...settings, pathao_api_url: e.target.value })}
                            className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-medium"
                          >
                            <option value="https://api-hermes.pathao.com">Live Production (https://api-hermes.pathao.com)</option>
                            <option value="https://courier-api-sandbox.pathao.com">Developer Sandbox (https://courier-api-sandbox.pathao.com)</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Client ID (Normal text) */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Client ID *</label>
                            <input
                              type="text"
                              value={settings.pathao_client_id || ''}
                              onChange={(e) => setSettings({ ...settings, pathao_client_id: e.target.value })}
                              placeholder="e.g. 102"
                              className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono bg-white"
                            />
                          </div>

                          {/* Client Secret (Masked) */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Client Secret *</label>
                            <input
                              type="password"
                              value={settings.pathao_client_secret || ''}
                              onChange={(e) => setSettings({ ...settings, pathao_client_secret: e.target.value })}
                              placeholder="••••••••••••••••"
                              className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono bg-white"
                            />
                          </div>

                          {/* Username (Email/Phone) */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Merchant Username / Email *</label>
                            <input
                              type="text"
                              value={settings.pathao_username || ''}
                              onChange={(e) => setSettings({ ...settings, pathao_username: e.target.value })}
                              placeholder="merchant@example.com"
                              className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono bg-white"
                            />
                          </div>

                          {/* Password (With Eye Toggle) */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password *</label>
                            <div className="relative">
                              <input
                                type={showPathaoPassword ? 'text' : 'password'}
                                value={settings.pathao_password || ''}
                                onChange={(e) => setSettings({ ...settings, pathao_password: e.target.value })}
                                placeholder="••••••••"
                                className="w-full rounded border border-slate-200 pl-3 pr-9 py-2 text-xs outline-none focus:border-brand-500 font-mono bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPathaoPassword(!showPathaoPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                title={showPathaoPassword ? 'Hide password' : 'Show password'}
                              >
                                {showPathaoPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Store Selector & Verification */}
                        <div className="pt-2 border-t border-slate-200/80 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="block text-xs font-semibold text-slate-700 uppercase">
                              Pathao Pickup Store ID *
                            </label>
                            <button
                              type="button"
                              onClick={handleFetchPathaoStores}
                              disabled={loadingPathaoStores}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition disabled:opacity-50"
                            >
                              {loadingPathaoStores ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                              <span>{loadingPathaoStores ? 'Verifying & Fetching Stores...' : 'Fetch Stores from Pathao'}</span>
                            </button>
                          </div>

                          {pathaoVerifyError && (
                            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 flex-shrink-0" />
                              <span>{pathaoVerifyError}</span>
                            </div>
                          )}

                          {pathaoVerifySuccess && (
                            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                              <span>Connected to Pathao! {pathaoStores.length} store(s) found.</span>
                            </div>
                          )}

                          {pathaoStores.length > 0 ? (
                            <select
                              value={settings.pathao_store_id || ''}
                              onChange={(e) => setSettings({ ...settings, pathao_store_id: e.target.value })}
                              className="w-full rounded border border-brand-500 ring-1 ring-brand-500 px-3 py-2 text-xs outline-none bg-white font-medium"
                            >
                              <option value="">Select your pickup store</option>
                              {pathaoStores.map((s) => (
                                <option key={s.store_id} value={s.store_id}>
                                  {s.store_name} (ID: {s.store_id}) {s.store_address ? `- ${s.store_address}` : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={settings.pathao_store_id || ''}
                              onChange={(e) => setSettings({ ...settings, pathao_store_id: e.target.value })}
                              placeholder="e.g. 150506 (or click 'Fetch Stores from Pathao' above)"
                              className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono bg-white"
                            />
                          )}
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Click <strong>Fetch Stores from Pathao</strong> to verify your credentials and automatically populate your exact registered store ID.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEADFAST TOGGLE */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Steadfast Courier Service</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Enables Steadfast Courier automated parcel dispatch with simplified direct address checkout.
                        </span>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.steadfast_enabled}
                        onClick={() => {
                          const nextVal = !settings.steadfast_enabled
                          setSettings({ ...settings, steadfast_enabled: nextVal })
                        }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.steadfast_enabled ? 'bg-brand-600' : 'bg-slate-300'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.steadfast_enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>

                    {/* STEADFAST CREDENTIALS (RENDERED WHEN STEADFAST IS ON) */}
                    {settings.steadfast_enabled && (
                      <div className="space-y-4 pt-4 border-t border-slate-200/80 animate-fadeIn">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                          <Truck className="h-4 w-4 text-brand-600" /> Steadfast Courier API Credentials
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Api-Key *</label>
                            <input
                              type="password"
                              value={settings.steadfast_api_key}
                              onChange={(e) => setSettings({ ...settings, steadfast_api_key: e.target.value })}
                              placeholder="Steadfast API Key"
                              className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Secret-Key *</label>
                            <input
                              type="password"
                              value={settings.steadfast_secret_key}
                              onChange={(e) => setSettings({ ...settings, steadfast_secret_key: e.target.value })}
                              placeholder="Steadfast Secret Key"
                              className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* NEITHER IS ENABLED NOTICE */}
                  {!settings.pathao_enabled && !settings.steadfast_enabled && (
                    <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-blue-950">
                        <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span>Custom / Manual Shipping Mode</span>
                      </div>
                      <p className="text-blue-800 text-[11px] leading-relaxed">
                        With both third-party couriers turned off, customers will simply pick Inside/Outside Dhaka and provide their address. You can dispatch orders manually through your preferred riders or local delivery partners.
                      </p>
                    </div>
                  )}

                </div>

              </div>
            </div>
          )}

          {/* TAB 5: ABOUT & CONTACT INFO */}
          {activeTab === 'about' && (
            <div className="bg-white rounded-b-lg border border-t-0 border-slate-200 p-6 space-y-6 shadow-sm">
              <div className="max-w-2xl space-y-6">

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase">Enable About Page</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Toggle whether the public <code>/about</code> page and navigation links are active for your store.
                    </p>
                  </div>

                  {/* Modern Switch Toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.about_enabled}
                    onClick={() => setSettings({ ...settings, about_enabled: !settings.about_enabled })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.about_enabled ? 'bg-brand-600' : 'bg-slate-300'
                      }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${settings.about_enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>

                {/* About Story (Conditionally Rendered) */}
                {settings.about_enabled && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Store Story / About Description
                    </label>
                    <p className="text-[11px] text-slate-500 mb-1.5">
                      Introduce your brand story, philosophy, product quality, and values to customers.
                    </p>
                    <textarea
                      rows={5}
                      value={settings.about_story || ''}
                      onChange={(e) => setSettings({ ...settings, about_story: e.target.value })}
                      placeholder="Tell your customers about your brand, history, product quality, and values..."
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 leading-relaxed"
                    />
                  </div>
                )}

                {/* Contact Phone & WhatsApp (Separated) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-brand-600" /> Contact Phone (Voice Calls)
                    </label>
                    <input
                      type="text"
                      value={settings.contact_phone || ''}
                      onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                      placeholder="e.g. +880 1700-000000"
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Displayed for regular phone calls and SMS</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Number (Chat)
                    </label>
                    <input
                      type="text"
                      value={settings.contact_whatsapp || ''}
                      onChange={(e) => setSettings({ ...settings, contact_whatsapp: e.target.value })}
                      placeholder="e.g. +880 1700-000000 or 017XXXXXXXX"
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Enables 1-click WhatsApp messaging for customers across the store
                    </p>
                  </div>
                </div>

                {/* Email Support */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-brand-600" /> Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.contact_email || ''}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    placeholder="e.g. contact@store.com"
                    className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                </div>

                {/* Social Media & Online Channels Section */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-brand-600" /> Social Media & Online Channels
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Add your store's social media page URLs. Active channels will automatically render with custom icons in the footer and about/contact pages.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Facebook */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                        <span className="text-[#1877F2] font-black text-sm">f</span> Facebook Page / Group URL
                      </label>
                      <input
                        type="text"
                        value={settings.social_facebook || ''}
                        onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
                        onBlur={(e) => {
                          const formatted = formatExternalUrl(e.target.value)
                          setSettings({ ...settings, social_facebook: formatted })
                        }}
                        placeholder="https://facebook.com/yourpage"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                    </div>

                    {/* Instagram */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                        <span className="text-[#E4405F] font-black text-sm">📸</span> Instagram Profile URL
                      </label>
                      <input
                        type="text"
                        value={settings.social_instagram || ''}
                        onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
                        onBlur={(e) => {
                          const formatted = formatExternalUrl(e.target.value)
                          setSettings({ ...settings, social_instagram: formatted })
                        }}
                        placeholder="https://instagram.com/yourprofile"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                    </div>

                    {/* YouTube */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                        <span className="text-[#FF0000] font-black text-sm">▶</span> YouTube Channel URL
                      </label>
                      <input
                        type="text"
                        value={settings.social_youtube || ''}
                        onChange={(e) => setSettings({ ...settings, social_youtube: e.target.value })}
                        onBlur={(e) => {
                          const formatted = formatExternalUrl(e.target.value)
                          setSettings({ ...settings, social_youtube: formatted })
                        }}
                        placeholder="https://youtube.com/@yourchannel"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                    </div>

                    {/* TikTok */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                        <span className="text-slate-900 font-black text-sm">🎵</span> TikTok Profile URL
                      </label>
                      <input
                        type="text"
                        value={settings.social_tiktok || ''}
                        onChange={(e) => setSettings({ ...settings, social_tiktok: e.target.value })}
                        onBlur={(e) => {
                          const formatted = formatExternalUrl(e.target.value)
                          setSettings({ ...settings, social_tiktok: formatted })
                        }}
                        placeholder="https://tiktok.com/@yourprofile"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                    </div>

                    {/* Twitter / X */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                        <span className="text-slate-900 font-black text-sm">𝕏</span> X (Twitter) Profile URL
                      </label>
                      <input
                        type="text"
                        value={settings.social_twitter || ''}
                        onChange={(e) => setSettings({ ...settings, social_twitter: e.target.value })}
                        onBlur={(e) => {
                          const formatted = formatExternalUrl(e.target.value)
                          setSettings({ ...settings, social_twitter: formatted })
                        }}
                        placeholder="https://x.com/yourhandle"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                    </div>

                    {/* LinkedIn */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                        <span className="text-[#0A66C2] font-black text-sm">in</span> LinkedIn Page URL
                      </label>
                      <input
                        type="text"
                        value={settings.social_linkedin || ''}
                        onChange={(e) => setSettings({ ...settings, social_linkedin: e.target.value })}
                        onBlur={(e) => {
                          const formatted = formatExternalUrl(e.target.value)
                          setSettings({ ...settings, social_linkedin: formatted })
                        }}
                        placeholder="https://linkedin.com/company/yourcompany"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Physical Address */}
                <div className="pt-4 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-brand-600" /> Store Physical Location / Address
                  </label>
                  <input
                    type="text"
                    value={settings.contact_address || ''}
                    onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                    placeholder="e.g. House 12, Road 4, Dhanmondi, Dhaka 1209"
                    className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                </div>

                {/* Google Maps Embed URL or Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Google Maps Embed (URL, HTML &lt;iframe&gt;, or Address)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1.5 leading-relaxed">
                    Paste your Google Maps embed code, share link, or location name. Any link will automatically be converted to a working embed.
                  </p>
                  <input
                    type="text"
                    value={settings.google_map_embed_url || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      const formatted = formatGoogleMapsEmbedUrl(val)
                      setSettings({ ...settings, google_map_embed_url: formatted })
                    }}
                    placeholder="https://www.google.com/maps/embed?pb=... or your store address"
                    className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono"
                  />
                  {/* Helper Tip Box */}
                  <div className="mt-2 p-3 bg-brand-50/60 rounded-xl border border-brand-100 text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-brand-900">📍 How to get your exact Google Maps pin:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                      <li>Open <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="text-brand-600 font-semibold underline">Google Maps</a> and search your exact shop location.</li>
                      <li>Click <strong>Share</strong> → select the <strong>Embed a map</strong> tab → click <strong>Copy HTML</strong>.</li>
                      <li>Paste the copied HTML snippet into the box above.</li>
                    </ol>
                  </div>

                  {settings.google_map_embed_url && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 aspect-video max-h-48 bg-slate-100 shadow-inner">
                      <iframe
                        src={formatGoogleMapsEmbedUrl(settings.google_map_embed_url)}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        title="Google Maps Preview"
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB: AUTOMATED EMAILS & NOTIFICATIONS */}
          {activeTab === 'emails' && (
            <div className="bg-white rounded-b-lg border border-t-0 border-slate-200 p-6 space-y-8 shadow-sm">
              <div className="max-w-2xl space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Email Service Integration & Customer Notifications</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connect Resend to send automated invoices, dispatch updates, cancellation alerts, and owner summaries.
                  </p>
                </div>

                {/* 1. RESEND CREDENTIALS */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-brand-600" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Resend API Configuration
                      </h3>
                    </div>
                    <a
                      href="https://resend.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-brand-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Get Free API Key</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Resend API Key
                    </label>
                    <input
                      type="password"
                      value={settings.resend_api_key || ''}
                      onChange={(e) => setSettings({ ...settings, resend_api_key: e.target.value })}
                      placeholder="re_123456789..."
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-mono"
                    />
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      Free 100 emails/day and 3,000 emails/month on <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-brand-600 underline">resend.com</a>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      From Email Address (Sender ID)
                    </label>
                    <input
                      type="text"
                      value={settings.resend_from_email || ''}
                      onChange={(e) => setSettings({ ...settings, resend_from_email: e.target.value })}
                      placeholder="e.g. orders@yourdomain.com (default: onboarding@resend.dev)"
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Leave blank to use the default sandbox (<code className="text-brand-600 font-bold">onboarding@resend.dev</code>). Once you verify your domain in Resend, enter your domain address here.
                    </p>
                  </div>
                </div>

                {/* 2. CUSTOMER EVENT NOTIFICATIONS */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Send className="h-4 w-4 text-brand-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Automated Customer Event Notifications
                    </h3>
                  </div>

                  {/* A. Invoice / Order Placed */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Order Confirmation & Itemized Invoice
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Immediately email an invoice receipt to the customer upon order placement.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, email_invoice_enabled: settings.email_invoice_enabled === false })}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.email_invoice_enabled !== false ? 'bg-brand-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.email_invoice_enabled !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* B. Order Dispatched */}
                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Order Dispatched & Tracking Alert
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Notify the customer when an order is handed over to Pathao, Steadfast, or local courier with consignment tracking details.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, email_dispatched_enabled: settings.email_dispatched_enabled === false })}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.email_dispatched_enabled !== false ? 'bg-brand-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.email_dispatched_enabled !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* C. Order Cancelled */}
                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Order Cancellation Notice
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Send a cancellation email alert to the customer if an order is cancelled from the admin panel.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, email_cancelled_enabled: settings.email_cancelled_enabled === false })}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.email_cancelled_enabled !== false ? 'bg-brand-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.email_cancelled_enabled !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* 3. DAILY PENDING ORDERS DIGEST */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-brand-600" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Store Owner Daily Pending Orders Summary
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, daily_digest_enabled: !settings.daily_digest_enabled })}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.daily_digest_enabled ? 'bg-brand-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.daily_digest_enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Receive a consolidated summary email of all unfulfilled and pending orders directly in your inbox every day.
                  </p>

                  {settings.daily_digest_enabled && (
                    <div className="p-4 rounded-xl border border-brand-200/80 bg-brand-50/40 space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Scheduled Digest Time (Dhaka BST)
                          </label>
                          <select
                            value={settings.daily_digest_time || '20:00'}
                            onChange={(e) => setSettings({ ...settings, daily_digest_time: e.target.value })}
                            className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-medium"
                          >
                            <option value="08:00">08:00 AM (Morning Kickoff)</option>
                            <option value="09:00">09:00 AM</option>
                            <option value="10:00">10:00 AM</option>
                            <option value="12:00">12:00 PM (Noon)</option>
                            <option value="15:00">03:00 PM</option>
                            <option value="18:00">06:00 PM (Evening)</option>
                            <option value="20:00">08:00 PM (Night Summary - Recommended)</option>
                            <option value="21:00">09:00 PM</option>
                            <option value="22:00">10:00 PM</option>
                            <option value="23:00">11:00 PM</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Recipient Owner Email
                          </label>
                          <input
                            type="email"
                            value={settings.daily_digest_email || ''}
                            onChange={(e) => setSettings({ ...settings, daily_digest_email: e.target.value })}
                            placeholder={settings.contact_email ? `Defaults to: ${settings.contact_email}` : 'owner@yourcompany.com'}
                            className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-brand-200/50">
                        <span className="text-[11px] text-slate-600 font-medium">
                          Send a live test summary to verify delivery:
                        </span>
                        <button
                          type="button"
                          onClick={handleSendTestDailyDigest}
                          disabled={testDigestLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                        >
                          {testDigestLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5" />
                              <span>Send Test Summary</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB: ADS & TRACKING PIXELS */}
          {activeTab === 'tracking' && (
            <div className="bg-white rounded-b-lg border border-t-0 border-slate-200 p-6 space-y-8 shadow-sm">
              <div className="max-w-2xl space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Marketing, Ads Tracking Pixels & Verification</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connect Meta Pixel & Conversions API (CAPI), Google Analytics 4, Google Tag Manager, TikTok Ads, site verification tags, and custom head scripts.
                  </p>
                </div>

                {/* 1. META (FACEBOOK / INSTAGRAM) ADS & CAPI */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Meta Ads (Facebook & Instagram)
                    </h3>
                  </div>

                  {/* Meta Pixel ID */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                      <span>Meta Pixel ID *</span>
                      <span className="text-[10px] font-normal text-slate-400">e.g. 1396628299199729</span>
                    </label>
                    <input
                      type="text"
                      value={settings.meta_pixel_id || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        const matchInit = val.match(/fbq\(\s*['"]init['"]\s*,\s*['"](\d+)['"]\s*\)/i)
                        const matchTr = val.match(/[?&]id=(\d+)/i)
                        const cleanVal = matchInit ? matchInit[1] : matchTr ? matchTr[1] : val.trim()
                        setSettings({ ...settings, meta_pixel_id: cleanVal })
                      }}
                      placeholder="e.g. 1396628299199729 or paste code"
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-mono"
                    />
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Enter your 15–16 digit <strong>Meta Pixel ID</strong>. Our system automatically embeds the full official Facebook tracking script &amp; PageView events into your site header.
                    </p>
                  </div>

                  {/* Meta CAPI Token */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                    <label className="block text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                      <span>Conversions API (CAPI) Access Token (Optional)</span>
                    </label>
                    <input
                      type="password"
                      value={settings.meta_conversions_api_token || ''}
                      onChange={(e) => setSettings({ ...settings, meta_conversions_api_token: e.target.value })}
                      placeholder="EAAG..."
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-mono"
                    />
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Generated in Meta Events Manager &gt; Settings &gt; Conversions API &gt; Generate Access Token for server-side tracking resilience against ad blockers.
                    </p>
                  </div>

                  {/* Meta Test Event Code & Domain Verification */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Meta Test Event Code
                      </label>
                      <input
                        type="text"
                        value={settings.meta_test_event_code || ''}
                        onChange={(e) => setSettings({ ...settings, meta_test_event_code: e.target.value })}
                        placeholder="TEST12345"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        For debugging live events in Meta Events Manager &gt; Test Events.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Meta Domain Verification Code
                      </label>
                      <input
                        type="text"
                        value={settings.meta_domain_verification || ''}
                        onChange={(e) => setSettings({ ...settings, meta_domain_verification: e.target.value })}
                        placeholder="e.g. 1a2b3c4d5e6f7g8h9"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Injects <code className="text-slate-600">&lt;meta name="facebook-domain-verification"&gt;</code> into site &lt;head&gt;.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. GOOGLE ANALYTICS & TAG MANAGER */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Globe className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Google Marketing & Analytics
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Google Analytics 4 (GA4) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        GA4 Measurement ID
                      </label>
                      <input
                        type="text"
                        value={settings.google_analytics_id || ''}
                        onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                        placeholder="G-XXXXXXXXXX"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-mono"
                      />
                    </div>

                    {/* Google Tag Manager (GTM) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Google Tag Manager (GTM) ID
                      </label>
                      <input
                        type="text"
                        value={settings.google_tag_manager_id || ''}
                        onChange={(e) => setSettings({ ...settings, google_tag_manager_id: e.target.value })}
                        placeholder="GTM-XXXXXXX"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Google Site Verification */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Google Search Console Site Verification Tag
                    </label>
                    <input
                      type="text"
                      value={settings.google_site_verification || ''}
                      onChange={(e) => setSettings({ ...settings, google_site_verification: e.target.value })}
                      placeholder="e.g. google-site-verification token or meta code"
                      className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Enables ownership verification in Google Search Console for SEO performance.
                    </p>
                  </div>
                </div>

                {/* 3. TIKTOK ADS */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Share2 className="h-4 w-4 text-slate-900" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      TikTok Ads & Events API
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        TikTok Pixel ID
                      </label>
                      <input
                        type="text"
                        value={settings.tiktok_pixel_id || ''}
                        onChange={(e) => setSettings({ ...settings, tiktok_pixel_id: e.target.value })}
                        placeholder="CXXXXXXXXXXXXXXX"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        TikTok Events API Access Token
                      </label>
                      <input
                        type="password"
                        value={settings.tiktok_events_api_token || ''}
                        onChange={(e) => setSettings({ ...settings, tiktok_events_api_token: e.target.value })}
                        placeholder="••••••••••••••••"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. CUSTOM HEAD SCRIPTS */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Code className="h-4 w-4 text-brand-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Custom Header Scripts & Tracking Tags
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Add any custom JavaScript tracking code or third-party tags (e.g. Microsoft Clarity, Hotjar, Pinterest Tag, Snapchat Pixel) into your storefront.
                  </p>
                  <textarea
                    rows={4}
                    value={settings.custom_head_scripts || ''}
                    onChange={(e) => setSettings({ ...settings, custom_head_scripts: e.target.value })}
                    placeholder={`<!-- Microsoft Clarity or Custom JS -->\n<script>\n  (function(c,l,a,r,i,t,y){ ... })(window, document, "clarity", "script", "YOUR_ID");\n</script>`}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-brand-500 bg-white font-mono text-slate-800"
                  />
                </div>

                {/* 5. SOCIAL MEDIA PROFILES */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Share2 className="h-4 w-4 text-brand-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Store Social Media Profiles
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Facebook Page URL
                      </label>
                      <input
                        type="text"
                        value={settings.social_facebook || ''}
                        onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
                        onBlur={(e) => setSettings({ ...settings, social_facebook: formatExternalUrl(e.target.value) })}
                        placeholder="https://facebook.com/yourpage"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Instagram Profile URL
                      </label>
                      <input
                        type="text"
                        value={settings.social_instagram || ''}
                        onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
                        onBlur={(e) => setSettings({ ...settings, social_instagram: formatExternalUrl(e.target.value) })}
                        placeholder="https://instagram.com/yourhandle"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        YouTube Channel URL
                      </label>
                      <input
                        type="text"
                        value={settings.social_youtube || ''}
                        onChange={(e) => setSettings({ ...settings, social_youtube: e.target.value })}
                        onBlur={(e) => setSettings({ ...settings, social_youtube: formatExternalUrl(e.target.value) })}
                        placeholder="https://youtube.com/@yourchannel"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        TikTok Profile URL
                      </label>
                      <input
                        type="text"
                        value={settings.social_tiktok || ''}
                        onChange={(e) => setSettings({ ...settings, social_tiktok: e.target.value })}
                        onBlur={(e) => setSettings({ ...settings, social_tiktok: formatExternalUrl(e.target.value) })}
                        placeholder="https://tiktok.com/@yourhandle"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        X (Twitter) Profile URL
                      </label>
                      <input
                        type="text"
                        value={settings.social_twitter || ''}
                        onChange={(e) => setSettings({ ...settings, social_twitter: e.target.value })}
                        onBlur={(e) => setSettings({ ...settings, social_twitter: formatExternalUrl(e.target.value) })}
                        placeholder="https://x.com/yourhandle"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        LinkedIn Page URL
                      </label>
                      <input
                        type="text"
                        value={settings.social_linkedin || ''}
                        onChange={(e) => setSettings({ ...settings, social_linkedin: e.target.value })}
                        onBlur={(e) => setSettings({ ...settings, social_linkedin: formatExternalUrl(e.target.value) })}
                        placeholder="https://linkedin.com/company/yourcompany"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* BKASH SETUP REQUIREMENT POPUP MODAL */}
      {bkashWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 animate-scale-up">
            <div className="h-14 w-14 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mx-auto border border-pink-200">
              <Smartphone className="h-7 w-7" />
            </div>

            <h3 className="text-base font-black text-slate-950">
              Set Up bKash First
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              To require advance delivery charge prepayment from customers, you must first enable and set up either <strong>bKash Personal (Send Money)</strong> or <strong>bKash Online Payment Gateway</strong> in the payment section below.
            </p>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setBkashWarningModal(false)}
                className="w-full sm:w-auto min-w-[120px] py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
