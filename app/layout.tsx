import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/globals.css'
import { CartProvider } from '@/context/CartContext'
import { StoreProvider } from '@/context/StoreContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { CustomerProvider } from '@/context/CustomerContext'
import ThemeProvider from '@/components/ThemeProvider'
import TrackingScripts from '@/components/TrackingScripts'
import PromoRibbon from '@/components/PromoRibbon'
import PromoBanner from '@/components/PromoBanner'
import AuthModal from '@/components/AuthModal'
import { getPublicSettings } from '@/utils/settings'
import { createAdminClient } from '@/utils/supabase/server'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings()
  const iconUrl = settings.favicon_url || settings.logo_url || '/logo.jpeg'

  const metadata: Metadata = {
    title: `${settings.store_name} - ${settings.store_tagline || 'Online Store'}`,
    description: settings.hero_description || 'Your one-stop online shop in Bangladesh.',
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl,
    }
  }

  const verification: Record<string, any> = {}
  if (settings.google_site_verification && settings.google_site_verification.trim()) {
    verification.google = settings.google_site_verification.trim()
  }
  if (settings.meta_domain_verification && settings.meta_domain_verification.trim()) {
    verification.other = {
      'facebook-domain-verification': settings.meta_domain_verification.trim()
    }
  }

  if (Object.keys(verification).length > 0) {
    metadata.verification = verification
  }

  return metadata
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getPublicSettings()
  const supabase = createAdminClient()

  // Fetch categories & active promotions in parallel
  const [categoriesRes, promotionsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true }),
    supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
  ])

  const categories = categoriesRes.data || []
  const promotions = promotionsRes.data || []

  const activeRibbon = promotions.find((p) => p.type === 'ribbon') || null
  const activeBanner = promotions.find((p) => p.type === 'banner') || null

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href={settings.favicon_url || settings.logo_url || '/logo.jpeg'} />
      </head>
      <body suppressHydrationWarning className={`${inter.className} bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col`}>
        <TrackingScripts settings={settings} />
        <LanguageProvider>
          <ThemeProvider themeColor={settings.theme_color}>
            <StoreProvider initialSettings={settings} initialCategories={categories}>
              <CustomerProvider>
                <CartProvider>
                  <PromoRibbon ribbon={activeRibbon} />
                  <PromoBanner banner={activeBanner} />
                  <AuthModal />
                  {children}
                </CartProvider>
              </CustomerProvider>
            </StoreProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}

