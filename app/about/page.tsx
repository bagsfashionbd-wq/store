import { getPublicSettings } from '@/utils/settings'
import AboutPageClient from '@/components/AboutPageClient'
import type { Metadata } from 'next'

export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings()
  return {
    title: `About Us - ${settings.store_name}`,
    description: settings.about_story?.slice(0, 160) || `Learn more about ${settings.store_name} and our mission.`
  }
}

export default function AboutPage() {
  return <AboutPageClient />
}
