'use client'

import { useState } from 'react'

/**
 * Public right-to-erasure request form (UK GDPR Article 17), rendered on
 * /parent/data-request.
 *
 * Parents/guardians ask us to erase their child's data. Submitting does NOT
 * delete anything — it lodges a request that the Children's Leader / Super
 * Admin reviews and actions from the dashboard, after verifying the requester.
 * Submits to the public /api/parent/erasure-request endpoint.
 */
export function ParentDataRequest() {
  const [childName, setChildName] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [message, setMessage] = useState('')
  const [confirmGuardian, setConfirmGuardian] = useState(false)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/parent/erasure-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName,
          guardianName,
          guardianEmail,
          message,
          confirmGuardian,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        if (json.details && Array.isArray(json.details) && json.details.length > 0) {
          throw new Error(
            json.details
              .map((d: { field: string; message: string }) => d.message)
              .join(' ')
          )
        }
        throw new Error(json.error ?? 'Could not submit your request.')
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="px-6 py-10 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--church-green, #0D8A4A)' }}
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2
          className="mt-5 text-2xl font-extrabold"
          style={{ color: 'rgba(27, 34, 119, 1)' }}
        >
          We&apos;ve received your request
        </h2>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
          Our Children&apos;s Leader will review it and may contact you on the
          email you gave to confirm your identity before erasing any records.
          We&apos;ll complete verified requests within one month, as required
          by UK GDPR.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to home
          </a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 py-8 space-y-5">
      <div>
        <label htmlFor="childName" className="block text-sm font-semibold text-gray-800">
          Child&apos;s full name
        </label>
        <input
          id="childName"
          type="text"
          required
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. Grace Ade"
        />
      </div>

      <div>
        <label htmlFor="guardianName" className="block text-sm font-semibold text-gray-800">
          Your full name
        </label>
        <input
          id="guardianName"
          type="text"
          required
          value={guardianName}
          onChange={(e) => setGuardianName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Parent / legal guardian"
        />
      </div>

      <div>
        <label htmlFor="guardianEmail" className="block text-sm font-semibold text-gray-800">
          Your email address
        </label>
        <input
          id="guardianEmail"
          type="email"
          required
          value={guardianEmail}
          onChange={(e) => setGuardianEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="So we can confirm your identity"
        />
        <p className="mt-1 text-xs text-gray-500">
          Please use the email we hold for your child if you can, so we can
          match your request quickly.
        </p>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-gray-800">
          Anything else we should know <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          id="message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. which records you'd like erased, or any context"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={confirmGuardian}
          onChange={(e) => setConfirmGuardian(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
        />
        <span>
          I confirm I am the parent or legal guardian of this child and I am
          requesting that the church erase their personal data.
        </span>
      </label>

      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 leading-relaxed">
        Some information may be kept where the law requires it — for example
        records relevant to a safeguarding matter are retained in line with
        statutory guidance even after a child&apos;s other data is erased. See
        our{' '}
        <a className="text-blue-700 underline" href="/privacy-notice">
          Privacy Notice
        </a>{' '}
        for details on how we handle your data and your rights.
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: 'var(--church-red, rgba(230, 17, 17, 1))' }}
      >
        {busy ? 'Submitting…' : 'Submit erasure request'}
      </button>
    </form>
  )
}
