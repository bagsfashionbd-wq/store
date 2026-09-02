import { Metadata } from 'next'
import { Suspense } from 'react'
import CustomerAccountClient from '@/components/CustomerAccountClient'
import { getPublicSettings } from '@/utils/settings'
import { Loader2 } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings()
  return {
    title: `My Account - ${settings.store_name}`,
    description: 'View order history, track shipments, manage wishlist and profile details.'
  }
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      }
    >
      <CustomerAccountClient />
    </Suspense>
  )
}

