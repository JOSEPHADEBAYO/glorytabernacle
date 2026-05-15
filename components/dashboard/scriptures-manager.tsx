'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, ExternalLink } from 'lucide-react'
import {
  ConfirmDeleteModal,
  useConfirmDelete,
} from '@/components/ui/confirm-delete-modal'

interface Scripture {
  id: string
  date: string
  reference: string
  text: string
  videoUrl: string | null
  published: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface Props {
  initialScriptures: Scripture[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const EMPTY_FORM = {
  date: '',
  reference: '',
  text: '',
  videoUrl: '',
  published: false,
}

export function ScripturesManager({ initialScriptures }: Props) {
  const router = useRouter()
  const [scriptures, setScriptures] = useState<Scripture[]>(initialScriptures)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingScripture, setEditingScripture] = useState<Scripture | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isOpen: deleteIsOpen, pendingItem: deletePendingId, openDelete, closeDelete } = useConfirmDelete<string>()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function refetch() {
    const res = await fetch('/api/admin/scriptures')
    if (res.ok) {
      const data = await res.json()
      setScriptures(data.scriptures.map((s: any) => ({
        ...s,
        date: s.date,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })))
    }
    router.refresh()
  }

  function openAdd() {
    setEditingScripture(null)
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split('T')[0] })
    setErrors({})
    setIsModalOpen(true)
  }

  function openEdit(s: Scripture) {
    setEditingScripture(s)
    setForm({
      date: s.date.split('T')[0],
      reference: s.reference,
      text: s.text,
      videoUrl: s.videoUrl ?? '',
      published: s.published,
    })
    setErrors({})
    setIsModalOpen(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.date) e.date = 'Date is required'
    if (!form.reference.trim()) e.reference = 'Scripture reference is required'
    if (form.text.trim().length < 10) e.text = 'Text must be at least 10 characters'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setIsSubmitting(true)
    try {
      const payload = {
        date: form.date,
        reference: form.reference.trim(),
        text: form.text.trim(),
        videoUrl: form.videoUrl.trim() || undefined,
        published: form.published,
      }

      const url = editingScripture
        ? `/api/admin/scriptures/${editingScripture.id}`
        : '/api/admin/scriptures'
      const method = editingScripture ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')

      showToast(editingScripture ? 'Scripture updated.' : 'Scripture created.', 'success')
      setIsModalOpen(false)
      await refetch()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/scriptures/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showToast('Scripture deleted.', 'success')
      await refetch()
    } catch {
      showToast('Failed to delete scripture.', 'error')
    }
  }

  async function handleTogglePublish(s: Scripture) {
    setTogglingId(s.id)
    try {
      const res = await fetch(`/api/admin/scriptures/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !s.published }),
      })
      if (!res.ok) throw new Error('Failed to update')
      showToast(s.published ? 'Unpublished.' : 'Published.', 'success')
      await refetch()
    } catch {
      showToast('Failed to update publish status.', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          role="alert"
          className={`fixed top-4 right-4 z-50 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{scriptures.length} scripture{scriptures.length !== 1 ? 's' : ''}</p>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'rgba(27,34,119,1)' }}
        >
          <Plus className="h-4 w-4" />
          Add Scripture
        </button>
      </div>

      {/* List */}
      {scriptures.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No scriptures yet. Add the first one.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100 overflow-hidden">
          {scriptures.map((s) => (
            <div key={s.id} className="flex items-start gap-4 p-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className="text-sm font-extrabold"
                    style={{ color: 'rgba(27,34,119,1)' }}
                  >
                    {s.reference}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(s.date)}</span>
                  {!s.published && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 italic">
                  &ldquo;{s.text}&rdquo;
                </p>
                {s.videoUrl && (
                  <a
                    href={s.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    YouTube video
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-none">
                <button
                  type="button"
                  title={s.published ? 'Unpublish' : 'Publish'}
                  disabled={togglingId === s.id}
                  onClick={() => handleTogglePublish(s)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
                >
                  {s.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  title="Edit"
                  onClick={() => openEdit(s)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Delete"
                  disabled={deletePendingId === s.id}
                  onClick={() => openDelete(s.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-extrabold mb-5" style={{ color: 'rgba(27,34,119,1)' }}>
              {editingScripture ? 'Edit Scripture' : 'Add Daily Scripture'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Scripture Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. John 3:16"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.reference && <p className="mt-1 text-xs text-red-600">{errors.reference}</p>}
              </div>

              {/* Text */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Scripture Text
                </label>
                <textarea
                  rows={4}
                  placeholder="For God so loved the world…"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {errors.text && <p className="mt-1 text-xs text-red-600">{errors.text}</p>}
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  YouTube Video URL <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Published */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Publish immediately (visible to youth members)
                </span>
              </label>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'rgba(27,34,119,1)' }}
                >
                  {isSubmitting ? 'Saving…' : editingScripture ? 'Save Changes' : 'Create Scripture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
