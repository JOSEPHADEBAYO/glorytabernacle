'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface FileUploadFieldProps {
  label: string
  accept: string // e.g., "image/jpeg,image/png" or "application/pdf"
  maxSize: number // in bytes
  currentUrl?: string
  onUpload: (url: string) => void
  onRemove: () => void
  error?: string
}

export function FileUploadField({
  label,
  accept,
  maxSize,
  currentUrl,
  onUpload,
  onRemove,
  error: externalError,
}: FileUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine if this is for images or PDFs based on accept prop
  const isImageUpload = accept.includes('image/')
  const isPdfUpload = accept.includes('application/pdf')

  // Format max size for display
  const maxSizeMB = maxSize / (1024 * 1024)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear previous errors
    setError(null)

    // Validate file type
    const acceptedTypes = accept.split(',').map((t) => t.trim())
    if (!acceptedTypes.includes(file.type)) {
      const expectedTypes = isImageUpload
        ? 'JPG or PNG'
        : isPdfUpload
        ? 'PDF'
        : 'the specified format'
      setError(`Invalid file type. Expected ${expectedTypes}.`)
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`)
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Upload file
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      onUpload(data.url)
      
      // Reset the input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('File upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  function handleRemove() {
    setError(null)
    onRemove()
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Extract filename from URL for display
  function getFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const parts = pathname.split('/')
      return parts[parts.length - 1] || 'document.pdf'
    } catch {
      return 'document.pdf'
    }
  }

  const displayError = error || externalError

  return (
    <div className="file-upload-field">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {currentUrl ? (
        <div className="file-preview border border-gray-200 rounded-lg p-4 bg-gray-50">
          {isImageUpload ? (
            <div className="space-y-3">
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={currentUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="w-full px-3 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Remove Image
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 text-red-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getFilenameFromUrl(currentUrl)}
                  </p>
                  <p className="text-xs text-gray-500">PDF Document</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="w-full px-3 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Remove PDF
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="file-input-wrapper">
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <svg
                  className="animate-spin h-10 w-10 text-blue-600 mb-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm text-gray-600 font-medium">
                  Uploading...
                </span>
              </div>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-10 h-10 text-gray-400 mb-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span className="text-sm text-gray-600 mb-1">
                  Click to upload {isImageUpload ? 'image' : isPdfUpload ? 'PDF' : 'file'}
                </span>
                <span className="text-xs text-gray-500">
                  {isImageUpload
                    ? `JPG or PNG, max ${maxSizeMB}MB`
                    : isPdfUpload
                    ? `PDF only, max ${maxSizeMB}MB`
                    : `Max ${maxSizeMB}MB`}
                </span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {displayError && (
        <div
          className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
          role="alert"
        >
          {displayError}
        </div>
      )}
    </div>
  )
}
