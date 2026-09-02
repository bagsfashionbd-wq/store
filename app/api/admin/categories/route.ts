import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { verifyStaffAuth } from '@/utils/auth'

export const dynamic = 'force-dynamic'

// GET: Fetch all categories
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST: Create category
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin', 'staff'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const { name, slug, description, parent_id } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        description: description?.trim() || null,
        parent_id: parent_id || null
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Failed to create category:', error)
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 })
  }
}

// PUT: Update category
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin', 'staff'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const { id, name, slug, description, parent_id } = body

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Prevent category from being its own parent
    const safeParentId = parent_id === id ? null : (parent_id || null)

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: name.trim(),
        slug: cleanSlug,
        description: description?.trim() || null,
        parent_id: safeParentId
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Failed to update category:', error)
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 })
  }
}

// DELETE: Delete category
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin', 'staff'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // First detach any children pointing to this category
    await supabase
      .from('categories')
      .update({ parent_id: null })
      .eq('parent_id', id)

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete category:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 })
  }
}
