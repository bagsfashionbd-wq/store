import React from 'react'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getPublicSettings } from '@/utils/settings'
import { CheckCircle2, ShoppingBag, Truck, Printer } from 'lucide-react'

interface ConfirmProps {
  searchParams: Promise<{ order_id?: string; trx_id?: string }>
}

export const revalidate = 0

export default async function OrderConfirmationPage({ searchParams }: ConfirmProps) {
  const { order_id, trx_id } = await searchParams
  const supabase = createAdminClient()
  const settings = await getPublicSettings()

  if (!order_id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-red-500 font-semibold mb-4">Invalid Confirmation Link</p>
          <Link href="/" className="inline-block bg-brand-600 px-6 py-2.5 rounded-xl text-white text-xs font-bold hover:bg-brand-500">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Fetch order details
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single()

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-red-500 font-semibold mb-4">Order record not found</p>
          <Link href="/" className="inline-block bg-brand-600 px-6 py-2.5 rounded-xl text-white text-xs font-bold hover:bg-brand-500">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Fetch order items
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*, products(name)')
    .eq('order_id', order.id)

  const codToCollect = order.payment_method === 'COD' 
    ? Number(order.total_price) - Number(order.delivery_charge)
    : 0

  const courierName = order.shipping_provider === 'steadfast' ? 'Steadfast Courier' : 'Pathao Courier'

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="flex-grow flex items-center justify-center p-4 py-16">
        <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-xl text-center space-y-6">
          
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-brand-600 bg-brand-50 rounded-full p-2" />
          </div>
          
          <div>
            <h1 className="text-2xl font-black text-slate-950">Order Placed Successfully!</h1>
            <p className="mt-1.5 text-xs text-slate-500">Thank you for shopping with {settings.store_name}.</p>
          </div>

          {/* Transaction Summary Panel */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-left text-xs space-y-2.5">
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Order ID:</span>
              <span className="font-mono font-bold text-slate-900">{order.id}</span>
            </div>
            
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">bKash Transaction ID:</span>
              <span className="font-mono font-bold text-slate-900">{trx_id || 'Completed'}</span>
            </div>

            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-900">{order.customer_name} ({order.customer_phone})</span>
            </div>

            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Payment Option:</span>
              <span className="font-bold text-slate-900 uppercase">
                {order.payment_method === 'COD' ? 'Cash on Delivery (COD)' : 'Fully Prepaid via bKash'}
              </span>
            </div>

            <div className="flex justify-between text-sm pt-1">
              <span className="text-slate-900 font-bold">Total Paid Now:</span>
              <span className="font-black text-brand-700">
                ৳{Number(order.payment_method === 'COD' ? order.delivery_charge : order.total_price).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden text-left text-xs">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 font-bold text-slate-800 uppercase tracking-wide text-[10px]">
              Ordered Products
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2 text-center">Qty</th>
                  <th className="px-4 py-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orderItems && orderItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/20">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{item.products?.name || 'Product Item'}</p>
                      {item.selected_variations && Object.entries(item.selected_variations as Record<string, any>).map(([k, v]) => (
                        <span key={k} className="inline-block bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] mr-1 mt-1 capitalize">
                          {k}: {String(v)}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-900 font-bold">৳{(Number(item.price) * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Delivery Note Box */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-5 text-left text-xs space-y-2 text-blue-900">
            <div className="flex items-center gap-1.5 font-bold">
              <Truck className="h-4 w-4 text-blue-700" />
              <span>Courier Delivery Details:</span>
            </div>
            {order.payment_method === 'COD' ? (
              <p className="leading-relaxed">
                Your delivery charge is confirmed. Your order will be dispatched via <strong>{courierName}</strong>. 
                Please keep <strong>৳{codToCollect.toLocaleString()}</strong> cash ready upon delivery.
              </p>
            ) : (
              <p className="leading-relaxed">
                Your order is fully prepaid. Your order will be dispatched via <strong>{courierName}</strong>. 
                Your COD balance is <strong>৳0</strong>.
              </p>
            )}
            
            {order.pathao_consignment_id && (
              <div className="pt-2">
                <span className="font-bold block">Pathao Consignment ID:</span>
                <span className="font-mono bg-white border border-blue-200 px-2 py-0.5 rounded text-blue-900 font-bold block w-fit mt-1">
                  {order.pathao_consignment_id}
                </span>
              </div>
            )}

            {order.steadfast_consignment_id && (
              <div className="pt-2 space-y-1">
                <span className="font-bold block">Steadfast Consignment ID:</span>
                <span className="font-mono bg-white border border-blue-200 px-2 py-0.5 rounded text-blue-900 font-bold block w-fit">
                  {order.steadfast_consignment_id}
                </span>
                {order.steadfast_tracking_code && (
                  <span className="text-[11px] text-blue-700 font-mono block">
                    Tracking Code: {order.steadfast_tracking_code}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow hover:bg-slate-800 transition"
            >
              <ShoppingBag className="h-4 w-4" />
              Back to Catalog
            </Link>

            <a
              href={`/invoice/${order.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-6 py-3 text-xs font-bold text-white shadow hover:bg-brand-500 transition"
            >
              <Printer className="h-4 w-4" />
              View & Print Invoice
            </a>
          </div>

        </div>
      </main>
    </div>
  )
}
