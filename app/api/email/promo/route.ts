import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { verifyStaffAuth } from '@/utils/auth'
import { sendPromoEmail } from '@/utils/email'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const { subject, body: emailBody, ctaText, ctaUrl } = body

    if (!subject || !emailBody) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    // Fetch all customers with an email
    const { data: customers, error } = await supabase
      .from('customers')
      .select('email')
      .neq('email', '')

    if (error) throw error

    const emails = (customers || []).map((c: any) => c.email).filter(Boolean)

    if (emails.length === 0) {
      return NextResponse.json({ error: 'No registered customers with emails found.' }, { status: 400 })
    }

    const result = await sendPromoEmail(emails, subject, emailBody, ctaText, ctaUrl)

    return NextResponse.json({
      success: true,
      sentCount: result.sentCount,
      totalRecipients: emails.length
    })
  } catch (error: any) {
    console.error('Promo email broadcast route error:', error)
    return NextResponse.json({ error: error.message || 'Failed to broadcast promo email' }, { status: 500 })
  }
}
