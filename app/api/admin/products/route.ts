import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const userClient = await createClient()

    // Check if user is authenticated and is admin
    const { data: { user } } = await userClient.auth.getUser()
    const adminEmail = 'admin@example.com'
    if (!user || (user.email !== adminEmail && !user.email?.includes('admin') && user.email !== 'sakib.samadhan@gmail.com')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const payload = await request.json()

    // Use admin client to bypass RLS policies
    const adminDb = createAdminClient()
    const { data, error } = await adminDb
      .from('products')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Failed to create product:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('Product Creation Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userClient = await createClient()

    // Check if user is authenticated and is admin
    const { data: { user } } = await userClient.auth.getUser()
    const adminEmail = 'admin@example.com'
    if (!user || (user.email !== adminEmail && !user.email?.includes('admin') && user.email !== 'sakib.samadhan@gmail.com')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Use admin client to bypass RLS policies
    const adminDb = createAdminClient()
    const { error } = await adminDb
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete product:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Product Deletion Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userClient = await createClient()

    // Check if user is authenticated and is admin
    const { data: { user } } = await userClient.auth.getUser()
    const adminEmail = 'admin@example.com'
    if (!user || (user.email !== adminEmail && !user.email?.includes('admin') && user.email !== 'sakib.samadhan@gmail.com')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const { id, ...payload } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Use admin client to bypass RLS policies
    const adminDb = createAdminClient()
    const { data, error } = await adminDb
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update product:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('Product Update Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userClient = await createClient()

    const { data: { user } } = await userClient.auth.getUser()
    const adminEmail = 'admin@example.com'
    if (!user || (user.email !== adminEmail && !user.email?.includes('admin') && user.email !== 'sakib.samadhan@gmail.com')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    const { id, is_hidden, is_featured } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {}
    if (is_hidden !== undefined) updatePayload.is_hidden = Boolean(is_hidden)
    if (is_featured !== undefined) updatePayload.is_featured = Boolean(is_featured)

    const adminDb = createAdminClient()
    const { data, error } = await adminDb
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
