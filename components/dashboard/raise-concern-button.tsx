'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/toast-provider'
import {
  CONCERN_TYPES,
  CONCERN_TYPE_LABELS,
  type ConcernType,
} from '@/lib/types/safeguarding'

interface ChildOption {
  id: string
  firstName: string
  lastName: string
}

function nowLocalDateTime(): string {
  // Format current local time as a value for <input type="datetime-local">.
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * "Raise a safeguarding concern" button + modal. Usable by any
 * CHILDREN_LEADER or SUPER_ADMIN. The raiser does not need to be able to
 * view the concern log — once logged, only the DSL / Super Admin can read it.
 */
export function RaiseConcernButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-colors"
        style={{ borderColor: 'var(--church-red, #dc2626)', color: 'var(--church-red, #dc2626)' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Raise safeguarding concern
      </button>
      {open && <RaiseConcernModal onClose={() => setOpen(false)} />}
    </>
  )
}

function RaiseConcernModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const [aboutMode, setAboutMode] = useState<'child' | 'other'>('child')
  const [children, setChildren] = useState<ChildOption[]>([])
  const [childId, setChildId] = useState('')
  const [otherName, setOtherName] = useState('')
  const [concernType, setConcernType] = useState<ConcernType>('DISCLOSURE')
  const [occurredAt, setOccurredAt] = useState(nowLocalDateTime())
  const [description, setDescription] = useState('')
  const [actionTaken, setActionTaken] = useState('')
  const [whoNotified, setWhoNotified] = useState('')
  const [referredToMash, setReferredToMash] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load the roster so the leader can link a registered child.
  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/children?pageSize=100', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return
        setChildren(
          (json.children as ChildOption[]).map((c) => ({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
          }))
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit() {
    if (!description.trim()) {
      setError('Please describe what happened.')
      return
    }
    if (aboutMode === 'child' && !childId) {
      setError('Please choose the child this concern is about, or switch to “Someone else”.')
      return
    }
    if (aboutMode === 'other' && !otherName.trim()) {
      setError('Please enter who this concern is about.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/safeguarding-concerns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: aboutMode === 'child' ? childId : '',
          childName: aboutMode === 'other' ? otherName.trim() : '',
          concernType,
          description: description.trim(),
          actionTaken: actionTaken.trim(),
          whoNotified: whoNotified.trim(),
          referredToMash,
          occurredAt: new Date(occurredAt).toISOString(),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (json.details?.length) {
          throw new Error(
            json.details
              .map((d: { field: string; message: string }) => d.message)
              .join('; ')
          )
        }
        throw new Error(json.error ?? 'Could not log the concern')
      }
      setSubmitted(true)
      toast({
        title: 'Concern logged',
        description: 'The Designated Safeguarding Lead has been notified in the log.',
        variant: 'success',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log the concern')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Raise a safeguarding concern"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">
            Raise a safeguarding concern
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        {submitted ? (
          <div className="px-6 py-8 text-center">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--church-green, #0D8A4A)' }}
              aria-hidden="true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-900">Concern logged</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Thank you. This concern is now recorded in the safeguarding log
              where only the Designated Safeguarding Lead and Super Admin can
              see it. If a child is in immediate danger, call 999 now.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800">
              If a child is in immediate danger, call 999 first. Use this form
              to record a concern so the Safeguarding Lead can act on it.
            </p>

            {/* About whom */}
            <fieldset>
              <legend className="block mb-1 text-xs font-semibold text-gray-700">
                Who is this concern about?
              </legend>
              <div className="flex gap-2 mb-2">
                <ModeChip active={aboutMode === 'child'} onClick={() => setAboutMode('child')}>
                  A registered child
                </ModeChip>
                <ModeChip active={aboutMode === 'other'} onClick={() => setAboutMode('other')}>
                  Someone else / general
                </ModeChip>
              </div>
              {aboutMode === 'child' ? (
                <select
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select a child…</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                  placeholder="Name / description (e.g. a visiting adult)"
                  className={selectClass}
                />
              )}
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Type of concern">
                <select
                  value={concernType}
                  onChange={(e) => setConcernType(e.target.value as ConcernType)}
                  className={selectClass}
                >
                  {CONCERN_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {CONCERN_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="When did it happen / when noticed?">
                <input
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  className={selectClass}
                />
              </Field>
            </div>

            <Field label="What happened?" required>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Record the facts as you observed them. Use the child's own words for any disclosure. Avoid assumptions or opinions."
                className={selectClass}
                maxLength={8000}
              />
            </Field>

            <Field label="What did you do at the time? (optional)">
              <textarea
                rows={2}
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                className={selectClass}
                maxLength={8000}
              />
            </Field>

            <Field label="Who have you already told? (optional)">
              <input
                type="text"
                value={whoNotified}
                onChange={(e) => setWhoNotified(e.target.value)}
                placeholder="e.g. told the DSL verbally, informed the parent"
                className={selectClass}
              />
            </Field>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={referredToMash}
                onChange={(e) => setReferredToMash(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">
                This has already been referred to social care / the Devon MASH
              </span>
            </label>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--church-red, #dc2626)' }}
              >
                {submitting ? 'Logging…' : 'Log concern'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ModeChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
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

const selectClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 outline-none'
