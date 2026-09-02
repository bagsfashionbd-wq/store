'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Sparkles } from 'lucide-react'

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

interface PromoRibbonProps {
  ribbon: Promotion | null
}

export default function PromoRibbon({ ribbon }: PromoRibbonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!ribbon || !ribbon.is_active || !ribbon.message) return

    // Check dates
    const now = Date.now()
    if (ribbon.start_date && new Date(ribbon.start_date).getTime() > now) return
    if (ribbon.end_date && new Date(ribbon.end_date).getTime() < now) return

    // Check per-session dismissal in sessionStorage
    const isDismissed = sessionStorage.getItem(`mystore_ribbon_dismissed_${ribbon.id}`)
    if (!isDismissed) {
      setIsVisible(true)
    }
  }, [ribbon])

  const handleDismiss = () => {
    if (ribbon) {
      sessionStorage.setItem(`mystore_ribbon_dismissed_${ribbon.id}`, 'true')
    }
    setIsVisible(false)
  }

  if (!isVisible || !ribbon || !ribbon.message) return null

  return (
    <div className="relative z-50 bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-700 text-white text-xs font-semibold py-2 px-4 shadow-sm animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center justify-center text-center gap-2 pr-6">
          <Sparkles className="h-3.5 w-3.5 text-yellow-300 flex-shrink-0 animate-pulse" />
          {ribbon.link_url ? (
            <Link href={ribbon.link_url} className="hover:underline flex items-center gap-1.5 font-bold">
              <span>{ribbon.message}</span>
            </Link>
          ) : (
            <span className="font-bold">{ribbon.message}</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition flex-shrink-0"
          aria-label="Dismiss announcement"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
