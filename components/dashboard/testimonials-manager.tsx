'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardTestimonial {
  id: string
  quote: string
  name: string
  memberSince: number
  order: number
  published: boolean
  createdAt: Date | string
}

interface TestimonialsManagerProps {
  initialTestimonials: DashboardTestimonial[]
}

type ToastFn = (options: {
  title: string
  description?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}) => void

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TestimonialsManager({
  initialTestimonials,
}: TestimonialsManagerProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [items, setItems] =
    useState<DashboardTestimonial[]>(initialTestimonials)
  const [searchQuery, setSearchQuery] = useState('')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editing, setEditing] = useState<DashboardTestimonial | null>(null)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    try {
      const res = await fetch('/api/testimonials', {
        method: 'GET',
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setItems(data.testimonials ?? [])
      }
    } catch (err) {
      console.error('Error refetching testimonials:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/testimonials/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems((prev) => prev.filter((t) => t.id !== id))
        toast({ title: 'Testimonial deleted', variant: 'success', duration: 3000 })
        await refetch()
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        toast({
          title: 'Delete failed',
          description: data.error ?? 'Failed to delete',
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      console.error('Error deleting testimonial:', err)
      toast({
        title: 'Delete failed',
        description: 'An error occurred while deleting',
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleTogglePublish = async (id: string) => {
    const item = items.find((t) => t.id === id)
    if (!item) return
    const previous = item.published
    setTogglingId(id)
    setError(null)
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, published: !previous } : t))
    )
    try {
      const res = await fetch(`/api/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !previous }),
      })
      if (!res.ok) {
        setItems((prev) =>
          prev.map((t) => (t.id === id ? { ...t, published: previous } : t))
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
          description: `Testimonial ${!previous ? 'published' : 'unpublished'}.`,
          variant: 'success',
          duration: 3000,
        })
        await refetch()
        router.refresh()
      }
    } catch (err) {
      setItems((prev) =>
        prev.map((t) => (t.id === id ? { ...t, published: previous } : t))
      )
      console.error('Error toggling publish:', err)
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

  const filtered = items.filter((t) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      t.quote.toLowerCase().includes(q)
    )
  })

  const showFilteredEmpty = filtered.length === 0 && items.length > 0

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            No Testimonials Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Add your first member testimonial to start populating the homepage.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add First Testimonial
          </button>
        </div>

        {isAddOpen && (
          <TestimonialFormModal
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

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="text-red-700 hover:text-red-900">×</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {filtered.length} {filtered.length === 1 ? 'testimonial' : 'testimonials'}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Testimonial
        </button>
      </div>

      <div className="mb-6">
        <label className="sr-only" htmlFor="testimonials-search">Search testimonials</label>
        <input
          id="testimonials-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or quote"
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {showFilteredEmpty && (
        <div className="text-center py-12">
          <p className="text-gray-600">No testimonials match your search.</p>
        </div>
      )}

      {!showFilteredEmpty && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Member since {t.memberSince} · order {t.order}
                  </p>
                </div>
                {!t.published && (
                  <span className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded shrink-0">
                    Draft
                  </span>
                )}
              </div>
              <blockquote className="text-sm text-gray-700 leading-relaxed line-clamp-4 italic">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  {t.published ? 'Published' : 'Draft'}
                </span>
                <button
                  type="button"
                  onClick={() => handleTogglePublish(t.id)}
                  disabled={togglingId === t.id}
                  aria-label={t.published ? 'Unpublish testimonial' : 'Publish testimonial'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${t.published ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${t.published ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(t)}
                  disabled={togglingId === t.id || deletingId === t.id}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  disabled={togglingId === t.id || deletingId === t.id}
                  className="flex-1 px-3 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deletingId === t.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAddOpen && (
        <TestimonialFormModal
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

      {editing && (
        <TestimonialFormModal
          mode="edit"
          existing={editing}
          onClose={() => setEditing(null)}
          onSuccess={async () => {
            setEditing(null)
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
// Form modal
// ---------------------------------------------------------------------------

interface TestimonialFormModalProps {
  mode: 'create' | 'edit'
  existing?: DashboardTestimonial
  onClose: () => void
  onSuccess: () => void | Promise<void>
  toast: ToastFn
}

function TestimonialFormModal({
  mode,
  existing,
  onClose,
  onSuccess,
  toast,
}: TestimonialFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const currentYear = new Date().getFullYear()

  const [formData, setFormData] = useState({
    quote: existing?.quote ?? '',
    name: existing?.name ?? '',
    memberSince: existing?.memberSince ?? currentYear,
    order: existing?.order ?? 0,
    published: existing?.published ?? false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const url = mode === 'create' ? '/api/testimonials' : `/api/testimonials/${existing!.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: formData.quote,
          name: formData.name,
          memberSince: formData.memberSince,
          order: formData.order,
          published: formData.published,
        }),
      })

      if (res.ok) {
        toast({
          title: mode === 'create' ? 'Testimonial created' : 'Testimonial updated',
          variant: 'success',
          duration: 3000,
        })
        await onSuccess()
      } else {
        const data = await res.json().catch(() => ({}))
        const msg = data.error ?? 'Failed to save testimonial'
        setError(msg)
        toast({
          title: mode === 'create' ? 'Create failed' : 'Update failed',
          description: msg,
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      console.error('Error saving testimonial:', err)
      setError('An error occurred while saving the testimonial')
      toast({
        title: mode === 'create' ? 'Create failed' : 'Update failed',
        description: 'An error occurred while saving',
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="testimonial-modal-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 id="testimonial-modal-title" className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            {mode === 'create' ? 'Add Testimonial' : 'Edit Testimonial'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="t-quote" className="block text-sm font-medium text-gray-700 mb-2">
              Quote *
            </label>
            <textarea
              id="t-quote"
              required
              maxLength={2000}
              rows={5}
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
              placeholder="Their words about Glory Tabernacle…"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="t-name" className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                id="t-name"
                type="text"
                required
                maxLength={100}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sarah Johnson"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="t-since" className="block text-sm font-medium text-gray-700 mb-2">
                Member since *
              </label>
              <input
                id="t-since"
                type="number"
                required
                min={1900}
                max={currentYear + 1}
                step={1}
                value={formData.memberSince}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    memberSince: parseInt(e.target.value, 10) || currentYear,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="t-order" className="block text-sm font-medium text-gray-700 mb-2">
              Display order
            </label>
            <input
              id="t-order"
              type="number"
              step={1}
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })
              }
              className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              Lower numbers appear first. Use 10, 20, 30 so you can insert between later.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Publish to homepage</p>
              <p className="text-xs text-gray-500">When enabled, this testimonial appears on the homepage Testimonials section.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.published}
              onClick={() => setFormData((prev) => ({ ...prev, published: !prev.published }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.published ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.published ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

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
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Testimonial' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
