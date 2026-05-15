'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useToast } from '@/components/ui/toast-provider'
import {
  ConfirmDeleteModal,
  useConfirmDelete,
} from '@/components/ui/confirm-delete-modal'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GalleryPhoto {
  id: string
  title: string
  description: string
  imageUrl: string
  imageAlt: string
  dateTaken: Date | string
  published: boolean
  createdAt: Date | string
}

interface GalleryManagerProps {
  initialPhotos: GalleryPhoto[]
}

// Toast helper type matches the one used by books-manager
type ToastFn = (options: {
  title: string
  description?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}) => void

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a Date / ISO string to YYYY-MM-DD for <input type="date">. */
function toDateInputValue(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Display dateTaken in DD/MM/YYYY for the card / table. */
function formatDateForDisplay(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GalleryManager({ initialPhotos }: GalleryManagerProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos)
  const [searchQuery, setSearchQuery] = useState('')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const { isOpen: deleteIsOpen, pendingItem: deletePendingId, openDelete, closeDelete } = useConfirmDelete<string>()
  const [error, setError] = useState<string | null>(null)

  // Refetch from server to keep client state in sync after writes.
  const refetch = async () => {
    try {
      const res = await fetch('/api/gallery', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setPhotos(data.photos ?? [])
      }
    } catch (err) {
      console.error('Error refetching gallery photos:', err)
    }
  }

  // ---------- Delete -----------------------------------------------------
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' })

      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== id))
        toast({
          title: 'Photo deleted',
          description: 'The photo has been removed from the gallery.',
          variant: 'success',
          duration: 3000,
        })
        await refetch()
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        toast({
          title: 'Delete failed',
          description: data.error ?? 'Failed to delete photo',
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      console.error('Error deleting gallery photo:', err)
      toast({
        title: 'Delete failed',
        description: 'An error occurred while deleting the photo',
        variant: 'error',
        duration: 5000,
      })
    }
  }

  // ---------- Toggle publish --------------------------------------------
  const handleTogglePublish = async (id: string) => {
    const photo = photos.find((p) => p.id === id)
    if (!photo) return

    const previous = photo.published

    setTogglingId(id)
    setError(null)
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, published: !previous } : p))
    )

    try {
      const res = await fetch(`/api/gallery/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !previous }),
      })

      if (!res.ok) {
        // Roll back optimistic update
        setPhotos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, published: previous } : p))
        )
        const data = await res.json().catch(() => ({}))
        const msg = data.error ?? 'Failed to update publish status'
        setError(msg)
        toast({
          title: 'Publish update failed',
          description: msg,
          variant: 'error',
          duration: 5000,
        })
        setTimeout(() => setError(null), 5000)
      } else {
        toast({
          title: 'Publish status updated',
          description: `Photo ${!previous ? 'published' : 'unpublished'} successfully.`,
          variant: 'success',
          duration: 3000,
        })
        await refetch()
        router.refresh()
      }
    } catch (err) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, published: previous } : p))
      )
      console.error('Error toggling publish status:', err)
      setError('An error occurred while updating publish status')
      toast({
        title: 'Publish update failed',
        description: 'An error occurred while updating publish status',
        variant: 'error',
        duration: 5000,
      })
      setTimeout(() => setError(null), 5000)
    } finally {
      setTogglingId(null)
    }
  }

  // ---------- Filter ------------------------------------------------------
  const filteredPhotos = photos.filter((p) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    )
  })

  const showFilteredEmpty = filteredPhotos.length === 0 && photos.length > 0

  // ---------- Empty state -------------------------------------------------
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
          <h3
            className="text-2xl font-bold mb-2"
            style={{ color: 'rgba(27, 34, 119, 1)' }}
          >
            No Photos Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Upload your first photo to start building the gallery.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Upload First Photo
          </button>
        </div>

        {isAddOpen && (
          <PhotoFormModal
            mode="create"
            onClose={() => setIsAddOpen(false)}
            onSuccess={async () => {
              setIsAddOpen(false)
              await refetch()
              router.refresh()
            }}
            toast={toast}
          />
        )}
      </div>
    )
  }

  // ---------- Populated state --------------------------------------------
  return (
    <div>
      {error && (
        <div
          className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Header row: count + add button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {filteredPhotos.length}{' '}
          {filteredPhotos.length === 1 ? 'photo' : 'photos'}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Photo
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="sr-only" htmlFor="gallery-search">
          Search photos
        </label>
        <input
          id="gallery-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title or description"
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Filtered empty state */}
      {showFilteredEmpty && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            No photos match your search. Try a different term.
          </p>
        </div>
      )}

      {/* Grid */}
      {!showFilteredEmpty && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-56 bg-gray-100">
                <Image
                  src={photo.imageUrl}
                  alt={photo.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {!photo.published && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
                    Draft
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <p
                  className="text-xs font-bold mb-1"
                  style={{ color: 'var(--church-green, rgb(27, 109, 36))' }}
                >
                  {formatDateForDisplay(photo.dateTaken)}
                </p>
                <h3
                  className="text-base font-bold mb-1"
                  style={{ color: 'rgba(27, 34, 119, 1)' }}
                >
                  {photo.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {photo.description}
                </p>

                {/* Publish toggle */}
                <div className="mb-3 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    {photo.published ? 'Published' : 'Draft'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(photo.id)}
                    disabled={togglingId === photo.id}
                    aria-label={photo.published ? 'Unpublish photo' : 'Publish photo'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                      photo.published ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        photo.published ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPhoto(photo)}
                      disabled={togglingId === photo.id || deletePendingId === photo.id}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => openDelete(photo.id)}
                      disabled={togglingId === photo.id || deletePendingId === photo.id}
                      className="flex-1 px-3 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletePendingId === photo.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        open={deleteIsOpen}
        onConfirm={async () => {
          if (deletePendingId) await handleDelete(deletePendingId)
          closeDelete()
        }}
        onCancel={closeDelete}
      />

      {/* Add modal */}
      {isAddOpen && (
        <PhotoFormModal
          mode="create"
          onClose={() => setIsAddOpen(false)}
          onSuccess={async () => {
            setIsAddOpen(false)
            await refetch()
            router.refresh()
          }}
          toast={toast}
        />
      )}

      {/* Edit modal */}
      {editingPhoto && (
        <PhotoFormModal
          mode="edit"
          existingPhoto={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSuccess={async () => {
            setEditingPhoto(null)
            await refetch()
            router.refresh()
          }}
          toast={toast}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PhotoFormModal — handles both create and edit
// ---------------------------------------------------------------------------

interface PhotoFormModalProps {
  mode: 'create' | 'edit'
  existingPhoto?: GalleryPhoto
  onClose: () => void
  onSuccess: () => void | Promise<void>
  toast: ToastFn
}

function PhotoFormModal({
  mode,
  existingPhoto,
  onClose,
  onSuccess,
  toast,
}: PhotoFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: existingPhoto?.title ?? '',
    description: existingPhoto?.description ?? '',
    imageUrl: existingPhoto?.imageUrl ?? '',
    imageAlt: existingPhoto?.imageAlt ?? '',
    dateTaken: existingPhoto
      ? toDateInputValue(existingPhoto.dateTaken)
      : toDateInputValue(new Date()),
    published: existingPhoto?.published ?? false,
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPG, PNG)',
        variant: 'error',
        duration: 5000,
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'error',
        duration: 5000,
      })
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'gallery')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({ ...prev, imageUrl: data.url }))
        toast({
          title: 'Image uploaded',
          description: 'Your photo has been uploaded successfully.',
          variant: 'success',
          duration: 3000,
        })
      } else {
        const data = await res.json().catch(() => ({}))
        const msg = data.error ?? 'Failed to upload image'
        setError(msg)
        toast({
          title: 'Upload failed',
          description: msg,
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      console.error('Upload error:', err)
      const msg = 'An error occurred while uploading the image'
      setError(msg)
      toast({
        title: 'Upload failed',
        description: msg,
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.imageUrl) {
      setError('Please upload an image before saving.')
      return
    }

    setIsSubmitting(true)

    try {
      const url =
        mode === 'create'
          ? '/api/gallery'
          : `/api/gallery/${existingPhoto!.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          imageUrl: formData.imageUrl,
          imageAlt: formData.imageAlt,
          dateTaken: formData.dateTaken,
          published: formData.published,
        }),
      })

      if (res.ok) {
        toast({
          title: mode === 'create' ? 'Photo created' : 'Photo updated',
          description: `"${formData.title}" has been ${
            mode === 'create' ? 'added to' : 'updated in'
          } the gallery.`,
          variant: 'success',
          duration: 3000,
        })
        await onSuccess()
      } else {
        const data = await res.json().catch(() => ({}))
        const msg = data.error ?? 'Failed to save photo'
        setError(msg)
        toast({
          title: mode === 'create' ? 'Create failed' : 'Update failed',
          description: msg,
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      console.error('Error saving gallery photo:', err)
      const msg = 'An error occurred while saving the photo'
      setError(msg)
      toast({
        title: mode === 'create' ? 'Create failed' : 'Update failed',
        description: msg,
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2
            id="gallery-modal-title"
            className="text-2xl font-bold"
            style={{ color: 'rgba(27, 34, 119, 1)' }}
          >
            {mode === 'create' ? 'Add Gallery Photo' : 'Edit Gallery Photo'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
            >
              {error}
            </div>
          )}

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo {mode === 'create' && '*'}
            </label>
            {formData.imageUrl ? (
              <div className="relative w-full h-56 rounded-lg overflow-hidden border border-gray-200 mb-2">
                <Image
                  src={formData.imageUrl}
                  alt={formData.imageAlt || 'Uploaded photo preview'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, imageUrl: '' }))
                    }
                    className="px-2 py-1 text-xs font-semibold bg-black/60 text-white rounded hover:bg-black/80"
                  >
                    Replace
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 text-gray-400 mb-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span className="text-sm text-gray-600">
                  {isUploading ? 'Uploading…' : 'Click to upload (JPG / PNG, max 5MB)'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="gallery-title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Title (Service / Event) *
            </label>
            <input
              id="gallery-title"
              type="text"
              required
              maxLength={200}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Sunday Service"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="gallery-description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description *
            </label>
            <textarea
              id="gallery-description"
              required
              maxLength={2000}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="Brief context for this photo (where, what, who)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Image alt */}
          <div>
            <label
              htmlFor="gallery-alt"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Image alt text *
              <span className="ml-1 font-normal text-gray-500">
                (for screen readers)
              </span>
            </label>
            <input
              id="gallery-alt"
              type="text"
              required
              maxLength={200}
              value={formData.imageAlt}
              onChange={(e) =>
                setFormData({ ...formData, imageAlt: e.target.value })
              }
              placeholder="e.g. Worship team leading praise on Sunday"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Date taken */}
          <div>
            <label
              htmlFor="gallery-date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Date taken *
            </label>
            <input
              id="gallery-date"
              type="date"
              required
              value={formData.dateTaken}
              onChange={(e) =>
                setFormData({ ...formData, dateTaken: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Published toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Publish to homepage
              </p>
              <p className="text-xs text-gray-500">
                When enabled, this photo will appear in the public gallery.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.published}
              onClick={() =>
                setFormData((prev) => ({ ...prev, published: !prev.published }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                formData.published ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.published ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving…'
                : mode === 'create'
                ? 'Create Photo'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
