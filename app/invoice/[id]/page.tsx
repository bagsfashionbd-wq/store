import { createAdminClient } from '@/utils/supabase/server'
import { getPublicSettings } from '@/utils/settings'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react'

export const revalidate = 0

interface InvoicePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: InvoicePageProps) {
  const { id } = await params
  const settings = await getPublicSettings()
  const shortId = id.slice(0, 8).toUpperCase()
  return {
    title: `Invoice-${shortId} - ${settings.store_name}`,
    description: `Official order invoice #${shortId} from ${settings.store_name}`
  }
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params
  const supabase = createAdminClient()
  const settings = await getPublicSettings()

  // Fetch Order and associated items
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, images))')
    .eq('id', id)
    .single()

  if (error || !order) {
    notFound()
  }

  const orderItems = order.order_items || []
  const date = new Date(order.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  const subtotal = (orderItems || []).reduce((sum: number, item: any) => sum + Number(item.price) * item.quantity, 0)
  
  const customAdvancePaid = order.payment_details?.advance_paid !== undefined 
    ? Number(order.payment_details.advance_paid)
    : (order.payment_status === 'FullyPaid' 
        ? Number(order.total_price) 
        : order.payment_status === 'DeliveryChargePrePaid' 
          ? Number(order.delivery_charge) 
          : 0)

  const isFullyPaid = order.payment_status === 'FullyPaid' || (customAdvancePaid >= Number(order.total_price) && Number(order.total_price) > 0)
  const isPartialAdvance = customAdvancePaid > 0 && !isFullyPaid
  
  // Due on delivery calculation
  const dueOnDelivery = Math.max(0, Number(order.total_price) - customAdvancePaid)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 print:bg-white print:p-0 print:text-black">
      
      {/* Print CSS Overrides */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body { 
              background: #ffffff !important; 
              color: #000000 !important; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
            }
            #invoice-sheet, #invoice-sheet * {
              color: #000000 !important;
              border-color: #000000 !important;
            }
            #invoice-sheet th, #invoice-sheet h1, #invoice-sheet h2, #invoice-sheet h3, #invoice-sheet strong, #invoice-sheet b {
              color: #000000 !important;
              font-weight: 800 !important;
              opacity: 1 !important;
            }
            #invoice-sheet .text-slate-400,
            #invoice-sheet .text-slate-500,
            #invoice-sheet .text-slate-600,
            #invoice-sheet .text-slate-700,
            #invoice-sheet .text-slate-800,
            #invoice-sheet .text-slate-900,
            #invoice-sheet .text-slate-950,
            #invoice-sheet .text-brand-600,
            #invoice-sheet .text-brand-700 {
              color: #000000 !important;
              opacity: 1 !important;
            }
            .print-clean { 
              background: #ffffff !important; 
              color: #000000 !important; 
              border: 1px solid #000000 !important; 
            }
          }
        `
      }} />

      {/* Action Bar (Hidden on print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Store
        </Link>
        
        <button
          onClick={undefined}
          id="print-invoice-btn"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2 shadow transition-colors"
        >
          <Printer className="h-4 w-4" /> Print / Save PDF
        </button>
      </div>

      {/* Invoice Sheet */}
      <div id="invoice-sheet" className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-8 sm:p-12 print:border-0 print:shadow-none print:rounded-none print:p-0">
        
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-slate-200 print:border-black">
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {settings.logo_url && (
              <img
                src={settings.logo_url}
                alt={settings.store_name}
                className="h-12 w-12 rounded-full object-cover border border-slate-200 flex-shrink-0 print:border-black"
              />
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-950 print:text-black tracking-tight">{settings.store_name}</h1>
              <p className="text-xs text-brand-600 print:text-black mt-0.5 font-bold tracking-wide">
                {settings.hero_title ? `${settings.hero_title} - ${settings.hero_subtitle}` : settings.store_tagline}
              </p>
              <p className="text-xs text-slate-500 print:text-black mt-1.5 leading-relaxed">
                {settings.contact_address ? settings.contact_address : 'Dhaka, Bangladesh'}<br />
                Delivery via <strong className="text-slate-700 print:text-black">{
                  order.shipping_provider === 'steadfast' 
                    ? 'Steadfast Courier' 
                    : order.shipping_provider === 'pathao' 
                      ? 'Pathao Express' 
                      : 'Standard / Home Delivery'
                }</strong>
              </p>
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <h2 className="text-xl font-black text-slate-900 print:text-black">INVOICE</h2>
            <p className="text-xs text-slate-500 print:text-black">Invoice ID: <span className="font-mono font-bold text-slate-800 print:text-black">{order.id.slice(0, 8).toUpperCase()}-{order.id.slice(9, 13).toUpperCase()}</span></p>
            <p className="text-xs text-slate-500 print:text-black">Date: <span className="font-semibold text-slate-800 print:text-black">{date}</span></p>
            
            <div className="flex flex-wrap sm:justify-end gap-1.5 mt-2">
              {/* Order Status Badge */}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold print-clean ${
                (order.order_status || 'Pending') === 'Confirmed'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : (order.order_status || 'Pending') === 'Shipped'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : (order.order_status || 'Pending') === 'Delivered' || (order.order_status || 'Pending') === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : (order.order_status || 'Pending') === 'Cancelled'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                STATUS: {(order.order_status || 'Pending').toUpperCase()}
              </span>

              {/* Payment Status Badge */}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold print-clean ${
                isFullyPaid || isPartialAdvance
                  ? 'bg-brand-50 text-brand-700 border border-brand-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {isFullyPaid && 'FULLY PREPAID'}
                {isPartialAdvance && `ADVANCE PAID (৳${customAdvancePaid.toLocaleString()})`}
                {!isFullyPaid && !isPartialAdvance && order.payment_status === 'Pending' && 'PAYMENT PENDING'}
                {!isFullyPaid && !isPartialAdvance && order.payment_status === 'Failed' && 'PAYMENT FAILED'}
              </span>
            </div>
          </div>
        </div>

        {/* Billing & Shipping Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-200 print:border-black text-xs">
          <div>
            <h3 className="text-slate-400 print:text-black font-bold uppercase tracking-wider mb-2">Billed To</h3>
            <p className="text-sm font-bold text-slate-900 print:text-black">{order.customer_name}</p>
            <p className="text-slate-600 print:text-black font-medium mt-1">Phone: {order.customer_phone}</p>
            {order.customer_email && <p className="text-slate-600 print:text-black font-medium">Email: {order.customer_email}</p>}
          </div>
          <div>
            <h3 className="text-slate-400 print:text-black font-bold uppercase tracking-wider mb-2">Shipping Destination</h3>
            <p className="text-slate-900 print:text-black font-medium leading-relaxed break-words">{order.shipping_address}</p>
            {order.payment_details?.shipping_metadata?.area_name && (
              <p className="text-slate-500 print:text-black mt-1 font-semibold">
                Area: {order.payment_details.shipping_metadata.area_name}, {order.payment_details.shipping_metadata.city_name}
              </p>
            )}
            {order.pathao_consignment_id && (
              <p className="text-slate-500 print:text-black mt-1 font-mono text-[11px]">
                Pathao Consignment: {order.pathao_consignment_id}
              </p>
            )}
            {order.steadfast_consignment_id && (
              <p className="text-slate-500 print:text-black mt-1 font-mono text-[11px]">
                Steadfast Consignment: {order.steadfast_consignment_id} (Track: {order.steadfast_tracking_code})
              </p>
            )}
          </div>
        </div>

        {/* Order Items Table */}
        <div className="py-6 border-b border-slate-200 print:border-black">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 print:border-black text-[10px] font-bold text-slate-400 print:text-black uppercase tracking-wider">
                <th className="pb-3 print:text-black print:font-extrabold">Item Description</th>
                <th className="pb-3 text-center print:text-black print:font-extrabold">Qty</th>
                <th className="pb-3 text-right print:text-black print:font-extrabold">Unit Price</th>
                <th className="pb-3 text-right print:text-black print:font-extrabold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-300">
              {orderItems.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-3.5">
                    <p className="font-bold text-slate-900 print:text-black">{item.products?.name || 'Product Item'}</p>
                    {item.selected_variations && typeof item.selected_variations === 'object' && (
                      <div className="text-[10px] text-slate-500 print:text-black mt-0.5 space-x-2">
                        {Object.entries(item.selected_variations).map(([k, v]) => (
                          <span key={k} className="capitalize">{k}: {String(v)}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 text-center font-semibold text-slate-700 print:text-black">{item.quantity}</td>
                  <td className="py-3.5 text-right font-medium text-slate-700 print:text-black">৳{Number(item.price).toLocaleString()}</td>
                  <td className="py-3.5 text-right font-bold text-slate-900 print:text-black">৳{(Number(item.price) * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="py-6 border-b border-slate-200 print:border-black text-xs font-semibold">
          <div className="w-full sm:w-1/2 ml-auto space-y-2">
            <div className="flex justify-between text-slate-600 print:text-black font-bold">
              <span>Items Subtotal:</span>
              <span>৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 print:text-black font-bold">
              <span>Delivery Fee ({
                order.shipping_provider === 'steadfast' 
                  ? 'Steadfast' 
                  : order.shipping_provider === 'pathao' 
                    ? 'Pathao' 
                    : 'Standard'
              }):</span>
              <span>৳{Number(order.delivery_charge).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-950 print:text-black pt-2 border-t border-slate-200 print:border-black">
              <span>Total Amount:</span>
              <span className="text-brand-700 print:text-black">৳{Number(order.total_price).toLocaleString()}</span>
            </div>

            {/* Payment Summary */}
            <div className="pt-3 space-y-1.5 text-xs">
              {isFullyPaid && (
                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-emerald-800 space-y-1 print-clean">
                  <div className="flex justify-between font-semibold print:text-black">
                    <span>Paid Online via bKash:</span>
                    <span>৳{Number(order.total_price).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-emerald-900 border-t border-emerald-200/60 pt-1 print-clean print:border-black">
                    <span>Due on Delivery:</span>
                    <span>৳0</span>
                  </div>
                </div>
              )}

              {isPartialAdvance && (
                <div className="space-y-1 text-slate-600 print:text-black">
                  <div className="flex justify-between text-brand-700 font-semibold print:text-black">
                    <span>Advance Payment Received:</span>
                    <span>-৳{customAdvancePaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-amber-800 text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200 print-clean">
                    <span>COD Balance Due on Delivery:</span>
                    <span>৳{dueOnDelivery.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {!isFullyPaid && !isPartialAdvance && (
                <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 text-amber-900 space-y-1 print-clean">
                  <div className="flex justify-between text-[11px] text-amber-700 font-semibold print:text-black">
                    <span>Advance Payment Status:</span>
                    <span className="font-bold uppercase text-red-600 print:text-black">{order.payment_status === 'Failed' ? 'Failed / Unpaid' : 'Pending'}</span>
                  </div>
                  <div className="flex justify-between font-black text-amber-950 text-xs border-t border-amber-200 pt-1 print:border-black print:text-black">
                    <span>Total Due on Delivery (Products + Shipping):</span>
                    <span>৳{dueOnDelivery.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Shop Contact Details in Invoice Footer */}
        <div className="pt-8 text-center text-xs space-y-2 print:text-black">
          <p className="font-bold text-slate-800 print:text-black">Thank you for shopping with {settings.store_name}!</p>
          
          {(settings.contact_phone || settings.contact_email || settings.contact_address) && (
            <div className="pt-2 border-t border-slate-100 print:border-black flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500 print:text-black font-medium">
              {settings.contact_phone && (
                <span>📞 <strong>Phone:</strong> {settings.contact_phone}</span>
              )}
              {settings.contact_email && (
                <span>✉️ <strong>Email:</strong> {settings.contact_email}</span>
              )}
              {settings.contact_address && (
                <span>📍 <strong>Address:</strong> {settings.contact_address}</span>
              )}
            </div>
          )}

          <p className="text-[10px] text-slate-400 print:text-black font-semibold">For parcel queries or tracking, quote your Invoice ID: #{order.id.slice(0, 8).toUpperCase()}</p>
        </div>

      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('print-invoice-btn')?.addEventListener('click', function() {
              window.print();
            });
          `
        }}
      />
    </div>
  )
}
