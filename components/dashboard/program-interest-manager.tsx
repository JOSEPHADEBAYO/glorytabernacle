'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/toast-provider'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Row {
  id: string
  name: string
  email: string
  createdAt: string
}

interface ListResponse {
  rows: Row[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface SendResult {
  sent: number
  failed: number
  errors?: Array<{ email: string; reason: string }>
}

interface ProgramInterestManagerProps {
  initialRows: Row[]
  initialTotal: number
  pageSize: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProgramInterestManager({
  initialRows,
  initialTotal,
  pageSize,
}: ProgramInterestManagerProps) {
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ListResponse>({
    rows: initialRows,
    total: initialTotal,
    page: 1,
    pageSize,
    totalPages: Math.max(1, Math.ceil(initialTotal / pageSize)),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [composer, setComposer] = useState<
    | { kind: 'single'; recipient: Row }
    | { kind: 'all' }
    | null
  >(null)

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [search])

  // Fetch on filter/page change (skip the very first render — server gave us data)
  const [hasInteracted, setHasInteracted] = useState(false)
  useEffect(() => {
    if (!hasInteracted) return
    let cancelled = false
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        if (debouncedSearch) params.set('search', debouncedSearch)
        const res = await fetch(`/api/admin/program-interest?${params}`, {
          cache: 'no-store',
        })
        if (cancelled) return
        if (res.ok) {
          setData(await res.json())
        } else {
          const json = await res.json().catch(() => ({}))
          setError(json.error ?? 'Could not load')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Program interest fetch error:', err)
          setError('Network error')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchData()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page])

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <input
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setHasInteracted(true)
          }}
          className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <div className="sm:ml-auto flex items-center gap-3">
          <p className="text-sm text-gray-600">
            {data.total} signup{data.total === 1 ? '' : 's'}
          </p>
          <button
            type="button"
            onClick={() => setComposer({ kind: 'all' })}
            disabled={data.total === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Send to All
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Joined</Th>
              <th className="px-4 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                  {isLoading ? 'Loading…' : 'No signups yet. As visitors register via the "Get Notified" modal, they will appear here.'}
                </td>
              </tr>
            ) : (
              data.rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td>
                    <span className="font-medium text-gray-900">{r.name}</span>
                  </Td>
                  <Td>
                    <a className="text-blue-600 hover:underline" href={`mailto:${r.email}`}>
                      {r.email}
                    </a>
                  </Td>
                  <Td>
                    {new Date(r.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => setComposer({ kind: 'single', recipient: r })}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Send Email
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => {
              setHasInteracted(true)
              setPage((p) => Math.max(1, p - 1))
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            ← Previous
          </button>
          <p className="text-sm text-gray-600">
            Page {page} of {data.totalPages} · {data.total} total
          </p>
          <button
            type="button"
            disabled={page >= data.totalPages || isLoading}
            onClick={() => {
              setHasInteracted(true)
              setPage((p) => Math.min(data.totalPages, p + 1))
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}

      {composer && (
        <EmailComposerModal
          target={composer}
          totalCount={data.total}
          onClose={() => setComposer(null)}
          onSent={(result) => {
            setComposer(null)
            toast({
              title:
                result.failed > 0
                  ? `Sent ${result.sent}, ${result.failed} failed`
                  : `Sent to ${result.sent} ${result.sent === 1 ? 'recipient' : 'recipients'}`,
              description:
                result.failed > 0
                  ? result.errors?.[0]?.reason ??
                    'Check the dashboard logs for per-recipient details.'
                  : undefined,
              variant: result.failed > 0 ? 'warning' : 'success',
              duration: 5000,
            })
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmailComposerModal
// ---------------------------------------------------------------------------

interface EmailComposerModalProps {
  target: { kind: 'single'; recipient: Row } | { kind: 'all' }
  totalCount: number
  onClose: () => void
  onSent: (result: SendResult) => void
}

function EmailComposerModal({
  target,
  totalCount,
  onClose,
  onSent,
}: EmailComposerModalProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaHref, setCtaHref] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recipientLabel =
    target.kind === 'single'
      ? `${target.recipient.name} (${target.recipient.email})`
      : `all ${totalCount} subscriber${totalCount === 1 ? '' : 's'}`

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSending(true)
    try {
      const trimmedLabel = ctaLabel.trim()
      const trimmedHref = ctaHref.trim()

      // Defensive client-side guard: keep CTA fields paired so we don't
      // round-trip a 400 from the server just for that.
      if (Boolean(trimmedLabel) !== Boolean(trimmedHref)) {
        setError(
          'Fill in both the CTA label and the CTA URL — or leave both blank.'
        )
        setIsSending(false)
        return
      }

      const payload: {
        subject: string
        body: string
        ctaLabel?: string
        ctaHref?: string
        recipientIds?: string[]
      } = {
        subject: subject.trim(),
        body: body.trim(),
      }
      if (trimmedLabel && trimmedHref) {
        payload.ctaLabel = trimmedLabel
        payload.ctaHref = trimmedHref
      }
      if (target.kind === 'single') {
        payload.recipientIds = [target.recipient.id]
      }

      const res = await fetch('/api/admin/program-interest/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const result = (await res.json()) as SendResult
        onSent(result)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Could not send. Please try again.')
      }
    } catch (err) {
      console.error('Send email error:', err)
      setError('Unable to reach the server. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2
            id="composer-title"
            className="text-xl font-bold"
            style={{ color: 'rgba(27, 34, 119, 1)' }}
          >
            Compose Email
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close composer"
            className="text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          {error && (
            <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
            <span className="font-semibold">Sending to:</span> {recipientLabel}
          </div>

          <div>
            <label htmlFor="email-subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              id="email-subject"
              type="text"
              required
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Don't miss this Sunday's service"
              className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label htmlFor="email-body" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="email-body"
              required
              maxLength={20000}
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message. Blank lines become paragraphs in the email."
              className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Each recipient&apos;s greeting (&ldquo;Hi &lt;name&gt;,&rdquo;) is added automatically.
            </p>
          </div>

          {/* Optional CTA button */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Call-to-action button <span className="text-gray-500 font-normal">(optional)</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Adds a green button under the message. Leave both blank to skip.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="email-cta-label" className="block text-xs font-medium text-gray-700 mb-1">
                  Button label
                </label>
                <input
                  id="email-cta-label"
                  type="text"
                  maxLength={60}
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="e.g. Register Now"
                  className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label htmlFor="email-cta-href" className="block text-xs font-medium text-gray-700 mb-1">
                  Button URL
                </label>
                <input
                  id="email-cta-href"
                  type="url"
                  value={ctaHref}
                  onChange={(e) => setCtaHref(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tiny table helpers
// ---------------------------------------------------------------------------

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{children}</td>
}
