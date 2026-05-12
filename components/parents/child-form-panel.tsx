'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GENDERS, GENDER_LABELS, type Gender } from '@/lib/types/group-member'

interface FormState {
  firstName: string
  lastName: string
  dateOfBirth: string // YYYY-MM-DD
  gender: Gender | ''
  allergies: string
  medicalNotes: string
  specialNeeds: string
  photoUrl: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
}

const empty: FormState = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  allergies: '',
  medicalNotes: '',
  specialNeeds: '',
  photoUrl: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
}

interface ChildFormPanelProps {
  mode: 'create' | 'edit'
  childId?: string
  initial?: Partial<FormState>
}

export function ChildFormPanel({ mode, childId, initial }: ChildFormPanelProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({ ...empty, ...initial })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<string[]>([])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors([])

    if (!form.gender) {
      setError('Please select a gender.')
      return
    }

    setIsSubmitting(true)
    try {
      const url =
        mode === 'create'
          ? '/api/parents/me/children'
          : `/api/parents/me/children/${childId}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        router.push('/parents')
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setFieldErrors(Array.isArray(data.details) ? data.details : [])
        setError(
          data.error ?? 'Could not save. Please check the form and try again.'
        )
      }
    } catch (err) {
      console.error('Child save error:', err)
      setError('Unable to reach the server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!childId) return
    if (
      !confirm(
        'Remove this child from your account? This cannot be undone (their attendance records will remain).'
      )
    ) {
      return
    }
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/parents/me/children/${childId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/parents')
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Could not remove. Please try again.')
      }
    } catch (err) {
      console.error('Child delete error:', err)
      setError('Unable to reach the server. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm"
    >
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">{error}</p>
          {fieldErrors.length > 0 && (
            <ul className="mt-1.5 list-disc pl-5 space-y-0.5 text-xs">
              {fieldErrors.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Section title="Child">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="c-first" label="First name *">
            <input
              id="c-first"
              type="text"
              required
              maxLength={100}
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </Field>
          <Field id="c-last" label="Last name *">
            <input
              id="c-last"
              type="text"
              required
              maxLength={100}
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="c-dob" label="Date of birth *">
            <input
              id="c-dob"
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
              value={form.dateOfBirth}
              onChange={(e) => update('dateOfBirth', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </Field>
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Gender *</p>
            <div className="flex gap-3">
              {GENDERS.map((g) => (
                <label
                  key={g}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors flex-1 justify-center ${
                    form.gender === g
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={form.gender === g}
                    onChange={() => update('gender', g)}
                    className="sr-only"
                  />
                  {GENDER_LABELS[g]}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Care details">
        <Field id="c-allergies" label="Allergies" hint="Foods, medications, environmental — write 'None' if not applicable">
          <textarea
            id="c-allergies"
            rows={2}
            maxLength={2000}
            value={form.allergies}
            onChange={(e) => update('allergies', e.target.value)}
            placeholder="Peanuts, dairy, etc."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </Field>
        <Field id="c-medical" label="Medical notes" hint="Conditions, medications, anything our team should know">
          <textarea
            id="c-medical"
            rows={2}
            maxLength={2000}
            value={form.medicalNotes}
            onChange={(e) => update('medicalNotes', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </Field>
        <Field id="c-special" label="Special needs" hint="Sensory, behavioural, accessibility considerations">
          <textarea
            id="c-special"
            rows={2}
            maxLength={2000}
            value={form.specialNeeds}
            onChange={(e) => update('specialNeeds', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </Field>
      </Section>

      <Section title="Emergency contact">
        <Field id="c-ec-name" label="Full name *">
          <input
            id="c-ec-name"
            type="text"
            required
            maxLength={100}
            value={form.emergencyContactName}
            onChange={(e) => update('emergencyContactName', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            id="c-ec-phone"
            label="Phone number *"
            hint="UK number (e.g. 07123 456789)"
          >
            <input
              id="c-ec-phone"
              type="tel"
              required
              maxLength={30}
              value={form.emergencyContactPhone}
              onChange={(e) => update('emergencyContactPhone', e.target.value)}
              placeholder="07123 456789"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </Field>
          <Field id="c-ec-rel" label="Relationship to child *">
            <input
              id="c-ec-rel"
              type="text"
              required
              maxLength={60}
              value={form.emergencyContactRelation}
              onChange={(e) => update('emergencyContactRelation', e.target.value)}
              placeholder="e.g. Grandmother, Aunt"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </Field>
        </div>
      </Section>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
        {mode === 'edit' ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting || isDeleting}
            className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {isDeleting ? 'Removing…' : 'Remove this child from my account'}
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-3 sm:ml-auto">
          <button
            type="button"
            onClick={() => router.push('/parents')}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isDeleting}
            className="px-6 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-50"
            style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
          >
            {isSubmitting ? 'Saving…' : mode === 'create' ? 'Register child' : 'Save changes'}
          </button>
        </div>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3
        className="text-sm font-bold uppercase tracking-wider"
        style={{ color: 'rgba(27, 34, 119, 1)' }}
      >
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
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
