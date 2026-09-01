'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  TrendingUp, Users, DollarSign, Package, CheckCircle2,
  AlertCircle, Clock, Truck, Search, LogOut, ArrowUpRight,
  RefreshCw, Play, Edit2, FileText, ChevronRight, MessageSquare, Trash2, Mail, Phone,
  XCircle, Check, Minus, Plus, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useStore } from '@/context/StoreContext'
import { useLanguage } from '@/context/LanguageContext'
import AdminSidebar from '@/components/AdminSidebar'
import axios from 'axios'

interface OrderItem {
  id: string
  quantity: number
  price: number
  selected_variations?: Record<string, string>
  products?: { name: string }
}

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  shipping_address: string
  shipping_provider?: string | null
  city_id: number
  zone_id: number
  area_id: number
  delivery_charge: number
  total_price: number
  payment_method: string
  payment_status: string
  order_status?: string
  payment_details: any
  pathao_consignment_id: string | null
  pathao_status: string | null
  steadfast_consignment_id?: string | null
  steadfast_tracking_code?: string | null
  created_at: string
  order_items?: OrderItem[]
}

interface ContactMessage {
  id: string
  name: string
  phone: string
  email: string | null
  subject: string | null
  message: string
  is_read: boolean
  created_at: string
}

interface DashboardProps {
  initialOrders: Order[]
}

interface EditableItem {
  id: string
  name: string
  quantity: number
  price: number
  selected_variations?: Record<string, string>
}

export default function AdminDashboardClient({ initialOrders }: DashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { settings } = useStore()
  const { t, toBengaliDigits, isBangla } = useLanguage()
  
  const [activeTab, setActiveTab] = useState<'orders' | 'messages'>(() => {
    return searchParams.get('tab') === 'messages' ? 'messages' : 'orders'
  })
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('tab') === 'messages') {
      setActiveTab('messages')
    } else if (searchParams.get('tab') === 'orders') {
      setActiveTab('orders')
    }
  }, [searchParams])

  // Edit Order Modal States
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editZone, setEditZone] = useState('')
  const [editArea, setEditArea] = useState('')
  const [editDeliveryCharge, setEditDeliveryCharge] = useState(0)
  const [editOrderStatus, setEditOrderStatus] = useState('Pending')
  const [editPaymentStatus, setEditPaymentStatus] = useState('Pending')
  const [editAdvancePaid, setEditAdvancePaid] = useState(0)
  const [editItems, setEditItems] = useState<EditableItem[]>([])
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([])

  const [locationCities, setLocationCities] = useState<any[]>([])
  const [locationZones, setLocationZones] = useState<any[]>([])
  const [locationAreas, setLocationAreas] = useState<any[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Courier Dispatch Confirmation Modal State
  const [dispatchConfirm, setDispatchConfirm] = useState<{
    order: Order
    provider: 'pathao' | 'steadfast' | 'manual'
  } | null>(null)

  // Delete Order Confirmation Modal State
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Column Sorting State
  const [sortField, setSortField] = useState<'date' | 'customer' | 'status' | 'payment' | 'amount' | 'courier'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Fetch Contact Messages
  const loadMessages = async () => {
    setLoadingMessages(true)
    try {
      const res = await axios.get('/api/contact')
      if (Array.isArray(res.data)) {
        setMessages(res.data)
      }
    } catch (err) {
      console.error('Failed to load contact messages', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  // Fetch Cities on Mount for editing
  useEffect(() => {
    async function loadCities() {
      try {
        const response = await fetch('/api/pathao?action=cities')
        const data = await response.json()
        if (Array.isArray(data)) setLocationCities(data)
      } catch (err) {
        console.error('Failed to load cities', err)
      }
    }
    loadCities()
  }, [])

  // Fetch Zones when editCity changes
  useEffect(() => {
    if (!editCity) {
      setLocationZones([])
      setLocationAreas([])
      return
    }
    if (editingOrder && String(editingOrder.city_id) === String(editCity) && locationZones.length > 0) {
      return
    }

    async function loadZones() {
      setLoadingLocations(true)
      try {
        const response = await fetch(`/api/pathao?city_id=${editCity}`)
        const data = await response.json()
        if (Array.isArray(data)) setLocationZones(data)
      } catch (err) {
        console.error('Failed to load zones', err)
      } finally {
        setLoadingLocations(false)
      }
    }
    loadZones()
  }, [editCity, editingOrder, locationZones.length])

  // Fetch Areas when editZone changes
  useEffect(() => {
    if (!editZone) {
      setLocationAreas([])
      return
    }
    if (editingOrder && String(editingOrder.zone_id) === String(editZone) && locationAreas.length > 0) {
      return
    }

    async function loadAreas() {
      setLoadingLocations(true)
      try {
        const response = await fetch(`/api/pathao?zone_id=${editZone}`)
        const data = await response.json()
        if (Array.isArray(data)) setLocationAreas(data)
      } catch (err) {
        console.error('Failed to load areas', err)
      } finally {
        setLoadingLocations(false)
      }
    }
    loadAreas()
  }, [editZone, editingOrder, locationAreas.length])

  // Open Full Order Edit Modal
  const openEditModal = async (order: Order) => {
    setEditingOrder(order)
    setEditName(order.customer_name)
    setEditPhone(order.customer_phone)
    setEditEmail(order.customer_email || '')
    setEditAddress(order.shipping_address)
    setEditCity(order.city_id ? String(order.city_id) : '')
    setEditZone(order.zone_id ? String(order.zone_id) : '')
    setEditArea(order.area_id ? String(order.area_id) : '')
    setEditDeliveryCharge(Number(order.delivery_charge || 0))
    setEditOrderStatus(order.order_status || 'Pending')
    setEditPaymentStatus(order.payment_status || 'Pending')
    
    // Set initial advance paid
    const initialAdvance = order.payment_details?.advance_paid !== undefined
      ? Number(order.payment_details.advance_paid)
      : order.payment_status === 'FullyPaid'
        ? Number(order.total_price)
        : order.payment_status === 'DeliveryChargePrePaid'
          ? Number(order.delivery_charge)
          : 0
    setEditAdvancePaid(initialAdvance)
    setDeletedItemIds([])

    // Populate editable items
    const itemsList: EditableItem[] = (order.order_items || []).map((it) => ({
      id: it.id,
      name: it.products?.name || 'Product Item',
      quantity: it.quantity,
      price: Number(it.price),
      selected_variations: it.selected_variations
    }))
    setEditItems(itemsList)

    if (order.city_id) {
      try {
        const resZones = await fetch(`/api/pathao?city_id=${order.city_id}`)
        const dataZones = await resZones.json()
        if (Array.isArray(dataZones)) setLocationZones(dataZones)
      } catch (e) {
        console.error(e)
      }
    }

    if (order.zone_id) {
      try {
        const resAreas = await fetch(`/api/pathao?zone_id=${order.zone_id}`)
        const dataAreas = await resAreas.json()
        if (Array.isArray(dataAreas)) setLocationAreas(dataAreas)
      } catch (e) {
        console.error(e)
      }
    }
  }

  // Handle Item Quantity Stepper in Edit Modal
  const handleItemQtyChange = (index: number, delta: number) => {
    setEditItems((prev) => {
      const next = [...prev]
      const currentQty = next[index].quantity || 1
      const updatedQty = Math.max(1, currentQty + delta)
      next[index] = { ...next[index], quantity: updatedQty }
      return next
    })
  }

  // Handle Item Removal in Edit Modal
  const handleRemoveItem = (index: number) => {
    const itemToRemove = editItems[index]
    if (itemToRemove?.id) {
      setDeletedItemIds((prev) => [...prev, itemToRemove.id])
    }
    setEditItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Save Order Changes
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOrder) return
    setSaveLoading(true)

    try {
      const cityName = locationCities.find((c) => String(c.city_id) === String(editCity))?.city_name || ''
      const zoneName = locationZones.find((z) => String(z.zone_id) === String(editZone))?.zone_name || ''
      const areaName = locationAreas.find((a) => String(a.area_id) === String(editArea))?.area_name || ''

      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingOrder.id,
          customer_name: editName,
          customer_phone: editPhone,
          customer_email: editEmail || null,
          shipping_address: editAddress,
          city_id: Number(editCity || 0),
          zone_id: Number(editZone || 0),
          area_id: Number(editArea || 0),
          city_name: cityName,
          zone_name: zoneName,
          area_name: areaName,
          delivery_charge: editDeliveryCharge,
          order_status: editOrderStatus,
          payment_status: editPaymentStatus,
          advance_paid: editAdvancePaid,
          items: editItems.map((it) => ({
            id: it.id,
            quantity: it.quantity,
            price: it.price
          })),
          deleted_item_ids: deletedItemIds
        })
      })

      const resJson = await response.json()
      if (!response.ok) {
        throw new Error(resJson.error || 'Failed to update order details.')
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === editingOrder.id ? resJson.data : o))
      )
      setEditingOrder(null)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error saving order changes.')
    } finally {
      setSaveLoading(false)
    }
  }

  // Quick Order Status Change (e.g. Accept / Decline)
  const handleQuickStatusChange = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId)
    try {
      const targetOrder = orders.find((o) => o.id === orderId)
      if (!targetOrder) return

      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          customer_name: targetOrder.customer_name,
          customer_phone: targetOrder.customer_phone,
          shipping_address: targetOrder.shipping_address,
          order_status: newStatus
        })
      })

      const resJson = await response.json()
      if (resJson.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o))
        )
      } else {
        alert(resJson.error || 'Failed to update status')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating order status')
    } finally {
      setActionLoading(null)
    }
  }

  // Toggle Message Read Status
  const handleToggleMessageRead = async (msg: ContactMessage) => {
    const nextRead = !msg.is_read
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: nextRead } : m))

    try {
      await axios.patch('/api/contact', { id: msg.id, is_read: nextRead })
    } catch (err) {
      console.error('Failed to update message status', err)
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: !nextRead } : m))
    }
  }

  // Delete Message
  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return
    setMessages((prev) => prev.filter((m) => m.id !== msgId))

    try {
      await axios.patch('/api/contact', { id: msgId, action: 'delete' })
    } catch (err) {
      console.error('Failed to delete message', err)
      loadMessages()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/stradmn/login')
    router.refresh()
  }

  // Live Courier Status Sync
  const [syncingCourier, setSyncingCourier] = useState<string | null>(null) // 'bulk' or orderId
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const handleSyncCourierStatus = async (orderId?: string) => {
    setSyncingCourier(orderId || 'bulk')
    setSyncMessage(null)

    try {
      const payload = orderId ? { order_id: orderId } : { bulk: true }
      const res = await axios.post('/api/admin/courier-sync', payload)

      if (res.data?.success) {
        const results = res.data.results as any[]
        if (results && results.length > 0) {
          // Update orders state with any modified order statuses
          setOrders((prev) =>
            prev.map((ord) => {
              const matched = results.find((r: any) => r.order_id === ord.id)
              if (matched && matched.new_order_status) {
                return { ...ord, order_status: matched.new_order_status }
              }
              return ord
            })
          )

          const firstResult = results[0]
          if (orderId) {
            setSyncMessage(
              firstResult.error 
                ? `Courier Note: ${firstResult.error}` 
                : `Live Courier Status: ${firstResult.raw_status ? firstResult.raw_status.toUpperCase() : 'Active'} → Order marked as ${firstResult.new_order_status}`
            )
          } else {
            const updatedCount = results.filter((r: any) => r.status_changed).length
            setSyncMessage(`Synced ${results.length} order(s). ${updatedCount} status(es) automatically updated!`)
          }
          setTimeout(() => setSyncMessage(null), 6000)
        } else {
          setSyncMessage(res.data.message || 'No booked orders found to sync.')
          setTimeout(() => setSyncMessage(null), 4000)
        }
      } else {
        alert(res.data?.error || 'Failed to sync courier status')
      }
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.error || err.message || 'Error checking courier status')
    } finally {
      setSyncingCourier(null)
    }
  }

  // Calculate statistics
  const paidOrders = orders.filter(
    (o) => o.payment_status === 'FullyPaid' || o.payment_status === 'DeliveryChargePrePaid'
  )

  const totalSalesCount = paidOrders.length
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_price), 0)
  
  // Pending orders count for badge
  const pendingOrdersCount = orders.filter((o) => (o.order_status || 'Pending') === 'Pending').length

  // Filter orders by search query
  const filteredOrders = orders.filter((o) => {
    const query = searchQuery.toLowerCase()
    return (
      o.id.toLowerCase().includes(query) ||
      o.customer_name.toLowerCase().includes(query) ||
      o.customer_phone.includes(query) ||
      o.shipping_address.toLowerCase().includes(query) ||
      (o.order_status || 'Pending').toLowerCase().includes(query)
    )
  })

  // Toggle sorting column
  const handleSort = (field: 'date' | 'customer' | 'status' | 'payment' | 'amount' | 'courier') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Sorted list
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let cmp = 0
    if (sortField === 'date') {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (sortField === 'customer') {
      cmp = a.customer_name.localeCompare(b.customer_name)
    } else if (sortField === 'status') {
      cmp = (a.order_status || 'Pending').localeCompare(b.order_status || 'Pending')
    } else if (sortField === 'payment') {
      cmp = (a.payment_status || 'Pending').localeCompare(b.payment_status || 'Pending')
    } else if (sortField === 'amount') {
      cmp = Number(a.total_price) - Number(b.total_price)
    } else if (sortField === 'courier') {
      const courierA = a.steadfast_consignment_id || a.pathao_consignment_id || a.shipping_provider || ''
      const courierB = b.steadfast_consignment_id || b.pathao_consignment_id || b.shipping_provider || ''
      cmp = courierA.localeCompare(courierB)
    }
    return sortDirection === 'asc' ? cmp : -cmp
  })

  // Delete Order Handler
  const handleDeleteOrder = async (orderId: string) => {
    setDeleteLoading(true)
    try {
      const res = await axios.delete(`/api/admin/orders?id=${orderId}`)
      if (res.data?.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
        setDeleteConfirmOrder(null)
      } else {
        alert(res.data?.error || 'Failed to delete order')
      }
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to delete order')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Courier consignment trigger with confirmation
  const handleExecuteDispatch = async (orderId: string, provider: 'pathao' | 'steadfast' | 'manual') => {
    setActionLoading(orderId)
    try {
      const response = await fetch('/api/admin/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, provider })
      })
      const data = await response.json()
      
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === orderId) {
              if (data.provider === 'steadfast') {
                return {
                  ...o,
                  shipping_provider: 'steadfast',
                  steadfast_consignment_id: data.consignment_id,
                  steadfast_tracking_code: data.tracking_code,
                  pathao_status: 'dispatched',
                  order_status: 'Shipped'
                }
              } else if (data.provider === 'manual') {
                return {
                  ...o,
                  shipping_provider: 'manual',
                  pathao_status: 'dispatched',
                  order_status: 'Shipped'
                }
              }
              return {
                ...o,
                shipping_provider: 'pathao',
                pathao_consignment_id: data.consignment_id,
                pathao_status: 'dispatched',
                order_status: 'Shipped'
              }
            }
            return o
          })
        )
        setDispatchConfirm(null)
      } else {
        alert(data.error || 'Courier booking failed.')
      }
    } catch (err) {
      console.error(err)
      alert('Error triggering courier dispatch.')
    } finally {
      setActionLoading(null)
    }
  }

  // Live Calculations in Edit Modal
  const modalSubtotal = editItems.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0)
  const modalTotalPrice = modalSubtotal + editDeliveryCharge
  const modalAdvancePaid = editAdvancePaid
  const modalDueOnDelivery = Math.max(0, modalTotalPrice - editAdvancePaid)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100 text-slate-800">
      
      {/* UNIFIED SIDEBAR NAVIGATION */}
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
              {activeTab === 'orders' 
                ? (isBangla ? 'অর্ডার ও ডেলিভারি ব্যবস্থাপনা' : 'Orders & Fulfillment') 
                : (isBangla ? 'গ্রাহক বার্তা ও জিজ্ঞাসা' : 'Customer Messages')}
            </h1>
            {activeTab === 'orders' && pendingOrdersCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-amber-500 text-white animate-pulse">
                {isBangla ? `${toBengaliDigits(pendingOrdersCount)} নতুন` : `${pendingOrdersCount} New`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 border border-slate-200 hover:border-brand-200 px-3 py-1.5 rounded-lg bg-white shadow-sm transition"
            >
              <span>{isBangla ? 'স্টোরফ্রন্ট দেখুন' : 'View Storefront'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 border border-red-100 hover:border-red-200 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden xs:inline sm:inline">{t('admin.logout')}</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
          
          {/* Access Restricted Notice */}
          {searchParams.get('notice') === 'access_restricted' && (
            <div className="flex items-center gap-2 p-3.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold animate-fadeIn">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>{isBangla ? 'অনুমতি নেই: আর্থিক পরিসংখ্যান, স্টোর সেটিংস ও কর্মী ব্যবস্থাপনা কেবল অ্যাডমিন এবং ওনারদের জন্য উন্মুক্ত।' : 'Access Restricted: Financial statistics, store settings, and staff management are only accessible to Admins and Shop Owners.'}</span>
            </div>
          )}

          {/* TAB 1: ORDERS & STATS */}
          {activeTab === 'orders' && (
            <>
              {/* Stat Metric Cards (2x2 on Mobile, 4x1 on Desktop) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
                
                <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">{isBangla ? 'পেইড সেলস' : 'Paid Sales'}</p>
                    <p className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1">{isBangla ? toBengaliDigits(totalSalesCount) : totalSalesCount}</p>
                  </div>
                  <div className="rounded-xl bg-brand-50 p-2 sm:p-3 text-brand-600">
                    <Package className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">{isBangla ? 'মোট আয়' : 'Total Revenue'}</p>
                    <p className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1">৳{isBangla ? toBengaliDigits(totalRevenue.toLocaleString()) : totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-2 sm:p-3 text-emerald-600">
                    <DollarSign className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">{isBangla ? 'মোট অর্ডার' : 'Total Orders'}</p>
                    <p className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1">{isBangla ? toBengaliDigits(orders.length) : orders.length}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-2 sm:p-3 text-blue-600">
                    <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">{isBangla ? 'পেন্ডিং অর্ডার' : 'Pending Review'}</p>
                    <p className="text-lg sm:text-2xl font-black text-amber-600 mt-0.5 sm:mt-1">{isBangla ? toBengaliDigits(pendingOrdersCount) : pendingOrdersCount}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-2 sm:p-3 text-amber-600">
                    <Clock className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                </div>

              </div>

              {/* Orders Table Container */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-2 sm:space-y-4">
                
                {/* Search & Actions Bar */}
                <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={isBangla ? 'আইডি, নাম, ফোন বা স্ট্যাটাস দিয়ে খুঁজুন...' : 'Search by ID, name, phone, status...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {(settings.steadfast_enabled || settings.pathao_enabled) && (
                      <button
                        type="button"
                        onClick={() => handleSyncCourierStatus()}
                        disabled={syncingCourier === 'bulk'}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-50 border border-slate-200/80"
                        title={isBangla ? 'কুরিয়ার এপিআই থেকে ডেলিভারি তথ্য সিঙ্ক করুন' : 'Check live delivery & return statuses from Steadfast & Pathao APIs'}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${syncingCourier === 'bulk' ? 'animate-spin text-brand-600' : 'text-slate-500'}`} />
                        <span>{syncingCourier === 'bulk' ? (isBangla ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (isBangla ? 'কুরিয়ার সিঙ্ক' : 'Sync Couriers')}</span>
                      </button>
                    )}

                    <span className="text-xs font-bold text-slate-500">
                      {isBangla 
                        ? `${toBengaliDigits(orders.length)} টির মধ্যে ${toBengaliDigits(sortedOrders.length)} টি অর্ডার` 
                        : `Showing ${sortedOrders.length} of ${orders.length} orders`}
                    </span>
                  </div>
                </div>

                {/* Live Sync Notification Banner */}
                {syncMessage && (
                  <div className="mx-3.5 sm:mx-4 p-3 bg-brand-50 border border-brand-200 text-brand-900 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn shadow-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-600 flex-shrink-0" />
                      <span>{syncMessage}</span>
                    </div>
                    <button onClick={() => setSyncMessage(null)} className="text-brand-400 hover:text-brand-700 p-0.5 rounded">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* 1. MOBILE RESPONSIVE ORDER CARDS (Phone View) */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {sortedOrders.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No orders found matching your search.
                    </div>
                  ) : (
                    sortedOrders.map((order) => {
                      const isCod = order.payment_method === 'COD'
                      const codProductAmount = isCod ? Number(order.total_price) - Number(order.delivery_charge) : 0
                      const provider = order.shipping_provider || 'pathao'
                      const hasConsignment = order.pathao_consignment_id || order.steadfast_consignment_id
                      const currentStatus = order.order_status || 'Pending'
                      const isDispatched = currentStatus === 'Shipped' || currentStatus === 'Delivered' || currentStatus === 'Completed' || order.pathao_status === 'dispatched' || hasConsignment
                      const isFullyPaid = order.payment_status === 'FullyPaid' || (order.payment_details?.advance_paid !== undefined && Number(order.payment_details.advance_paid) >= Number(order.total_price) && Number(order.total_price) > 0)
                      const isPartiallyPaid = !isFullyPaid && (order.payment_status === 'DeliveryChargePrePaid' || (order.payment_details?.advance_paid !== undefined && Number(order.payment_details.advance_paid) > 0))

                      return (
                        <div key={order.id} className="p-3.5 space-y-2.5 bg-white hover:bg-slate-50/50 transition">
                          {/* Row 1: ID, Date, Order Status Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="font-mono font-black text-slate-900 text-xs">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              currentStatus === 'Confirmed'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : currentStatus === 'Shipped'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : currentStatus === 'Delivered' || currentStatus === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : currentStatus === 'Cancelled'
                                      ? 'bg-red-50 text-red-700 border border-red-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {currentStatus}
                            </span>
                          </div>

                          {/* Row 2: Customer Name, 1-Tap Call Phone, Address */}
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-slate-900 text-xs">{order.customer_name}</p>
                              <a
                                href={`tel:${order.customer_phone}`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition"
                              >
                                <Phone className="h-3 w-3" />
                                <span>{order.customer_phone}</span>
                              </a>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">
                              {order.shipping_address}
                            </p>
                            {order.payment_details?.shipping_metadata?.city_name && (
                              <p className="text-[10px] text-slate-400 font-semibold">
                                {order.payment_details.shipping_metadata.area_name ? `${order.payment_details.shipping_metadata.area_name}, ` : ''}
                                {order.payment_details.shipping_metadata.city_name}
                              </p>
                            )}
                          </div>

                          {/* Row 3: Items Ordered & Financials */}
                          <div className="flex items-start justify-between gap-3 text-xs">
                            <div className="space-y-0.5 max-w-[55%]">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Items:</span>
                              {(order.order_items || []).map((it, idx) => (
                                <p key={idx} className="text-[11px] text-slate-700 line-clamp-1 font-medium">
                                  {it.quantity}x {it.products?.name || 'Item'}
                                </p>
                              ))}
                            </div>

                            <div className="text-right space-y-0.5">
                              <p className="text-sm font-black text-slate-950">৳{Number(order.total_price).toLocaleString()}</p>
                              <div className="flex items-center justify-end gap-1">
                                <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                  isFullyPaid
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : isPartiallyPaid
                                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                      : order.payment_status === 'Failed'
                                        ? 'bg-red-50 text-red-700 border border-red-100'
                                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {isFullyPaid && 'Fully Paid'}
                                  {isPartiallyPaid && 'Partially Paid'}
                                  {!isFullyPaid && !isPartiallyPaid && order.payment_status === 'Failed' && 'Failed'}
                                  {!isFullyPaid && !isPartiallyPaid && order.payment_status !== 'Failed' && 'Pending'}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">
                                  {order.payment_method}
                                </span>
                              </div>
                              {isCod && (
                                <p className="text-[10px] text-amber-700 font-bold">
                                  Due on Delivery: ৳{codProductAmount.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Row 4: Courier Booking Status */}
                          {hasConsignment ? (
                            <div className="p-2 rounded-lg bg-brand-50 border border-brand-200 text-xs flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-brand-800 font-bold text-[11px]">
                                <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
                                <span>{provider === 'steadfast' ? 'Steadfast Booked' : 'Pathao Booked'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-brand-700 font-bold">
                                  #{order.steadfast_consignment_id || order.pathao_consignment_id}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleSyncCourierStatus(order.id)}
                                  disabled={syncingCourier === order.id}
                                  className="p-1 rounded hover:bg-brand-200/60 text-brand-700 transition"
                                  title="Refresh Live Courier Status"
                                >
                                  <RefreshCw className={`h-3 w-3 ${syncingCourier === order.id ? 'animate-spin text-brand-700' : ''}`} />
                                </button>
                              </div>
                            </div>
                          ) : isDispatched ? (
                            <div className="p-2 rounded-lg bg-slate-100 text-xs flex items-center gap-1.5 text-slate-700 font-bold text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Marked as Dispatched</span>
                            </div>
                          ) : null}

                          {/* Row 5: Action Buttons (Large Comfort Targets) */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                            {/* Quick Accept/Decline (for Pending) */}
                            {currentStatus === 'Pending' ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleQuickStatusChange(order.id, 'Confirmed')}
                                  disabled={actionLoading === order.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => handleQuickStatusChange(order.id, 'Cancelled')}
                                  disabled={actionLoading === order.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Decline</span>
                                </button>
                              </div>
                            ) : !hasConsignment && !isDispatched ? (
                              <div className="flex flex-wrap gap-1.5">
                                {settings.pathao_enabled && (
                                  <button
                                    onClick={() => setDispatchConfirm({ order, provider: 'pathao' })}
                                    disabled={actionLoading === order.id}
                                    className="inline-flex items-center gap-1 rounded-lg bg-[#CF0012] hover:bg-[#b0000f] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
                                  >
                                    <Play className="h-3 w-3" />
                                    <span>Pathao</span>
                                  </button>
                                )}
                                {settings.steadfast_enabled && (
                                  <button
                                    onClick={() => setDispatchConfirm({ order, provider: 'steadfast' })}
                                    disabled={actionLoading === order.id}
                                    className="inline-flex items-center gap-1 rounded-lg bg-[#04A285] hover:bg-[#038b72] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
                                  >
                                    <Play className="h-3 w-3" />
                                    <span>Steadfast</span>
                                  </button>
                                )}
                                {!settings.pathao_enabled && !settings.steadfast_enabled && (
                                  <button
                                    onClick={() => setDispatchConfirm({ order, provider: 'manual' })}
                                    disabled={actionLoading === order.id}
                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Dispatch</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div />
                            )}

                            {/* Secondary Tools: Edit, Invoice, Delete */}
                            <div className="flex items-center gap-1.5 ml-auto">
                              <button
                                onClick={() => openEditModal(order)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold shadow-sm hover:bg-slate-50"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                                <span>Edit</span>
                              </button>
                              <a
                                href={`/invoice/${order.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-200 bg-brand-50 text-brand-700 text-xs font-bold shadow-sm"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Invoice</span>
                              </a>
                              <button
                                onClick={() => setDeleteConfirmOrder(order)}
                                className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 shadow-sm"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* 2. DESKTOP RICH DATA TABLE */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-4">
                          <button
                            onClick={() => handleSort('date')}
                            className="inline-flex items-center gap-1.5 hover:text-slate-900 font-bold uppercase transition"
                          >
                            <span>Order ID & Date</span>
                            {sortField === 'date' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-brand-600" /> : <ArrowDown className="h-3 w-3 text-brand-600" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                            )}
                          </button>
                        </th>
                        <th className="p-4">
                          <button
                            onClick={() => handleSort('customer')}
                            className="inline-flex items-center gap-1.5 hover:text-slate-900 font-bold uppercase transition"
                          >
                            <span>Customer</span>
                            {sortField === 'customer' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-brand-600" /> : <ArrowDown className="h-3 w-3 text-brand-600" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                            )}
                          </button>
                        </th>
                        <th className="p-4">Destination</th>
                        <th className="p-4">
                          <button
                            onClick={() => handleSort('status')}
                            className="inline-flex items-center gap-1.5 hover:text-slate-900 font-bold uppercase transition"
                          >
                            <span>Status</span>
                            {sortField === 'status' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-brand-600" /> : <ArrowDown className="h-3 w-3 text-brand-600" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                            )}
                          </button>
                        </th>
                        <th className="p-4">
                          <button
                            onClick={() => handleSort('payment')}
                            className="inline-flex items-center gap-1.5 hover:text-slate-900 font-bold uppercase transition"
                          >
                            <span>Payment</span>
                            {sortField === 'payment' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-brand-600" /> : <ArrowDown className="h-3 w-3 text-brand-600" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                            )}
                          </button>
                        </th>
                        <th className="p-4">
                          <button
                            onClick={() => handleSort('amount')}
                            className="inline-flex items-center gap-1.5 hover:text-slate-900 font-bold uppercase transition"
                          >
                            <span>Total & Dues</span>
                            {sortField === 'amount' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-brand-600" /> : <ArrowDown className="h-3 w-3 text-brand-600" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                            )}
                          </button>
                        </th>
                        <th className="p-4">
                          <button
                            onClick={() => handleSort('courier')}
                            className="inline-flex items-center gap-1.5 hover:text-slate-900 font-bold uppercase transition"
                          >
                            <span>Courier</span>
                            {sortField === 'courier' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-brand-600" /> : <ArrowDown className="h-3 w-3 text-brand-600" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                            )}
                          </button>
                        </th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            No orders found matching your search.
                          </td>
                        </tr>
                      ) : (
                        sortedOrders.map((order) => {
                          const isCod = order.payment_method === 'COD'
                          const codProductAmount = isCod ? Number(order.total_price) - Number(order.delivery_charge) : 0
                          const provider = order.shipping_provider || 'pathao'
                          const hasConsignment = order.pathao_consignment_id || order.steadfast_consignment_id
                          const currentStatus = order.order_status || 'Pending'
                          const isDispatched = currentStatus === 'Shipped' || currentStatus === 'Delivered' || currentStatus === 'Completed' || order.pathao_status === 'dispatched' || hasConsignment

                          const isFullyPaid = order.payment_status === 'FullyPaid' || (order.payment_details?.advance_paid !== undefined && Number(order.payment_details.advance_paid) >= Number(order.total_price) && Number(order.total_price) > 0)
                          const isPartiallyPaid = !isFullyPaid && (order.payment_status === 'DeliveryChargePrePaid' || (order.payment_details?.advance_paid !== undefined && Number(order.payment_details.advance_paid) > 0))

                          return (
                            <tr key={order.id} className="hover:bg-slate-50/50">
                              
                              {/* ID & Date */}
                              <td className="p-4">
                                <span className="font-mono font-bold text-slate-900">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span className="block text-[10px] text-slate-400 mt-0.5">
                                  {new Date(order.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </td>

                              {/* Customer */}
                              <td className="p-4">
                                <p className="font-bold text-slate-900">{order.customer_name}</p>
                                <p className="text-slate-500 font-mono text-[11px] mt-0.5">{order.customer_phone}</p>
                              </td>

                              {/* Destination */}
                              <td className="p-4 max-w-xs">
                                <p className="text-slate-700 leading-tight line-clamp-2">{order.shipping_address}</p>
                                {order.payment_details?.shipping_metadata?.area_name && (
                                  <span className="text-[10px] font-semibold text-slate-400 block mt-1">
                                    {order.payment_details.shipping_metadata.area_name}, {order.payment_details.shipping_metadata.city_name}
                                  </span>
                                )}
                              </td>

                              {/* Order Status & Quick Actions */}
                              <td className="p-4 space-y-1.5">
                                <div>
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                                    currentStatus === 'Confirmed'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : currentStatus === 'Shipped'
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                        : currentStatus === 'Delivered' || currentStatus === 'Completed'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : currentStatus === 'Cancelled'
                                            ? 'bg-red-50 text-red-700 border border-red-200'
                                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}>
                                    {currentStatus}
                                  </span>
                                </div>

                                {currentStatus === 'Pending' && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleQuickStatusChange(order.id, 'Confirmed')}
                                      disabled={actionLoading === order.id}
                                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold shadow-sm transition"
                                      title="Accept Order"
                                    >
                                      <Check className="h-3 w-3" />
                                      <span>Accept</span>
                                    </button>
                                    <button
                                      onClick={() => handleQuickStatusChange(order.id, 'Cancelled')}
                                      disabled={actionLoading === order.id}
                                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold transition"
                                      title="Decline Order"
                                    >
                                      <XCircle className="h-3 w-3" />
                                      <span>Decline</span>
                                    </button>
                                  </div>
                                )}
                              </td>

                              {/* Payment status */}
                              <td className="p-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  isFullyPaid
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : isPartiallyPaid
                                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                      : order.payment_status === 'Failed'
                                        ? 'bg-red-50 text-red-700 border border-red-100'
                                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {isFullyPaid && 'Fully Paid'}
                                  {isPartiallyPaid && 'Partially Paid'}
                                  {!isFullyPaid && !isPartiallyPaid && order.payment_status === 'Failed' && 'Failed'}
                                  {!isFullyPaid && !isPartiallyPaid && order.payment_status !== 'Failed' && 'Pending'}
                                </span>
                                <span className="block text-[10px] text-slate-400 uppercase font-semibold mt-1">
                                  {order.payment_method}
                                </span>
                              </td>

                              {/* Pricing */}
                              <td className="p-4 space-y-0.5 font-medium">
                                <p className="text-slate-900 font-bold">৳{Number(order.total_price).toLocaleString()}</p>
                                {isCod && (
                                  <p className="text-[10px] text-amber-600 font-bold">
                                    COD: ৳{codProductAmount.toLocaleString()}
                                  </p>
                                )}
                              </td>

                              {/* Courier Consignment & Booking */}
                              <td className="p-4">
                                {hasConsignment ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                                        <CheckCircle2 className="h-3 w-3" />
                                        {provider === 'steadfast' ? 'Steadfast' : 'Pathao'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleSyncCourierStatus(order.id)}
                                        disabled={syncingCourier === order.id}
                                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition"
                                        title="Refresh live courier status"
                                      >
                                        <RefreshCw className={`h-3 w-3 ${syncingCourier === order.id ? 'animate-spin text-brand-600' : ''}`} />
                                      </button>
                                    </div>
                                    <span className="block font-mono text-[10px] text-slate-500 font-bold">
                                      ID: {order.steadfast_consignment_id || order.pathao_consignment_id}
                                    </span>
                                    {order.steadfast_tracking_code && (
                                      <span className="block font-mono text-[10px] text-blue-600">
                                        Track: {order.steadfast_tracking_code}
                                      </span>
                                    )}
                                  </div>
                                ) : isDispatched ? (
                                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    Dispatched
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5 items-center">
                                    {settings.pathao_enabled && (
                                      <button
                                        onClick={() => setDispatchConfirm({ order, provider: 'pathao' })}
                                        disabled={actionLoading === order.id}
                                        className="inline-flex items-center gap-1 rounded bg-[#CF0012] hover:bg-[#b0000f] px-2.5 py-1 text-[10px] font-bold text-white disabled:bg-slate-300 shadow-sm transition"
                                        title="Book Pathao Aladdin Parcel"
                                      >
                                        <Play className="h-3 w-3" />
                                        <span>{actionLoading === order.id ? 'Booking...' : 'Pathao'}</span>
                                      </button>
                                    )}
                                    {settings.steadfast_enabled && (
                                      <button
                                        onClick={() => setDispatchConfirm({ order, provider: 'steadfast' })}
                                        disabled={actionLoading === order.id}
                                        className="inline-flex items-center gap-1 rounded bg-[#04A285] hover:bg-[#038b72] px-2.5 py-1 text-[10px] font-bold text-white disabled:bg-slate-300 shadow-sm transition"
                                        title="Book Steadfast Courier Parcel"
                                      >
                                        <Play className="h-3 w-3" />
                                        <span>{actionLoading === order.id ? 'Booking...' : 'Steadfast'}</span>
                                      </button>
                                    )}
                                    {!settings.pathao_enabled && !settings.steadfast_enabled && (
                                      <button
                                        onClick={() => setDispatchConfirm({ order, provider: 'manual' })}
                                        disabled={actionLoading === order.id}
                                        className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[10px] font-bold text-white disabled:bg-slate-300 shadow-sm transition"
                                        title="Mark order as dispatched manually"
                                      >
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Mark Dispatched</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Action Buttons */}
                              <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => openEditModal(order)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-sm text-xs font-semibold transition"
                                  title="Edit Full Order Details"
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Edit</span>
                                </button>
                                <a
                                  href={`/invoice/${order.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 hover:border-brand-300 shadow-sm text-xs font-bold transition"
                                  title="Open Printable Customer Invoice"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>Invoice</span>
                                </a>
                                <button
                                  onClick={() => setDeleteConfirmOrder(order)}
                                  className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 shadow-sm text-xs font-semibold transition"
                                  title="Delete Order"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>

                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: CONTACT MESSAGES */}
          {activeTab === 'messages' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-950">Customer Contact Inquiries</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Messages submitted by customers from the storefront Contact Us page.
                  </p>
                </div>
                <button
                  onClick={loadMessages}
                  className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingMessages ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">No Contact Messages</p>
                  <p className="text-xs">When customers submit inquiries via `/contact`, they will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-6 transition ${
                        !msg.is_read ? 'bg-amber-50/40 border-l-4 border-amber-500' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-950 text-sm">{msg.name}</span>
                          {!msg.is_read && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                              UNREAD
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3" />
                            {new Date(msg.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleMessageRead(msg)}
                            className="text-xs font-bold text-slate-600 hover:text-brand-600 border border-slate-200 px-2.5 py-1 rounded-lg bg-white shadow-sm transition"
                          >
                            {msg.is_read ? 'Mark as Unread' : 'Mark as Read'}
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition"
                            title="Delete Message"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Contact Info Pills */}
                      <div className="flex flex-wrap gap-4 py-2 text-xs">
                        <a 
                          href={`tel:${msg.phone}`}
                          className="flex items-center gap-1 text-brand-600 font-bold hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>{msg.phone}</span>
                        </a>
                        {msg.email && (
                          <a 
                            href={`mailto:${msg.email}`}
                            className="flex items-center gap-1 text-slate-600 hover:underline"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            <span>{msg.email}</span>
                          </a>
                        )}
                        {msg.subject && (
                          <span className="text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            Subject: {msg.subject}
                          </span>
                        )}
                      </div>

                      {/* Message Content */}
                      <p className="mt-2 text-xs leading-relaxed text-slate-800 bg-white p-3.5 rounded-xl border border-slate-200/80 whitespace-pre-line shadow-inner">
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* FULL ORDER DETAILS EDIT MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-950">
                  Edit Order Details (#{editingOrder.id.slice(0, 8).toUpperCase()})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Placed on {new Date(editingOrder.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-6 text-xs">
              
              {/* SECTION 1: STATUS CONTROLS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Order Fulfillment Status</label>
                  <select
                    value={editOrderStatus}
                    onChange={(e) => setEditOrderStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-brand-500"
                  >
                    <option value="Pending">Pending (Awaiting Review)</option>
                    <option value="Confirmed">Confirmed (Accepted)</option>
                    <option value="Shipped">Shipped (Dispatched)</option>
                    <option value="Delivered">Delivered (Handed to Customer)</option>
                    <option value="Completed">Completed (Delivered & Paid)</option>
                    <option value="Cancelled">Cancelled (Declined)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Payment Status</label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-brand-500"
                  >
                    <option value="Pending">Pending (Unpaid)</option>
                    <option value="DeliveryChargePrePaid">Partially Paid (Advance Received)</option>
                    <option value="FullyPaid">Fully Paid Online</option>
                    <option value="Failed">Failed / Unsuccessful</option>
                  </select>
                </div>
              </div>

              {/* SECTION 2: CUSTOMER DETAILS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Customer & Shipping Information</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-mono font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Detailed Delivery Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 leading-relaxed font-medium"
                  />
                </div>

                {/* Pathao Region Dropdowns */}
                {settings.pathao_enabled && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">City</label>
                      <select
                        value={editCity}
                        onChange={(e) => {
                          setEditCity(e.target.value)
                          setEditZone('')
                          setEditArea('')
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-500"
                      >
                        <option value="">Select City</option>
                        {locationCities.map((city) => (
                          <option key={city.city_id} value={city.city_id}>{city.city_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Zone</label>
                      <select
                        disabled={!editCity || locationZones.length === 0}
                        value={editZone}
                        onChange={(e) => {
                          setEditZone(e.target.value)
                          setEditArea('')
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none disabled:bg-slate-100 focus:border-brand-500"
                      >
                        <option value="">Select Zone</option>
                        {locationZones.map((zone) => (
                          <option key={zone.zone_id} value={zone.zone_id}>{zone.zone_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Area</label>
                      <select
                        disabled={!editZone || locationAreas.length === 0}
                        value={editArea}
                        onChange={(e) => setEditArea(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none disabled:bg-slate-100 focus:border-brand-500"
                      >
                        <option value="">Select Area</option>
                        {locationAreas.map((area) => (
                          <option key={area.area_id} value={area.area_id}>{area.area_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: ORDERED ITEMS & QUANTITIES */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Ordered Items & Quantities</h4>
                  <span className="text-[11px] font-semibold text-slate-400">{editItems.length} items</span>
                </div>

                {editItems.length === 0 ? (
                  <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-center font-medium">
                    All items removed. You can cancel or decline this order.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {editItems.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 bg-white flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{item.name}</p>
                          {item.selected_variations && typeof item.selected_variations === 'object' && (
                            <p className="text-[10px] text-slate-400 truncate">
                              {Object.entries(item.selected_variations).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            ৳{Number(item.price).toLocaleString()} / unit
                          </p>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleItemQtyChange(idx, -1)}
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2.5 py-1 text-xs font-bold text-slate-900 min-w-[28px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleItemQtyChange(idx, 1)}
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="text-right min-w-[65px]">
                            <span className="font-black text-slate-900 text-xs">
                              ৳{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>

                          {/* Remove Item Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Remove item from order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 4: FINANCIAL SUMMARY & DUE CALCULATION */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Financials & Doorstep Due</h4>
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Products Subtotal:</span>
                    <span className="font-bold text-slate-900">৳{modalSubtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span>Delivery Charge:</span>
                    <div className="flex items-center gap-1">
                      <span>৳</span>
                      <input
                        type="number"
                        value={editDeliveryCharge}
                        onChange={(e) => setEditDeliveryCharge(Number(e.target.value))}
                        className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-right outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t border-slate-200">
                    <span>Total Order Amount:</span>
                    <span className="text-brand-700 font-black">৳{modalTotalPrice.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <div>
                      <span className="font-bold text-slate-700">Paid Advance:</span>
                      <span className="text-[10px] text-slate-400 block">Edit if collected via bKash, bank, or cash</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>৳</span>
                      <input
                        type="number"
                        value={editAdvancePaid}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setEditAdvancePaid(val)
                          if (val >= modalTotalPrice && modalTotalPrice > 0) {
                            setEditPaymentStatus('FullyPaid')
                          } else if (val > 0) {
                            setEditPaymentStatus('DeliveryChargePrePaid')
                          } else {
                            setEditPaymentStatus('Pending')
                          }
                        }}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-right outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs font-black text-amber-900 bg-amber-100/70 p-2.5 rounded-xl border border-amber-200 mt-2">
                    <span>Balance Due on Delivery:</span>
                    <span>৳{modalDueOnDelivery.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md disabled:bg-slate-400 transition"
                >
                  {saveLoading ? 'Saving Changes...' : 'Save All Changes'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* COURIER DISPATCH CONFIRMATION MODAL */}
      {dispatchConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl text-white shadow-sm ${
                  dispatchConfirm.provider === 'pathao'
                    ? 'bg-[#CF0012]'
                    : dispatchConfirm.provider === 'steadfast'
                      ? 'bg-[#04A285]'
                      : 'bg-slate-800'
                }`}>
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950">
                    Confirm Courier Dispatch
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    {dispatchConfirm.provider === 'pathao'
                      ? 'Pathao Express Parcel'
                      : dispatchConfirm.provider === 'steadfast'
                        ? 'Steadfast Courier Parcel'
                        : 'Manual / Direct Delivery'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDispatchConfirm(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Warning if order is not confirmed yet */}
            {(dispatchConfirm.order.order_status || 'Pending') !== 'Confirmed' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Order Status Warning</p>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    This order is currently <strong>{dispatchConfirm.order.order_status || 'Pending'}</strong> (not confirmed yet). Confirming dispatch will automatically accept and update its fulfillment status to <strong>Shipped</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Order Details Breakdown Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between font-medium text-slate-600">
                <span>Order Invoice ID:</span>
                <span className="font-bold font-mono text-slate-900">#{dispatchConfirm.order.id.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className="flex justify-between font-medium text-slate-600">
                <span>Recipient Name:</span>
                <span className="font-bold text-slate-900">{dispatchConfirm.order.customer_name}</span>
              </div>

              <div className="flex justify-between font-medium text-slate-600">
                <span>Phone Number:</span>
                <span className="font-mono font-bold text-slate-900">{dispatchConfirm.order.customer_phone}</span>
              </div>

              <div className="flex justify-between font-medium text-slate-600 items-start gap-4">
                <span className="flex-shrink-0">Destination:</span>
                <span className="text-right font-medium text-slate-800 line-clamp-2">{dispatchConfirm.order.shipping_address}</span>
              </div>

              {dispatchConfirm.order.payment_details?.shipping_metadata?.area_name && (
                <div className="flex justify-between font-medium text-slate-500 text-[11px]">
                  <span>Area / City:</span>
                  <span>{dispatchConfirm.order.payment_details.shipping_metadata.area_name}, {dispatchConfirm.order.payment_details.shipping_metadata.city_name}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between font-medium text-slate-600">
                <span>Total Order Amount:</span>
                <span className="font-bold text-slate-900">৳{Number(dispatchConfirm.order.total_price).toLocaleString()}</span>
              </div>

              {(() => {
                const advance = dispatchConfirm.order.payment_details?.advance_paid !== undefined
                  ? Number(dispatchConfirm.order.payment_details.advance_paid)
                  : dispatchConfirm.order.payment_status === 'FullyPaid'
                    ? Number(dispatchConfirm.order.total_price)
                    : dispatchConfirm.order.payment_status === 'DeliveryChargePrePaid'
                      ? Number(dispatchConfirm.order.delivery_charge)
                      : 0
                const codToCollect = Math.max(0, Number(dispatchConfirm.order.total_price) - advance)

                return (
                  <>
                    {advance > 0 && (
                      <div className="flex justify-between text-brand-700 font-semibold">
                        <span>Advance Paid:</span>
                        <span>-৳{advance.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-amber-900 bg-amber-100/80 p-2.5 rounded-xl border border-amber-200 mt-1.5">
                      <span>Courier COD Amount to Collect:</span>
                      <span>৳{codToCollect.toLocaleString()}</span>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Prompt */}
            <p className="text-xs text-slate-600 text-center font-medium">
              Are you sure you want to book this dispatch with <strong>{
                dispatchConfirm.provider === 'pathao'
                  ? 'Pathao Express'
                  : dispatchConfirm.provider === 'steadfast'
                    ? 'Steadfast Courier'
                    : 'Manual Delivery'
              }</strong>?
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDispatchConfirm(null)}
                disabled={actionLoading === dispatchConfirm.order.id}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteDispatch(dispatchConfirm.order.id, dispatchConfirm.provider)}
                disabled={actionLoading === dispatchConfirm.order.id}
                className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition disabled:bg-slate-400 ${
                  dispatchConfirm.provider === 'pathao'
                    ? 'bg-[#CF0012] hover:bg-[#b0000f]'
                    : dispatchConfirm.provider === 'steadfast'
                      ? 'bg-[#04A285] hover:bg-[#038b72]'
                      : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {actionLoading === dispatchConfirm.order.id ? 'Booking Consignment...' : 'Yes, Confirm & Dispatch'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE ORDER CONFIRMATION MODAL */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-5 animate-scale-up">
            
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-100 text-red-600 shadow-sm">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950">
                  Delete Order Permanently?
                </h3>
                <p className="text-xs font-mono font-bold text-slate-500">
                  #{deleteConfirmOrder.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-red-900">
              <p className="font-bold">⚠️ Warning: This action cannot be undone.</p>
              <p className="text-[11px] text-red-800 leading-relaxed">
                This will completely remove Order <strong>#{deleteConfirmOrder.id.slice(0, 8).toUpperCase()}</strong> for <strong>{deleteConfirmOrder.customer_name}</strong> (৳{Number(deleteConfirmOrder.total_price).toLocaleString()}) and all its associated line items from the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOrder(null)}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOrder(deleteConfirmOrder.id)}
                disabled={deleteLoading}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition disabled:bg-slate-400"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Order'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
