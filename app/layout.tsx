import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/globals.css'
import { CartProvider } from '@/context/CartContext'
import { StoreProvider } from '@/context/StoreContext'
import { LanguageProvider } from '@/context/LanguageContext'
import ThemeProvider from '@/components/ThemeProvider'
import TrackingScripts from '@/components/TrackingScripts'
import { getPublicSettings } from '@/utils/settings'
import { createAdminClient } from '@/utils/supabase/server'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings()
  const iconUrl = settings.favicon_url || settings.logo_url || '/logo.jpeg'

  return {
    title: `${settings.store_name} - ${settings.store_tagline || 'Online Store'}`,
    description: settings.hero_description || 'Your one-stop online shop in Bangladesh.',
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl,
    }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getPublicSettings()
  const supabase = createAdminClient()

  // Fetch categories for context
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href={settings.favicon_url || settings.logo_url || '/logo.jpeg'} />
      </head>
      <body suppressHydrationWarning className={`${inter.className} bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col`}>
        <TrackingScripts settings={settings} />
        <LanguageProvider>
          <ThemeProvider themeColor={settings.theme_color}>
            <StoreProvider initialSettings={settings} initialCategories={categories || []}>
              <CartProvider>
                {children}
              </CartProvider>
            </StoreProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
