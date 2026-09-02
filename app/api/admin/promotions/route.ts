import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { verifyStaffAuth } from '@/utils/auth'

export const dynamic = 'force-dynamic'

// GET: Fetch all promotions
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Failed to fetch promotions:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch promotions' }, { status: 500 })
  }
}

// POST: Create promotion
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const { type, title, message, image_url, link_url, is_active, start_date, end_date } = body

    if (!type || (type !== 'banner' && type !== 'ribbon')) {
      return NextResponse.json({ error: 'Valid promotion type (banner or ribbon) is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('promotions')
      .insert({
        type,
        title: title || '',
        message: message || '',
        image_url: image_url || '',
        link_url: link_url || '',
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        start_date: start_date ? new Date(start_date).toISOString() : new Date().toISOString(),
        end_date: end_date ? new Date(end_date).toISOString() : null
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Failed to create promotion:', error)
    return NextResponse.json({ error: error.message || 'Failed to create promotion' }, { status: 500 })
  }
}

// PUT: Update promotion
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const { id, type, title, message, image_url, link_url, is_active, start_date, end_date } = body

    if (!id) {
      return NextResponse.json({ error: 'Promotion ID is required' }, { status: 400 })
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (type !== undefined) updates.type = type
    if (title !== undefined) updates.title = title
    if (message !== undefined) updates.message = message
    if (image_url !== undefined) updates.image_url = image_url
    if (link_url !== undefined) updates.link_url = link_url
    if (is_active !== undefined) updates.is_active = Boolean(is_active)
    if (start_date !== undefined) updates.start_date = start_date ? new Date(start_date).toISOString() : new Date().toISOString()
    if (end_date !== undefined) updates.end_date = end_date ? new Date(end_date).toISOString() : null

    const { data, error } = await supabase
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Failed to update promotion:', error)
    return NextResponse.json({ error: error.message || 'Failed to update promotion' }, { status: 500 })
  }
}

// DELETE: Delete promotion
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Promotion ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete promotion:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete promotion' }, { status: 500 })
  }
}
