'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useToast } from '@/components/ui/toast-provider'
import { sluggify, type GroupProgramme, type GroupSpecialRole } from '@/lib/types/group'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardGroup {
  id: string
  slug: string
  title: string
  tag: string | null
  description: string
  imageSrc: string
  imageAlt: string
  ctaLabel: string | null
  ctaHref: string | null
  order: number
  published: boolean
  scripture: string | null
  headTitle: string | null
  responsibilities: unknown // string[] in practice, JsonValue at the type level
  programmes: unknown // GroupProgramme[]
  specialRole: unknown // GroupSpecialRole | null
  furnishStatement: string | null
  transformStatement: string | null
  influenceStatement: string | null
  createdAt: Date | string
}

interface GroupsManagerProps {
  initialGroups: DashboardGroup[]
}

type ToastFn = (options: {
  title: string
  description?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}) => void

// ---------------------------------------------------------------------------
// Helpers — narrow JsonValue into our typed shapes safely
// ---------------------------------------------------------------------------

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string')
}

function asProgrammeArray(value: unknown): GroupProgramme[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((v): v is { title: string; schedule?: string } => {
      return typeof v === 'object' && v !== null && typeof (v as { title?: unknown }).title === 'string'
    })
    .map((v) => ({
      title: v.title,
      schedule: typeof v.schedule === 'string' ? v.schedule : undefined,
    }))
}

function asSpecialRole(value: unknown): GroupSpecialRole | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    typeof (value as { title?: unknown }).title !== 'string' ||
    typeof (value as { body?: unknown }).body !== 'string'
  ) {
    return null
  }
  return {
    title: (value as { title: string }).title,
    body: (value as { body: string }).body,
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GroupsManager({ initialGroups }: GroupsManagerProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [groups, setGroups] = useState<DashboardGroup[]>(initialGroups)
  const [searchQuery, setSearchQuery] = useState('')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<DashboardGroup | null>(null)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    try {
      const res = await fetch('/api/groups', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups ?? [])
      }
    } catch (err) {
      console.error('Error refetching groups:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this group? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== id))
        toast({ title: 'Group deleted', variant: 'success', duration: 3000 })
        await refetch()
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        toast({
          title: 'Delete failed',
          description: data.error ?? 'Failed to delete group',
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      console.error('Error deleting group:', err)
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
    const group = groups.find((g) => g.id === id)
    if (!group) return
    const previous = group.published
    setTogglingId(id)
    setError(null)
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, published: !previous } : g))
    )
    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !previous }),
      })
      if (!res.ok) {
        setGroups((prev) =>
          prev.map((g) => (g.id === id ? { ...g, published: previous } : g))
        )
        const data = await res.json().catch(() => ({}))
        const msg = data.error ?? 'Failed to update publish status'
        setError(msg)
        toast({ title: 'Publish update failed', description: msg, variant: 'error', duration: 5000 })
        setTimeout(() => setError(null), 5000)
      } else {
        toast({
          title: 'Publish status updated',
          description: `Group ${!previous ? 'published' : 'unpublished'}.`,
          variant: 'success',
          duration: 3000,
        })
        await refetch()
        router.refresh()
      }
    } catch (err) {
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, published: previous } : g))
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

  const filteredGroups = groups.filter((g) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.slug.toLowerCase().includes(q)
    )
  })

  const showFilteredEmpty = filteredGroups.length === 0 && groups.length > 0

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            No Groups Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first ministry or group with full departmental-board content.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add First Group
          </button>
        </div>

        {isAddOpen && (
          <GroupFormModal
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
          {filteredGroups.length} {filteredGroups.length === 1 ? 'group' : 'groups'}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Group
        </button>
      </div>

      <div className="mb-6">
        <label className="sr-only" htmlFor="groups-search">Search groups</label>
        <input
          id="groups-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, description, or slug"
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {showFilteredEmpty && (
        <div className="text-center py-12">
          <p className="text-gray-600">No groups match your search.</p>
        </div>
      )}

      {!showFilteredEmpty && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
              <div className="relative h-48 bg-gray-100">
                <Image
                  src={group.imageSrc}
                  alt={group.imageAlt ?? group.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {!group.published && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
                    Draft
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <p className="text-xs font-mono text-gray-400 mb-1">/{group.slug}</p>
                <h3 className="text-base font-bold mb-1" style={{ color: 'rgba(27, 34, 119, 1)' }}>
                  {group.title}
                </h3>
                <p className="text-xs text-gray-500 mb-2">Order: {group.order}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">{group.description}</p>

                <div className="mb-3 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    {group.published ? 'Published' : 'Draft'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(group.id)}
                    disabled={togglingId === group.id}
                    aria-label={group.published ? 'Unpublish group' : 'Publish group'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${group.published ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${group.published ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingGroup(group)}
                    disabled={togglingId === group.id || deletingId === group.id}
                    className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(group.id)}
                    disabled={togglingId === group.id || deletingId === group.id}
                    className="flex-1 px-3 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === group.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAddOpen && (
        <GroupFormModal
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

      {editingGroup && (
        <GroupFormModal
          mode="edit"
          existingGroup={editingGroup}
          onClose={() => setEditingGroup(null)}
          onSuccess={async () => {
            setEditingGroup(null)
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
// GroupFormModal — handles both create and edit, with list editors
// ---------------------------------------------------------------------------

interface GroupFormModalProps {
  mode: 'create' | 'edit'
  existingGroup?: DashboardGroup
  onClose: () => void
  onSuccess: () => void | Promise<void>
  toast: ToastFn
}

function GroupFormModal({
  mode,
  existingGroup,
  onClose,
  onSuccess,
  toast,
}: GroupFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(existingGroup) // existing rows always have explicit slugs
  )

  const initialSpecialRole = existingGroup
    ? asSpecialRole(existingGroup.specialRole)
    : null

  const [formData, setFormData] = useState({
    slug: existingGroup?.slug ?? '',
    title: existingGroup?.title ?? '',
    tag: existingGroup?.tag ?? '',
    description: existingGroup?.description ?? '',
    imageSrc: existingGroup?.imageSrc ?? '',
    imageAlt: existingGroup?.imageAlt ?? '',
    ctaLabel: existingGroup?.ctaLabel ?? '',
    ctaHref: existingGroup?.ctaHref ?? '',
    order: existingGroup?.order ?? 0,
    published: existingGroup?.published ?? false,
    scripture: existingGroup?.scripture ?? '',
    headTitle: existingGroup?.headTitle ?? '',
    responsibilities: existingGroup
      ? asStringArray(existingGroup.responsibilities)
      : [],
    programmes: existingGroup
      ? asProgrammeArray(existingGroup.programmes)
      : [],
    hasSpecialRole: Boolean(initialSpecialRole),
    specialRoleTitle: initialSpecialRole?.title ?? '',
    specialRoleBody: initialSpecialRole?.body ?? '',
    furnishStatement: existingGroup?.furnishStatement ?? '',
    transformStatement: existingGroup?.transformStatement ?? '',
    influenceStatement: existingGroup?.influenceStatement ?? '',
  })

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      // Auto-fill slug while user hasn't manually edited it
      slug: slugManuallyEdited ? prev.slug : sluggify(value),
    }))
  }

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    setFormData((prev) => ({ ...prev, slug: value }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'JPG or PNG only', variant: 'error', duration: 5000 })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB', variant: 'error', duration: 5000 })
      return
    }
    setIsUploading(true)
    setError('')
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'groups')
      const res = await fetch('/api/upload', { method: 'POST', body: uploadFormData })
      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({ ...prev, imageSrc: data.url }))
        toast({ title: 'Image uploaded', variant: 'success', duration: 3000 })
      } else {
        const data = await res.json().catch(() => ({}))
        const msg = data.error ?? 'Failed to upload image'
        setError(msg)
        toast({ title: 'Upload failed', description: msg, variant: 'error', duration: 5000 })
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('An error occurred while uploading the image')
      toast({ title: 'Upload failed', variant: 'error', duration: 5000 })
    } finally {
      setIsUploading(false)
    }
  }

  // ---------- list editors -------------------------------------------------

  const updateResponsibility = (index: number, value: string) => {
    setFormData((prev) => {
      const next = [...prev.responsibilities]
      next[index] = value
      return { ...prev, responsibilities: next }
    })
  }

  const addResponsibility = () => {
    setFormData((prev) => ({
      ...prev,
      responsibilities: [...prev.responsibilities, ''],
    }))
  }

  const removeResponsibility = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index),
    }))
  }

  const updateProgramme = (index: number, key: 'title' | 'schedule', value: string) => {
    setFormData((prev) => {
      const next = [...prev.programmes]
      next[index] = { ...next[index], [key]: value }
      return { ...prev, programmes: next }
    })
  }

  const addProgramme = () => {
    setFormData((prev) => ({
      ...prev,
      programmes: [...prev.programmes, { title: '', schedule: '' }],
    }))
  }

  const removeProgramme = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      programmes: prev.programmes.filter((_, i) => i !== index),
    }))
  }

  // ---------- submit -------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.imageSrc) {
      setError('Please upload an image before saving.')
      return
    }
    setIsSubmitting(true)
    try {
      const url = mode === 'create' ? '/api/groups' : `/api/groups/${existingGroup!.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      // Strip empty list entries before sending
      const cleanedResponsibilities = formData.responsibilities
        .map((r) => r.trim())
        .filter((r) => r.length > 0)
      const cleanedProgrammes = formData.programmes
        .map((p) => ({
          title: p.title.trim(),
          schedule: p.schedule?.trim() ?? '',
        }))
        .filter((p) => p.title.length > 0)

      const specialRolePayload = formData.hasSpecialRole
        && formData.specialRoleTitle.trim()
        && formData.specialRoleBody.trim()
        ? {
            title: formData.specialRoleTitle.trim(),
            body: formData.specialRoleBody.trim(),
          }
        : null

      const payload = {
        slug: formData.slug,
        title: formData.title,
        tag: formData.tag,
        description: formData.description,
        imageSrc: formData.imageSrc,
        imageAlt: formData.imageAlt,
        ctaLabel: formData.ctaLabel,
        ctaHref: formData.ctaHref,
        order: Number.isFinite(formData.order) ? formData.order : 0,
        published: formData.published,
        scripture: formData.scripture,
        headTitle: formData.headTitle,
        responsibilities: cleanedResponsibilities,
        programmes: cleanedProgrammes,
        specialRole: specialRolePayload,
        furnishStatement: formData.furnishStatement,
        transformStatement: formData.transformStatement,
        influenceStatement: formData.influenceStatement,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast({
          title: mode === 'create' ? 'Group created' : 'Group updated',
          description: `"${formData.title}" has been ${mode === 'create' ? 'added' : 'updated'}.`,
          variant: 'success',
          duration: 3000,
        })
        await onSuccess()
      } else {
        const data = await res.json().catch(() => ({}))
        const msg = data.error ?? 'Failed to save group'
        setError(msg)
        toast({
          title: mode === 'create' ? 'Create failed' : 'Update failed',
          description: msg,
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      console.error('Error saving group:', err)
      setError('An error occurred while saving the group')
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

  // ---------- render -------------------------------------------------------

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="group-modal-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 id="group-modal-title" className="text-2xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            {mode === 'create' ? 'Add Group' : 'Edit Group'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* === Section: Basics === */}
          <Section title="Basics">
            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image *
              </label>
              {formData.imageSrc ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 mb-2">
                  <Image src={formData.imageSrc} alt={formData.imageAlt || 'Preview'} fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
                  <div className="absolute top-2 right-2">
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, imageSrc: '' }))} className="px-2 py-1 text-xs font-semibold bg-black/60 text-white rounded hover:bg-black/80">
                      Replace
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400 mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {isUploading ? 'Uploading…' : 'Click to upload (JPG / PNG, max 5MB)'}
                  </span>
                  <input type="file" accept="image/jpeg,image/png" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
                </label>
              )}
            </div>

            <Field label="Title *" id="g-title">
              <input
                id="g-title"
                type="text"
                required
                maxLength={200}
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Prayer & Intercession"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </Field>

            <Field
              label="Tag"
              id="g-tag"
              hint="Short label shown on the homepage MinistriesSection card (e.g. King's club). Falls back to uppercased title."
            >
              <input
                id="g-tag"
                type="text"
                maxLength={100}
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                placeholder="e.g. PRAYER & INTERCESSION"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase"
              />
            </Field>

            <Field
              label="URL slug *"
              id="g-slug"
              hint={`Public URL: /groups/${formData.slug || '...'}`}
            >
              <input
                id="g-slug"
                type="text"
                required
                maxLength={100}
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="e.g. prayer-intercession"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
              />
            </Field>

            <Field label="Short description (card blurb) *" id="g-description">
              <textarea
                id="g-description"
                required
                maxLength={2000}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Brief one-paragraph blurb shown on the listing card"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </Field>

            <Field label="Image alt text *" id="g-image-alt" hint="For screen readers — describe the image">
              <input
                id="g-image-alt"
                type="text"
                required
                maxLength={200}
                value={formData.imageAlt}
                onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                placeholder="e.g. Prayer ministry intercessors gathering"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="CTA label" id="g-cta-label" hint="Button text on the card (optional)">
                <input
                  id="g-cta-label"
                  type="text"
                  maxLength={50}
                  value={formData.ctaLabel}
                  onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
                  placeholder="e.g. Get Involved"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </Field>
              <Field label="CTA URL" id="g-cta-href" hint="Where the button links (defaults to detail page)">
                <input
                  id="g-cta-href"
                  type="url"
                  value={formData.ctaHref}
                  onChange={(e) => setFormData({ ...formData, ctaHref: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </Field>
            </div>

            <Field label="Display order" id="g-order" hint="Lower numbers appear first. Use 10, 20, 30… so you can insert between later.">
              <input
                id="g-order"
                type="number"
                step={1}
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </Field>
          </Section>

          {/* === Section: Departmental Board === */}
          <Section title="Departmental Board (optional)">
            <Field label="Scripture" id="g-scripture" hint="Bible verse + reference shown as the banner quote">
              <textarea
                id="g-scripture"
                maxLength={2000}
                value={formData.scripture}
                onChange={(e) => setFormData({ ...formData, scripture: e.target.value })}
                rows={2}
                placeholder='e.g. Isaiah 40:28-31 — They that wait upon the LORD shall renew their strength'
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </Field>

            <Field label="Head Title" id="g-head-title" hint='e.g. "HEAD OF PRAYER & INTERCESSION"'>
              <input
                id="g-head-title"
                type="text"
                maxLength={200}
                value={formData.headTitle}
                onChange={(e) => setFormData({ ...formData, headTitle: e.target.value })}
                placeholder="HEAD OF PRAYER & INTERCESSION"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </Field>

            {/* Responsibilities list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Responsibilities
                </label>
                <button
                  type="button"
                  onClick={addResponsibility}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  + Add responsibility
                </button>
              </div>
              {formData.responsibilities.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  Click &ldquo;Add responsibility&rdquo; to add numbered duties for the Head of this ministry.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.responsibilities.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-2 text-sm font-bold text-gray-400 w-6 text-right">{i + 1}.</span>
                      <textarea
                        value={item}
                        onChange={(e) => updateResponsibility(i, e.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder="Lead and coordinate all weekly corporate prayer meetings for the church"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeResponsibility(i)}
                        aria-label={`Remove responsibility ${i + 1}`}
                        className="mt-2 text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Programmes list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Programmes & Sub-Units
                </label>
                <button
                  type="button"
                  onClick={addProgramme}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  + Add programme
                </button>
              </div>
              {formData.programmes.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  Click &ldquo;Add programme&rdquo; to list programmes, meetings, or sub-units.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.programmes.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={p.title}
                          onChange={(e) => updateProgramme(i, 'title', e.target.value)}
                          maxLength={300}
                          placeholder="Programme title (e.g. MOUNT UP)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        />
                        <input
                          type="text"
                          value={p.schedule ?? ''}
                          onChange={(e) => updateProgramme(i, 'schedule', e.target.value)}
                          maxLength={200}
                          placeholder="Schedule (optional, e.g. Daily 00:00–00:30)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProgramme(i)}
                        aria-label={`Remove programme ${i + 1}`}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Special role callout */}
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Special role callout</p>
                  <p className="text-xs text-gray-500">
                    e.g. SOUL PIPELINE ROLE — a single highlighted note shown alongside the programmes list.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.hasSpecialRole}
                  onClick={() => setFormData((prev) => ({ ...prev, hasSpecialRole: !prev.hasSpecialRole }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.hasSpecialRole ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.hasSpecialRole ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {formData.hasSpecialRole && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.specialRoleTitle}
                    onChange={(e) => setFormData({ ...formData, specialRoleTitle: e.target.value })}
                    maxLength={200}
                    placeholder="Callout title (e.g. SOUL PIPELINE ROLE)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                  <textarea
                    value={formData.specialRoleBody}
                    onChange={(e) => setFormData({ ...formData, specialRoleBody: e.target.value })}
                    rows={3}
                    maxLength={2000}
                    placeholder="Callout body — what does this role do?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                  />
                </div>
              )}
            </div>
          </Section>

          {/* === Section: Vision Pillars === */}
          <Section
            title="Vision Alignment (optional)"
            description="Three short statements describing how this ministry serves the Furnish · Transform · Influence vision."
          >
            <Field label="Furnish statement" id="g-furnish">
              <textarea
                id="g-furnish"
                maxLength={2000}
                value={formData.furnishStatement}
                onChange={(e) => setFormData({ ...formData, furnishStatement: e.target.value })}
                rows={2}
                placeholder="Training and mobilising every member to..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </Field>
            <Field label="Transform statement" id="g-transform">
              <textarea
                id="g-transform"
                maxLength={2000}
                value={formData.transformStatement}
                onChange={(e) => setFormData({ ...formData, transformStatement: e.target.value })}
                rows={2}
                placeholder="Atmospheres, families and destinies transformed through..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </Field>
            <Field label="Influence statement" id="g-influence">
              <textarea
                id="g-influence"
                maxLength={2000}
                value={formData.influenceStatement}
                onChange={(e) => setFormData({ ...formData, influenceStatement: e.target.value })}
                rows={2}
                placeholder="A church that releases salvation and declares..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </Field>
          </Section>

          {/* === Section: Publish === */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Publish to public site</p>
              <p className="text-xs text-gray-500">When enabled, this group is visible on /groups and the detail page.</p>
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

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
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
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Group' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small layout primitives used inside the modal form
// ---------------------------------------------------------------------------

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-2">
        <h3 className="text-base font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          {title}
        </h3>
        {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string
  id: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
