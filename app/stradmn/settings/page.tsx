import { getStoreSettings } from '@/utils/settings'
import AdminSettingsClient from '@/components/AdminSettingsClient'

export const revalidate = 0

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings(true)

  return <AdminSettingsClient initialSettings={settings} />
}
