import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const adminDb = createAdminClient()
    const body = await request.json()
    const { action } = body

    // 1. CHECK PHONE NUMBER (Used on checkout to detect if customer exists)
    if (action === 'check-phone') {
      const { phone } = body
      if (!phone) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
      }

      const cleanPhone = phone.trim().replace(/[^0-9+]/g, '')
      const { data: existingCustomer } = await adminDb
        .from('customers')
        .select('id, full_name, email, phone')
        .eq('phone', cleanPhone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingCustomer) {
        return NextResponse.json({
          exists: true,
          email: existingCustomer.email,
          fullName: existingCustomer.full_name
        })
      }

      return NextResponse.json({ exists: false })
    }

    // 2. SIGNUP ACTION
    if (action === 'signup') {
      const { full_name, phone, email, password } = body

      if (!full_name || !phone || !email || !password) {
        return NextResponse.json({ error: 'Full name, phone, email, and password are all required.' }, { status: 400 })
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 })
      }

      const cleanEmail = email.toLowerCase().trim()
      const cleanPhone = phone.trim().replace(/[^0-9+]/g, '')

      // Check if phone is already registered
      const { data: phoneCheck } = await adminDb
        .from('customers')
        .select('id')
        .eq('phone', cleanPhone)
        .limit(1)

      if (phoneCheck && phoneCheck.length > 0) {
        return NextResponse.json({ error: 'An account with this phone number already exists. Please log in.' }, { status: 400 })
      }

      // Check if email is already registered
      const { data: emailCheck } = await adminDb
        .from('customers')
        .select('id')
        .eq('email', cleanEmail)
        .limit(1)

      if (emailCheck && emailCheck.length > 0) {
        return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 400 })
      }

      // Create Supabase Auth user
      const { data: authData, error: authErr } = await adminDb.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
          phone: cleanPhone,
          role: 'customer'
        }
      })

      if (authErr || !authData.user) {
        // If user already exists in auth.users
        if (authErr?.message?.includes('already been registered') || authErr?.message?.includes('already exists')) {
          return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 400 })
        }
        throw authErr || new Error('Failed to create customer auth user')
      }

      const userId = authData.user.id

      // Create public.customers entry
      const { data: customerRecord, error: custErr } = await adminDb
        .from('customers')
        .insert({
          user_id: userId,
          full_name: full_name.trim(),
          phone: cleanPhone,
          email: cleanEmail,
          address: body.address || '',
          city_id: Number(body.city_id || 0),
          zone_id: Number(body.zone_id || 0),
          area_id: Number(body.area_id || 0)
        })
        .select()
        .single()

      if (custErr) {
        console.error('Failed to create customer table record:', custErr)
      }

      // Link newly created or past orders to this customer account
      const customerId = customerRecord?.id || userId
      if (body.order_id) {
        await adminDb
          .from('orders')
          .update({ customer_id: customerId })
          .eq('id', body.order_id)
      }

      // Retroactively link any guest orders with matching phone or email
      await adminDb
        .from('orders')
        .update({ customer_id: customerId })
        .or(`customer_phone.eq.${cleanPhone},customer_email.ilike.${cleanEmail}`)
        .is('customer_id', null)

      // Automatically sign in the new customer to generate session
      const userClient = await createClient()
      const { data: signInData, error: signInErr } = await userClient.auth.signInWithPassword({
        email: cleanEmail,
        password
      })

      return NextResponse.json({
        success: true,
        session: signInData?.session || null,
        customer: customerRecord || { 
          id: userId, 
          full_name, 
          phone: cleanPhone, 
          email: cleanEmail,
          address: body.address || '',
          city_id: Number(body.city_id || 0),
          zone_id: Number(body.zone_id || 0),
          area_id: Number(body.area_id || 0)
        }
      })
    }

    // 3. LOGIN ACTION (Supports logging in with Email OR Phone)
    if (action === 'login') {
      const { identifier, password } = body

      if (!identifier || !password) {
        return NextResponse.json({ error: 'Email or phone number and password are required.' }, { status: 400 })
      }

      const cleanInput = identifier.trim()
      let emailToAuth = cleanInput.toLowerCase()

      // If identifier doesn't have '@', it's a phone number -> look up associated email
      if (!cleanInput.includes('@')) {
        const cleanPhone = cleanInput.replace(/[^0-9+]/g, '')
        const { data: matchedCustomer } = await adminDb
          .from('customers')
          .select('email')
          .eq('phone', cleanPhone)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!matchedCustomer || !matchedCustomer.email) {
          return NextResponse.json({ error: 'No customer account found with this phone number.' }, { status: 404 })
        }

        emailToAuth = matchedCustomer.email.toLowerCase().trim()
      }

      // Perform GoTrue Sign In
      const userClient = await createClient()
      const { data: signInData, error: signInErr } = await userClient.auth.signInWithPassword({
        email: emailToAuth,
        password
      })

      if (signInErr || !signInData.session) {
        return NextResponse.json({
          error: 'Incorrect email/phone number or password. Please try again.'
        }, { status: 401 })
      }

      // Fetch customer profile
      const { data: customerRecord } = await adminDb
        .from('customers')
        .select('*')
        .or(`user_id.eq.${signInData.user.id},email.ilike.${emailToAuth}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        session: signInData.session,
        customer: customerRecord || null
      })
    }

    // 4. FORGOT PASSWORD ACTION
    if (action === 'forgot-password') {
      const { email } = body
      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 })
      }

      const cleanEmail = email.toLowerCase().trim()
      const userClient = await createClient()
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      const { error: resetErr } = await userClient.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${APP_URL}/account?tab=password`
      })

      if (resetErr) {
        console.error('Password reset request error:', resetErr)
      }

      // Always return success for security (avoid enumeration)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Customer auth API error:', error)
    return NextResponse.json({ error: error.message || 'Authentication processing error' }, { status: 500 })
  }
}
