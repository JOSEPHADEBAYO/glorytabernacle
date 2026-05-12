'use client'

import { useState } from 'react'
import {
  ATTENDANCE_SERVICES,
  type AttendanceService,
} from '@/lib/types/attendance'

interface AttendanceFormProps {
  initialService?: AttendanceService
}

export function AttendanceForm({
  initialService = 'Sunday First Service',
}: AttendanceFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [service, setService] = useState<AttendanceService>(initialService)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors([])
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          service,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setFieldErrors(Array.isArray(data.details) ? data.details : [])
        setError(data.error ?? 'Could not record. Please try again.')
      }
    } catch (err) {
      console.error('Attendance submit error:', err)
      setError('Unable to reach the server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(27, 109, 36, 0.12)' }}
        >
          <svg
            className="h-7 w-7"
            style={{ color: 'rgb(27, 109, 36)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          You&apos;re marked in. Welcome!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Thanks, {name.split(' ')[0] || name}. Enjoy the service — we&apos;re
          glad you&apos;re with us today.
        </p>
        <button
          type="button"
          onClick={() => {
            setName('')
            setEmail('')
            setSubmitted(false)
          }}
          className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Mark someone else in
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm space-y-4"
    >
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
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

      <div>
        <label htmlFor="att-name" className="block text-sm font-medium text-gray-700 mb-2">
          Full name *
        </label>
        <input
          id="att-name"
          type="text"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label htmlFor="att-email" className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          id="att-email"
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label htmlFor="att-service" className="block text-sm font-medium text-gray-700 mb-2">
          Service *
        </label>
        <select
          id="att-service"
          required
          value={service}
          onChange={(e) => setService(e.target.value as AttendanceService)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
        >
          {ATTENDANCE_SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          We&apos;ve picked the most likely service — you can change it.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
      >
        {isSubmitting ? 'Submitting…' : 'Mark me in'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your details stay private. We use them only to follow up and pray for you.
      </p>
    </form>
  )
}
