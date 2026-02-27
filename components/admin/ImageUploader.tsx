'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, RefreshCw, AlertCircle, FileImage } from 'lucide-react'
import Image from 'next/image'

interface FileInfo {
  name: string
  size: string
  resolution: string
  type: string
}

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
  className?: string
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ImageUploader({
  value,
  onChange,
  folder = 'uploads',
  label = 'Upload Image',
  className = '',
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only PNG, JPG, and WEBP are allowed.'
    }
    if (file.size > MAX_SIZE) {
      return 'File too large. Maximum size is 10MB.'
    }
    return null
  }

  const getImageResolution = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        resolve(`${img.naturalWidth} x ${img.naturalHeight} px`)
        URL.revokeObjectURL(img.src)
      }
      img.onerror = () => {
        resolve('Unknown')
        URL.revokeObjectURL(img.src)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null)

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setIsUploading(true)

      try {
        // Get resolution before uploading
        const resolution = await getImageResolution(file)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Upload failed')
        }

        const data = await response.json()

        setFileInfo({
          name: file.name,
          size: formatFileSize(file.size),
          resolution,
          type: file.type.split('/')[1].toUpperCase(),
        })

        onChange(data.url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setIsUploading(false)
      }
    },
    [folder, onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        uploadFile(file)
      }
    },
    [uploadFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        uploadFile(file)
      }
      // Reset input so the same file can be re-selected
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [uploadFile]
  )

  const handleRemove = useCallback(async () => {
    if (value) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: value }),
        })
      } catch {
        // Silently fail on delete - the URL is still removed from the form
      }
    }
    onChange('')
    setFileInfo(null)
    setError(null)
  }, [value, onChange])

  const handleReplace = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Has image - show preview */}
      {value ? (
        <div className="space-y-3">
          <div className="relative rounded-xl border border-border overflow-hidden bg-muted">
            <div className="relative aspect-[4/3] max-h-64">
              <Image
                src={value}
                alt="Uploaded image"
                fill
                className="object-contain"
              />
            </div>

            {/* Overlay actions */}
            <div className="absolute top-2 right-2 flex gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 gap-1.5 bg-background/90 hover:bg-background shadow-sm"
                onClick={handleReplace}
                disabled={isUploading}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Replace
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-8 w-8 p-0 shadow-sm"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* File info */}
          {fileInfo && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted text-sm">
              <FileImage className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="space-y-0.5 min-w-0">
                <p className="font-medium truncate">{fileInfo.name}</p>
                <p className="text-xs text-muted-foreground">
                  {fileInfo.resolution} &middot; {fileInfo.size} &middot; {fileInfo.type}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* No image - show upload area */
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/50'
          } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <div className="space-y-3">
              <RefreshCw className="w-10 h-10 mx-auto text-muted-foreground animate-spin" />
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag and drop or click to browse
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
