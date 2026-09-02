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

    const { data: customer } = await adminDb
      .from('customers')
      .select('*')
      .or(`user_id.eq.${user.id},email.ilike.${cleanEmail}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!customer) {
      // If customer record doesn't exist yet but user exists in auth.users
      return NextResponse.json({
        customer: {
          id: user.id,
          user_id: user.id,
          full_name: user.user_metadata?.full_name || cleanEmail.split('@')[0],
          phone: user.user_metadata?.phone || '',
          email: cleanEmail,
          address: '',
          city_id: 0,
          zone_id: 0,
          area_id: 0
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

    const cleanEmail = user.email?.toLowerCase().trim() || ''
    const cleanPhone = phone !== undefined ? phone.trim().replace(/[^0-9+]/g, '') : undefined
    const cleanName = full_name !== undefined ? full_name.trim() : undefined

    // Check if customer record exists
    const { data: existingCustomer } = await adminDb
      .from('customers')
      .select('*')
      .or(`user_id.eq.${user.id},email.ilike.${cleanEmail}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let updatedCustomer: any = null

    if (existingCustomer) {
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
        user_id: user.id,
        email: cleanEmail
      }

      if (cleanName !== undefined) updates.full_name = cleanName
      if (cleanPhone !== undefined) updates.phone = cleanPhone
      if (avatar_url !== undefined) updates.avatar_url = avatar_url
      if (address !== undefined) updates.address = address.trim()
      if (city_id !== undefined) updates.city_id = Number(city_id || 0)
      if (zone_id !== undefined) updates.zone_id = Number(zone_id || 0)
      if (area_id !== undefined) updates.area_id = Number(area_id || 0)

      const { data, error } = await adminDb
        .from('customers')
        .update(updates)
        .eq('id', existingCustomer.id)
        .select()
        .maybeSingle()

      if (error) throw error
      updatedCustomer = data || { ...existingCustomer, ...updates }
    } else {
      // Create new customer record for this user
      const newCustomer = {
        user_id: user.id,
        email: cleanEmail,
        full_name: cleanName || user.user_metadata?.full_name || cleanEmail.split('@')[0],
        phone: cleanPhone || user.user_metadata?.phone || '',
        avatar_url: avatar_url || null,
        address: address ? address.trim() : '',
        city_id: Number(city_id || 0),
        zone_id: Number(zone_id || 0),
        area_id: Number(area_id || 0),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await adminDb
        .from('customers')
        .insert(newCustomer)
        .select()
        .maybeSingle()

      if (error) throw error
      updatedCustomer = data || newCustomer
    }

    // Sync auth user metadata
    try {
      if (cleanName || cleanPhone) {
        await userClient.auth.updateUser({
          data: {
            ...(cleanName ? { full_name: cleanName } : {}),
            ...(cleanPhone ? { phone: cleanPhone } : {})
          }
        })
      }
    } catch (metaErr) {
      console.warn('Could not sync user metadata:', metaErr)
    }

    return NextResponse.json({ success: true, customer: updatedCustomer })
  } catch (error: any) {
    console.error('Customer profile update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 })
  }
}
