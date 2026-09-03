import { getStoreSettings } from '@/utils/settings'
import { createAdminClient } from '@/utils/supabase/server'
import axios from 'axios'

interface InvoiceEmailPayload {
  toEmail: string
  customerName: string
  orderId: string
  createdAt: string
  shippingAddress: string
  customerPhone: string
  paymentMethod: string
  paymentStatus: string
  deliveryCharge: number
  totalPrice: number
  discountAmount?: number
  items: Array<{
    name: string
    quantity: number
    price: number
    selectedVariations?: Record<string, string>
  }>
}

export async function getResendApiKey(): Promise<string> {
  if (process.env.RESEND_API_KEY) {
    return process.env.RESEND_API_KEY
  }
  const settings = await getStoreSettings()
  return settings.resend_api_key || ''
}

/**
 * Send automated order confirmation invoice email via Resend
 */
export async function sendInvoiceEmail(payload: InvoiceEmailPayload) {
  try {
    const settings = await getStoreSettings()

    // Check if store owner disabled customer invoice emails
    if (settings.email_invoice_enabled === false) {
      console.log('[Resend] Automated invoice emails are disabled in store settings. Skipping.')
      return { success: false, reason: 'Automated invoice emails are disabled in store settings' }
    }

    const apiKey = await getResendApiKey()
    if (!apiKey) {
      console.warn('Resend API key is not configured. Skipping invoice email.')
      return { success: false, reason: 'No Resend API key configured' }
    }
    const storeName = settings.store_name || 'Online Store'
    const fromEmail = (settings.resend_from_email || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim()
    const sender = fromEmail.includes('<') ? fromEmail : `${storeName} <${fromEmail}>`
    const shortId = payload.orderId.slice(0, 8).toUpperCase()

    const itemRows = payload.items.map((item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b;">
          <strong>${item.name}</strong>
          ${item.selectedVariations && Object.keys(item.selectedVariations).length > 0
            ? `<div style="font-size: 11px; color: #64748b;">${Object.entries(item.selectedVariations).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>`
            : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; text-align: right; font-weight: bold;">
          ৳${(Number(item.price) * item.quantity).toLocaleString()}
        </td>
      </tr>
    `).join('')

    const subtotal = payload.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
    const discount = payload.discountAmount ? Number(payload.discountAmount) : 0

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${shortId}</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${storeName}</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Order Invoice & Confirmation</p>
          </div>

          <!-- Greeting -->
          <div style="padding: 24px;">
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 16px; color: #065f46; font-weight: 700;">Thank you for your order, ${payload.customerName}! 🎉</h2>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #047857; line-height: 1.4;">
                We have received your order <strong>#${shortId}</strong> and our team is preparing it for delivery.
              </p>
            </div>

            <!-- Order Meta Grid -->
            <table style="width: 100%; margin-bottom: 20px; font-size: 12px; color: #475569;">
              <tr>
                <td style="padding: 4px 0;"><strong>Order ID:</strong> #${shortId}</td>
                <td style="padding: 4px 0; text-align: right;"><strong>Payment Method:</strong> ${payload.paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Phone:</strong> ${payload.customerPhone}</td>
                <td style="padding: 4px 0; text-align: right;"><strong>Status:</strong> ${payload.paymentStatus}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 4px 0;"><strong>Delivery Address:</strong> ${payload.shippingAddress}</td>
              </tr>
            </table>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f1f5f9; text-transform: uppercase; font-size: 11px; color: #64748b;">
                  <th style="padding: 8px 10px; text-align: left;">Item</th>
                  <th style="padding: 8px 10px; text-align: center;">Qty</th>
                  <th style="padding: 8px 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <!-- Totals Calculation -->
            <table style="width: 100%; font-size: 13px; color: #475569; margin-bottom: 24px;">
              <tr>
                <td style="padding: 4px 0;">Subtotal</td>
                <td style="padding: 4px 0; text-align: right; font-weight: bold;">৳${subtotal.toLocaleString()}</td>
              </tr>
              ${discount > 0 ? `
              <tr>
                <td style="padding: 4px 0; color: #10b981;">Promo Discount</td>
                <td style="padding: 4px 0; text-align: right; color: #10b981; font-weight: bold;">-৳${discount.toLocaleString()}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 4px 0;">Delivery Charge</td>
                <td style="padding: 4px 0; text-align: right;">৳${payload.deliveryCharge.toLocaleString()}</td>
              </tr>
              <tr style="font-size: 16px; font-weight: 800; color: #0f172a; border-top: 2px solid #e2e8f0;">
                <td style="padding: 10px 0;">Total Amount</td>
                <td style="padding: 10px 0; text-align: right; color: #059669;">৳${Number(payload.totalPrice).toLocaleString()}</td>
              </tr>
            </table>

            <!-- Support Footer -->
            <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0 0 6px 0;">Need help with your order? Contact us at <strong>${settings.contact_phone || settings.contact_email}</strong></p>
              <p style="margin: 0;">${storeName} • Bangladesh</p>
            </div>

          </div>
        </div>
      </body>
    </html>
    `

    const response = await axios.post('https://api.resend.com/emails', {
      from: sender,
      to: [payload.toEmail],
      subject: `Order Confirmation & Invoice #${shortId} - ${storeName}`,
      html: htmlContent
    }, {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`[Resend] Invoice email sent successfully to ${payload.toEmail}. ID:`, response.data?.id)
    return { success: true, data: response.data }
  } catch (error: any) {
    const errorDetails = error.response?.data || error.message
    console.error('[Resend] sendInvoiceEmail error:', errorDetails)
    return { success: false, error: error.response?.data?.message || error.message }
  }
}

interface OrderDispatchedPayload {
  toEmail: string
  customerName: string
  orderId: string
  courierName: string
  consignmentId?: string
  trackingCode?: string
  shippingAddress: string
  totalPrice: number
  codAmount?: number
  paymentStatus: string
  items?: Array<{ name: string; quantity: number }>
}

/**
 * Send automated order dispatched email to customer via Resend
 */
export async function sendOrderDispatchedEmail(payload: OrderDispatchedPayload) {
  try {
    const settings = await getStoreSettings()

    if (settings.email_dispatched_enabled === false) {
      console.log('[Resend] Order dispatched emails are disabled in store settings. Skipping.')
      return { success: false, reason: 'Dispatched emails disabled in settings' }
    }

    const apiKey = await getResendApiKey()
    if (!apiKey || !payload.toEmail || !payload.toEmail.includes('@')) {
      return { success: false, reason: 'No valid Resend API key or customer email' }
    }

    const storeName = settings.store_name || 'Online Store'
    const fromEmail = (settings.resend_from_email || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim()
    const sender = fromEmail.includes('<') ? fromEmail : `${storeName} <${fromEmail}>`
    const shortId = payload.orderId.slice(0, 8).toUpperCase()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const trackingId = payload.consignmentId || payload.trackingCode

    const isCOD = payload.codAmount && payload.codAmount > 0

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Dispatched #${shortId}</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <div style="background-color: #0284c7; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${storeName}</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #e0f2fe;">🚚 Your Order Has Been Dispatched!</p>
          </div>

          <!-- Body -->
          <div style="padding: 24px;">
            <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 16px; color: #0369a1; font-weight: 700;">Great news, ${payload.customerName}!</h2>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #075985; line-height: 1.5;">
                Your order <strong>#${shortId}</strong> has been handed over to <strong>${payload.courierName}</strong> and is on its way to your doorstep.
              </p>
            </div>

            <!-- Courier Details Box -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <table style="width: 100%; font-size: 13px; color: #334155;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Courier Partner:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #0284c7;">${payload.courierName}</td>
                </tr>
                ${trackingId ? `
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Consignment / Tracking ID:</td>
                  <td style="padding: 4px 0; text-align: right; font-family: monospace; font-weight: bold;">${trackingId}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Delivery Address:</td>
                  <td style="padding: 4px 0; text-align: right;">${payload.shippingAddress}</td>
                </tr>
                <tr style="border-top: 1px dashed #cbd5e1;">
                  <td style="padding: 8px 0 4px 0; color: #0f172a; font-weight: bold;">Amount to Pay on Delivery:</td>
                  <td style="padding: 8px 0 4px 0; text-align: right; font-weight: 800; font-size: 15px; color: ${isCOD ? '#dc2626' : '#059669'};">
                    ${isCOD ? `৳${payload.codAmount?.toLocaleString()} (Cash on Delivery)` : '৳0 (Fully Prepaid)'}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 24px 0;">
              <a href="${appUrl}/track?id=${payload.orderId}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 13px; font-weight: 700; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.2);">
                Track Your Parcel →
              </a>
            </div>

            <!-- Support Footer -->
            <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0 0 4px 0;">Questions? Reach us anytime at <strong>${settings.contact_phone || settings.contact_email}</strong></p>
              <p style="margin: 0;">${storeName} • Bangladesh</p>
            </div>

          </div>
        </div>
      </body>
    </html>
    `

    const response = await axios.post('https://api.resend.com/emails', {
      from: sender,
      to: [payload.toEmail],
      subject: `Order #${shortId} Dispatched via ${payload.courierName} - ${storeName}`,
      html: htmlContent
    }, {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`[Resend] Order dispatched email sent to ${payload.toEmail}. ID:`, response.data?.id)
    return { success: true, data: response.data }
  } catch (error: any) {
    console.error('[Resend] sendOrderDispatchedEmail error:', error.response?.data || error.message)
    return { success: false, error: error.message }
  }
}

interface OrderCancelledPayload {
  toEmail: string
  customerName: string
  orderId: string
  totalPrice: number
  reason?: string
}

/**
 * Send automated order cancelled email to customer via Resend
 */
export async function sendOrderCancelledEmail(payload: OrderCancelledPayload) {
  try {
    const settings = await getStoreSettings()

    if (settings.email_cancelled_enabled === false) {
      console.log('[Resend] Order cancelled emails are disabled in store settings. Skipping.')
      return { success: false, reason: 'Cancelled emails disabled in settings' }
    }

    const apiKey = await getResendApiKey()
    if (!apiKey || !payload.toEmail || !payload.toEmail.includes('@')) {
      return { success: false, reason: 'No valid Resend API key or customer email' }
    }

    const storeName = settings.store_name || 'Online Store'
    const fromEmail = (settings.resend_from_email || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim()
    const sender = fromEmail.includes('<') ? fromEmail : `${storeName} <${fromEmail}>`
    const shortId = payload.orderId.slice(0, 8).toUpperCase()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Cancelled #${shortId}</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <div style="background-color: #475569; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${storeName}</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Order Cancellation Notice</p>
          </div>

          <!-- Body -->
          <div style="padding: 24px;">
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 16px; color: #991b1b; font-weight: 700;">Order #${shortId} has been cancelled</h2>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #b91c1c; line-height: 1.5;">
                Hello ${payload.customerName}, your order <strong>#${shortId}</strong> (total: ৳${Number(payload.totalPrice).toLocaleString()}) has been cancelled.
                ${payload.reason ? `<br/><strong>Reason:</strong> ${payload.reason}` : ''}
              </p>
            </div>

            <p style="font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
              If you made an advance payment or have questions regarding this cancellation, please contact our support team immediately with your Order ID #${shortId}.
            </p>

            <!-- Action Button -->
            <div style="text-align: center; margin: 24px 0;">
              <a href="${appUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 13px; font-weight: 700; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                Visit Storefront →
              </a>
            </div>

            <!-- Support Footer -->
            <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0 0 4px 0;">Need assistance? Contact <strong>${settings.contact_phone || settings.contact_email}</strong></p>
              <p style="margin: 0;">${storeName} • Bangladesh</p>
            </div>

          </div>
        </div>
      </body>
    </html>
    `

    const response = await axios.post('https://api.resend.com/emails', {
      from: sender,
      to: [payload.toEmail],
      subject: `Order #${shortId} Cancelled - ${storeName}`,
      html: htmlContent
    }, {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`[Resend] Order cancelled email sent to ${payload.toEmail}. ID:`, response.data?.id)
    return { success: true, data: response.data }
  } catch (error: any) {
    console.error('[Resend] sendOrderCancelledEmail error:', error.response?.data || error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send promotional broadcast email to multiple customers
 */
export async function sendPromoEmail(
  recipients: string[],
  subject: string,
  bodyText: string,
  ctaText = 'Shop Now',
  ctaUrl = '/'
) {
  try {
    const apiKey = await getResendApiKey()
    if (!apiKey) {
      throw new Error('Resend API key is not configured in settings or environment.')
    }

    const settings = await getStoreSettings()
    const storeName = settings.store_name || 'Online Store'
    const fromEmail = (settings.resend_from_email || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim()
    const sender = fromEmail.includes('<') ? fromEmail : `${storeName} <${fromEmail}>`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const fullCtaUrl = ctaUrl.startsWith('http') ? ctaUrl : `${appUrl}${ctaUrl}`

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${storeName}</h1>
          </div>

          <!-- Body -->
          <div style="padding: 24px;">
            <h2 style="margin-top: 0; font-size: 18px; color: #0f172a; font-weight: 700;">${subject}</h2>
            <div style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; white-space: pre-line;">
              ${bodyText}
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${fullCtaUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 14px; font-weight: 700; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
                ${ctaText} →
              </a>
            </div>

            <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0 0 4px 0;">You received this email because you are a registered customer at ${storeName}.</p>
              <p style="margin: 0;">${storeName} • Bangladesh</p>
            </div>
          </div>
        </div>
      </body>
    </html>
    `

    // Batch send or loop through recipients (chunk in batches of 50)
    let sentCount = 0
    const validEmails = recipients.filter((e) => e && e.includes('@'))

    for (const email of validEmails) {
      try {
        await axios.post('https://api.resend.com/emails', {
          from: sender,
          to: [email],
          subject,
          html: htmlContent
        }, {
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          }
        })
        sentCount++
      } catch (err: any) {
        console.error(`Failed to send promo email to ${email}:`, err.response?.data || err.message)
      }
    }

    return { success: true, sentCount }
  } catch (error: any) {
    console.error('sendPromoEmail error:', error)
    throw error
  }
}

/**
 * Send scheduled daily summary of pending/unfulfilled orders to store owner
 */
export async function sendDailyPendingOrdersSummary(targetEmail?: string) {
  try {
    const apiKey = await getResendApiKey()
    if (!apiKey) {
      console.warn('[Resend] API key not configured. Skipping daily pending orders digest.')
      return { success: false, reason: 'No Resend API key configured' }
    }

    const settings = await getStoreSettings()
    const storeName = settings.store_name || 'Online Store'
    const fromEmail = (settings.resend_from_email || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim()
    const sender = fromEmail.includes('<') ? fromEmail : `${storeName} <${fromEmail}>`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Determine recipient email: explicitly provided -> daily_digest_email -> contact_email
    const recipient = (targetEmail || settings.daily_digest_email || settings.contact_email || '').trim()
    if (!recipient) {
      console.warn('[Resend] No recipient email configured for daily pending orders digest.')
      return { success: false, reason: 'No recipient email configured' }
    }

    // Query pending/unfulfilled orders
    const supabase = createAdminClient()
    const { data: pendingOrders, error: fetchErr } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name))')
      .in('order_status', ['Pending', 'Processing', 'Confirmed'])
      .order('created_at', { ascending: false })

    if (fetchErr) throw fetchErr

    // Query unread customer contact messages
    const { data: unreadContactMessages, error: msgErr } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    if (msgErr) {
      console.warn('[Resend] Could not fetch contact messages for digest:', msgErr.message)
    }

    const orders = pendingOrders || []
    const totalPendingCount = orders.length
    const totalPendingAmount = orders.reduce((sum, o) => sum + Number(o.total_price || 0), 0)
    const verificationNeededCount = orders.filter(o =>
      o.payment_status === 'Pending Verification' ||
      (o.payment_details?.advance_paid && !o.payment_details?.verified)
    ).length

    const unreadMessages = unreadContactMessages || []
    const unreadMessagesCount = unreadMessages.length

    const todayDateFormatted = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

    const orderRowsHtml = orders.map((o) => {
      const shortId = o.id.slice(0, 8).toUpperCase()
      const total = Number(o.total_price || 0)
      const itemsText = (o.order_items || []).map((it: any) => `${it.quantity}x ${it.products?.name || 'Item'}`).join(', ') || 'No items'
      const isVerification = o.payment_status === 'Pending Verification'

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #1e293b;">
            <a href="${appUrl}/stradmn" style="color: #059669; font-weight: bold; text-decoration: none; font-family: monospace;">
              #${shortId}
            </a>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              ${new Date(o.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #1e293b;">
            <strong>${o.customer_name}</strong>
            <div style="font-size: 11px; color: #64748b;">${o.customer_phone}</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">${o.shipping_address || ''}</div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155; max-width: 180px;">
            ${itemsText}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: center;">
            <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; ${isVerification
          ? 'background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;'
          : 'background-color: #f1f5f9; color: #475569;'
        }">
              ${o.payment_method || 'COD'}<br/>
              <span style="font-size: 9px; font-weight: normal;">${o.payment_status}</span>
            </span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #059669; text-align: right; font-weight: bold;">
            ৳${total.toLocaleString()}
          </td>
        </tr>
      `
    }).join('')

    const unreadMessagesHtml = unreadMessages.map((msg) => {
      const msgTime = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      const msgDate = new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <div>
              <strong style="font-size: 13px; color: #0f172a;">${msg.name}</strong>
              <span style="font-size: 11px; color: #64748b; margin-left: 6px;">(${msg.phone}${msg.email ? ` • ${msg.email}` : ''})</span>
            </div>
            <span style="font-size: 10px; color: #94a3b8; white-space: nowrap;">${msgDate}, ${msgTime}</span>
          </div>
          <div style="font-size: 11px; font-weight: bold; color: #4338ca; margin-bottom: 4px;">
            Subject: ${msg.subject || 'General Inquiry'}
          </div>
          <div style="font-size: 12px; color: #334155; line-height: 1.5; background-color: #ffffff; padding: 8px 10px; border-radius: 6px; border-left: 3px solid #6366f1;">
            "${msg.message}"
          </div>
        </div>
      `
    }).join('')

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Pending Orders Summary</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155;">
        <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${storeName}</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Daily Pending Orders & Messages Digest</p>
            <p style="margin: 6px 0 0 0; font-size: 11px; color: #cbd5e1;">📅 ${todayDateFormatted}</p>
          </div>

          <div style="padding: 24px;">
            
            <!-- Metrics Summary Cards -->
            <table style="width: 100%; border-collapse: separate; border-spacing: 6px 0; margin-bottom: 24px;">
              <tr>
                <td style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 8px; text-align: center; width: 25%;">
                  <div style="font-size: 10px; font-weight: bold; color: #1e40af; text-transform: uppercase;">Pending</div>
                  <div style="font-size: 20px; font-weight: 900; color: #1e3a8a; margin-top: 3px;">${totalPendingCount}</div>
                </td>
                <td style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 12px 8px; text-align: center; width: 25%;">
                  <div style="font-size: 10px; font-weight: bold; color: #065f46; text-transform: uppercase;">Total Value</div>
                  <div style="font-size: 20px; font-weight: 900; color: #047857; margin-top: 3px;">৳${totalPendingAmount.toLocaleString()}</div>
                </td>
                <td style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 8px; text-align: center; width: 25%;">
                  <div style="font-size: 10px; font-weight: bold; color: #92400e; text-transform: uppercase;">Verification</div>
                  <div style="font-size: 20px; font-weight: 900; color: #78350f; margin-top: 3px;">${verificationNeededCount}</div>
                </td>
                <td style="background-color: ${unreadMessagesCount > 0 ? '#eef2ff' : '#f8fafc'}; border: 1px solid ${unreadMessagesCount > 0 ? '#c7d2fe' : '#e2e8f0'}; border-radius: 10px; padding: 12px 8px; text-align: center; width: 25%;">
                  <div style="font-size: 10px; font-weight: bold; color: ${unreadMessagesCount > 0 ? '#4338ca' : '#64748b'}; text-transform: uppercase;">Unread Msg</div>
                  <div style="font-size: 20px; font-weight: 900; color: ${unreadMessagesCount > 0 ? '#3730a3' : '#334155'}; margin-top: 3px;">${unreadMessagesCount}</div>
                </td>
              </tr>
            </table>

            <!-- Orders Table or Empty State -->
            ${totalPendingCount === 0 ? `
              <div style="text-align: center; padding: 24px 16px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0; margin-bottom: 24px;">
                <p style="font-size: 15px; font-weight: bold; color: #15803d; margin: 0 0 4px 0;">🎉 All Orders Fulfilled!</p>
                <p style="font-size: 12px; color: #166534; margin: 0;">There are currently zero pending orders in the queue.</p>
              </div>
            ` : `
              <div style="margin-bottom: 24px;">
                <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Pending Orders List</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f8fafc; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">
                      <th style="padding: 8px 10px; text-align: left;">Order</th>
                      <th style="padding: 8px 10px; text-align: left;">Customer</th>
                      <th style="padding: 8px 10px; text-align: left;">Items</th>
                      <th style="padding: 8px 10px; text-align: center;">Payment</th>
                      <th style="padding: 8px 10px; text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderRowsHtml}
                  </tbody>
                </table>
              </div>
            `}

            <!-- Unread Customer Messages Section -->
            ${unreadMessagesCount > 0 ? `
              <div style="margin-top: 24px; margin-bottom: 24px; border-top: 1px dashed #cbd5e1; padding-top: 20px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                  <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;">
                    💬 Unread Customer Messages (${unreadMessagesCount})
                  </h3>
                  <a href="${appUrl}/stradmn" style="font-size: 11px; color: #4f46e5; text-decoration: none; font-weight: bold;">
                    Reply in Admin →
                  </a>
                </div>
                ${unreadMessagesHtml}
              </div>
            ` : ''}

            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 28px; margin-bottom: 12px;">
              <a href="${appUrl}/stradmn" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 13px; font-weight: 700; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                Open Admin Dashboard →
              </a>
            </div>

            <!-- Footer -->
            <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 18px; margin-top: 24px; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0 0 4px 0;">This automated summary was generated based on your daily digest schedule setting.</p>
              <p style="margin: 0;">${storeName} Management • Bangladesh</p>
            </div>

          </div>
        </div>
      </body>
    </html>
    `

    const subjectParts: string[] = []
    subjectParts.push(`${totalPendingCount} Pending Orders (৳${totalPendingAmount.toLocaleString()})`)
    if (unreadMessagesCount > 0) {
      subjectParts.push(`${unreadMessagesCount} Unread Messages`)
    }

    const response = await axios.post('https://api.resend.com/emails', {
      from: sender,
      to: [recipient],
      subject: `[Daily Digest] ${subjectParts.join(' • ')} - ${storeName}`,
      html: htmlContent
    }, {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`[Resend] Daily pending orders summary sent to ${recipient}. ID:`, response.data?.id)
    return {
      success: true,
      recipient,
      totalPendingCount,
      totalPendingAmount,
      unreadMessagesCount,
      data: response.data
    }
  } catch (error: any) {
    const errorDetails = error.response?.data || error.message
    console.error('[Resend] sendDailyPendingOrdersSummary error:', errorDetails)
    return { success: false, error: error.response?.data?.message || error.message }
  }
}
