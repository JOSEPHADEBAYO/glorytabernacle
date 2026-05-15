'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Edit, ExternalLink, Grid3X3, List, Plus, Search, Trash2 } from 'lucide-react'
import { FileUploadField } from '@/components/dashboard/file-upload-field'
import { useToast } from '@/components/ui/toast-provider'
import { youtubeUrlSchema } from '@/lib/validation/sermon'
import {
  ConfirmDeleteModal,
  useConfirmDelete,
} from '@/components/ui/confirm-delete-modal'

export interface DashboardSermon {
  id: string
  title: string
  series: string | null
  speaker: string
  date: string | Date
  duration: string
  description: string
  thumbnail: string
  videoUrl: string
  published: boolean
  createdBy: string
  createdAt: string | Date
  updatedAt: string | Date
}

interface SermonsManagerProps {
  initialSermons: DashboardSermon[]
}

type ViewMode = 'grid' | 'table'
type SermonFormMode = 'create' | 'edit'

const EMPTY_FORM = {
  title: '',
  series: '',
  speaker: '',
  date: new Date().toISOString().slice(0, 10),
  duration: '',
  description: '',
  thumbnail: '',
  videoUrl: '',
  published: false,
}

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function toDateInput(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10)
}

function errorMessageFrom(data: unknown, fallback: string): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'details' in data &&
    Array.isArray((data as { details?: unknown }).details)
  ) {
    return ((data as { details: string[] }).details).join(', ')
  }
  if (typeof data === 'object' && data !== null && 'error' in data) {
    return String((data as { error: unknown }).error)
  }
  return fallback
}

export function SermonsManager({ initialSermons }: SermonsManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [sermons, setSermons] = useState<DashboardSermon[]>(initialSermons)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [seriesFilter, setSeriesFilter] = useState('All Series')
  const [gridDisplayCount, setGridDisplayCount] = useState(12)
  const [currentPage, setCurrentPage] = useState(1)
  const [modal, setModal] = useState<{ mode: SermonFormMode; sermon?: DashboardSermon } | null>(null)
  const { isOpen: deleteIsOpen, pendingItem: deletePendingId, openDelete, closeDelete } = useConfirmDelete<string>()
  const [deleteItemName, setDeleteItemName] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const seriesOptions = useMemo(
    () => Array.from(new Set(sermons.map((s) => s.series).filter(Boolean))) as string[],
    [sermons]
  )

  const filtered = sermons.filter((sermon) => {
    const matchesSearch =
      search.trim() === '' ||
      sermon.title.toLowerCase().includes(search.trim().toLowerCase())
    const matchesSeries = seriesFilter === 'All Series' || sermon.series === seriesFilter
    return matchesSearch && matchesSeries
  })

  const tablePageSize = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / tablePageSize))
  const tableSermons = filtered.slice(
    (currentPage - 1) * tablePageSize,
    currentPage * tablePageSize
  )
  const gridSermons = filtered.slice(0, gridDisplayCount)

  function resetFilters() {
    setSearch('')
    setSeriesFilter('All Series')
    setCurrentPage(1)
    setGridDisplayCount(12)
  }

  async function refetchSermons() {
    const res = await fetch('/api/sermons', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      setSermons(data.sermons ?? [])
    }
  }

  async function handleTogglePublish(sermon: DashboardSermon) {
    setTogglingId(sermon.id)
    const previous = sermon.published
    setSermons((items) =>
      items.map((item) =>
        item.id === sermon.id ? { ...item, published: !previous } : item
      )
    )

    try {
      const res = await fetch(`/api/sermons/${sermon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !previous }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(errorMessageFrom(data, 'Could not update publish status'))
      }
      toast({
        title: !previous ? 'Sermon published' : 'Sermon unpublished',
        variant: 'success',
        duration: 3000,
      })
      await refetchSermons()
      router.refresh()
    } catch (error) {
      setSermons((items) =>
        items.map((item) =>
          item.id === sermon.id ? { ...item, published: previous } : item
        )
      )
      toast({
        title: 'Publish update failed',
        description: error instanceof Error ? error.message : 'Could not update sermon',
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/sermons/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(errorMessageFrom(data, 'Could not delete sermon'))
      }
      setSermons((items) => items.filter((item) => item.id !== id))
      toast({
        title: 'Sermon deleted',
        description: 'The sermon has been removed.',
        variant: 'success',
        duration: 3000,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Could not delete sermon',
        variant: 'error',
        duration: 5000,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            Sermons
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage sermon recordings, YouTube links, thumbnails, and publishing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: 'create' })}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add Sermon
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto_auto] lg:items-center">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
                setGridDisplayCount(12)
              }}
              placeholder="Search by title"
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <select
            value={seriesFilter}
            onChange={(event) => {
              setSeriesFilter(event.target.value)
              setCurrentPage(1)
              setGridDisplayCount(12)
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option>All Series</option>
            {seriesOptions.map((series) => (
              <option key={series}>{series}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear Filters
          </button>
          <div className="flex rounded-lg border border-gray-300 p-1">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Table view"
              onClick={() => setViewMode('table')}
              className={`rounded-md p-2 ${viewMode === 'table' ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Showing {filtered.length} of {sermons.length} sermons
        </p>
      </div>

      {sermons.length === 0 ? (
        <EmptyState onAdd={() => setModal({ mode: 'create' })} />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          No sermons match your current filters.
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {gridSermons.map((sermon) => (
              <SermonCard
                key={sermon.id}
                sermon={sermon}
                isToggling={togglingId === sermon.id}
                isDeleting={deletePendingId === sermon.id}
                onEdit={() => setModal({ mode: 'edit', sermon })}
                onDelete={() => {
                  setDeleteItemName(sermon.title)
                  openDelete(sermon.id)
                }}
                onToggle={() => handleTogglePublish(sermon)}
              />
            ))}
          </div>
          {gridDisplayCount < filtered.length && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setGridDisplayCount((count) => count + 12)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Load More Sermons
              </button>
            </div>
          )}
        </>
      ) : (
        <SermonsTable
          sermons={tableSermons}
          currentPage={currentPage}
          totalPages={totalPages}
          togglingId={togglingId}
          deletingId={deletePendingId}
          onPageChange={setCurrentPage}
          onEdit={(sermon) => setModal({ mode: 'edit', sermon })}
          onDelete={(sermon) => {
            setDeleteItemName(sermon.title)
            openDelete(sermon.id)
          }}
          onToggle={handleTogglePublish}
        />
      )}

      <ConfirmDeleteModal
        open={deleteIsOpen}
        itemName={deleteItemName ?? undefined}
        onConfirm={async () => {
          if (deletePendingId) await handleDelete(deletePendingId)
          closeDelete()
          setDeleteItemName(null)
        }}
        onCancel={() => {
          closeDelete()
          setDeleteItemName(null)
        }}
      />

      {modal && (
        <SermonFormModal
          mode={modal.mode}
          sermon={modal.sermon}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null)
            await refetchSermons()
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
      <h2 className="text-lg font-bold text-gray-900">No sermons yet</h2>
      <p className="mt-2 text-sm text-gray-500">Add your first sermon to start building the media library.</p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
      >
        <Plus className="h-4 w-4" />
        Add Sermon
      </button>
    </div>
  )
}

function SermonCard({
  sermon,
  isToggling,
  isDeleting,
  onEdit,
  onDelete,
  onToggle,
}: {
  sermon: DashboardSermon
  isToggling: boolean
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="relative aspect-video bg-gray-100">
        <Image
          src={sermon.thumbnail}
          alt={sermon.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized
        />
        {!sermon.published && (
          <span className="absolute left-3 top-3 rounded bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase text-white">
            Draft
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          {sermon.series && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">
              {sermon.series}
            </p>
          )}
          <h3 className="mt-1 line-clamp-2 text-base font-bold text-gray-900">{sermon.title}</h3>
          <p className="mt-1 text-xs text-gray-500">
            {sermon.speaker} · {formatDate(sermon.date)} · {sermon.duration}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={sermon.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Watch
          </a>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? 'Deleting' : 'Delete'}
          </button>
          <label className="ml-auto inline-flex items-center gap-2 text-xs font-medium text-gray-600">
            <input
              type="checkbox"
              checked={sermon.published}
              disabled={isToggling}
              onChange={onToggle}
              className="h-4 w-4 rounded border-gray-300 text-blue-700"
            />
            {isToggling ? 'Saving' : 'Published'}
          </label>
        </div>
      </div>
    </article>
  )
}

function SermonsTable({
  sermons,
  currentPage,
  totalPages,
  togglingId,
  deletingId,
  onPageChange,
  onEdit,
  onDelete,
  onToggle,
}: {
  sermons: DashboardSermon[]
  currentPage: number
  totalPages: number
  togglingId: string | null
  deletingId: string | null
  onPageChange: (page: number) => void
  onEdit: (sermon: DashboardSermon) => void
  onDelete: (sermon: DashboardSermon) => void
  onToggle: (sermon: DashboardSermon) => void
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Thumbnail', 'Title', 'Series', 'Speaker', 'Date', 'Duration', 'Published', 'Actions'].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sermons.map((sermon) => (
              <tr key={sermon.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="relative h-12 w-20 overflow-hidden rounded bg-gray-100">
                    <Image src={sermon.thumbnail} alt="" fill className="object-cover" unoptimized />
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{sermon.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{sermon.series ?? '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{sermon.speaker}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sermon.date)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{sermon.duration}</td>
                <td className="px-4 py-3">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                    <input
                      type="checkbox"
                      checked={sermon.published}
                      disabled={togglingId === sermon.id}
                      onChange={() => onToggle(sermon)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-700"
                    />
                    {sermon.published ? 'Live' : 'Draft'}
                  </label>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onEdit(sermon)} className="text-sm font-medium text-blue-700 hover:underline">
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === sermon.id}
                      onClick={() => onDelete(sermon)}
                      className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        <p className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </p>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

function SermonFormModal({
  mode,
  sermon,
  onClose,
  onSaved,
}: {
  mode: SermonFormMode
  sermon?: DashboardSermon
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const { toast } = useToast()
  const [form, setForm] = useState(() =>
    sermon
      ? {
          title: sermon.title,
          series: sermon.series ?? '',
          speaker: sermon.speaker,
          date: toDateInput(sermon.date),
          duration: sermon.duration,
          description: sermon.description,
          thumbnail: sermon.thumbnail,
          videoUrl: sermon.videoUrl,
          published: sermon.published,
        }
      : EMPTY_FORM
  )
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const youtubeValidation = form.videoUrl
    ? youtubeUrlSchema.safeParse(form.videoUrl)
    : { success: false }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.thumbnail) {
      setError('Please upload a thumbnail image')
      return
    }
    if (!youtubeValidation.success) {
      setError('Please enter a valid YouTube URL')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...form,
        series: form.series.trim() || null,
      }
      const url = mode === 'create' ? '/api/sermons' : `/api/sermons/${sermon!.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(errorMessageFrom(data, 'Could not save sermon'))
      }

      toast({
        title: mode === 'create' ? 'Sermon created' : 'Sermon updated',
        variant: 'success',
        duration: 3000,
      })
      await onSaved()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save sermon'
      setError(message)
      toast({
        title: 'Save failed',
        description: message,
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div className="mx-auto my-8 w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-900">
              {mode === 'create' ? 'Add Sermon' : 'Edit Sermon'}
            </h2>
          </div>

          <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
            <TextField label="Title" value={form.title} onChange={(value) => update('title', value)} required />
            <TextField label="Series" value={form.series} onChange={(value) => update('series', value)} placeholder="Optional" />
            <TextField label="Speaker" value={form.speaker} onChange={(value) => update('speaker', value)} required />
            <TextField label="Date" type="date" value={form.date} onChange={(value) => update('date', value)} required />
            <TextField label="Duration" value={form.duration} onChange={(value) => update('duration', value)} placeholder="e.g. 48 min, 1h 15min" required />
            <div>
              <TextField label="YouTube URL" value={form.videoUrl} onChange={(value) => update('videoUrl', value)} required />
              <p className={`mt-1 text-xs ${form.videoUrl && youtubeValidation.success ? 'text-green-700' : 'text-gray-500'}`}>
                Accepts youtube.com/watch?v=, youtu.be/, and youtube.com/embed/ links.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                rows={5}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="md:col-span-2">
              <FileUploadField
                label="Thumbnail"
                accept="image/jpeg,image/png"
                maxSize={5 * 1024 * 1024}
                currentUrl={form.thumbnail}
                onUpload={(url) => update('thumbnail', url)}
                onRemove={() => update('thumbnail', '')}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) => update('published', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-700"
              />
              Published
            </label>
            {error && (
              <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Sermon' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  )
}
