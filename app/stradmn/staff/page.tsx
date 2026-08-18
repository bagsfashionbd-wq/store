import { createAdminClient } from '@/utils/supabase/server'
import AdminStaffClient from '@/components/AdminStaffClient'
import { StaffMember } from '@/utils/staff'

export const revalidate = 0 // Disable cache for live staff management

export default async function AdminStaffPage() {
  const supabase = createAdminClient()

  // 1. Fetch Staff Members
  const { data: staffData, error } = await supabase
    .from('staff_members')
    .select('*')
    .order('created_at', { ascending: false })

  let initialStaff: StaffMember[] = staffData || []

  // Fallback initial founder if table was just created
  if (initialStaff.length === 0) {
    initialStaff = [
      {
        id: 'founder-001',
        email: 'sakib.samadhan@gmail.com',
        full_name: 'Store Founder',
        role: 'shop_owner',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'admin-001',
        email: 'admin@example.com',
        full_name: 'System Administrator',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ]
  }

  return <AdminStaffClient initialStaff={initialStaff} />
}
