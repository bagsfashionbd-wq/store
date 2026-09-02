'use client'

import React from 'react'
import Link from 'next/link'
import { useStore } from '@/context/StoreContext'
import { formatExternalUrl } from '@/utils/url'
import { Phone, Mail, MapPin, ArrowUpRight, MessageCircle } from 'lucide-react'

import { useLanguage } from '@/context/LanguageContext'

// Helper for formatting WhatsApp URL
function getWhatsAppUrl(num: string, storeName: string) {
  const digits = num.replace(/\D/g, '')
  const cleanNumber = digits.startsWith('01') ? '88' + digits : digits
  const text = encodeURIComponent(`Hello ${storeName}, I have an inquiry about your products.`)
  return `https://wa.me/${cleanNumber}?text=${text}`
}

export default function Footer() {
  const { settings, categories } = useStore()
  const { t, toBengaliDigits, isBangla } = useLanguage()

  // Only show top 5 parent categories
  const parentCategories = categories.filter((c) => !c.parent_id).slice(0, 5)

  // Show about page if enabled and has content
  const hasAbout = settings.about_enabled && (
    settings.about_story || settings.contact_address || settings.contact_phone || settings.contact_whatsapp || settings.contact_email
  )

  const heroHeading = [settings.hero_title, settings.hero_subtitle].filter(Boolean).join(' - ')

  const socialLinks = [
    {
      key: 'facebook',
      name: 'Facebook',
      url: formatExternalUrl(settings.social_facebook),
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      hoverBg: 'hover:bg-[#1877F2] hover:text-white'
    },
    {
      key: 'instagram',
      name: 'Instagram',
      url: formatExternalUrl(settings.social_instagram),
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      hoverBg: 'hover:bg-gradient-to-tr hover:from-[#FA7E1E] hover:via-[#D62976] hover:to-[#962FBF] hover:text-white'
    },
    {
      key: 'youtube',
      name: 'YouTube',
      url: formatExternalUrl(settings.social_youtube),
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      hoverBg: 'hover:bg-[#FF0000] hover:text-white'
    },
    {
      key: 'tiktok',
      name: 'TikTok',
      url: formatExternalUrl(settings.social_tiktok),
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.72 1.55-.06 2.87-1.13 3.16-2.65.1-.47.13-.96.13-1.44V.02z"/>
        </svg>
      ),
      hoverBg: 'hover:bg-black hover:text-[#00f2fe]'
    },
    {
      key: 'twitter',
      name: 'X (Twitter)',
      url: formatExternalUrl(settings.social_twitter),
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      hoverBg: 'hover:bg-slate-900 hover:text-white'
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      url: formatExternalUrl(settings.social_linkedin),
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.66 1.66 0 0 0-1.66 1.66c0 .92.74 1.66 1.66 1.66.92 0 1.66-.74 1.66-1.66 0-.92-.74-1.66-1.66-1.66z"/>
        </svg>
      ),
      hoverBg: 'hover:bg-[#0A66C2] hover:text-white'
    }
  ].filter((item) => Boolean(item.url && item.url.trim()))

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 mt-auto">
      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* Col 1: Store Info, Social Channels & Hero Banner Heading */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              {settings.logo_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={settings.logo_url}
                  alt={settings.store_name}
                  className="h-9 w-9 rounded-full object-cover border border-slate-800"
                />
              )}
              <span className="text-lg font-black tracking-tight text-white">{settings.store_name}</span>
            </div>

            {/* Line under store name: Heading from hero banner */}
            <p className="text-xs font-bold text-brand-400 tracking-wide">
              {heroHeading || settings.store_tagline || (isBangla ? 'সেরা মানের পণ্য ও দ্রুত ডেলিভারি সেবা' : 'Quality Products & Reliable Service')}
            </p>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {settings.hero_description || settings.store_tagline || (isBangla ? 'সারা বাংলাদেশে আপনার বিশ্বস্ত অনলাইন শপ।' : 'Your trusted online destination for quality products in Bangladesh.')}
            </p>

            {/* Social Media Channels */}
            {(socialLinks.length > 0 || settings.contact_whatsapp) && (
              <div className="pt-2 space-y-2">
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{t('footer.connect_with_us')}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {/* WhatsApp Direct Chat */}
                  {settings.contact_whatsapp && (
                    <a
                      href={getWhatsAppUrl(settings.contact_whatsapp, settings.store_name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-xs font-bold transition shadow-sm"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {/* Social Icons */}
                  {socialLinks.map((s) => (
                    <a
                      key={s.key}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 transition-all duration-200 shadow-sm ${s.hoverBg}`}
                      title={s.name}
                      aria-label={s.name}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Col 2: Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white">{t('footer.quick_links')}</p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-brand-400 transition-colors">{t('nav.home')}</Link>
              </li>
              {hasAbout && (
                <li>
                  <Link href="/about" className="hover:text-brand-400 transition-colors">{t('about.about_us')}</Link>
                </li>
              )}
              <li>
                <Link href="/contact" className="hover:text-brand-400 transition-colors">{t('nav.contact')}</Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-brand-400 transition-colors font-semibold text-brand-400">{t('nav.track_order')}</Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-brand-400 transition-colors">{t('checkout.checkout')}</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white">{t('footer.categories')}</p>
            <ul className="space-y-2 text-xs">
              {parentCategories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/category/${cat.slug}`} className="hover:text-brand-400 transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact & Support (Separated Phone & WhatsApp) */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white">{t('footer.contact_support')}</p>
            <div className="space-y-2.5 text-xs">
              {settings.contact_phone && (
                <a
                  href={`tel:${settings.contact_phone.replace(/\s+/g, '')}`}
                  className="flex items-start gap-2 text-slate-400 hover:text-white transition group"
                >
                  <Phone className="h-4 w-4 text-brand-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">{isBangla ? 'ফোন সহায়তা' : 'Call Support'}</span>
                    <span>{settings.contact_phone}</span>
                  </div>
                </a>
              )}

              {settings.contact_whatsapp && (
                <a
                  href={getWhatsAppUrl(settings.contact_whatsapp, settings.store_name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-emerald-400 hover:text-emerald-300 transition group"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-[10px] text-emerald-600 block uppercase font-bold">{isBangla ? 'হোয়াটসঅ্যাপ' : 'WhatsApp Direct'}</span>
                    <span>{settings.contact_whatsapp}</span>
                  </div>
                </a>
              )}

              {settings.contact_email && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="flex items-start gap-2 text-slate-400 hover:text-white transition group"
                >
                  <Mail className="h-4 w-4 text-brand-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">{isBangla ? 'ইমেইল' : 'Email Inquiries'}</span>
                    <span>{settings.contact_email}</span>
                  </div>
                </a>
              )}

              {settings.contact_address && (
                <div className="flex items-start gap-2 text-slate-400">
                  <MapPin className="h-4 w-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">{isBangla ? 'দোকানের ঠিকানা' : 'Store Address'}</span>
                    <span>{settings.contact_address}</span>
                  </div>
                </div>
              )}

              <div className="pt-1">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 transition"
                >
                  <span>{isBangla ? 'সরাসরি বার্তা পাঠান' : 'Send a direct message'}</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {isBangla ? toBengaliDigits(new Date().getFullYear()) : new Date().getFullYear()} {settings.store_name}. {t('footer.all_rights_reserved')}</p>
          <p className="text-[11px] text-slate-600">
            {settings.store_name} • E-Commerce Platform
          </p>
        </div>
      </div>
    </footer>
  )
}
