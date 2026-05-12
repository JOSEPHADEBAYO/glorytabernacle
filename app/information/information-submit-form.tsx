'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import {
  INFORMATION_CATEGORIES,
  INFORMATION_CATEGORY_LABELS,
  type InformationCategory,
} from '@/lib/types/information'

const initialState = {
  title: '',
  description: '',
  linkUrl: '',
  category: 'IMMIGRATION' as InformationCategory,
  submittedBy: '',
  submitterEmail: '',
}

export function InformationSubmitForm() {
  const { toast } = useToast()
  const [formData, setFormData] = useState(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/information', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const message = data.details?.[0] ?? data.error ?? 'Submission failed'
        setError(message)
        toast({
          title: 'Submission failed',
          description: message,
          variant: 'error',
          duration: 5000,
        })
        return
      }

      setFormData(initialState)
      toast({
        title: 'Information submitted',
        description: 'Thank you. An admin will review it before publishing.',
        variant: 'success',
        duration: 5000,
      })
    } catch (err) {
      console.error('Error submitting information:', err)
      setError('Something went wrong while submitting.')
      toast({
        title: 'Submission failed',
        description: 'Something went wrong while submitting.',
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="info-title" className="mb-1 block text-sm font-semibold text-gray-900">
          Title
        </label>
        <input
          id="info-title"
          required
          maxLength={160}
          value={formData.title}
          onChange={(event) => setFormData({ ...formData, title: event.target.value })}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-900"
        />
      </div>

      <div>
        <label htmlFor="info-description" className="mb-1 block text-sm font-semibold text-gray-900">
          Description
        </label>
        <textarea
          id="info-description"
          required
          rows={5}
          maxLength={3000}
          value={formData.description}
          onChange={(event) =>
            setFormData({ ...formData, description: event.target.value })
          }
          className="w-full resize-none rounded border border-gray-300 bg-white px-3 py-2 text-sm leading-relaxed outline-none transition focus:border-gray-900"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="info-link" className="mb-1 block text-sm font-semibold text-gray-900">
            Link
          </label>
          <input
            id="info-link"
            type="url"
            required
            value={formData.linkUrl}
            onChange={(event) => setFormData({ ...formData, linkUrl: event.target.value })}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-900"
          />
        </div>
        <div>
          <label htmlFor="info-category" className="mb-1 block text-sm font-semibold text-gray-900">
            Category
          </label>
          <select
            id="info-category"
            value={formData.category}
            onChange={(event) =>
              setFormData({
                ...formData,
                category: event.target.value as InformationCategory,
              })
            }
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-900"
          >
            {INFORMATION_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {INFORMATION_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="info-name" className="mb-1 block text-sm font-semibold text-gray-900">
            Name
          </label>
          <input
            id="info-name"
            value={formData.submittedBy}
            onChange={(event) =>
              setFormData({ ...formData, submittedBy: event.target.value })
            }
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-900"
          />
        </div>
        <div>
          <label htmlFor="info-email" className="mb-1 block text-sm font-semibold text-gray-900">
            Email
          </label>
          <input
            id="info-email"
            type="email"
            value={formData.submitterEmail}
            onChange={(event) =>
              setFormData({ ...formData, submitterEmail: event.target.value })
            }
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-900"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {isSubmitting ? 'Submitting...' : 'Submit for review'}
      </button>
    </form>
  )
}
