import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userClient = await createClient()
    const { data: { user }, error: authErr } = await userClient.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { new_password } = body

    if (!new_password || new_password.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 })
    }

    const { error: updateErr } = await userClient.auth.updateUser({
      password: new_password
    })

    if (updateErr) throw updateErr

    return NextResponse.json({ success: true, message: 'Password updated successfully!' })
  } catch (error: any) {
    console.error('Password update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update password' }, { status: 500 })
  }
}
