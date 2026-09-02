import { NextRequest, NextResponse } from 'next/server'
import { getStoreSettings } from '@/utils/settings'
import { sendDailyPendingOrdersSummary } from '@/utils/email'

export const dynamic = 'force-dynamic'

// GET: Handled by Vercel Cron or external scheduler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isForce = searchParams.get('force') === 'true'
    const targetEmail = searchParams.get('email') || undefined

    const settings = await getStoreSettings(true)

    // Check authorization header if CRON_SECRET is configured
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && !isForce) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 })
      }
    }

    // If not forced, check if daily digest is enabled in settings
    if (!isForce && !settings.daily_digest_enabled) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Daily pending orders digest is disabled in store settings.'
      })
    }

    // If not forced, check if current Bangladesh Time hour matches scheduled hour
    if (!isForce) {
      const scheduledTime = settings.daily_digest_time || '20:00'
      const [scheduledHour] = scheduledTime.split(':').map(Number)

      // Get current hour in Asia/Dhaka time zone (UTC+6)
      const nowDhakaStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: 'numeric',
        hour12: false
      }).format(new Date())

      const currentDhakaHour = parseInt(nowDhakaStr, 10)

      if (currentDhakaHour !== scheduledHour) {
        return NextResponse.json({
          success: true,
          skipped: true,
          message: `Current Dhaka hour (${currentDhakaHour}:00) does not match scheduled hour (${scheduledHour}:00).`
        })
      }
    }

    const result = await sendDailyPendingOrdersSummary(targetEmail)
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Daily digest cron execution error:', error)
    return NextResponse.json({ error: error.message || 'Daily digest cron failed' }, { status: 500 })
  }
}

// POST: Triggered by Admin "Send Test Summary Now" button
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { email } = body

    const result = await sendDailyPendingOrdersSummary(email)
    if (!result.success) {
      return NextResponse.json({ error: result.reason || result.error || 'Failed to send summary email' }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Daily digest test execution error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send summary' }, { status: 500 })
  }
}
