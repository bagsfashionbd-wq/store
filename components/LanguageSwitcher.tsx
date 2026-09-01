'use client'

import React from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Languages } from 'lucide-react'

interface LanguageSwitcherProps {
  size?: 'sm' | 'md'
  variant?: 'light' | 'dark' | 'outline'
  showIcon?: boolean
  className?: string
}

export default function LanguageSwitcher({
  size = 'sm',
  variant = 'light',
  showIcon = false,
  className = ''
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()

  const isSmall = size === 'sm'

  // Variant styling
  const bgClass =
    variant === 'dark'
      ? 'bg-slate-800/80 border-slate-700 text-slate-200'
      : variant === 'outline'
        ? 'bg-transparent border-slate-300 text-slate-700'
        : 'bg-slate-100/90 border-slate-200 text-slate-700'

  return (
    <div
      className={`inline-flex items-center rounded-xl p-0.5 border shadow-sm transition-all ${bgClass} ${className}`}
      role="group"
      aria-label="Language selection"
    >
      {showIcon && (
        <div className="pl-2 pr-1 text-slate-400">
          <Languages className={isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </div>
      )}

      {/* English button */}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`rounded-lg font-bold transition-all duration-200 ${
          isSmall ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        } ${
          language === 'en'
            ? 'bg-white text-brand-700 shadow-sm font-black ring-1 ring-slate-200/60'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        aria-pressed={language === 'en'}
      >
        EN
      </button>

      {/* Bangla button */}
      <button
        type="button"
        onClick={() => setLanguage('bn')}
        className={`rounded-lg font-bold transition-all duration-200 ${
          isSmall ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        } ${
          language === 'bn'
            ? 'bg-white text-brand-700 shadow-sm font-black ring-1 ring-slate-200/60'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        aria-pressed={language === 'bn'}
      >
        বাংলা
      </button>
    </div>
  )
}
