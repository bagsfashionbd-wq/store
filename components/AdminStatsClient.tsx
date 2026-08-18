'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import {
  TrendingUp, DollarSign, Package, CheckCircle2,
  AlertCircle, Clock, Truck, RefreshCw, ShoppingBag,
  ArrowUpRight, ArrowDownRight, Layers, ShieldCheck,
  BarChart3, PieChart, AlertTriangle, Check, ArrowRight
} from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product_id?: string
  products?: {
    id: string
    name: string
    price: number
    buying_price?: number
    stock: number
    images?: string[]
  }
}

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  total_price: number
  delivery_charge: number
  order_status?: string
  payment_status?: string
  payment_method: string
  shipping_provider?: string
  pathao_consignment_id?: string
  steadfast_consignment_id?: string
  payment_details?: {
    advance_paid?: number
    shipping_metadata?: any
  }
  created_at: string
  order_items?: OrderItem[]
}

interface Product {
  id: string
  name: string
  price: number
  buying_price?: number
  stock: number
  images?: string[]
  category_id?: string
  is_hidden?: boolean
}

interface Category {
  id: string
  name: string
}

interface AdminStatsClientProps {
  initialOrders: Order[]
  initialProducts: Product[]
  initialCategories: Category[]
}

export default function AdminStatsClient({ initialOrders, initialProducts, initialCategories }: AdminStatsClientProps) {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<'all' | '30days' | '7days'>('all')

  // Filter orders by time range if selected
  const now = new Date().getTime()
  const orders = initialOrders.filter((o) => {
    if (timeRange === 'all') return true
    const orderDate = new Date(o.created_at).getTime()
    const diffDays = (now - orderDate) / (1000 * 3600 * 24)
    if (timeRange === '30days') return diffDays <= 30
    if (timeRange === '7days') return diffDays <= 7
    return true
  })

  // 1. CRITICAL: STRICTLY EXCLUDE CANCELLED ORDERS FROM FINANCIAL STATS
  const validOrders = orders.filter((o) => (o.order_status || 'Pending') !== 'Cancelled')
  const cancelledOrders = orders.filter((o) => (o.order_status || 'Pending') === 'Cancelled')

  // Gross Revenue (All non-cancelled orders)
  const grossRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0)

  // Net Paid/Collected Revenue
  const netCollectedRevenue = validOrders.reduce((sum, o) => {
    const isCompletedOrDelivered = o.order_status === 'Completed' || o.order_status === 'Delivered'
    if (isCompletedOrDelivered) {
      return sum + Number(o.total_price || 0)
    }

    if (o.payment_status === 'FullyPaid') {
      return sum + Number(o.total_price || 0)
    }

    if (o.payment_details?.advance_paid !== undefined && o.payment_details.advance_paid > 0) {
      return sum + Number(o.payment_details.advance_paid)
    }

    if (o.payment_status === 'DeliveryChargePrePaid') {
      return sum + Number(o.delivery_charge || 0)
    }

    return sum
  }, 0)

  // Outstanding Doorstep Dues (Uncollected COD amount)
  const outstandingDoorstepDue = validOrders.reduce((sum, o) => {
    const isCompletedOrDelivered = o.order_status === 'Completed' || o.order_status === 'Delivered'
    if (isCompletedOrDelivered) return sum

    let advance = 0
    if (o.payment_details?.advance_paid !== undefined) {
      advance = Number(o.payment_details.advance_paid)
    } else if (o.payment_status === 'FullyPaid') {
      advance = Number(o.total_price)
    } else if (o.payment_status === 'DeliveryChargePrePaid') {
      advance = Number(o.delivery_charge)
    }

    const due = Math.max(0, Number(o.total_price) - advance)
    return sum + due
  }, 0)

  // Average Order Value (AOV)
  const averageOrderValue = validOrders.length > 0 ? Math.round(grossRevenue / validOrders.length) : 0

  // 2. PROFIT & COGS COMPUTATION (From all items in non-cancelled orders)
  let totalCOGS = 0
  let totalProductRevenue = 0

  validOrders.forEach((order) => {
    (order.order_items || []).forEach((item) => {
      const qty = Number(item.quantity || 1)
      const sellPrice = Number(item.price || 0)
      const buyCost = Number(item.products?.buying_price || 0)

      totalProductRevenue += sellPrice * qty
      totalCOGS += buyCost * qty
    })
  })

  const estimatedGrossProfit = Math.max(0, totalProductRevenue - totalCOGS)
  const profitMarginPercent = totalProductRevenue > 0
    ? Math.round((estimatedGrossProfit / totalProductRevenue) * 100)
    : 0

  // 3. ORDER STATUS BREAKDOWN
  const statusCounts = {
    Pending: validOrders.filter((o) => (o.order_status || 'Pending') === 'Pending').length,
    Confirmed: validOrders.filter((o) => o.order_status === 'Confirmed').length,
    Shipped: validOrders.filter((o) => o.order_status === 'Shipped').length,
    Delivered: validOrders.filter((o) => o.order_status === 'Delivered').length,
    Completed: validOrders.filter((o) => o.order_status === 'Completed').length,
    Cancelled: cancelledOrders.length
  }

  // 4. PAYMENT STATUS BREAKDOWN
  const paymentCounts = {
    FullyPaid: validOrders.filter((o) => o.payment_status === 'FullyPaid').length,
    PartiallyPaid: validOrders.filter((o) => o.payment_status === 'DeliveryChargePrePaid' || (o.payment_details?.advance_paid && o.payment_details.advance_paid > 0 && o.payment_status !== 'FullyPaid')).length,
    Pending: validOrders.filter((o) => !o.payment_status || o.payment_status === 'Pending').length,
    Failed: validOrders.filter((o) => o.payment_status === 'Failed').length
  }

  // 5. COURIER LOGISTICS BREAKDOWN
  const courierCounts = {
    Pathao: validOrders.filter((o) => o.shipping_provider === 'pathao' || o.pathao_consignment_id).length,
    Steadfast: validOrders.filter((o) => o.shipping_provider === 'steadfast' || o.steadfast_consignment_id).length,
    Manual: validOrders.filter((o) => o.shipping_provider === 'manual' && !o.pathao_consignment_id && !o.steadfast_consignment_id).length
  }

  // 6. INVENTORY & STOCK VALUATION
  const totalStockUnits = initialProducts.reduce((sum, p) => sum + (p.stock || 0), 0)
  const totalStockValuation = initialProducts.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.stock || 0)), 0)
  const totalStockCostValuation = initialProducts.reduce((sum, p) => sum + (Number(p.buying_price || 0) * Number(p.stock || 0)), 0)
  const potentialInventoryProfit = Math.max(0, totalStockValuation - totalStockCostValuation)
  const outOfStockProducts = initialProducts.filter((p) => (p.stock || 0) <= 0)
  const lowStockProducts = initialProducts.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5)

  // 7. TOP SELLING PRODUCTS WITH PROFIT BREAKDOWN
  const productSalesMap: Record<string, { id: string; name: string; quantity: number; revenue: number; cost: number; profit: number; image?: string }> = {}
  validOrders.forEach((order) => {
    (order.order_items || []).forEach((item) => {
      const prodId = item.product_id || item.products?.id || item.id
      const prodName = item.products?.name || 'Product'
      const prodImg = item.products?.images?.[0]
      const qty = Number(item.quantity || 1)
      const rev = Number(item.price || 0) * qty
      const cost = Number(item.products?.buying_price || 0) * qty
      const profit = Math.max(0, rev - cost)

      if (!productSalesMap[prodId]) {
        productSalesMap[prodId] = {
          id: prodId,
          name: prodName,
          quantity: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          image: prodImg
        }
      }
      productSalesMap[prodId].quantity += qty
      productSalesMap[prodId].revenue += rev
      productSalesMap[prodId].cost += cost
      productSalesMap[prodId].profit += profit
    })
  })

  const topSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100 text-slate-800">
      
      {/* UNIFIED SIDEBAR */}
      <AdminSidebar />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-brand-600 flex-shrink-0" />
            <h1 className="text-sm sm:text-lg font-bold text-slate-950 truncate">Analytics & Reports</h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Time Filter Pills */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 sm:p-1 border border-slate-200 text-[10px] sm:text-xs font-bold">
              <button
                onClick={() => setTimeRange('all')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition ${
                  timeRange === 'all' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTimeRange('30days')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition ${
                  timeRange === '30days' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                30D
              </button>
              <button
                onClick={() => setTimeRange('7days')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition ${
                  timeRange === '7days' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                7D
              </button>
            </div>

            <button
              onClick={() => router.refresh()}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition"
              title="Refresh Data"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* TOP KEY METRICS CARDS (Financial & Profit Performance) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-4">
            
            {/* Card 1: Gross Sales Volume */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Gross Sales</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-950 font-mono">
                ৳{grossRevenue.toLocaleString()}
              </p>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>{validOrders.length} orders</span>
                <span className="font-semibold text-blue-600">AOV: ৳{averageOrderValue.toLocaleString()}</span>
              </div>
            </div>

            {/* Card 2: Estimated Gross Profit (NEW) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/20 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800">Gross Profit</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                ৳{estimatedGrossProfit.toLocaleString()}
              </p>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 pt-1 border-t border-emerald-100">
                <span className="text-emerald-700 font-bold">{profitMarginPercent}% margin</span>
                <span className="font-mono text-slate-500">COGS: ৳{totalCOGS.toLocaleString()}</span>
              </div>
            </div>

            {/* Card 3: Net Realized Revenue */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Collected Revenue</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-brand-50 text-brand-600">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-950 font-mono">
                ৳{netCollectedRevenue.toLocaleString()}
              </p>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Advance + Delivered</span>
                <span className="font-semibold text-brand-600">
                  {grossRevenue > 0 ? Math.round((netCollectedRevenue / grossRevenue) * 100) : 0}% realized
                </span>
              </div>
            </div>

            {/* Card 4: Outstanding Doorstep Due */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Doorstep COD Due</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-700 font-mono">
                ৳{outstandingDoorstepDue.toLocaleString()}
              </p>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>In transit COD</span>
                <span className="font-bold text-amber-700">Receivable</span>
              </div>
            </div>

            {/* Card 5: Inventory Asset Valuation */}
            <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Stock Valuation</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-950 font-mono">
                ৳{totalStockValuation.toLocaleString()}
              </p>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>{totalStockUnits} units</span>
                <span className="font-mono text-purple-700 font-semibold" title="Cost of Goods in Inventory">
                  Cost: ৳{totalStockCostValuation.toLocaleString()}
                </span>
              </div>
            </div>

          </div>

          {/* ROW 2: ORDER LIFECYCLE & PAYMENT DISTRIBUTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Order Fulfillment Status Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-brand-600" /> Order Fulfillment Lifecycle
                </h3>
                <span className="text-xs text-slate-400 font-medium">{orders.length} total</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Pending Acceptance', count: statusCounts.Pending, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
                  { label: 'Confirmed (Processing)', count: statusCounts.Confirmed, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
                  { label: 'Shipped (In Transit)', count: statusCounts.Shipped, color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' },
                  { label: 'Delivered / Completed', count: statusCounts.Delivered + statusCounts.Completed, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                  { label: 'Cancelled (Excluded)', count: statusCounts.Cancelled, color: 'bg-red-400', text: 'text-red-700', bg: 'bg-red-50' }
                ].map((item) => {
                  const pct = orders.length > 0 ? Math.round((item.count / orders.length) * 100) : 0
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="text-slate-900 font-mono font-bold">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment Status Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" /> Payment Settlement Status
                </h3>
                <span className="text-xs text-slate-400 font-medium">{validOrders.length} active</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Fully Paid Online', count: paymentCounts.FullyPaid, color: 'bg-emerald-500' },
                  { label: 'Partially Paid (Advance)', count: paymentCounts.PartiallyPaid, color: 'bg-blue-500' },
                  { label: 'Pending Payment / Unpaid COD', count: paymentCounts.Pending, color: 'bg-amber-500' },
                  { label: 'Failed Online Transactions', count: paymentCounts.Failed, color: 'bg-red-500' }
                ].map((item) => {
                  const pct = validOrders.length > 0 ? Math.round((item.count / validOrders.length) * 100) : 0
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="text-slate-900 font-mono font-bold">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Calculated exclusively from non-cancelled active orders.
                </p>
              </div>
            </div>

            {/* Courier Logistics Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-slate-800" /> Courier Logistics Breakdown
                </h3>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Pathao Courier Aladdin', count: courierCounts.Pathao, color: 'bg-[#CF0012]' },
                  { label: 'Steadfast Courier', count: courierCounts.Steadfast, color: 'bg-[#04A285]' },
                  { label: 'Manual Store Delivery', count: courierCounts.Manual, color: 'bg-slate-700' }
                ].map((item) => {
                  const totalCouriers = courierCounts.Pathao + courierCounts.Steadfast + courierCounts.Manual
                  const pct = totalCouriers > 0 ? Math.round((item.count / totalCouriers) * 100) : 0
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="text-slate-900 font-mono font-bold">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Real-time consignment volume booked with integrated delivery partners.
                </p>
              </div>
            </div>

          </div>

          {/* ROW 3: TOP PRODUCTS & INVENTORY HEALTH ALERTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Selling Products List with Profit Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" /> Best Performing Products & Profit
                </h3>
                <Link
                  href="/stradmn/products"
                  className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1"
                >
                  View Inventory <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {topSellingProducts.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center italic">
                  No product sales recorded yet in this time period.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {topSellingProducts.map((p, idx) => {
                    const prodMargin = p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0
                    return (
                      <div key={p.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono font-black text-slate-400 w-4 flex-shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span>{p.quantity} sold</span>
                              <span>•</span>
                              <span>Rev: ৳{p.revenue.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-mono font-black text-emerald-700 block">
                            +৳{p.profit.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600/80 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {prodMargin}% margin
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Inventory Alerts & Stock Health */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Stock Health & Replenishment Alerts
                </h3>
              </div>

              {outOfStockProducts.length === 0 && lowStockProducts.length === 0 ? (
                <div className="p-8 text-center space-y-2 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-900">All products are healthy in stock!</p>
                  <p className="text-[11px] text-emerald-700">No items are currently out of stock or below 5 units.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Out of Stock Warning */}
                  {outOfStockProducts.length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-red-900">
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-red-600" /> Out of Stock ({outOfStockProducts.length})
                        </span>
                        <Link href="/stradmn/products" className="text-red-700 underline text-[11px]">
                          Restock
                        </Link>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {outOfStockProducts.slice(0, 6).map((p) => (
                          <span key={p.id} className="inline-block bg-white border border-red-200 px-2 py-0.5 rounded text-[11px] font-semibold text-red-800">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Low Stock Warning */}
                  {lowStockProducts.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-amber-600" /> Low Stock Warning ({lowStockProducts.length})
                        </span>
                        <Link href="/stradmn/products" className="text-amber-700 underline text-[11px]">
                          View
                        </Link>
                      </div>
                      <div className="divide-y divide-amber-200/60 bg-white rounded-lg border border-amber-200 px-3">
                        {lowStockProducts.slice(0, 5).map((p) => (
                          <div key={p.id} className="flex justify-between py-2 text-xs">
                            <span className="font-semibold text-slate-800">{p.name}</span>
                            <span className="font-mono font-bold text-amber-700">{p.stock} units left</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </main>
      </div>
    </div>
  )
}
