import { getStoreSettings } from '@/utils/settings'
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
    const apiKey = await getResendApiKey()
    if (!apiKey) {
      console.warn('Resend API key is not configured. Skipping invoice email.')
      return { success: false, reason: 'No Resend API key configured' }
    }

    const settings = await getStoreSettings()
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
