'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useStore } from '@/context/StoreContext'
import { useLanguage } from '@/context/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { hasFullAccess, getRoleDetails, normalizeStaffRole } from '@/utils/staff'
import { 
  BarChart3, ShoppingBag, Package, LogOut, MessageSquare, 
  Settings, FolderTree, ShieldCheck, Menu, X, ExternalLink, Users, Megaphone
} from 'lucide-react'
import axios from 'axios'

interface AdminSidebarProps {
  activeTab?: 'orders' | 'messages'
  onTabChange?: (tab: 'orders' | 'messages') => void
}

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { settings } = useStore()
  const { t, isBangla } = useLanguage()
  
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState<'admin' | 'shop_owner' | 'staff'>('shop_owner')
  const [userDisplayName, setUserDisplayName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  // Fetch current user and staff role
  useEffect(() => {
    async function loadUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
          setUserEmail(user.email)
          const cleanEmail = user.email.toLowerCase().trim()
          const metaRole = normalizeStaffRole(user.user_metadata?.role)
          
          const { data: staffMembers } = await supabase
            .from('staff_members')
            .select('*')
            .or(`user_id.eq.${user.id},email.ilike.${cleanEmail}`)
            .limit(1)

          const staffMember = staffMembers && staffMembers.length > 0 ? staffMembers[0] : null

          if (staffMember) {
            setCurrentRole(normalizeStaffRole(staffMember.role || metaRole))
            setUserDisplayName(staffMember.full_name || user.email.split('@')[0])
          } else {
            // Default founder / metadata check
            setUserDisplayName(user.user_metadata?.full_name || user.email.split('@')[0])
            if (cleanEmail === 'sakib.samadhan@gmail.com' || cleanEmail === 'admin@example.com' || cleanEmail.includes('admin') || metaRole === 'shop_owner' || metaRole === 'admin') {
              setCurrentRole(metaRole === 'admin' ? 'admin' : 'shop_owner')
            } else {
              setCurrentRole('staff')
            }
          }
        }
      } catch (err) {
        // silent
      }
    }
    loadUserRole()
  }, [])

  // Fetch unread inquiries count
  useEffect(() => {
    let isMounted = true
    async function checkUnread() {
      try {
        const res = await axios.get('/api/contact')
        if (isMounted && Array.isArray(res.data)) {
          const unread = res.data.filter((m: any) => !m.is_read).length
          setUnreadCount(unread)
        }
      } catch (err) {
        // silent fail
      }
    }
    checkUnread()
    const interval = setInterval(checkUnread, 30000) // check every 30s
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/stradmn/login')
    router.refresh()
  }

  const isDashboard = pathname === '/stradmn'
  const isMessagesActive = isDashboard && (activeTab === 'messages' || searchParams.get('tab') === 'messages')
  const isOrdersActive = isDashboard && !isMessagesActive

  const canSeeFullDashboard = hasFullAccess(currentRole)
  const roleDetails = getRoleDetails(currentRole)

  const allNavItems = [
    {
      name: t('admin.orders'),
      href: '/stradmn',
      icon: ShoppingBag,
      isActive: isOrdersActive,
      visible: true,
      onClick: () => {
        if (isDashboard && onTabChange) {
          onTabChange('orders')
        }
      }
    },
    {
      name: t('admin.analytics'),
      href: '/stradmn/stats',
      icon: BarChart3,
      isActive: pathname === '/stradmn/stats',
      visible: canSeeFullDashboard
    },
    {
      name: t('admin.messages'),
      href: '/stradmn?tab=messages',
      icon: MessageSquare,
      isActive: isMessagesActive,
      badge: unreadCount > 0 ? unreadCount : null,
      visible: true,
      onClick: () => {
        if (isDashboard && onTabChange) {
          onTabChange('messages')
        }
      }
    },
    {
      name: t('admin.products'),
      href: '/stradmn/products',
      icon: Package,
      isActive: pathname === '/stradmn/products',
      visible: true
    },
    {
      name: isBangla ? 'প্রচার ও অফার' : 'Promotions',
      href: '/stradmn/promotions',
      icon: Megaphone,
      isActive: pathname === '/stradmn/promotions',
      visible: canSeeFullDashboard
    },
    {
      name: t('admin.categories'),
      href: '/stradmn/categories',
      icon: FolderTree,
      isActive: pathname === '/stradmn/categories',
      visible: true
    },
    {
      name: t('admin.staff'),
      href: '/stradmn/staff',
      icon: Users,
      isActive: pathname === '/stradmn/staff',
      visible: canSeeFullDashboard
    },
    {
      name: t('admin.settings'),
      href: '/stradmn/settings',
      icon: Settings,
      isActive: pathname === '/stradmn/settings',
      visible: canSeeFullDashboard
    }
  ]

  const navItems = allNavItems.filter((i) => i.visible)

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-slate-400 flex-shrink-0">
        {/* Brand Header */}
        <div className="flex h-16 items-center px-6 border-b border-slate-800 bg-slate-950 gap-3">
          {settings.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={settings.logo_url}
              alt={settings.store_name}
              className="h-8 w-8 rounded-full object-cover border border-slate-700 shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
              {settings.store_name?.charAt(0) || 'S'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-sm font-black tracking-tight text-white truncate block">
              {settings.store_name}
            </span>
            <span className="text-[10px] text-brand-400 font-bold tracking-wider uppercase block">
              Management Portal
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={item.onClick}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition duration-150 ${
                  item.isActive
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge !== null && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black rounded-full bg-red-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}

          <div className="pt-4 mt-4 border-t border-slate-800">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition duration-150"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-4 w-4" />
                <span>{isBangla ? 'স্টোরফ্রন্ট দেখুন' : 'View Storefront'}</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </Link>
          </div>
        </nav>

        {/* Language Switcher in Desktop Admin Sidebar */}
        <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400">Language:</span>
          <LanguageSwitcher size="sm" />
        </div>

        {/* Desktop Footer User Info & Log Out */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-xs font-bold text-slate-200 truncate">
                {userDisplayName || 'Store Team'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                {userEmail}
              </p>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider ${roleDetails.bg} ${roleDetails.text} ${roleDetails.border}`}>
              {roleDetails.label}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-red-950/60 hover:text-red-400 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{t('admin.logout')}</span>
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR WITH DRAWER */}
      <div className="md:hidden w-full bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          {settings.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={settings.logo_url}
              alt=""
              className="h-7 w-7 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
              {settings.store_name?.charAt(0) || 'S'}
            </div>
          )}
          <div className="min-w-0">
            <span className="text-xs font-bold truncate max-w-[140px] block">
              {settings.store_name}
            </span>
            <span className="text-[9px] text-brand-400 font-bold block">
              {roleDetails.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher size="sm" />
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black rounded-full bg-red-500 text-white animate-pulse">
              {unreadCount}
            </span>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-64 h-full bg-slate-900 p-4 space-y-4 flex flex-col justify-between animate-fade-in-right">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-sm font-bold text-white truncate block">{settings.store_name}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black border uppercase tracking-wider mt-1 ${roleDetails.bg} ${roleDetails.text} ${roleDetails.border}`}>
                    {roleDetails.label}
                  </span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-slate-400 p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1 pt-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => {
                        if (item.onClick) item.onClick()
                        setMobileOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                        item.isActive
                          ? 'bg-brand-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge !== undefined && item.badge !== null && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black rounded-full bg-red-500 text-white animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}

                <div className="pt-2 mt-2 border-t border-slate-800">
                  <Link
                    href="/"
                    target="_blank"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>{isBangla ? 'স্টোরফ্রন্ট দেখুন' : 'View Storefront'}</span>
                  </Link>
                </div>
              </nav>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="px-1">
                <p className="text-xs font-bold text-slate-200 truncate">{userDisplayName}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{userEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/60"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('admin.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
