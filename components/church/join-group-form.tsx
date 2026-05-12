'use client'

import { useState } from 'react'
import {
  GENDERS,
  GENDER_LABELS,
  MARITAL_STATUSES,
  MARITAL_STATUS_LABELS,
  type Gender,
  type MaritalStatus,
} from '@/lib/types/group-member'

interface JoinGroupFormProps {
  groupId: string
  groupTitle: string
}

interface FormState {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  birthDay: string
  birthMonth: string
  gender: Gender | ''
  maritalStatus: MaritalStatus | ''
  address: string
  filledWithHolyGhost: '' | 'yes' | 'no'
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const initialState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  birthDay: '',
  birthMonth: '',
  gender: '',
  maritalStatus: '',
  address: '',
  filledWithHolyGhost: '',
}

export function JoinGroupForm({ groupId, groupTitle }: JoinGroupFormProps) {
  const [form, setForm] = useState<FormState>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<string[]>([])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors([])

    if (
      !form.gender ||
      !form.maritalStatus ||
      !form.filledWithHolyGhost
    ) {
      setError('Please complete all required fields before submitting.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          birthDay: Number(form.birthDay),
          birthMonth: Number(form.birthMonth),
          gender: form.gender,
          maritalStatus: form.maritalStatus,
          address: form.address.trim(),
          filledWithHolyGhost: form.filledWithHolyGhost === 'yes',
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json().catch(() => ({}))
        const detail: string[] = Array.isArray(data.details) ? data.details : []
        setFieldErrors(detail)
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch (err) {
      console.error('Join group submit error:', err)
      setError(
        'Unable to reach the server. Please check your connection and try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <section
        id="join"
        aria-label={`Join ${groupTitle}`}
        className="w-full bg-white py-16 px-6 md:px-16"
      >
        <div className="mx-auto max-w-2xl text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(27, 109, 36, 0.12)' }}
          >
            <svg className="h-7 w-7" style={{ color: 'rgb(27, 109, 36)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            Thank you for joining {groupTitle}!
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We&apos;ve received your details. Our follow-up team will be in touch soon.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      id="join"
      aria-label={`Join ${groupTitle}`}
      className="w-full py-16 px-6 md:px-16"
      style={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--church-light-green, rgb(27, 109, 36))' }}
          >
            Get Involved
          </p>
          <h2
            className="text-3xl md:text-4xl font-extrabold leading-tight"
            style={{ color: 'rgba(27, 34, 119, 1)' }}
          >
            Join {groupTitle}
          </h2>
          <p className="mt-3 text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            Fill in your details below and our follow-up team will reach out
            with next steps.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-semibold">{error}</p>
            {fieldErrors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 space-y-0.5 text-xs">
                {fieldErrors.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm" noValidate>
          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First name *" id="join-firstName">
              <input
                id="join-firstName"
                type="text"
                required
                maxLength={100}
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </Field>
            <Field label="Last name *" id="join-lastName">
              <input
                id="join-lastName"
                type="text"
                required
                maxLength={100}
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </Field>
          </div>

          {/* Email + phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email *" id="join-email">
              <input
                id="join-email"
                type="email"
                required
                maxLength={254}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </Field>
            <Field
              label="Phone number *"
              id="join-phone"
              hint="UK number (e.g. 07123 456789)"
            >
              <input
                id="join-phone"
                type="tel"
                required
                maxLength={30}
                value={form.phoneNumber}
                onChange={(e) => update('phoneNumber', e.target.value)}
                placeholder="07123 456789"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </Field>
          </div>

          {/* DOB */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Day &amp; month of birth *
            </p>
            <div className="grid grid-cols-2 gap-4">
              <select
                aria-label="Day of birth"
                required
                value={form.birthDay}
                onChange={(e) => update('birthDay', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                aria-label="Month of birth"
                required
                value={form.birthMonth}
                onChange={(e) => update('birthMonth', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Month</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Gender *</p>
            <div className="flex flex-wrap gap-3">
              {GENDERS.map((g) => (
                <label
                  key={g}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
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

          {/* Marital status */}
          <Field label="Marital status *" id="join-marital">
            <select
              id="join-marital"
              required
              value={form.maritalStatus}
              onChange={(e) => update('maritalStatus', e.target.value as MaritalStatus | '')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Select…</option>
              {MARITAL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {MARITAL_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>

          {/* Address */}
          <Field label="Address *" id="join-address">
            <textarea
              id="join-address"
              required
              maxLength={500}
              rows={3}
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Street, city, postcode"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </Field>

          {/* Holy Ghost */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Have you been filled with the Holy Ghost? *
            </p>
            <div className="flex gap-3">
              {(['yes', 'no'] as const).map((v) => (
                <label
                  key={v}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                    form.filledWithHolyGhost === v
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="filledWithHolyGhost"
                    value={v}
                    checked={form.filledWithHolyGhost === v}
                    onChange={() => update('filledWithHolyGhost', v)}
                    className="sr-only"
                  />
                  {v === 'yes' ? 'Yes' : 'No'}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
            >
              {isSubmitting ? 'Submitting…' : `Join ${groupTitle}`}
            </button>
            <p className="mt-3 text-xs text-gray-500 text-center">
              By submitting, your details will be shared with the {groupTitle} department.
            </p>
          </div>
        </form>
      </div>
    </section>
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
