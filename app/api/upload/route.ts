import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { verifyStaffAuth } from '@/utils/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStaffAuth(['shop_owner', 'admin', 'staff'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'uploads'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Size limit: 10MB
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Supported formats
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: JPG, PNG, WebP, GIF, SVG, MP4, WebM.` },
        { status: 400 }
      )
    }

    const bucketName = 'store-assets'

    // Ensure bucket exists (attempt to get, if error try create)
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some((b) => b.name === bucketName)
      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 52428800 // 50MB
        })
      }
    } catch {
      // Continue if already exists or permission restricted
    }

    // Sanitize filename
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase()
    const filePath = `${folder}/${Date.now()}-${cleanName}`

    // ArrayBuffer to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message || 'Upload failed' }, { status: 500 })
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: filePath,
      size: file.size,
      type: file.type,
      name: file.name
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error during upload' }, { status: 500 })
  }
}
