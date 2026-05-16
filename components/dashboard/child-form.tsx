'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export const EMPTY_CHILD_FORM = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'MALE' as 'MALE' | 'FEMALE',
  allergies: '',
  medicalNotes: '',
  specialNeeds: '',
  photoUrl: '',
  primaryGuardianName: '',
  primaryGuardianPhone: '',
  primaryGuardianEmail: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
}
export type ChildFormValues = typeof EMPTY_CHILD_FORM

interface ChildFormProps {
  initialValues: ChildFormValues
  /** Endpoint to POST the child photo to. Returns { url } on success. */
  uploadEndpoint: string
  /** Label on the submit button. */
  submitLabel: string
  /** Called with the validated values when the user submits. */
  onSubmit: (values: ChildFormValues) => Promise<void>
  /** Called when the user cancels (e.g. closes the modal). Omit on standalone pages. */
  onCancel?: () => void
  /** Optional toast hook so consumers can surface upload errors. */
  onUploadError?: (message: string) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChildForm({
  initialValues,
  uploadEndpoint,
  submitLabel,
  onSubmit,
  onCancel,
  onUploadError,
}: ChildFormProps) {
  const [values, setValues] = useState<ChildFormValues>(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function set<K extends keyof ChildFormValues>(key: K, value: ChildFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleUpload(file: File) {
    setIsUploading(true)
    try {
      // Type / size guard (matches /api/upload, kept client-side too so we
      // can fail fast before the network round-trip).
      const allowed = ['image/jpeg', 'image/png']
      if (!allowed.includes(file.type)) {
        const msg = 'Please choose a JPG or PNG photo.'
        onUploadError?.(msg)
        setError(msg)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        const msg = 'Photo must be 5 MB or smaller.'
        onUploadError?.(msg)
        setError(msg)
        return
      }

      const fd = new FormData()
      fd.append('file', file)
      // /api/upload reads this; the parent upload endpoint ignores it.
      fd.append('folder', 'children/photos')

      const res = await fetch(uploadEndpoint, { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = data.error ?? 'Photo upload failed. Please try again.'
        onUploadError?.(msg)
        setError(msg)
        return
      }
      const data = await res.json()
      set('photoUrl', data.url)
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed.'
      onUploadError?.(msg)
      setError(msg)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(values)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
      <Section title="Child">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="First name" required>
            <input
              type="text"
              required
              value={values.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Last name" required>
            <input
              type="text"
              required
              value={values.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Date of birth" required>
            <input
              type="date"
              required
              value={values.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Gender" required>
            <select
              required
              value={values.gender}
              onChange={(e) => set('gender', e.target.value as 'MALE' | 'FEMALE')}
              className={inputClass}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Allergies">
            <textarea
              rows={2}
              value={values.allergies}
              onChange={(e) => set('allergies', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Medical notes">
            <textarea
              rows={2}
              value={values.medicalNotes}
              onChange={(e) => set('medicalNotes', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Special needs">
            <textarea
              rows={2}
              value={values.specialNeeds}
              onChange={(e) => set('specialNeeds', e.target.value)}
              className={inputClass}
            />
          </Field>

          {/* Photo upload — replaces the old URL text field. */}
          <Field label="Photo (optional)">
            {values.photoUrl ? (
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <Image
                    src={values.photoUrl}
                    alt="Child photo preview"
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={() => set('photoUrl', '')}
                  className="text-xs font-medium text-red-600 hover:text-red-800"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(file)
                    // Reset value so re-selecting the same file fires onChange.
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  disabled={isUploading}
                  className="block text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                <p className="text-xs text-gray-500">
                  JPG or PNG, up to 5 MB. {isUploading && 'Uploading…'}
                </p>
              </div>
            )}
          </Field>
        </div>
      </Section>

      <Section title="Primary guardian">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name" required>
            <input
              type="text"
              required
              value={values.primaryGuardianName}
              onChange={(e) => set('primaryGuardianName', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone" required>
            <input
              type="tel"
              required
              value={values.primaryGuardianPhone}
              onChange={(e) => set('primaryGuardianPhone', e.target.value)}
              placeholder="07123 456789"
              className={inputClass}
            />
          </Field>
          <Field label="Email (optional)">
            <input
              type="email"
              value={values.primaryGuardianEmail}
              onChange={(e) => set('primaryGuardianEmail', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Emergency contact (different from primary guardian)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name" required>
            <input
              type="text"
              required
              value={values.emergencyContactName}
              onChange={(e) => set('emergencyContactName', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone" required>
            <input
              type="tel"
              required
              value={values.emergencyContactPhone}
              onChange={(e) => set('emergencyContactPhone', e.target.value)}
              placeholder="07123 456789"
              className={inputClass}
            />
          </Field>
          <Field label="Relationship" required>
            <input
              type="text"
              required
              value={values.emergencyContactRelation}
              onChange={(e) => set('emergencyContactRelation', e.target.value)}
              placeholder="Aunt, neighbour, etc."
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || isUploading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Small helpers (kept local — not re-used elsewhere)
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 outline-none'

/**
 * Map a server-side AdminChild to form values. Exported so callers can
 * prefill the edit modal.
 */
export function childToFormValues(child: {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE'
  allergies: string | null
  medicalNotes: string | null
  specialNeeds: string | null
  photoUrl: string | null
  primaryGuardianName: string
  primaryGuardianPhone: string
  primaryGuardianEmail: string | null
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
}): ChildFormValues {
  return {
    firstName: child.firstName,
    lastName: child.lastName,
    dateOfBirth: child.dateOfBirth.slice(0, 10),
    gender: child.gender,
    allergies: child.allergies ?? '',
    medicalNotes: child.medicalNotes ?? '',
    specialNeeds: child.specialNeeds ?? '',
    photoUrl: child.photoUrl ?? '',
    primaryGuardianName: child.primaryGuardianName,
    primaryGuardianPhone: child.primaryGuardianPhone,
    primaryGuardianEmail: child.primaryGuardianEmail ?? '',
    emergencyContactName: child.emergencyContactName,
    emergencyContactPhone: child.emergencyContactPhone,
    emergencyContactRelation: child.emergencyContactRelation,
  }
}
