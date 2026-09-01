'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import { useStore } from '@/context/StoreContext'
import { formatGoogleMapsEmbedUrl } from '@/utils/map'
import { formatExternalUrl } from '@/utils/url'
import { 
  Phone, Mail, MapPin, ShieldCheck, Truck, 
  HeartHandshake, ChevronRight, Store, ArrowRight, MessageCircle, Share2
} from 'lucide-react'

import { useLanguage } from '@/context/LanguageContext'

// Helper for formatting WhatsApp URL
function getWhatsAppUrl(num: string, storeName: string) {
  const digits = num.replace(/\D/g, '')
  const cleanNumber = digits.startsWith('01') ? '88' + digits : digits
  const text = encodeURIComponent(`Hello ${storeName}, I am reaching out after viewing your About page.`)
  return `https://wa.me/${cleanNumber}?text=${text}`
}

export default function AboutPageClient() {
  const { settings } = useStore()
  const { t, isBangla } = useLanguage()
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)

  const socialLinks = [
    {
      key: 'facebook',
      name: 'Facebook',
      url: formatExternalUrl(settings.social_facebook),
      color: 'hover:border-[#1877F2] hover:text-[#1877F2]',
      icon: (
        <svg className="h-3.5 w-3.5 fill-[#1877F2]" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      key: 'instagram',
      name: 'Instagram',
      url: formatExternalUrl(settings.social_instagram),
      color: 'hover:border-[#E4405F] hover:text-[#E4405F]',
      icon: (
        <svg className="h-3.5 w-3.5 fill-[#E4405F]" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    {
      key: 'youtube',
      name: 'YouTube',
      url: formatExternalUrl(settings.social_youtube),
      color: 'hover:border-[#FF0000] hover:text-[#FF0000]',
      icon: (
        <svg className="h-3.5 w-3.5 fill-[#FF0000]" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      key: 'tiktok',
      name: 'TikTok',
      url: formatExternalUrl(settings.social_tiktok),
      color: 'hover:border-black hover:text-black',
      icon: (
        <svg className="h-3.5 w-3.5 fill-slate-900" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.72 1.55-.06 2.87-1.13 3.16-2.65.1-.47.13-.96.13-1.44V.02z"/>
        </svg>
      )
    },
    {
      key: 'twitter',
      name: 'X (Twitter)',
      url: formatExternalUrl(settings.social_twitter),
      color: 'hover:border-slate-800 hover:text-slate-900',
      icon: (
        <svg className="h-3.5 w-3.5 fill-slate-900" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      url: formatExternalUrl(settings.social_linkedin),
      color: 'hover:border-[#0A66C2] hover:text-[#0A66C2]',
      icon: (
        <svg className="h-3.5 w-3.5 fill-[#0A66C2]" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.66 1.66 0 0 0-1.66 1.66c0 .92.74 1.66 1.66 1.66.92 0 1.66-.74 1.66-1.66 0-.92-.74-1.66-1.66-1.66z"/>
        </svg>
      )
    }
  ].filter((item) => Boolean(item.url && item.url.trim()))

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <Navbar onCartToggle={() => setCartDrawerOpen(true)} />

      {/* Hero */}
      <section className="bg-slate-950 text-white py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-25 bg-cover bg-center" style={{ backgroundImage: `url(${settings.hero_image_url || '/logo.jpeg'})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent z-0" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Link href="/" className="hover:text-brand-400">{t('nav.home')}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-brand-400">{t('about.about_us')}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl text-white">
            {isBangla ? `${settings.store_name} সম্পর্কে` : `About ${settings.store_name}`}
          </h1>
          <p className="mt-3 text-sm text-slate-300 max-w-xl">
            {settings.store_tagline || (isBangla ? 'সারা বাংলাদেশে সেরা মানের পণ্য ও উন্নত কাস্টমার সেবা নিশ্চিত করতে আমরা প্রতিশ্রুতিবদ্ধ।' : 'Committed to delivering excellence, quality products, and exceptional customer service across Bangladesh.')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full space-y-12">
        
        {/* Story Section */}
        {settings.about_story && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">{t('about.story_mission')}</h2>
                <p className="text-xs text-slate-500">{isBangla ? 'আপনার দোরগোড়ায় প্রিমিয়াম পণ্য পৌঁছে দিতে আমরা নিবেদিত' : 'Dedicated to delivering high-quality products to your doorstep'}</p>
              </div>
            </div>
            
            <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-line space-y-4">
              {settings.about_story}
            </div>
          </div>
        )}

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="rounded-xl bg-brand-50 w-12 h-12 flex items-center justify-center text-brand-600 font-bold">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t('about.quality')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('about.quality_desc')}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="rounded-xl bg-brand-50 w-12 h-12 flex items-center justify-center text-brand-600 font-bold">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t('about.delivery_nationwide')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('about.delivery_desc')}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="rounded-xl bg-brand-50 w-12 h-12 flex items-center justify-center text-brand-600 font-bold">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t('about.support')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('about.support_desc')}
            </p>
          </div>
        </div>

        {/* Location, Contact & Social Media Section */}
        {(settings.contact_address || settings.google_map_embed_url || settings.contact_phone || settings.contact_whatsapp || socialLinks.length > 0) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{t('about.visit_us')}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{isBangla ? 'আমরা যে কোনো পরামর্শ ও প্রশ্নের জন্য সবসময় প্রস্তুত।' : 'We welcome visits, inquiries, and customer consultations.'}</p>
              </div>
              <Link
                href="/contact"
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-brand-500 transition"
              >
                <span>{t('nav.contact')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-5 text-xs">
                {settings.contact_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">{isBangla ? 'দোকানের ঠিকানা' : 'Store Address'}</p>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{settings.contact_address}</p>
                    </div>
                  </div>
                )}

                {settings.contact_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">{isBangla ? 'ফোন সহায়তা' : 'Phone Support'}</p>
                      <a href={`tel:${settings.contact_phone.replace(/\s+/g, '')}`} className="text-slate-600 hover:text-brand-600 transition mt-0.5 block">
                        {settings.contact_phone}
                      </a>
                    </div>
                  </div>
                )}

                {settings.contact_whatsapp && (
                  <div className="flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">{isBangla ? 'হোয়াটসঅ্যাপ চ্যাট' : 'WhatsApp Chat'}</p>
                      <a 
                        href={getWhatsAppUrl(settings.contact_whatsapp, settings.store_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-bold hover:underline mt-0.5 inline-flex items-center gap-1"
                      >
                        <span>{settings.contact_whatsapp}</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">{isBangla ? 'মেসেজ দিন' : 'Message Now'}</span>
                      </a>
                    </div>
                  </div>
                )}

                {settings.contact_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">{isBangla ? 'ইমেইল' : 'Email'}</p>
                      <a href={`mailto:${settings.contact_email}`} className="text-slate-600 hover:text-brand-600 transition mt-0.5 block">
                        {settings.contact_email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Social Links Badges */}
                {socialLinks.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5 text-brand-600" /> {isBangla ? 'সোশ্যাল মিডিয়ায় যুক্ত হোন' : 'Connect on Social Media'}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {socialLinks.map((s) => (
                        <a
                          key={s.key}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-xs ${s.color}`}
                        >
                          <span className="flex-shrink-0">{s.icon}</span>
                          <span>{s.name}</span>
                          <ArrowRight className="h-3 w-3 opacity-50 ml-0.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {settings.google_map_embed_url && (
                <div className="lg:col-span-7 rounded-xl overflow-hidden border border-slate-200 aspect-video shadow-inner bg-slate-100">
                  <iframe
                    src={formatGoogleMapsEmbedUrl(settings.google_map_embed_url)}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    title="Store Google Map"
                  />
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <Footer />
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </div>
  )
}
