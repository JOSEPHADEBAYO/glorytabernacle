'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface ChildFormCollector {
  name: string
  relationship: string
  phone: string
  photoUrl: string
  photoPublicId: string
  notes: string
}

export const EMPTY_COLLECTOR: ChildFormCollector = {
  name: '',
  relationship: '',
  phone: '',
  photoUrl: '',
  photoPublicId: '',
  notes: '',
}

export const EMPTY_CHILD_FORM = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'MALE' as 'MALE' | 'FEMALE',
  allergies: '',
  medicalNotes: '',
  specialNeeds: '',
  photoUrl: '',
  photoPublicId: '',
  primaryGuardianName: '',
  primaryGuardianPhone: '',
  primaryGuardianEmail: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  authorisedCollectors: [] as ChildFormCollector[],
  // UK GDPR consent — only the photography box is optional.
  consentDataProcessing: false,
  consentMedicalInfoSharing: false,
  consentEmergencyTreatment: false,
  consentPhotography: false,
  consentByName: '',
}
export type ChildFormValues = typeof EMPTY_CHILD_FORM

const MAX_COLLECTORS = 5

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
      // Lenient client guard: accept anything the OS reports as an image,
      // plus an empty MIME type (iOS often reports '' for HEIC photos
      // picked from the library). The server does the authoritative check.
      if (!isLikelyImage(file)) {
        const msg = 'Please choose an image (photo) file.'
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
      // Store the signed URL for preview AND the publicId to persist —
      // the publicId is what gets re-signed on every future read.
      setValues((v) => ({
        ...v,
        photoUrl: data.url,
        photoPublicId: data.publicId ?? '',
      }))
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
                  onClick={() =>
                    setValues((v) => ({ ...v, photoUrl: '', photoPublicId: '' }))
                  }
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
                  accept="image/*"
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
                  Take a photo or choose from your gallery, up to 5 MB.{' '}
                  {isUploading && 'Uploading…'}
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

      <CollectorsSection
        values={values.authorisedCollectors}
        uploadEndpoint={uploadEndpoint}
        onChange={(next) => set('authorisedCollectors', next)}
        onUploadError={onUploadError}
      />

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

      <ConsentSection
        values={values}
        onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
      />

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
// Authorised collectors section — repeating fieldset, capped at MAX_COLLECTORS
// ---------------------------------------------------------------------------

function CollectorsSection({
  values,
  uploadEndpoint,
  onChange,
  onUploadError,
}: {
  values: ChildFormCollector[]
  uploadEndpoint: string
  onChange: (next: ChildFormCollector[]) => void
  onUploadError?: (message: string) => void
}) {
  function update(index: number, patch: Partial<ChildFormCollector>) {
    onChange(values.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }
  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index))
  }
  function add() {
    if (values.length >= MAX_COLLECTORS) return
    onChange([...values, { ...EMPTY_COLLECTOR }])
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Authorised collectors
        </h3>
        <span className="text-[11px] text-gray-400">
          {values.length}/{MAX_COLLECTORS}
        </span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-gray-600">
        Anyone (other than the primary guardian) permitted to collect your
        child. The primary guardian is already authorised — you don&apos;t
        need to add them here. Add grandparents, aunts/uncles or trusted
        family friends. At pickup the children&apos;s leader will check the
        person matches one of these names and ask for the pickup code.
      </p>

      {values.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-3 py-3 text-xs text-gray-500">
          No additional collectors added yet. Tap &ldquo;Add a collector&rdquo;
          below if anyone besides the primary guardian may collect.
        </p>
      ) : (
        <ol className="space-y-3">
          {values.map((collector, i) => (
            <li
              key={i}
              className="rounded-xl border border-gray-200 bg-gray-50 p-3"
            >
              <CollectorRow
                index={i}
                value={collector}
                uploadEndpoint={uploadEndpoint}
                onUpdate={(patch) => update(i, patch)}
                onRemove={() => remove(i)}
                onUploadError={onUploadError}
              />
            </li>
          ))}
        </ol>
      )}

      {values.length < MAX_COLLECTORS && (
        <button
          type="button"
          onClick={add}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
        >
          + Add a collector
        </button>
      )}
    </section>
  )
}

function CollectorRow({
  index,
  value,
  uploadEndpoint,
  onUpdate,
  onRemove,
  onUploadError,
}: {
  index: number
  value: ChildFormCollector
  uploadEndpoint: string
  onUpdate: (patch: Partial<ChildFormCollector>) => void
  onRemove: () => void
  onUploadError?: (message: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      if (!isLikelyImage(file)) {
        onUploadError?.('Please choose an image (photo) file.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        onUploadError?.('Photo must be 5 MB or smaller.')
        return
      }
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'children/collectors')
      const res = await fetch(uploadEndpoint, { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        onUploadError?.(data.error ?? 'Photo upload failed.')
        return
      }
      const data = await res.json()
      onUpdate({ photoUrl: data.url, photoPublicId: data.publicId ?? '' })
    } catch (err) {
      onUploadError?.(err instanceof Error ? err.message : 'Photo upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Collector {index + 1}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-medium text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Full name" required>
          <input
            type="text"
            required
            value={value.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Relationship to child" required>
          <input
            type="text"
            required
            value={value.relationship}
            onChange={(e) => onUpdate({ relationship: e.target.value })}
            placeholder="e.g. Aunt, Grandfather"
            className={inputClass}
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            type="tel"
            value={value.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="07123 456789"
            className={inputClass}
          />
        </Field>
        <Field label="Photo (optional)">
          {value.photoUrl ? (
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-gray-200 bg-white">
                <Image
                  src={value.photoUrl}
                  alt={`${value.name || 'Collector'} photo`}
                  fill
                  sizes="56px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <button
                type="button"
                onClick={() => onUpdate({ photoUrl: '', photoPublicId: '' })}
                className="text-xs font-medium text-red-600 hover:text-red-800"
              >
                Remove photo
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                disabled={uploading}
                className="block text-xs text-gray-700 file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="text-[11px] text-gray-500">
                Take a photo or choose from your gallery, up to 5 MB.{' '}
                {uploading && 'Uploading…'}
              </p>
            </div>
          )}
        </Field>
      </div>
      <Field label="Notes (optional)">
        <textarea
          rows={2}
          value={value.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Anything the leader should know (e.g. only collects on Sundays)."
          className={inputClass}
        />
      </Field>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Consent section — UK GDPR Article 6 + Article 9 explicit consent.
// Three mandatory consents block submission until ticked; photography is
// optional. Auto-prefills the "consent given by" name from the primary
// guardian field but lets the user edit it (e.g. if both parents are
// signing).
// ---------------------------------------------------------------------------

function ConsentSection({
  values,
  onChange,
}: {
  values: ChildFormValues
  onChange: (patch: Partial<ChildFormValues>) => void
}) {
  // Auto-mirror the primary guardian's name into the consent name field
  // until the user edits it explicitly.
  function syncConsentName(next: boolean) {
    if (next && !values.consentByName && values.primaryGuardianName) {
      onChange({ consentByName: values.primaryGuardianName })
    }
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2">
        Consent &amp; data protection
      </h3>
      <p className="text-xs leading-relaxed text-gray-700 mb-3">
        Under UK GDPR we need your explicit consent to hold and use your
        child&apos;s information for our children&apos;s ministry. Please
        review and tick to confirm. The first three boxes are required.
        You can withdraw any of these at any time by emailing{' '}
        <a
          href="mailto:admin@glorytabernacle.co.uk"
          className="text-blue-700 underline"
        >
          admin@glorytabernacle.co.uk
        </a>
        .
      </p>

      <div className="space-y-2">
        <ConsentCheckbox
          checked={values.consentDataProcessing}
          onChange={(c) => {
            onChange({ consentDataProcessing: c })
            syncConsentName(c)
          }}
          required
          title="Processing my child's personal data"
          description="I consent to RCCG Glory Tabernacle, Barnstaple holding my child's personal information (name, date of birth, contact details, attendance) for the purposes of registration, pastoral care, and safeguarding."
        />
        <ConsentCheckbox
          checked={values.consentMedicalInfoSharing}
          onChange={(c) => {
            onChange({ consentMedicalInfoSharing: c })
            syncConsentName(c)
          }}
          required
          title="Sharing medical / allergy information with leaders"
          description="I consent to the medical, allergy and special-needs information I have provided being shared with the children's-ministry leaders who care for my child during sessions. This is required so we can keep my child safe."
        />
        <ConsentCheckbox
          checked={values.consentEmergencyTreatment}
          onChange={(c) => {
            onChange({ consentEmergencyTreatment: c })
            syncConsentName(c)
          }}
          required
          title="Emergency first aid and medical treatment"
          description="I consent to the children's-ministry team administering basic first aid to my child if needed, and — in a medical emergency where I cannot be reached — calling 999 and consenting to emergency medical treatment on my behalf."
        />
        <ConsentCheckbox
          checked={values.consentPhotography}
          onChange={(c) => onChange({ consentPhotography: c })}
          title="Photography &amp; use of images (optional)"
          description="I consent to my child being photographed or filmed during children's-ministry activities, with images potentially used in church communications (newsletters, social media, website). You can leave this blank if you'd rather we did not."
        />
      </div>

      <label className="mt-4 block text-sm">
        <span className="block mb-1 text-xs font-semibold text-gray-700">
          Consent given by <span className="text-red-600">*</span>
        </span>
        <input
          type="text"
          required
          value={values.consentByName}
          onChange={(e) => onChange({ consentByName: e.target.value })}
          placeholder="Your full name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <span className="mt-1 block text-xs text-gray-500">
          Usually the primary guardian. We snapshot this name and the
          timestamp so we have a record of who agreed to what.
        </span>
      </label>

      <div className="mt-4 rounded-lg bg-white/70 border border-amber-200 px-3 py-2 text-[11px] leading-relaxed text-gray-600">
        <p className="font-semibold text-gray-800 mb-1">Your rights</p>
        <p>
          Under UK GDPR you have the right to access the data we hold on
          your child, ask us to correct or erase it, restrict or object to
          our processing, and request portability of the data. You can also
          complain to the Information Commissioner&apos;s Office (
          <a
            href="https://ico.org.uk/make-a-complaint/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline"
          >
            ico.org.uk
          </a>
          ) if you&apos;re unhappy with how we handle it. Full details:{' '}
          <a
            href="/privacy-notice"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline"
          >
            our privacy notice
          </a>
          .
        </p>
      </div>
    </section>
  )
}

function ConsentCheckbox({
  checked,
  onChange,
  title,
  description,
  required,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  title: string
  description: string
  required?: boolean
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border bg-white px-3 py-2 cursor-pointer transition-colors ${
        checked ? 'border-green-500' : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900">
          {title}
          {required && <span className="text-red-600 ml-1">*</span>}
        </span>
        <span className="block text-xs text-gray-600 leading-relaxed mt-0.5">
          {description}
        </span>
      </span>
    </label>
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
 * Lenient client-side image check. Accepts anything the browser reports as
 * an image, an empty MIME type (iOS Safari frequently reports '' for HEIC
 * photos picked from the library / camera), or a recognised image file
 * extension. The server performs the authoritative validation.
 */
function isLikelyImage(file: File): boolean {
  if (file.type === '' || file.type.startsWith('image/')) return true
  return /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(file.name)
}

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
  photoPublicId?: string | null
  primaryGuardianName: string
  primaryGuardianPhone: string
  primaryGuardianEmail: string | null
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
  authorisedCollectors?: Array<{
    name: string
    relationship: string
    phone: string | null
    photoUrl: string | null
    photoPublicId?: string | null
    notes: string | null
  }>
  consentDataProcessing?: boolean
  consentPhotography?: boolean
  consentMedicalInfoSharing?: boolean
  consentEmergencyTreatment?: boolean
  consentByName?: string | null
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
    photoPublicId: child.photoPublicId ?? '',
    primaryGuardianName: child.primaryGuardianName,
    primaryGuardianPhone: child.primaryGuardianPhone,
    primaryGuardianEmail: child.primaryGuardianEmail ?? '',
    emergencyContactName: child.emergencyContactName,
    emergencyContactPhone: child.emergencyContactPhone,
    emergencyContactRelation: child.emergencyContactRelation,
    authorisedCollectors: (child.authorisedCollectors ?? []).map((c) => ({
      name: c.name,
      relationship: c.relationship,
      phone: c.phone ?? '',
      photoUrl: c.photoUrl ?? '',
      photoPublicId: c.photoPublicId ?? '',
      notes: c.notes ?? '',
    })),
    consentDataProcessing: child.consentDataProcessing ?? false,
    consentMedicalInfoSharing: child.consentMedicalInfoSharing ?? false,
    consentEmergencyTreatment: child.consentEmergencyTreatment ?? false,
    consentPhotography: child.consentPhotography ?? false,
    consentByName: child.consentByName ?? '',
  }
}
