'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, Language } from '@/utils/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (path: string, params?: Record<string, string | number>) => string
  toBengaliDigits: (num: number | string) => string
  formatPrice: (amount: number | string, options?: { showBengaliDigits?: boolean }) => string
  isBangla: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const BENGALI_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯'
}

export function toBengaliDigits(input: number | string): string {
  return String(input).replace(/[0-9]/g, (digit) => BENGALI_DIGITS[digit] || digit)
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('bn') // Default to Bangla for Bangladeshi store, or read from storage
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('preferred_language') as Language | null
      if (stored === 'en' || stored === 'bn') {
        setLanguageState(stored)
      } else {
        // Default to Bengali or English based on browser language
        const browserLang = navigator.language.toLowerCase()
        if (browserLang.includes('bn') || browserLang.includes('bd')) {
          setLanguageState('bn')
        } else {
          setLanguageState('bn') // Default friendly Bengali
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem('preferred_language', lang)
      document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`
    } catch {
      // Ignore storage errors
    }
  }

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.')
    let current: any = translations[language]

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        // Fallback to English
        let fallback: any = translations.en
        for (const fKey of keys) {
          if (fallback && typeof fallback === 'object' && fKey in fallback) {
            fallback = fallback[fKey]
          } else {
            return path
          }
        }
        current = fallback
        break
      }
    }

    if (typeof current !== 'string') {
      return path
    }

    let result = current
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue))
      })
    }

    return result
  }

  const formatPrice = (amount: number | string, options?: { showBengaliDigits?: boolean }): string => {
    const num = Number(amount) || 0
    const formattedNum = num.toLocaleString('en-US')
    
    if (language === 'bn' && options?.showBengaliDigits) {
      return `৳${toBengaliDigits(formattedNum)}`
    }
    return `৳${formattedNum}`
  }

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    toBengaliDigits,
    formatPrice,
    isBangla: language === 'bn'
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
