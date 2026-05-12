'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import {
  INFORMATION_CATEGORIES,
  INFORMATION_CATEGORY_LABELS,
  type InformationCategory,
} from '@/lib/types/information'

export interface DashboardInformationItem {
  id: string
  title: string
  description: string
  linkUrl: string
  category: string
  submittedBy: string | null
  submitterEmail: string | null
  published: boolean
  createdBy: string | null
  createdAt: Date | string
}

interface InformationManagerProps {
  initialItems: DashboardInformationItem[]
}

type FormState = {
  title: string
  description: string
  linkUrl: string
  category: InformationCategory
  submittedBy: string
  submitterEmail: string
  published: boolean
}

const emptyForm: FormState = {
  title: '',
  description: '',
  linkUrl: '',
  category: 'IMMIGRATION',
  submittedBy: '',
  submitterEmail: '',
  published: true,
}

function toFormState(item: DashboardInformationItem): FormState {
  return {
    title: item.title,
    description: item.description,
    linkUrl: item.linkUrl,
    category: item.category as InformationCategory,
    submittedBy: item.submittedBy ?? '',
    submitterEmail: item.submitterEmail ?? '',
    published: item.published,
  }
}

function labelFor(category: string) {
  return (
    INFORMATION_CATEGORY_LABELS[category as InformationCategory] ??
    'Information'
  )
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function InformationManager({ initialItems }: InformationManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [items, setItems] = useState(initialItems)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'pending' | 'published'>('all')
  const [category, setCategory] = useState<'all' | InformationCategory>('all')
  const [modal, setModal] = useState<
    | { mode: 'create'; item?: undefined }
    | { mode: 'edit'; item: DashboardInformationItem }
    | null
  >(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refetch() {
    const response = await fetch('/api/information', { cache: 'no-store' })
    if (response.ok) {
      const data = await response.json()
      setItems(data.items ?? [])
    }
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q.length === 0 ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.linkUrl.toLowerCase().includes(q)
      const matchesStatus =
        status === 'all' ||
        (status === 'published' && item.published) ||
        (status === 'pending' && !item.published)
      const matchesCategory = category === 'all' || item.category === category
      return matchesQuery && matchesStatus && matchesCategory
    })
  }, [items, query, status, category])

  const pendingCount = items.filter((item) => !item.published).length

  async function togglePublish(item: DashboardInformationItem) {
    setBusyId(item.id)
    try {
      const response = await fetch(`/api/information/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !item.published }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to update status')
      }

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, published: !item.published } : entry
        )
      )
      toast({
        title: item.published ? 'Information unpublished' : 'Information published',
        variant: 'success',
        duration: 3000,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Status update failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setBusyId(null)
    }
  }

  async function deleteItem(item: DashboardInformationItem) {
    if (!confirm('Delete this information item? This cannot be undone.')) return
    setBusyId(item.id)
    try {
      const response = await fetch(`/api/information/${item.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to delete item')
      }

      setItems((current) => current.filter((entry) => entry.id !== item.id))
      toast({ title: 'Information deleted', variant: 'success', duration: 3000 })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setBusyId(null)
    }
  }

  async function saveItem(formData: FormState, editing?: DashboardInformationItem) {
    const response = await fetch(
      editing ? `/api/information/${editing.id}` : '/api/information',
      {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.details?.[0] ?? data.error ?? 'Failed to save item')
    }

    await refetch()
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Total</p>
          <p className="mt-1 text-3xl font-bold text-gray-950">{items.length}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-700">Pending review</p>
          <p className="mt-1 text-3xl font-bold text-amber-900">{pendingCount}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">Published</p>
          <p className="mt-1 text-3xl font-bold text-emerald-900">
            {items.length - pendingCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, description, or link"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 md:max-w-sm"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="published">Published</option>
          </select>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as 'all' | InformationCategory)
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          >
            <option value="all">All categories</option>
            {INFORMATION_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {INFORMATION_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: 'create' })}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add information
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
          No information items match this view.
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-gray-700">
                      {labelFor(item.category)}
                    </span>
                    <span
                      className={`rounded px-2 py-1 text-xs font-bold ${
                        item.published
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.published ? 'Published' : 'Pending'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-950">{item.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                    {item.description}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Open link
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    {item.submittedBy && (
                      <span className="text-gray-500">Shared by {item.submittedBy}</span>
                    )}
                    {item.submitterEmail && (
                      <span className="text-gray-500">{item.submitterEmail}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => togglePublish(item)}
                    disabled={busyId === item.id}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-60 ${
                      item.published
                        ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {item.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ mode: 'edit', item })}
                    disabled={busyId === item.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item)}
                    disabled={busyId === item.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-600 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <InformationModal
          mode={modal.mode}
          initial={modal.mode === 'edit' ? toFormState(modal.item) : emptyForm}
          onClose={() => setModal(null)}
          onSave={async (formData) => {
            await saveItem(formData, modal.mode === 'edit' ? modal.item : undefined)
            setModal(null)
            toast({
              title: modal.mode === 'edit' ? 'Information updated' : 'Information created',
              variant: 'success',
              duration: 3000,
            })
          }}
        />
      )}
    </div>
  )
}

function InformationModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit'
  initial: FormState
  onClose: () => void
  onSave: (formData: FormState) => Promise<void>
}) {
  const [formData, setFormData] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)
    try {
      await onSave(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-950">
              {mode === 'create' ? 'Add information' : 'Edit information'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Dashboard-created items can be published immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="dash-info-title" className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="dash-info-title"
              required
              maxLength={160}
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="dash-info-description" className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="dash-info-description"
              required
              rows={5}
              maxLength={3000}
              value={formData.description}
              onChange={(event) =>
                setFormData({ ...formData, description: event.target.value })
              }
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="dash-info-link" className="mb-1 block text-sm font-medium text-gray-700">
                Link
              </label>
              <input
                id="dash-info-link"
                type="url"
                required
                value={formData.linkUrl}
                onChange={(event) => setFormData({ ...formData, linkUrl: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label htmlFor="dash-info-category" className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="dash-info-category"
                value={formData.category}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    category: event.target.value as InformationCategory,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              >
                {INFORMATION_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {INFORMATION_CATEGORY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="dash-info-name" className="mb-1 block text-sm font-medium text-gray-700">
                Submitted by
              </label>
              <input
                id="dash-info-name"
                value={formData.submittedBy}
                onChange={(event) =>
                  setFormData({ ...formData, submittedBy: event.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label htmlFor="dash-info-email" className="mb-1 block text-sm font-medium text-gray-700">
                Submitter email
              </label>
              <input
                id="dash-info-email"
                type="email"
                value={formData.submitterEmail}
                onChange={(event) =>
                  setFormData({ ...formData, submitterEmail: event.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <label className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <span>
              <span className="block text-sm font-medium text-gray-900">Published</span>
              <span className="block text-xs text-gray-500">
                Published items appear on the public Information Hub.
              </span>
            </span>
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(event) =>
                setFormData({ ...formData, published: event.target.checked })
              }
              className="h-5 w-5"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save information'}
          </button>
        </div>
      </form>
    </div>
  )
}
