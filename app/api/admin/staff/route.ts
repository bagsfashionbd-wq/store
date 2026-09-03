import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { verifyStaffAuth } from '@/utils/auth'

export const dynamic = 'force-dynamic'

// GET: List all staff members (Admins and Shop Owners only)
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin'])
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()

    const { data: staffList, error } = await supabase
      .from('staff_members')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Error fetching staff members:', error.message)
      return NextResponse.json({ success: true, data: [] })
    }

    return NextResponse.json({ success: true, data: staffList || [] })
  } catch (err: any) {
    console.error('Staff GET error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// POST: Add new staff member (creates auth user + staff_members record)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin'])
    if (!auth.authorized) {
      const errMsg = typeof auth.error === 'string' ? auth.error : 'Unauthorized access. Staff account not found.'
      return NextResponse.json({ success: false, error: errMsg }, { status: auth.status || 403 })
    }

    const body = await request.json()
    const { email, password, full_name, role = 'staff', phone = '' } = body

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { success: false, error: 'Full Name, Email, and Password are required.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanRole = role === 'admin' || role === 'shop_owner' ? role : 'staff'
    const supabase = createAdminClient()

    // Pre-check: Does staff member already exist in staff_members table?
    const { data: existingStaff } = await supabase
      .from('staff_members')
      .select('id, full_name, email')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (existingStaff) {
      return NextResponse.json(
        { success: false, error: `A staff member with email "${cleanEmail}" already exists.` },
        { status: 400 }
      )
    }

    // Helper to format auth errors nicely
    const formatAuthError = (err: any): string => {
      if (!err) return 'Unknown authentication error'
      if (typeof err === 'string' && err.trim().length > 0) return err
      if (err.message && typeof err.message === 'string' && err.message.trim().length > 0) return err.message
      if (err.error_description && typeof err.error_description === 'string') return err.error_description
      if (err.msg && typeof err.msg === 'string') return err.msg
      if (err.description && typeof err.description === 'string') return err.description
      if (err.code === 'not_admin' || err.status === 403) {
        return 'Supabase Service Role Key is invalid or unauthorized. Please verify SUPABASE_SERVICE_ROLE_KEY in your Vercel / environment settings.'
      }
      if (err.code) return `Supabase Auth Error (${err.code})`
      return 'Failed to register credentials in authentication service.'
    }

    // 1. Create User in Supabase Auth via Admin API
    let authUserId: string | null = null
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: cleanRole
      }
    })

    if (authError) {
      const authErrMsg = (authError.message || '').toLowerCase()
      const authErrCode = (authError as any).code || ''

      // If user already exists in auth.users (e.g. from customer signups or previous creation)
      if (
        authErrMsg.includes('already registered') ||
        authErrMsg.includes('already exists') ||
        authErrCode === 'email_exists' ||
        authError.status === 422
      ) {
        // Fetch auth user ID from Supabase auth users
        try {
          const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
          const matched = usersData?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail)
          if (matched) {
            authUserId = matched.id
            // Update their password and role metadata so they can log in
            await supabase.auth.admin.updateUserById(matched.id, {
              password: password,
              email_confirm: true,
              user_metadata: {
                full_name,
                role: cleanRole
              }
            })
          }
        } catch (findErr) {
          console.warn('Could not list users for fallback ID matching:', findErr)
        }
      } else if (authErrCode === 'not_admin' || authError.status === 403) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication Error: Supabase Service Role Key unauthorized or missing. Please ensure SUPABASE_SERVICE_ROLE_KEY is set with your Supabase service_role secret key in Vercel environment variables.'
          },
          { status: 403 }
        )
      } else {
        const errorMsg = formatAuthError(authError)
        return NextResponse.json(
          { success: false, error: `Authentication Error: ${errorMsg}` },
          { status: 400 }
        )
      }
    } else if (authUser?.user) {
      authUserId = authUser.user.id
    }

    // 2. Insert into public.staff_members
    const { data: newStaff, error: insertError } = await supabase
      .from('staff_members')
      .insert({
        user_id: authUserId,
        email: cleanEmail,
        full_name,
        role: cleanRole,
        phone: phone || '',
        status: 'active'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting staff member:', insertError)
      return NextResponse.json(
        { success: false, error: `Database Error: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: newStaff })
  } catch (err: any) {
    console.error('Staff POST error:', err)
    const errText = typeof err?.message === 'string' ? err.message : 'Failed to create staff member.'
    return NextResponse.json({ success: false, error: errText }, { status: 500 })
  }
}

// PATCH: Update staff member (Role, Status, Name, Password)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin'])
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { id, role, status, full_name, phone, password } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Staff ID is required.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Fetch current staff record
    const { data: currentStaff, error: fetchErr } = await supabase
      .from('staff_members')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !currentStaff) {
      return NextResponse.json({ success: false, error: 'Staff member not found.' }, { status: 404 })
    }

    // 2. Build update payload
    const updates: any = { updated_at: new Date().toISOString() }
    if (role !== undefined) {
      updates.role = role === 'admin' || role === 'shop_owner' ? role : 'staff'
    }
    if (status !== undefined) {
      updates.status = status === 'suspended' ? 'suspended' : 'active'
    }
    if (full_name !== undefined) updates.full_name = full_name
    if (phone !== undefined) updates.phone = phone

    // 3. Update staff_members table
    const { data: updatedStaff, error: updateErr } = await supabase
      .from('staff_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
    }

    // 4. If password was provided & user_id exists, update auth user password
    if (password && currentStaff.user_id) {
      await supabase.auth.admin.updateUserById(currentStaff.user_id, {
        password: password,
        user_metadata: {
          full_name: updates.full_name || currentStaff.full_name,
          role: updates.role || currentStaff.role
        }
      })
    }

    return NextResponse.json({ success: true, data: updatedStaff })
  } catch (err: any) {
    console.error('Staff PATCH error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// DELETE: Remove staff member
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin'])
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Staff ID is required.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Fetch staff member to get auth user_id
    const { data: staffMember } = await supabase
      .from('staff_members')
      .select('*')
      .eq('id', id)
      .single()

    if (!staffMember) {
      return NextResponse.json({ success: false, error: 'Staff member not found.' }, { status: 404 })
    }

    // 2. Delete from staff_members table
    const { error: deleteErr } = await supabase
      .from('staff_members')
      .delete()
      .eq('id', id)

    if (deleteErr) {
      return NextResponse.json({ success: false, error: deleteErr.message }, { status: 500 })
    }

    // 3. Delete auth account if user_id exists
    if (staffMember.user_id) {
      try {
        await supabase.auth.admin.deleteUser(staffMember.user_id)
      } catch (authDelErr) {
        console.warn('Could not delete auth user (may already be deleted):', authDelErr)
      }
    }

    return NextResponse.json({ success: true, message: 'Staff member removed successfully.' })
  } catch (err: any) {
    console.error('Staff DELETE error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
