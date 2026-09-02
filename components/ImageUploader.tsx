'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, X, Loader2, Play, Image as ImageIcon, CheckCircle } from 'lucide-react'

import { useStore } from '@/context/StoreContext'

interface ImageUploaderProps {
  value?: string | string[]
  onChange: (value: any) => void
  folder?: string
  maxImages?: number
  allowVideo?: boolean
  label?: string
  description?: string
  single?: boolean
}

// Client-side canvas compression for images with optional watermark
async function compressImage(file: File, watermarkLogoUrl?: string, watermarkEnabled?: boolean): Promise<File> {
  // If not image or is SVG / GIF, return as-is
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Max dimension: 1600px
        const MAX_DIM = 1600
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width)
            width = MAX_DIM
          } else {
            width = Math.round((width * MAX_DIM) / height)
            height = MAX_DIM
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        const exportCanvas = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) {
                resolve(file)
              } else {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                  type: 'image/webp',
                  lastModified: Date.now()
                })
                resolve(compressedFile)
              }
            },
            'image/webp',
            0.85
          )
        }

        // Apply watermark if enabled
        if (watermarkEnabled && watermarkLogoUrl && watermarkLogoUrl.trim()) {
          const watermarkImg = new Image()
          watermarkImg.crossOrigin = 'anonymous'
          watermarkImg.src = watermarkLogoUrl
          watermarkImg.onload = () => {
            try {
              const wmSize = Math.max(48, Math.round(Math.min(width, height) * 0.12))
              const padding = Math.round(wmSize * 0.25)
              const x = width - wmSize - padding
              const y = height - wmSize - padding

              ctx.save()
              ctx.globalAlpha = 0.35
              ctx.drawImage(watermarkImg, x, y, wmSize, wmSize)
              ctx.restore()
            } catch (err) {
              console.warn('Could not apply watermark:', err)
            }
            exportCanvas()
          }
          watermarkImg.onerror = () => {
            exportCanvas()
          }
        } else {
          exportCanvas()
        }
      }
      img.onerror = () => resolve(file)
    }
    reader.onerror = () => resolve(file)
  })
}

export default function ImageUploader({
  value,
  onChange,
  folder = 'products',
  maxImages = 5,
  allowVideo = true,
  label = 'Media Files',
  description = 'Upload up to 5 images and 1 optional video',
  single = false
}: ImageUploaderProps) {
  const { settings } = useStore()
  const [uploading, setUploading] = useState(false)
  const [progressText, setProgressText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Max 10MB file limit
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

  // Normalize current items array
  const currentItems: string[] = single
    ? (typeof value === 'string' && value.trim() ? [value] : [])
    : (Array.isArray(value) ? value : (typeof value === 'string' && value.trim() ? [value] : []))

  const isVideo = (url: string) => {
    return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url)
  }

  const existingVideos = currentItems.filter(isVideo)
  const existingImages = currentItems.filter((url) => !isVideo(url))

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setErrorMsg('')
    setUploading(true)

    try {
      const newUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        let file = files[i]

        // Validate 10MB size limit
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setErrorMsg(`"${file.name}" exceeds the 10MB maximum file size limit.`)
          continue
        }

        const isFileVideo = file.type.startsWith('video/')

        if (single) {
          setProgressText(`Uploading ${file.name}...`)
          if (file.type.startsWith('image/')) {
            file = await compressImage(file, settings?.logo_url, settings?.watermark_enabled)
          }
          const uploadedUrl = await uploadSingleFile(file, folder)
          if (uploadedUrl) {
            onChange(uploadedUrl)
          }
          break
        }

        // Multiple mode restrictions:
        if (isFileVideo) {
          if (!allowVideo) {
            setErrorMsg('Videos are not allowed for this field.')
            continue
          }
          if (existingVideos.length > 0 || newUrls.some(isVideo)) {
            setErrorMsg('Only 1 video is allowed per product.')
            continue
          }
        } else {
          const totalImages = existingImages.length + newUrls.filter(u => !isVideo(u)).length
          if (totalImages >= maxImages) {
            setErrorMsg(`Maximum ${maxImages} images allowed.`)
            continue
          }
          setProgressText(`Optimizing image ${i + 1} of ${files.length}...`)
          file = await compressImage(file, settings?.logo_url, settings?.watermark_enabled)
        }

        setProgressText(`Uploading ${file.name}...`)
        const uploadedUrl = await uploadSingleFile(file, folder)
        if (uploadedUrl) {
          newUrls.push(uploadedUrl)
        }
      }

      if (!single && newUrls.length > 0) {
        onChange([...currentItems, ...newUrls])
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Upload failed. Please check your network connection.')
    } finally {
      setUploading(false)
      setProgressText('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const uploadSingleFile = async (file: File, folderName: string): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folderName)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    if (!res.ok || !data.url) {
      throw new Error(data.error || 'Upload error')
    }
    return data.url
  }

  const handleRemove = (indexToRemove: number) => {
    if (single) {
      onChange('')
    } else {
      const updated = currentItems.filter((_, idx) => idx !== indexToRemove)
      onChange(updated)
    }
  }

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            {label}
          </label>
          <span className="text-[11px] text-slate-400">
            {single ? '1 file' : `${existingImages.length}/${maxImages} images • ${existingVideos.length}/1 video`}
          </span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
          uploading
            ? 'border-brand-400 bg-brand-50/50 cursor-wait'
            : 'border-slate-300 bg-slate-50/70 hover:bg-slate-100 hover:border-brand-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={single ? 'image/*' : allowVideo ? 'image/*,video/mp4,video/webm' : 'image/*'}
          multiple={!single}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-brand-600">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-xs font-semibold">{progressText || 'Uploading...'}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="p-2.5 rounded-full bg-white shadow-sm border border-slate-200 mb-2 text-slate-500">
              <UploadCloud className="h-6 w-6 text-brand-600" />
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Click to browse or drag & drop
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {description}
            </p>
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="text-xs font-semibold text-red-500">{errorMsg}</p>
      )}

      {/* Media Previews Grid */}
      {currentItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
          {currentItems.map((url, idx) => {
            const videoItem = isVideo(url)
            return (
              <div
                key={`${url}-${idx}`}
                className="group relative aspect-square rounded-lg border border-slate-200 bg-slate-100 overflow-hidden shadow-sm"
              >
                {videoItem ? (
                  <div className="h-full w-full relative flex items-center justify-center bg-slate-900 text-white">
                    <video src={url} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="h-6 w-6 text-white fill-current opacity-80" />
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] font-bold px-1.5 py-0.5 rounded text-white uppercase">
                      Video
                    </span>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt="Upload thumbnail"
                    className="h-full w-full object-cover object-center"
                  />
                )}

                {/* Primary Badge */}
                {idx === 0 && !single && (
                  <span className="absolute top-1 left-1 bg-brand-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                    Cover
                  </span>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(idx)
                  }}
                  className="absolute top-1 right-1 rounded-full bg-slate-900/80 text-white p-1 hover:bg-red-600 transition shadow"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
