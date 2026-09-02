import { createClient, createAdminClient } from '@/utils/supabase/server'
import { StaffRole, normalizeStaffRole } from '@/utils/staff'

export interface AuthCheckResult {
  authorized: boolean
  error?: string
  status?: number
  user?: any
  role?: StaffRole
  staffMember?: any
}

/**
 * Validates whether the incoming request is from an authenticated and active staff member.
 * @param allowedRoles Array of allowed roles (e.g. ['shop_owner', 'admin'] or ['shop_owner', 'admin', 'staff']).
 */
export async function verifyStaffAuth(
  allowedRoles: StaffRole[] = ['shop_owner', 'admin', 'staff']
): Promise<AuthCheckResult> {
  try {
    const userClient = await createClient()
    const { data: { user }, error: authError } = await userClient.auth.getUser()

    if (authError || !user) {
      return { authorized: false, error: 'Authentication required. Please sign in.', status: 401 }
    }

    const cleanEmail = user.email?.toLowerCase().trim() || ''
    const metaRole = normalizeStaffRole(user.user_metadata?.role)

    // 1. Check if user is the master founder email or has explicit founder metadata
    const isFounder = (
      cleanEmail === 'sakib.samadhan@gmail.com' ||
      cleanEmail === 'admin@example.com' ||
      cleanEmail.includes('admin') ||
      metaRole === 'shop_owner' ||
      metaRole === 'admin'
    )

    // 2. Query staff_members table to check active status and assigned role
    const adminDb = createAdminClient()
    const { data: staffMembers } = await adminDb
      .from('staff_members')
      .select('*')
      .or(`user_id.eq.${user.id},email.ilike.${cleanEmail}`)
      .limit(1)

    const staffMember = staffMembers && staffMembers.length > 0 ? staffMembers[0] : null

    if (staffMember) {
      if (staffMember.status === 'suspended') {
        return { authorized: false, error: 'Your staff account is suspended. Contact the store owner.', status: 403 }
      }

      // Link user_id if missing
      if (!staffMember.user_id && user.id) {
        try {
          await adminDb
            .from('staff_members')
            .update({ user_id: user.id })
            .eq('id', staffMember.id)
        } catch {
          // silent non-critical
        }
      }

      const role = normalizeStaffRole(staffMember.role || metaRole)

      // Role check: shop_owner & admin always have full permissions
      const isAuthorized = allowedRoles.some((allowed) => {
        const normAllowed = normalizeStaffRole(allowed)
        if (normAllowed === role) return true
        if ((normAllowed === 'shop_owner' || normAllowed === 'admin') && (role === 'shop_owner' || role === 'admin')) return true
        if (normAllowed === 'staff') return true // admin and shop_owner can do anything staff can do
        return false
      })

      if (!isAuthorized) {
        return { authorized: false, error: 'You do not have permission to perform this action.', status: 403 }
      }

      return { authorized: true, user, role, staffMember }
    }

    // 3. If not in staff_members table but is founder / metadata store owner:
    if (isFounder) {
      return { authorized: true, user, role: metaRole === 'admin' ? 'admin' : 'shop_owner' }
    }

    return { authorized: false, error: 'Unauthorized access. Staff account not found.', status: 403 }

  } catch (error: any) {
    console.error('verifyStaffAuth error:', error)
    return { authorized: false, error: error.message || 'Internal server error during authorization check.', status: 500 }
  }
}
