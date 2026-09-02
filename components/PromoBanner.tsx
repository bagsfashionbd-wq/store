'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Sparkles, ArrowRight } from 'lucide-react'

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
}

interface PromoBannerProps {
  banner: Promotion | null
}

const STORAGE_KEY = 'mystore_banner_seen_timestamp'
const COOLDOWN_HOURS = 24

export default function PromoBanner({ banner }: PromoBannerProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!banner || !banner.is_active || !banner.image_url) return

    // Check validity dates
    const now = Date.now()
    if (banner.start_date && new Date(banner.start_date).getTime() > now) return
    if (banner.end_date && new Date(banner.end_date).getTime() < now) return

    // Check 24-hour cooldown in localStorage
    const lastSeenStr = localStorage.getItem(`${STORAGE_KEY}_${banner.id}`) || localStorage.getItem(STORAGE_KEY)
    if (lastSeenStr) {
      const lastSeen = parseInt(lastSeenStr, 10)
      if (!isNaN(lastSeen)) {
        const hoursPassed = (now - lastSeen) / (1000 * 60 * 60)
        if (hoursPassed < COOLDOWN_HOURS) {
          return // Still in cooldown, do not show
        }
      }
    }

    // Show banner with small delay for smooth entry
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 1200)

    return () => clearTimeout(timer)
  }, [banner])

  const handleDismiss = () => {
    if (banner) {
      localStorage.setItem(`${STORAGE_KEY}_${banner.id}`, Date.now().toString())
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
    }
    setIsOpen(false)
  }

  if (!isOpen || !banner || !banner.image_url) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/60 text-white hover:bg-slate-950/90 backdrop-blur-md transition shadow-md"
          aria-label="Close promotion"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Banner Media */}
        <div className="relative w-full overflow-hidden bg-slate-900 group">
          {banner.link_url ? (
            <Link href={banner.link_url} onClick={handleDismiss} className="block cursor-pointer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.image_url}
                alt={banner.title || 'Special Promotion'}
                className="w-full h-auto max-h-[70vh] object-cover sm:object-contain group-hover:scale-[1.02] transition-transform duration-300"
              />
            </Link>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={banner.image_url}
              alt={banner.title || 'Special Promotion'}
              className="w-full h-auto max-h-[70vh] object-cover sm:object-contain"
            />
          )}
        </div>

        {/* Bottom CTA Bar (If title or link exists) */}
        {(banner.title || banner.link_url) && (
          <div className="p-4 bg-white flex items-center justify-between gap-3 border-t border-slate-100">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-brand-600 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Special Promotion</span>
              </div>
              {banner.title && (
                <h4 className="font-extrabold text-sm text-slate-900 truncate mt-0.5">
                  {banner.title}
                </h4>
              )}
            </div>

            {banner.link_url ? (
              <Link
                href={banner.link_url}
                onClick={handleDismiss}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition whitespace-nowrap"
              >
                <span>Shop Now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Got it
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
