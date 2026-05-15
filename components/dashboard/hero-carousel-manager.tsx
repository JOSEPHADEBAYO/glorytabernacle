'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ImagePlus, Loader2, Pencil, Trash2, Upload } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import type { HeroCarouselImage } from '@/lib/types/hero-carousel'
import {
  ConfirmDeleteModal,
  useConfirmDelete,
} from '@/components/ui/confirm-delete-modal'

interface HeroCarouselManagerProps {
  initialImages: HeroCarouselImage[]
}

interface UploadedImage {
  url: string
  publicId?: string
  filename?: string
  format?: string
  size?: number
  width?: number
  height?: number
}

type FormState = {
  title: string
  imageAlt: string
  imageUrl: string
  publicId?: string
  filename?: string
  format?: string
  size?: number
  width?: number
  height?: number
  order: number
  published: boolean
}

const emptyForm: FormState = {
  title: '',
  imageAlt: '',
  imageUrl: '',
  order: 0,
  published: true,
}

function formatBytes(size: number | null | undefined) {
  if (!size) return null
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function toFormState(image: HeroCarouselImage): FormState {
  return {
    title: image.title,
    imageAlt: image.imageAlt,
    imageUrl: image.imageUrl,
    publicId: image.publicId ?? undefined,
    filename: image.filename ?? undefined,
    format: image.format ?? undefined,
    size: image.size ?? undefined,
    width: image.width ?? undefined,
    height: image.height ?? undefined,
    order: image.order,
    published: image.published,
  }
}

export function HeroCarouselManager({
  initialImages,
}: HeroCarouselManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [images, setImages] = useState(initialImages)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { isOpen: deleteIsOpen, pendingItem: deletePendingId, openDelete, closeDelete } = useConfirmDelete<string>()
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    const res = await fetch('/api/hero-carousel', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    setImages(data.images ?? [])
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError(null)
  }

  const applyUpload = (upload: UploadedImage, fallbackName: string) => {
    setForm((current) => ({
      ...current,
      title: current.title || fallbackName.replace(/\.[^.]+$/, ''),
      imageAlt: current.imageAlt || fallbackName.replace(/\.[^.]+$/, ''),
      imageUrl: upload.url,
      publicId: upload.publicId,
      filename: upload.filename ?? fallbackName,
      format: upload.format,
      size: upload.size,
      width: upload.width,
      height: upload.height,
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({
        title: 'Invalid file',
        description: 'Hero carousel images must be JPG or PNG files.',
        variant: 'error',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'error',
      })
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const body = new FormData()
      body.append('file', file)
      body.append('folder', 'hero-carousel')

      const res = await fetch('/api/upload', { method: 'POST', body })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to upload image')
      }

      applyUpload(data, file.name)
      toast({
        title: 'Image uploaded',
        description: 'Review the details, then save it to the hero carousel.',
        variant: 'success',
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An error occurred during upload'
      setError(message)
      toast({ title: 'Upload failed', description: message, variant: 'error' })
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!form.imageUrl) {
      setError('Upload an image before saving.')
      return
    }

    setIsSaving(true)

    try {
      const res = await fetch(
        editingId ? `/api/hero-carousel/${editingId}` : '/api/hero-carousel',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      )
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to save hero image')
      }

      toast({
        title: editingId ? 'Hero image updated' : 'Hero image saved',
        description: 'The landing page will use published images from this list.',
        variant: 'success',
      })
      resetForm()
      await refetch()
      router.refresh()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An error occurred while saving'
      setError(message)
      toast({ title: 'Save failed', description: message, variant: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/hero-carousel/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to delete hero image')
      }

      setImages((current) => current.filter((image) => image.id !== id))
      toast({
        title: 'Hero image deleted',
        description: 'The carousel list has been updated.',
        variant: 'success',
      })
      router.refresh()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An error occurred while deleting'
      toast({ title: 'Delete failed', description: message, variant: 'error' })
    }
  }

  const handleTogglePublish = async (image: HeroCarouselImage) => {
    const previous = image.published
    setImages((current) =>
      current.map((item) =>
        item.id === image.id ? { ...item, published: !previous } : item
      )
    )

    try {
      const res = await fetch(`/api/hero-carousel/${image.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !previous }),
      })

      if (!res.ok) {
        throw new Error('Failed to update publish status')
      }

      await refetch()
      router.refresh()
    } catch (err) {
      setImages((current) =>
        current.map((item) =>
          item.id === image.id ? { ...item, published: previous } : item
        )
      )
      toast({
        title: 'Publish update failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      })
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(340px,420px)_1fr]">
      <form
        onSubmit={handleSubmit}
        className="self-start rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {editingId ? 'Edit Hero Image' : 'Add Hero Image'}
            </h2>
            <p className="text-sm text-gray-500">JPG or PNG, up to 5MB.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Image
            </label>
            {form.imageUrl ? (
              <div className="relative aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                <Image
                  src={form.imageUrl}
                  alt={form.imageAlt || 'Hero image preview'}
                  fill
                  className="object-cover"
                  sizes="420px"
                />
              </div>
            ) : (
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center hover:bg-gray-100">
                {isUploading ? (
                  <Loader2 className="mb-2 h-7 w-7 animate-spin text-blue-600" />
                ) : (
                  <Upload className="mb-2 h-7 w-7 text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {isUploading ? 'Uploading...' : 'Upload hero image'}
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
            {form.imageUrl && (
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Replace image
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

          <div>
            <label
              htmlFor="hero-title"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              id="hero-title"
              required
              maxLength={120}
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Sunday worship hero"
            />
          </div>

          <div>
            <label
              htmlFor="hero-alt"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Alt Text
            </label>
            <input
              id="hero-alt"
              required
              maxLength={200}
              value={form.imageAlt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  imageAlt: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Congregation worshipping at Glory Tabernacle"
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label
                htmlFor="hero-order"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Display Order
              </label>
              <input
                id="hero-order"
                type="number"
                min={0}
                value={form.order}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    order: Number(event.target.value),
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      published: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                Published
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Save Image'}
            </button>
          </div>
        </div>
      </form>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {images.length} {images.length === 1 ? 'image' : 'images'} in the
            hero carousel library
          </p>
        </div>

        {images.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <ImagePlus className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900">
              No hero images yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add the first image to begin replacing the default landing hero.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {images.map((image) => (
              <article
                key={image.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="relative aspect-video bg-gray-100">
                  <Image
                    src={image.imageUrl}
                    alt={image.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 50vw, 420px"
                  />
                  <span className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                    Order {image.order}
                  </span>
                  {!image.published && (
                    <span className="absolute right-3 top-3 rounded bg-yellow-500 px-2 py-1 text-xs font-semibold text-white">
                      Draft
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{image.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {image.imageAlt}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                    {image.width && image.height && (
                      <span>{`${image.width} x ${image.height}`}</span>
                    )}
                    {formatBytes(image.size) && (
                      <span>{formatBytes(image.size)}</span>
                    )}
                    {image.format && <span>{image.format.toUpperCase()}</span>}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={image.published}
                        onChange={() => handleTogglePublish(image)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      Published
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(image.id)
                          setForm(toFormState(image))
                          setError(null)
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                        aria-label={`Edit ${image.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(image.id)}
                        disabled={deletePendingId === image.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        aria-label={`Delete ${image.title}`}
                      >
                        {deletePendingId === image.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={deleteIsOpen}
        onConfirm={async () => {
          if (deletePendingId) await handleDelete(deletePendingId)
          closeDelete()
        }}
        onCancel={closeDelete}
      />
    </div>
  )
}
