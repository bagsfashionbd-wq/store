import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// GET: Fetch currently logged-in customer profile
export async function GET() {
  try {
    const userClient = await createClient()
    const { data: { user }, error: authErr } = await userClient.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ customer: null })
    }

    const adminDb = createAdminClient()
    const cleanEmail = user.email?.toLowerCase().trim() || ''

    const { data: customer, error } = await adminDb
      .from('customers')
      .select('*')
      .or(`user_id.eq.${user.id},email.ilike.${cleanEmail}`)
      .single()

    if (error || !customer) {
      // If customer record doesn't exist yet but user exists in auth.users
      return NextResponse.json({
        customer: {
          id: user.id,
          user_id: user.id,
          full_name: user.user_metadata?.full_name || cleanEmail.split('@')[0],
          phone: user.user_metadata?.phone || '',
          email: cleanEmail
        }
      })
    }

    return NextResponse.json({ customer })
  } catch (error: any) {
    console.error('Customer profile fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch customer profile' }, { status: 500 })
  }
}

// PATCH: Update customer profile
export async function PATCH(request: NextRequest) {
  try {
    const userClient = await createClient()
    const { data: { user }, error: authErr } = await userClient.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = createAdminClient()
    const body = await request.json()
    const { full_name, phone, avatar_url, address, city_id, zone_id, area_id } = body

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (full_name !== undefined) updates.full_name = full_name.trim()
    if (phone !== undefined) updates.phone = phone.trim().replace(/[^0-9+]/g, '')
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (address !== undefined) updates.address = address.trim()
    if (city_id !== undefined) updates.city_id = Number(city_id || 0)
    if (zone_id !== undefined) updates.zone_id = Number(zone_id || 0)
    if (area_id !== undefined) updates.area_id = Number(area_id || 0)

    const { data: updatedCustomer, error } = await adminDb
      .from('customers')
      .update(updates)
      .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, customer: updatedCustomer })
  } catch (error: any) {
    console.error('Customer profile update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 })
  }
}
