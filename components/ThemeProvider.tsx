'use client'

import React, { useEffect } from 'react'
import { THEME_PALETTES } from '@/utils/theme'

interface ThemeProviderProps {
  themeColor?: string
  children: React.ReactNode
}

export default function ThemeProvider({ themeColor = 'emerald', children }: ThemeProviderProps) {
  useEffect(() => {
    const palette = THEME_PALETTES[themeColor] || THEME_PALETTES['emerald']
    if (!palette) return

    const root = document.documentElement
    Object.entries(palette.colors).forEach(([shade, rgbVal]) => {
      root.style.setProperty(`--color-primary-${shade}`, rgbVal)
    })
  }, [themeColor])

  return <>{children}</>
}
