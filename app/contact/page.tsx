import { getPublicSettings } from '@/utils/settings'
import ContactPageClient from '@/components/ContactPageClient'
import type { Metadata } from 'next'

export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings()
  return {
    title: `Contact Us - ${settings.store_name}`,
    description: `Get in touch with ${settings.store_name}. We are here to help with your orders and inquiries.`
  }
}

export default function ContactPage() {
  return <ContactPageClient />
}
