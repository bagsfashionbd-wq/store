import { Suspense } from 'react'
import { getPublicSettings } from '@/utils/settings'
import TrackOrderClient from '@/components/TrackOrderClient'
import { Loader2 } from 'lucide-react'

export const revalidate = 0

export const metadata = {
  title: 'Track Order - Live Consignment Status',
  description: 'Track your parcel, consignment booking, delivery progress and invoice status.'
}

export default async function TrackPage() {
  const settings = await getPublicSettings()

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    }>
      <TrackOrderClient settings={settings} />
    </Suspense>
  )
}
