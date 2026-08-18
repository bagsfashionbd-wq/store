'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import { useStore } from '@/context/StoreContext'
import { formatGoogleMapsEmbedUrl } from '@/utils/map'
import { 
  Phone, Mail, MapPin, ShieldCheck, Truck, 
  HeartHandshake, ChevronRight, Store, ArrowRight
} from 'lucide-react'

export default function AboutPageClient() {
  const { settings } = useStore()
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <Navbar onCartToggle={() => setCartDrawerOpen(true)} />

      {/* Hero */}
      <section className="bg-slate-950 text-white py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-25 bg-cover bg-center" style={{ backgroundImage: `url(${settings.hero_image_url || '/logo.jpeg'})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent z-0" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Link href="/" className="hover:text-brand-400">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-brand-400">About Us</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl text-white">
            About {settings.store_name}
          </h1>
          <p className="mt-3 text-sm text-slate-300 max-w-xl">
            {settings.store_tagline || 'Committed to delivering excellence, quality products, and exceptional customer service across Bangladesh.'}
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
                <h2 className="text-lg font-black text-slate-950">Our Story & Mission</h2>
                <p className="text-xs text-slate-500">Dedicated to delivering high-quality products to your doorstep</p>
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
            <h3 className="text-sm font-bold text-slate-900">Uncompromising Quality</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We carefully inspect every item before dispatch to ensure it meets the highest standards of reliability and durability.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="rounded-xl bg-brand-50 w-12 h-12 flex items-center justify-center text-brand-600 font-bold">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Reliable Nationwide Courier</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fast, insured doorstep deliveries across all 64 districts in Bangladesh with live parcel tracking.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="rounded-xl bg-brand-50 w-12 h-12 flex items-center justify-center text-brand-600 font-bold">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Customer First Support</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our responsive customer service is always here to assist with product guidance, order tracking, and after-sales support.
            </p>
          </div>
        </div>

        {/* Location & Map Section (if provided) */}
        {(settings.contact_address || settings.google_map_embed_url || settings.contact_phone) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Visit Our Location & Reach Us</h2>
                <p className="text-xs text-slate-500 mt-0.5">We welcome visits, inquiries, and customer consultations.</p>
              </div>
              <Link
                href="/contact"
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-brand-500 transition"
              >
                <span>Contact Page</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-4 text-xs">
                {settings.contact_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Store Address</p>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{settings.contact_address}</p>
                    </div>
                  </div>
                )}

                {settings.contact_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Phone</p>
                      <p className="text-slate-600 mt-0.5">{settings.contact_phone}</p>
                    </div>
                  </div>
                )}

                {settings.contact_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Email</p>
                      <p className="text-slate-600 mt-0.5">{settings.contact_email}</p>
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
