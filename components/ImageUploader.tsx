'use client'

import React, { useState, useRef, useMemo } from 'react'
import { UploadCloud, X, Loader2, Play, Image as ImageIcon, CheckCircle2, ExternalLink, RefreshCw, Trash2 } from 'lucide-react'

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
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
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

        const finish = () => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                  type: 'image/webp',
                  lastModified: Date.now()
                })
                resolve(compressedFile)
              } else {
                resolve(file)
              }
            },
            'image/webp',
            0.85
          )
        }

        // Apply watermark if enabled and logo URL is valid
        if (watermarkEnabled && watermarkLogoUrl && typeof watermarkLogoUrl === 'string' && watermarkLogoUrl.startsWith('http')) {
          const watermarkImg = new Image()
          watermarkImg.crossOrigin = 'anonymous'
          watermarkImg.src = watermarkLogoUrl
          watermarkImg.onload = () => {
            const wmMaxDim = Math.min(width, height) * 0.18
            let wmW = watermarkImg.width
            let wmH = watermarkImg.height
            if (wmW > wmH) {
              wmH = (wmH * wmMaxDim) / wmW
              wmW = wmMaxDim
            } else {
              wmW = (wmW * wmMaxDim) / wmH
              wmH = wmMaxDim
            }
            const padding = 16
            const posX = width - wmW - padding
            const posY = height - wmH - padding

            ctx.globalAlpha = 0.65
            ctx.drawImage(watermarkImg, posX, posY, wmW, wmH)
            ctx.globalAlpha = 1.0
            finish()
          }
          watermarkImg.onerror = () => {
            finish()
          }
        } else {
          finish()
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
  maxImages = 8,
  allowVideo = false,
  label,
  description = 'PNG, JPG, WEBP up to 10MB',
  single = false
}: ImageUploaderProps) {
  const { settings } = useStore()
  const [uploading, setUploading] = useState(false)
  const [progressText, setProgressText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Max 10MB file limit
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

  // Normalize current items array
  const currentItems: string[] = useMemo(() => {
    if (single) {
      if (typeof value === 'string' && value.trim()) return [value.trim()]
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && value[0].trim()) return [value[0].trim()]
      return []
    }
    if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string' && Boolean(v.trim()))
    if (typeof value === 'string' && value.trim()) return [value.trim()]
    return []
  }, [value, single])

  const isVideo = (url: string) => {
    return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url)
  }

  const existingVideos = currentItems.filter(isVideo)
  const existingImages = currentItems.filter((url) => !isVideo(url))

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setErrorMsg('')
    setUploadSuccess(false)
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
            setUploadSuccess(true)
            setTimeout(() => setUploadSuccess(false), 4000)
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
          setProgressText(`Uploading video ${file.name}...`)
          const uploadedUrl = await uploadSingleFile(file, folder)
          if (uploadedUrl) newUrls.push(uploadedUrl)
        } else {
          if (existingImages.length + newUrls.filter((u) => !isVideo(u)).length >= maxImages) {
            setErrorMsg(`Maximum limit of ${maxImages} images reached.`)
            continue
          }
          setProgressText(`Processing ${file.name}...`)
          const processedFile = await compressImage(file, settings?.logo_url, settings?.watermark_enabled)
          setProgressText(`Uploading ${file.name}...`)
          const uploadedUrl = await uploadSingleFile(processedFile, folder)
          if (uploadedUrl) newUrls.push(uploadedUrl)
        }
      }

      if (!single && newUrls.length > 0) {
        onChange([...currentItems, ...newUrls])
        setUploadSuccess(true)
        setTimeout(() => setUploadSuccess(false), 4000)
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
    setUploadSuccess(false)
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

      {/* Upload Success Alert */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>✓ File uploaded and updated successfully!</span>
        </div>
      )}

      {/* SINGLE IMAGE PREVIEW CARD */}
      {single && currentItems.length > 0 ? (
        <div className="relative flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/80 shadow-sm">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          {/* Image Thumbnail */}
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentItems[0]}
              alt="Uploaded file"
              className="h-full w-full object-contain p-1"
            />
          </div>

          {/* Details & Actions */}
          <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Image active & saved</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-full font-mono">
              {currentItems[0]}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-medium shadow-sm transition"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                <span>{uploading ? 'Uploading...' : 'Replace'}</span>
              </button>
              <a
                href={currentItems[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 text-xs font-medium shadow-sm transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Full</span>
              </a>
              <button
                type="button"
                onClick={() => handleRemove(0)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Dropzone */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFiles(e.dataTransfer.files)
          }}
          className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
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
      )}

      {errorMsg && (
        <p className="text-xs font-semibold text-red-500">{errorMsg}</p>
      )}

      {/* MULTIPLE Media Previews Grid */}
      {!single && currentItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
          {currentItems.map((url, idx) => {
            const videoItem = isVideo(url)
            return (
              <div
                key={`${url}-${idx}`}
                className="group relative aspect-square rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shadow-sm"
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
                {idx === 0 && (
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
