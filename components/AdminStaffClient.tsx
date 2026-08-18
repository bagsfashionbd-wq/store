'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import { StaffMember, StaffRole, getRoleDetails, hasFullAccess } from '@/utils/staff'
import { 
  Users, UserPlus, ShieldCheck, ShieldAlert, Shield, 
  Search, X, Check, Trash2, Edit2, Phone, Mail, 
  AlertCircle, RefreshCw, KeyRound, Lock, User
} from 'lucide-react'
import axios from 'axios'

interface AdminStaffClientProps {
  initialStaff: StaffMember[]
  currentUserRole?: string
}

export default function AdminStaffClient({ initialStaff, currentUserRole = 'shop_owner' }: AdminStaffClientProps) {
  const router = useRouter()
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'shop_owner' | 'staff'>('all')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Add Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedRole, setSelectedRole] = useState<StaffRole>('staff')

  const canEditRoles = hasFullAccess(currentUserRole)

  // 1. Filtered Staff List
  const filteredStaff = useMemo(() => {
    return staffList.filter((member) => {
      // Role filter
      if (roleFilter !== 'all' && member.role !== roleFilter) {
        return false
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = (member.full_name || '').toLowerCase().includes(q)
        const matchEmail = (member.email || '').toLowerCase().includes(q)
        const matchPhone = (member.phone || '').toLowerCase().includes(q)
        const matchRole = (member.role || '').toLowerCase().includes(q)
        return matchName || matchEmail || matchPhone || matchRole
      }
      return true
    })
  }, [staffList, searchQuery, roleFilter])

  // 2. Metrics Breakdown
  const stats = useMemo(() => {
    return {
      total: staffList.length,
      admins: staffList.filter((s) => s.role === 'admin').length,
      owners: staffList.filter((s) => s.role === 'shop_owner').length,
      staff: staffList.filter((s) => s.role === 'staff').length
    }
  }, [staffList])

  // 3. Handle Add Staff
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const res = await axios.post('/api/admin/staff', {
        full_name: fullName.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim(),
        role: selectedRole
      })

      if (res.data.success) {
        setStaffList((prev) => [res.data.data, ...prev])
        setSuccessMessage(`Staff member "${fullName}" added successfully!`)
        setShowAddModal(false)
        // Reset form
        setFullName('')
        setEmail('')
        setPassword('')
        setPhone('')
        setSelectedRole('staff')
        setTimeout(() => setSuccessMessage(''), 4000)
      } else {
        throw new Error(res.data.error || 'Failed to add staff member')
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to create staff member.')
    } finally {
      setLoading(false)
    }
  }

  // 4. Handle Update Role
  const handleUpdateRole = async (memberId: string, newRole: StaffRole) => {
    if (!canEditRoles) return

    try {
      // Optimistic update
      setStaffList((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      )

      const res = await axios.patch('/api/admin/staff', {
        id: memberId,
        role: newRole
      })

      if (!res.data.success) {
        throw new Error(res.data.error || 'Failed to update role')
      }
    } catch (err: any) {
      console.error(err)
      router.refresh()
    }
  }

  // 5. Handle Toggle Status (Active / Suspended)
  const handleToggleStatus = async (member: StaffMember) => {
    if (!canEditRoles) return
    const newStatus = member.status === 'active' ? 'suspended' : 'active'

    try {
      // Optimistic update
      setStaffList((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m))
      )

      const res = await axios.patch('/api/admin/staff', {
        id: member.id,
        status: newStatus
      })

      if (!res.data.success) {
        throw new Error(res.data.error || 'Failed to update status')
      }
    } catch (err: any) {
      console.error(err)
      router.refresh()
    }
  }

  // 6. Handle Delete Staff
  const handleConfirmDelete = async () => {
    if (!deletingStaff || !canEditRoles) return
    setLoading(true)

    try {
      const res = await axios.delete(`/api/admin/staff?id=${deletingStaff.id}`)
      if (res.data.success) {
        setStaffList((prev) => prev.filter((m) => m.id !== deletingStaff.id))
        setSuccessMessage(`Staff member "${deletingStaff.full_name}" removed.`)
        setDeletingStaff(null)
        setTimeout(() => setSuccessMessage(''), 4000)
      } else {
        throw new Error(res.data.error || 'Failed to delete staff')
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to delete staff.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100 text-slate-800">
      
      {/* UNIFIED SIDEBAR NAVIGATION */}
      <AdminSidebar />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-brand-600 flex-shrink-0" />
            <h1 className="text-sm sm:text-lg font-bold text-slate-950 truncate">Staff & Role-Based Access</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.refresh()}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition"
              title="Refresh Staff List"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            {canEditRoles && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-3 sm:px-4 py-2 shadow-sm transition"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Staff</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Success / Error Alerts */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold animate-fadeIn">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-bold animate-fadeIn">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SUMMARY STAT METRICS CARDS (2x2 on Mobile, 4x1 on Desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            
            {/* Card 1: Total Staff */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Team</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-brand-50 text-brand-600">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-950 font-mono">{stats.total}</p>
              <p className="text-[10px] text-slate-400">Authorized members</p>
            </div>

            {/* Card 2: Shop Owners */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Shop Owners</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">{stats.owners}</p>
              <p className="text-[10px] text-slate-400">Founder & full store control</p>
            </div>

            {/* Card 3: Administrators */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Administrators</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-purple-700 font-mono">{stats.admins}</p>
              <p className="text-[10px] text-slate-400">Full management & settings</p>
            </div>

            {/* Card 4: Operations Staff */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Staff Members</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-blue-700 font-mono">{stats.staff}</p>
              <p className="text-[10px] text-slate-400">Orders & inventory management</p>
            </div>

          </div>

          {/* STAFF MANAGEMENT CONTAINER */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-2">
            
            {/* Search & Filter Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center">
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff by name, email, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Role Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
                {(['all', 'admin', 'shop_owner', 'staff'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      roleFilter === r
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r === 'all' ? 'All Roles' : r === 'shop_owner' ? 'Shop Owners' : r === 'admin' ? 'Admins' : 'Staff'}
                  </button>
                ))}
              </div>

            </div>

            {/* 1. MOBILE RESPONSIVE STAFF CARDS (< 768px) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <Users className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">
                    {searchQuery ? `No staff members matching "${searchQuery}"` : 'No staff members found.'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="inline-flex items-center gap-1 text-brand-600 hover:underline font-bold text-xs"
                    >
                      Clear Search Filter
                    </button>
                  )}
                </div>
              ) : (
                filteredStaff.map((member) => {
                  const details = getRoleDetails(member.role)
                  return (
                    <div key={member.id} className="p-3.5 space-y-3 bg-white hover:bg-slate-50/50 transition">
                      {/* Top Row: Avatar Initials, Name, Email, Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-sm flex-shrink-0 ${
                            member.role === 'shop_owner' ? 'bg-emerald-600' : member.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
                          }`}>
                            {member.full_name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">{member.full_name}</p>
                            <p className="text-[11px] text-slate-500 font-mono truncate">{member.email}</p>
                            {member.phone && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="h-2.5 w-2.5" /> {member.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status badge */}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          member.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {member.status}
                        </span>
                      </div>

                      {/* Middle: Role Selector & Description */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assigned Role</span>
                          {canEditRoles ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member.id, e.target.value as StaffRole)}
                              className="text-xs font-bold rounded-lg border border-slate-200 bg-white px-2 py-1 outline-none focus:border-brand-500"
                            >
                              <option value="staff">Staff</option>
                              <option value="shop_owner">Shop Owner</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${details.bg} ${details.text} ${details.border}`}>
                              {details.label}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug">{details.desc}</p>
                      </div>

                      {/* Bottom Row: Actions */}
                      {canEditRoles && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(member)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition ${
                              member.status === 'active'
                                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {member.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingStaff(member)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition"
                            title="Delete Staff"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* 2. DESKTOP RICH DATA TABLE (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Role & Capabilities</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4">Added Date</th>
                    {canEditRoles && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        <Users className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
                        <p className="font-bold text-slate-700 text-xs">
                          {searchQuery ? `No staff members matching "${searchQuery}"` : 'No staff members found.'}
                        </p>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="inline-flex items-center gap-1 text-brand-600 hover:underline font-bold text-xs mt-2"
                          >
                            Clear Search Filter
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((member) => {
                      const details = getRoleDetails(member.role)
                      return (
                        <tr key={member.id} className="hover:bg-slate-50/50 transition">
                          {/* Member Info */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-sm flex-shrink-0 ${
                                member.role === 'shop_owner' ? 'bg-emerald-600' : member.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
                              }`}>
                                {member.full_name?.charAt(0)?.toUpperCase() || 'S'}
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-900 line-clamp-1">{member.full_name}</p>
                                <p className="text-[11px] text-slate-500 font-mono">{member.email}</p>
                                {member.phone && (
                                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Phone className="h-2.5 w-2.5" /> {member.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role selector */}
                          <td className="p-4">
                            <div className="space-y-1">
                              {canEditRoles ? (
                                <select
                                  value={member.role}
                                  onChange={(e) => handleUpdateRole(member.id, e.target.value as StaffRole)}
                                  className="text-xs font-bold rounded-lg border border-slate-200 bg-white px-2.5 py-1 outline-none focus:border-brand-500 shadow-sm"
                                >
                                  <option value="staff">Staff (Operations)</option>
                                  <option value="shop_owner">Shop Owner (Founder)</option>
                                  <option value="admin">Admin (Full Control)</option>
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${details.bg} ${details.text} ${details.border}`}>
                                  {details.label}
                                </span>
                              )}
                              <p className="text-[10px] text-slate-400 leading-none">{details.desc}</p>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-4 text-center">
                            {canEditRoles ? (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(member)}
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                  member.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                }`}
                                title="Click to toggle status"
                              >
                                {member.status === 'active' ? 'Active' : 'Suspended'}
                              </button>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                member.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {member.status}
                              </span>
                            )}
                          </td>

                          {/* Created date */}
                          <td className="p-4 text-slate-500 font-mono text-[11px]">
                            {new Date(member.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>

                          {/* Actions */}
                          {canEditRoles && (
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setDeletingStaff(member)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition"
                                title="Delete Staff Member"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </main>
      </div>

      {/* ADD STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up">
            
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-brand-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Add New Staff Member</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-4 sm:p-6 space-y-4">
              
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Login Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@store.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
                />
              </div>

              {/* Phone (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Assign Dashboard Role *
                </label>
                
                <div className="space-y-2">
                  
                  {/* Option 1: Staff */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    selectedRole === 'staff' ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="staff"
                      checked={selectedRole === 'staff'}
                      onChange={() => setSelectedRole('staff')}
                      className="mt-0.5 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Staff (Operations)</p>
                      <p className="text-[11px] text-slate-500">Can view & manage Orders, Inquiries, Inventory, and Categories. Financials and settings are restricted.</p>
                    </div>
                  </label>

                  {/* Option 2: Shop Owner */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    selectedRole === 'shop_owner' ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="shop_owner"
                      checked={selectedRole === 'shop_owner'}
                      onChange={() => setSelectedRole('shop_owner')}
                      className="mt-0.5 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Shop Owner (Founder)</p>
                      <p className="text-[11px] text-slate-500">Can do everything in the dashboard: manage store operations, orders, financials, settings, and staff.</p>
                    </div>
                  </label>

                  {/* Option 3: Admin */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    selectedRole === 'admin' ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={selectedRole === 'admin'}
                      onChange={() => setSelectedRole('admin')}
                      className="mt-0.5 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Administrator</p>
                      <p className="text-[11px] text-slate-500">Full system access: manage settings, staff roles, inventory, and all store features.</p>
                    </div>
                  </label>

                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow disabled:bg-slate-300"
                >
                  {loading ? 'Creating...' : 'Create Staff Member'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Remove Staff Member?</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove <strong>{deletingStaff.full_name}</strong> ({deletingStaff.email})? They will lose access to the dashboard immediately.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingStaff(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow disabled:bg-slate-300"
              >
                {loading ? 'Removing...' : 'Yes, Remove Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
