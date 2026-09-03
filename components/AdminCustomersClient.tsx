'use client'

import React, { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import { useLanguage } from '@/context/LanguageContext'
import {
  Users, MessageSquare, Search, Phone, Mail, MapPin,
  ShoppingBag, Calendar, ArrowUpDown, ChevronRight,
  Trash2, CheckCircle2, MessageCircle, ExternalLink,
  Download, Filter, Clock, Eye, AlertCircle, RefreshCw, X
} from 'lucide-react'
import axios from 'axios'

interface Customer {
  id: string
  user_id?: string
  full_name: string
  phone: string
  email: string
  address?: string
  avatar_url?: string
  city_id?: number
  zone_id?: number
  area_id?: number
  created_at: string
  updated_at?: string
}

interface OrderItemSummary {
  id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  total_amount: number
  status: string
  created_at: string
  user_id?: string
}

interface ContactMessage {
  id: string
  name: string
  phone: string
  email?: string
  subject: string
  message: string
  is_read: boolean
  created_at: string
}

interface AdminCustomersClientProps {
  initialCustomers: Customer[]
  initialOrders: OrderItemSummary[]
  initialMessages: ContactMessage[]
}

export default function AdminCustomersClient({
  initialCustomers,
  initialOrders,
  initialMessages
}: AdminCustomersClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t, isBangla } = useLanguage()

  const [activeTab, setActiveTab] = useState<'directory' | 'messages'>(() => {
    return searchParams.get('tab') === 'messages' ? 'messages' : 'directory'
  })

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [orders] = useState<OrderItemSummary[]>(initialOrders)
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [copiedNotification, setCopiedNotification] = useState('')

  const showCopyToast = (text: string) => {
    setCopiedNotification(text)
    setTimeout(() => setCopiedNotification(''), 2500)
  }

  // Calculate customer order stats
  const customerStatsMap = useMemo(() => {
    const stats: Record<string, { orderCount: number; totalSpent: number; orders: OrderItemSummary[] }> = {}

    customers.forEach((c) => {
      const cleanPhone = (c.phone || '').trim().replace(/[^0-9]/g, '')
      const cleanEmail = (c.email || '').trim().toLowerCase()
      const userId = c.user_id || c.id

      const matchingOrders = orders.filter((o) => {
        const orderPhone = (o.customer_phone || '').trim().replace(/[^0-9]/g, '')
        const orderEmail = (o.customer_email || '').trim().toLowerCase()
        const orderUserId = o.user_id

        if (orderUserId && orderUserId === userId) return true
        if (cleanEmail && orderEmail && cleanEmail === orderEmail) return true
        if (cleanPhone && orderPhone && cleanPhone === orderPhone) return true
        return false
      })

      const totalSpent = matchingOrders
        .filter((o) => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

      stats[c.id] = {
        orderCount: matchingOrders.length,
        totalSpent,
        orders: matchingOrders
      }
    })

    return stats
  }, [customers, orders])

  // Aggregate KPI stats
  const totalRegisteredCount = customers.length
  const totalCustomerSpend = Object.values(customerStatsMap).reduce((sum, s) => sum + s.totalSpent, 0)
  const activeBuyersCount = Object.values(customerStatsMap).filter((s) => s.orderCount > 0).length
  const unreadMessageCount = messages.filter((m) => !m.is_read).length

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return customers

    return customers.filter((c) => {
      const name = (c.full_name || '').toLowerCase()
      const phone = (c.phone || '').toLowerCase()
      const email = (c.email || '').toLowerCase()
      const addr = (c.address || '').toLowerCase()
      return name.includes(q) || phone.includes(q) || email.includes(q) || addr.includes(q)
    })
  }, [customers, searchQuery])

  // Filtered messages list
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (messageFilter === 'unread') return !m.is_read
      if (messageFilter === 'read') return m.is_read
      return true
    }).filter((m) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      const name = (m.name || '').toLowerCase()
      const phone = (m.phone || '').toLowerCase()
      const email = (m.email || '').toLowerCase()
      const subj = (m.subject || '').toLowerCase()
      const body = (m.message || '').toLowerCase()
      return name.includes(q) || phone.includes(q) || email.includes(q) || subj.includes(q) || body.includes(q)
    })
  }, [messages, messageFilter, searchQuery])

  // Message Actions
  const handleToggleMessageRead = async (msg: ContactMessage) => {
    const nextRead = !msg.is_read
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: nextRead } : m)))
    try {
      await axios.patch('/api/contact', { id: msg.id, is_read: nextRead })
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: !nextRead } : m)))
      alert('Failed to update message status')
    }
  }

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Are you sure you want to permanently delete this customer inquiry?')) return
    setMessages((prev) => prev.filter((m) => m.id !== msgId))
    try {
      await axios.patch('/api/contact', { id: msgId, action: 'delete' })
    } catch (err) {
      alert('Failed to delete message')
    }
  }

  const reloadMessages = async () => {
    setLoadingMessages(true)
    try {
      const res = await axios.get('/api/contact')
      if (Array.isArray(res.data)) {
        setMessages(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMessages(false)
    }
  }

  // Export phone numbers
  const handleExportPhones = () => {
    const phones = customers
      .map((c) => (c.phone || '').trim())
      .filter((p) => p.length >= 11)

    const uniquePhones = Array.from(new Set(phones))
    navigator.clipboard.writeText(uniquePhones.join(',\n'))
    showCopyToast(`Copied ${uniquePhones.length} customer phone numbers!`)
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Users className="h-4 w-4" />
              <span>{isBangla ? 'গ্রাহক ও বার্তা ব্যবস্থাপনা' : 'Customer Relationship Management'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isBangla ? 'গ্রাহক ও বার্তা' : 'Customers & Messages'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isBangla
                ? 'আপনার স্টোরের নিবন্ধিত গ্রাহকদের তালিকা, অর্ডার ইতিহাস ও ইনকোয়ারি বার্তা।'
                : 'Browse registered accounts, monitor lifetime value, and respond to storefront inquiries.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPhones}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-sm"
              title="Copy all customer phone numbers to clipboard for bulk SMS"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>{isBangla ? 'ফোন নম্বর কপি করুন' : 'Export Numbers'}</span>
            </button>
          </div>
        </div>

        {/* COPY TOAST NOTIFICATION */}
        {copiedNotification && (
          <div className="fixed top-6 right-6 z-50 p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isBangla ? 'মোট নিবন্ধিত গ্রাহক' : 'Total Customers'}
              </span>
              <div className="h-8 w-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {totalRegisteredCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Registered buyer profiles</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isBangla ? 'সক্রিয় ক্রেতা' : 'Active Buyers'}
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {activeBuyersCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Placed 1+ store orders</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isBangla ? 'গ্রাহক মোট বিক্রয়' : 'Customer Lifetime LTV'}
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="text-xs font-black">৳</span>
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              ৳{totalCustomerSpend.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total revenue from accounts</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isBangla ? 'অপঠিত বার্তা' : 'Unread Inquiries'}
              </span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {unreadMessageCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Storefront contact forms</p>
          </div>
        </div>

        {/* TAB BUTTONS & SEARCH BAR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            {/* TABS */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('directory')
                  router.push('/stradmn/customers')
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'directory'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>{isBangla ? 'গ্রাহক ডিরেক্টরি' : 'Customer Directory'} ({customers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('messages')
                  router.push('/stradmn/customers?tab=messages')
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition relative ${
                  activeTab === 'messages'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{isBangla ? 'গ্রাহক বার্তা' : 'Inquiries & Messages'} ({messages.length})</span>
                {unreadMessageCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black">
                    {unreadMessageCount}
                  </span>
                )}
              </button>
            </div>

            {/* SEARCH */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'directory' ? 'Search by name, phone, email...' : 'Search inquiries...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 bg-slate-50"
              />
            </div>
          </div>

          {/* TAB 1: CUSTOMER DIRECTORY */}
          {activeTab === 'directory' && (
            <div>
              {filteredCustomers.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">
                    {searchQuery ? 'No customers matched your search' : 'No registered customers found yet'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Customers who create an account or sign up on your storefront will automatically appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">Customer</th>
                        <th className="px-5 py-3.5">Contact Details</th>
                        <th className="px-5 py-3.5">Location / Address</th>
                        <th className="px-5 py-3.5">Orders Placed</th>
                        <th className="px-5 py-3.5">Total Spent</th>
                        <th className="px-5 py-3.5">Joined Date</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredCustomers.map((cust) => {
                        const stats = customerStatsMap[cust.id] || { orderCount: 0, totalSpent: 0, orders: [] }
                        const cleanPhone = (cust.phone || '').trim().replace(/[^0-9+]/g, '')
                        const waPhone = cleanPhone.startsWith('0') ? `88${cleanPhone}` : cleanPhone.replace(/^\+/, '')

                        return (
                          <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {cust.avatar_url ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={cust.avatar_url}
                                    alt={cust.full_name}
                                    className="h-9 w-9 rounded-full object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="h-9 w-9 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                                    {(cust.full_name || 'C').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold text-slate-900 block text-xs">
                                    {cust.full_name || 'Unnamed Customer'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ID: {cust.id.slice(0, 8)}...
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              <div className="space-y-1">
                                {cust.phone && (
                                  <div className="flex items-center gap-1.5 font-mono text-xs">
                                    <Phone className="h-3 w-3 text-slate-400" />
                                    <span>{cust.phone}</span>
                                    {waPhone && (
                                      <a
                                        href={`https://wa.me/${waPhone}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 hover:text-emerald-700 ml-1"
                                        title="Chat on WhatsApp"
                                      >
                                        <MessageCircle className="h-3.5 w-3.5 inline" />
                                      </a>
                                    )}
                                  </div>
                                )}
                                {cust.email && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                    <Mail className="h-3 w-3 text-slate-400" />
                                    <span>{cust.email}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4 text-slate-600 max-w-[200px]">
                              {cust.address ? (
                                <div className="flex items-start gap-1.5 text-[11px] truncate">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                  <span className="truncate">{cust.address}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Not provided</span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                stats.orderCount > 0 ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {stats.orderCount} order{stats.orderCount === 1 ? '' : 's'}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="font-bold text-slate-900 text-xs">
                                ৳{stats.totalSpent.toLocaleString()}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-slate-500 text-[11px]">
                              {new Date(cust.created_at).toLocaleDateString()}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(cust)
                                  setCustomerModalOpen(true)
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                              >
                                <span>Details</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONTACT INQUIRIES & MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMessageFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      messageFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    All ({messages.length})
                  </button>
                  <button
                    onClick={() => setMessageFilter('unread')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      messageFilter === 'unread' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Unread ({unreadMessageCount})
                  </button>
                  <button
                    onClick={() => setMessageFilter('read')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      messageFilter === 'read' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Read ({messages.length - unreadMessageCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={reloadMessages}
                  disabled={loadingMessages}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 text-xs font-bold transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingMessages ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {filteredMessages.length === 0 ? (
                <div className="py-16 text-center">
                  <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No inquiries found</p>
                  <p className="text-xs text-slate-400 mt-1">Customer inquiries from the Contact Us page will show up here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.map((msg) => {
                    const cleanPhone = (msg.phone || '').trim().replace(/[^0-9+]/g, '')
                    const waPhone = cleanPhone.startsWith('0') ? `88${cleanPhone}` : cleanPhone.replace(/^\+/, '')

                    return (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-2xl border transition space-y-2 ${
                          !msg.is_read
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{msg.name}</span>
                            {!msg.is_read && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase">
                                New
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleMessageRead(msg)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                                msg.is_read
                                  ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                  : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {msg.is_read ? 'Mark Unread' : 'Mark as Read'}
                            </button>

                            {waPhone && (
                              <a
                                href={`https://wa.me/${waPhone}?text=Hi%20${encodeURIComponent(msg.name)},%20regarding%20your%20inquiry:%20`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                                title="Reply on WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            )}

                            {msg.email && (
                              <a
                                href={`mailto:${msg.email}?subject=Re:%20${encodeURIComponent(msg.subject)}`}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                                title="Reply via Email"
                              >
                                <Mail className="h-4 w-4" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                              title="Delete inquiry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          {msg.phone && (
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Phone className="h-3 w-3 text-slate-400" /> {msg.phone}
                            </span>
                          )}
                          {msg.email && (
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Mail className="h-3 w-3 text-slate-400" /> {msg.email}
                            </span>
                          )}
                          {msg.subject && (
                            <span className="font-bold text-slate-700">
                              Subject: {msg.subject}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-800 bg-slate-50/80 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CUSTOMER DETAILS & ORDER HISTORY MODAL */}
        {customerModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  {selectedCustomer.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedCustomer.avatar_url}
                      alt={selectedCustomer.full_name}
                      className="h-10 w-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                      {(selectedCustomer.full_name || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {selectedCustomer.full_name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Member since {new Date(selectedCustomer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCustomerModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Customer Contact & Address Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone</span>
                  <span className="font-mono font-bold text-slate-900">{selectedCustomer.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Email</span>
                  <span className="font-mono text-slate-900">{selectedCustomer.email || 'Not provided'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Delivery Address</span>
                  <span className="text-slate-800">{selectedCustomer.address || 'No address saved yet'}</span>
                </div>
              </div>

              {/* Past Orders by this customer */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-brand-600" />
                  <span>Order History ({(customerStatsMap[selectedCustomer.id]?.orders || []).length})</span>
                </h4>

                {(customerStatsMap[selectedCustomer.id]?.orders || []).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                    This customer has not completed any orders yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(customerStatsMap[selectedCustomer.id]?.orders || []).map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              #{ord.id.slice(0, 8)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-brand-100 text-brand-800'
                            }`}>
                              {ord.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(ord.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="font-bold text-slate-900">
                          ৳{ord.total_amount?.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCustomerModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
