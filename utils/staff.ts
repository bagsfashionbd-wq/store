export type StaffRole = 'admin' | 'shop_owner' | 'staff'
export type StaffStatus = 'active' | 'suspended'

export interface StaffMember {
  id: string
  user_id?: string | null
  email: string
  full_name: string
  role: StaffRole
  status: StaffStatus
  phone?: string
  created_at: string
  updated_at?: string
}

/**
 * Normalizes role string to standard StaffRole enum
 */
export function normalizeStaffRole(role?: string | null): StaffRole {
  if (!role) return 'staff'
  const r = role.toLowerCase().trim().replace(/[-\s]/g, '_')
  if (r === 'admin' || r === 'administrator') return 'admin'
  if (
    r === 'shop_owner' ||
    r === 'shopowner' ||
    r === 'store_owner' ||
    r === 'storeowner' ||
    r === 'owner' ||
    r === 'shop_admin' ||
    r === 'store_admin'
  ) {
    return 'shop_owner'
  }
  return 'staff'
}

/**
 * Checks if role has full administrative & management access
 */
export function hasFullAccess(role?: string | null): boolean {
  if (!role) return false
  const r = normalizeStaffRole(role)
  return r === 'admin' || r === 'shop_owner'
}

/**
 * Checks if role can modify staff members and change roles
 */
export function canManageStaff(role?: string | null): boolean {
  return hasFullAccess(role)
}

/**
 * Checks if role can access store settings & API credentials
 */
export function canAccessSettings(role?: string | null): boolean {
  return hasFullAccess(role)
}

/**
 * Checks if role can access financial stats & analytics
 */
export function canAccessStats(role?: string | null): boolean {
  return hasFullAccess(role)
}

/**
 * Get human-friendly label and styling for roles
 */
export function getRoleDetails(role: string): { label: string; bg: string; text: string; border: string; desc: string } {
  const r = normalizeStaffRole(role)
  if (r === 'admin') {
    return {
      label: 'Admin',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      desc: 'Full access to all store modules, settings, and staff'
    }
  }
  if (r === 'shop_owner') {
    return {
      label: 'Shop Owner',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      desc: 'Can do everything in the dashboard and manage store operations'
    }
  }
  return {
    label: 'Staff',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    desc: 'Can view and manage Orders, Inquiries, Inventory, and Categories'
  }
}
