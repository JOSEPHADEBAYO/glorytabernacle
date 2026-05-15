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

export interface DashboardEvent {
  id: string
  title: string
  description: string
  date: Date | string
  time: string | null
  location: string | null
  imageSrc: string | null
  imageAlt: string | null
  registrationHref: string | null
  published: boolean
  createdAt: Date | string
}

interface EventsManagerProps {
  initialEvents: DashboardEvent[]
}

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

/** Display date as DD/MM/YYYY for cards / table rows. */
function formatDateForDisplay(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/** Returns true if the event date is in the past (excluding today). */
function isPast(value: Date | string): boolean {
  const d = typeof value === 'string' ? new Date(value) : value
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(d)
  eventDate.setHours(0, 0, 0, 0)
  return eventDate.getTime() < today.getTime()
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EventsManager({ initialEvents }: EventsManagerProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [events, setEvents] = useState<DashboardEvent[]>(initialEvents)
  const [searchQuery, setSearchQuery] = useState('')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<DashboardEvent | null>(null)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const { isOpen: deleteIsOpen, pendingItem: deletePendingId, openDelete, closeDelete } = useConfirmDelete<string>()
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    try {
      const res = await fetch('/api/events', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events ?? [])
      }
    } catch (err) {
      console.error('Error refetching events:', err)
    }
  }

  // ---------- Delete -----------------------------------------------------
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })

      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id))
        toast({
          title: 'Event deleted',
          description: 'The event has been removed.',
          variant: 'success',
          duration: 3000,
        })
        await refetch()
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        toast({
          title: 'Delete failed',
          description: data.error ?? 'Failed to delete event',
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      console.error('Error deleting event:', err)
      toast({
        title: 'Delete failed',
        description: 'An error occurred while deleting the event',
        variant: 'error',
        duration: 5000,
      })
    }
  }

  // ---------- Toggle publish --------------------------------------------
  const handleTogglePublish = async (id: string) => {
    const event = events.find((e) => e.id === id)
    if (!event) return

    const previous = event.published

    setTogglingId(id)
    setError(null)
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, published: !previous } : e))
    )

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !previous }),
      })

      if (!res.ok) {
        // Roll back optimistic update
        setEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, published: previous } : e))
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
          description: `Event ${!previous ? 'published' : 'unpublished'} successfully.`,
          variant: 'success',
          duration: 3000,
        })
        await refetch()
        router.refresh()
      }
    } catch (err) {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, published: previous } : e))
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
  const filteredEvents = events.filter((e) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      (e.location ?? '').toLowerCase().includes(q)
    )
  })

  const showFilteredEmpty = filteredEvents.length === 0 && events.length > 0

  // ---------- Empty state -------------------------------------------------
  if (events.length === 0) {
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
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
          </div>
          <h3
            className="text-2xl font-bold mb-2"
            style={{ color: 'rgba(27, 34, 119, 1)' }}
          >
            No Events Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first event to start building the church calendar.
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
            Create First Event
          </button>
        </div>

        {isAddOpen && (
          <EventFormModal
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

      {/* Header: count + add button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {filteredEvents.length}{' '}
          {filteredEvents.length === 1 ? 'event' : 'events'}
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
          Add Event
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="sr-only" htmlFor="events-search">
          Search events
        </label>
        <input
          id="events-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, description, or location"
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {showFilteredEmpty && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            No events match your search. Try a different term.
          </p>
        </div>
      )}

      {!showFilteredEmpty && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const past = isPast(event.date)
            return (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                {/* Image (or placeholder) */}
                <div className="relative h-48 bg-gray-100">
                  {event.imageSrc ? (
                    <Image
                      src={event.imageSrc}
                      alt={event.imageAlt ?? event.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-12 h-12"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {past && (
                      <div className="bg-gray-700 text-white text-xs font-semibold px-2 py-1 rounded">
                        Past
                      </div>
                    )}
                    {!event.published && (
                      <div className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        Draft
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <p
                    className="text-xs font-bold mb-1"
                    style={{ color: 'var(--church-green, rgb(27, 109, 36))' }}
                  >
                    {formatDateForDisplay(event.date)}
                    {event.time ? ` · ${event.time}` : ''}
                  </p>
                  <h3
                    className="text-base font-bold mb-1"
                    style={{ color: 'rgba(27, 34, 119, 1)' }}
                  >
                    {event.title}
                  </h3>
                  {event.location && (
                    <p className="text-xs text-gray-500 mb-2">{event.location}</p>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">
                    {event.description}
                  </p>

                  {/* Publish toggle */}
                  <div className="mb-3 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      {event.published ? 'Published' : 'Draft'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(event.id)}
                      disabled={togglingId === event.id}
                      aria-label={event.published ? 'Unpublish event' : 'Publish event'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                        event.published ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          event.published ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingEvent(event)}
                      disabled={togglingId === event.id || deletePendingId === event.id}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => openDelete(event.id)}
                      disabled={togglingId === event.id || deletePendingId === event.id}
                      className="flex-1 px-3 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletePendingId === event.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
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
        <EventFormModal
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
      {editingEvent && (
        <EventFormModal
          mode="edit"
          existingEvent={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSuccess={async () => {
            setEditingEvent(null)
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
// EventFormModal — handles both create and edit
// ---------------------------------------------------------------------------

interface EventFormModalProps {
  mode: 'create' | 'edit'
  existingEvent?: DashboardEvent
  onClose: () => void
  onSuccess: () => void | Promise<void>
  toast: ToastFn
}

function EventFormModal({
  mode,
  existingEvent,
  onClose,
  onSuccess,
  toast,
}: EventFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: existingEvent?.title ?? '',
    description: existingEvent?.description ?? '',
    date: existingEvent
      ? toDateInputValue(existingEvent.date)
      : toDateInputValue(new Date()),
    time: existingEvent?.time ?? '',
    location: existingEvent?.location ?? '',
    imageSrc: existingEvent?.imageSrc ?? '',
    imageAlt: existingEvent?.imageAlt ?? '',
    registrationHref: existingEvent?.registrationHref ?? '',
    published: existingEvent?.published ?? false,
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
      uploadFormData.append('folder', 'events')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({ ...prev, imageSrc: data.url }))
        toast({
          title: 'Image uploaded',
          description: 'Event image uploaded successfully.',
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

    setIsSubmitting(true)

    try {
      const url =
        mode === 'create' ? '/api/events' : `/api/events/${existingEvent!.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          imageSrc: formData.imageSrc,
          imageAlt: formData.imageAlt,
          registrationHref: formData.registrationHref,
          published: formData.published,
        }),
      })

      if (res.ok) {
        toast({
          title: mode === 'create' ? 'Event created' : 'Event updated',
          description: `"${formData.title}" has been ${
            mode === 'create' ? 'added' : 'updated'
          }.`,
          variant: 'success',
          duration: 3000,
        })
        await onSuccess()
      } else {
        const data = await res.json().catch(() => ({}))
        const msg = data.error ?? 'Failed to save event'
        setError(msg)
        toast({
          title: mode === 'create' ? 'Create failed' : 'Update failed',
          description: msg,
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      console.error('Error saving event:', err)
      const msg = 'An error occurred while saving the event'
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
      aria-labelledby="event-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2
            id="event-modal-title"
            className="text-2xl font-bold"
            style={{ color: 'rgba(27, 34, 119, 1)' }}
          >
            {mode === 'create' ? 'Add Event' : 'Edit Event'}
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
              Event Image (optional)
            </label>
            {formData.imageSrc ? (
              <div className="relative w-full h-56 rounded-lg overflow-hidden border border-gray-200 mb-2">
                <Image
                  src={formData.imageSrc}
                  alt={formData.imageAlt || 'Uploaded event image preview'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, imageSrc: '' }))
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
              htmlFor="event-title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Title *
            </label>
            <input
              id="event-title"
              type="text"
              required
              maxLength={200}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Sunday Worship Service"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="event-description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description *
            </label>
            <textarea
              id="event-description"
              required
              maxLength={2000}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="Brief description of the event"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Date & Time row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="event-date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Date *
              </label>
              <input
                id="event-date"
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="event-time"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Time
              </label>
              <input
                id="event-time"
                type="text"
                maxLength={50}
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                placeholder="e.g. 10:00 AM"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="event-location"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Location
            </label>
            <input
              id="event-location"
              type="text"
              maxLength={200}
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="e.g. Main Sanctuary"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Image alt — only required when imageSrc is set */}
          {formData.imageSrc && (
            <div>
              <label
                htmlFor="event-image-alt"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Image alt text *
                <span className="ml-1 font-normal text-gray-500">
                  (for screen readers)
                </span>
              </label>
              <input
                id="event-image-alt"
                type="text"
                required
                maxLength={200}
                value={formData.imageAlt}
                onChange={(e) =>
                  setFormData({ ...formData, imageAlt: e.target.value })
                }
                placeholder="Describe the image"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          {/* Registration link */}
          <div>
            <label
              htmlFor="event-registration"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Registration URL (optional)
            </label>
            <input
              id="event-registration"
              type="url"
              value={formData.registrationHref}
              onChange={(e) =>
                setFormData({ ...formData, registrationHref: e.target.value })
              }
              placeholder="https://example.com/register"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Published toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Publish to public site
              </p>
              <p className="text-xs text-gray-500">
                When enabled and the event is upcoming, it appears on the homepage
                and the public Events page.
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
                ? 'Create Event'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
