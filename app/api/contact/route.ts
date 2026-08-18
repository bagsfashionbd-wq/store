import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// POST: Public submission of contact form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, subject, message } = body

    if (!name?.trim() || !phone?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Name, phone number, and message are required.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        subject: subject?.trim() || 'General Inquiry',
        message: message.trim(),
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Contact Form Save Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully!' })
  } catch (err: any) {
    console.error('Contact API Exception:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// GET: Fetch all messages (Admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH: Toggle is_read or delete (Admin)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { id, is_read, action } = body

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    if (action === 'delete') {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id)
      if (error) throw error
      return NextResponse.json({ success: true, deleted: true })
    }

    const { data, error } = await supabase
      .from('contact_messages')
      .update({ is_read: Boolean(is_read) })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
