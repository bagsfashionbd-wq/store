import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired (maintains login state)
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  let isAuthorized = false
  let userRole: 'admin' | 'shop_owner' | 'staff' = 'staff'
  let isSuspended = false

  if (user && user.email) {
    const cleanEmail = user.email.toLowerCase()
    
    // Check staff_members table
    try {
      const { data: staffMember } = await supabase
        .from('staff_members')
        .select('role, status')
        .eq('email', cleanEmail)
        .single()

      if (staffMember) {
        if (staffMember.status === 'suspended') {
          isSuspended = true
        } else {
          isAuthorized = true
          userRole = staffMember.role as any
        }
      } else {
        // Fallback for primary founder/admin
        const isFounder = (
          cleanEmail === 'sakib.samadhan@gmail.com' ||
          cleanEmail === 'admin@example.com' ||
          cleanEmail.includes('admin') ||
          user.user_metadata?.role === 'admin' ||
          user.user_metadata?.role === 'shop_owner'
        )
        if (isFounder) {
          isAuthorized = true
          userRole = 'shop_owner'
        }
      }
    } catch {
      // Fallback
      if (cleanEmail === 'sakib.samadhan@gmail.com' || cleanEmail.includes('admin')) {
        isAuthorized = true
        userRole = 'shop_owner'
      }
    }
  }

  // If visiting /stradmn/login while already logged in as authorized staff -> redirect to /stradmn
  if (pathname === '/stradmn/login') {
    if (isAuthorized && !isSuspended) {
      const url = request.nextUrl.clone()
      url.pathname = '/stradmn'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Protect /stradmn routes
  if (pathname.startsWith('/stradmn')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/stradmn/login'
      return NextResponse.redirect(url)
    }

    if (isSuspended) {
      const url = request.nextUrl.clone()
      url.pathname = '/stradmn/login'
      url.searchParams.set('error', 'suspended')
      return NextResponse.redirect(url)
    }

    if (!isAuthorized) {
      const url = request.nextUrl.clone()
      url.pathname = '/stradmn/login'
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }

    // Role-Based Route Protection:
    // 'staff' role cannot access /stradmn/stats, /stradmn/settings, or /stradmn/staff
    const isRestrictedForStaff = (
      pathname.startsWith('/stradmn/stats') ||
      pathname.startsWith('/stradmn/settings') ||
      pathname.startsWith('/stradmn/staff')
    )

    if (userRole === 'staff' && isRestrictedForStaff) {
      const url = request.nextUrl.clone()
      url.pathname = '/stradmn'
      url.searchParams.set('notice', 'access_restricted')
      return NextResponse.redirect(url)
    }
  }

  // Legacy route protection / redirect
  if (pathname.startsWith('/admin') || pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = isAuthorized ? '/stradmn' : '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
