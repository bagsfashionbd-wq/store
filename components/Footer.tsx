'use client'

import React from 'react'
import Link from 'next/link'
import { useStore } from '@/context/StoreContext'
import { Phone, Mail, MapPin, ArrowUpRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react'

export default function Footer() {
  const { settings, categories } = useStore()

  // Only show top 5 parent categories
  const parentCategories = categories.filter((c) => !c.parent_id).slice(0, 5)

  // Show about page if enabled and has content
  const hasAbout = settings.about_enabled && (
    settings.about_story || settings.contact_address || settings.contact_phone || settings.contact_email
  )

  const heroHeading = [settings.hero_title, settings.hero_subtitle].filter(Boolean).join(' - ')

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 mt-auto">
      {/* Top USP Banner */}


      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* Col 1: Store Info & Hero Banner Heading */}
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
              {heroHeading || settings.store_tagline || 'Quality Products & Reliable Service'}
            </p>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {settings.hero_description || settings.store_tagline || 'Your trusted online destination for quality products in Bangladesh.'}
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white">Quick Links</p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-brand-400 transition-colors">Home</Link>
              </li>
              {hasAbout && (
                <li>
                  <Link href="/about" className="hover:text-brand-400 transition-colors">About Us</Link>
                </li>
              )}
              <li>
                <Link href="/contact" className="hover:text-brand-400 transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-brand-400 transition-colors font-semibold text-brand-400">Track Order</Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-brand-400 transition-colors">Checkout</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white">Categories</p>
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

          {/* Col 4: Contact Info */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white">Contact & Support</p>
            <div className="space-y-2.5 text-xs">
              {settings.contact_phone && (
                <p className="flex items-start gap-2 text-slate-400">
                  <Phone className="h-4 w-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  <span>{settings.contact_phone}</span>
                </p>
              )}
              {settings.contact_email && (
                <p className="flex items-start gap-2 text-slate-400">
                  <Mail className="h-4 w-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  <span>{settings.contact_email}</span>
                </p>
              )}
              {settings.contact_address && (
                <p className="flex items-start gap-2 text-slate-400">
                  <MapPin className="h-4 w-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  <span>{settings.contact_address}</span>
                </p>
              )}
              <div className="pt-1">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 transition"
                >
                  <span>Send a direct message</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {settings.store_name}. All rights reserved.</p>
          <p className="text-[11px] text-slate-600">
            Powered by Secure White-Label E-Commerce Platform
          </p>
        </div>
      </div>
    </footer>
  )
}
