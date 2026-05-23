'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/toast-provider'
import {
  EmailComposerModal,
  formatSendResultToast,
} from '@/components/dashboard/email-composer-modal'

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

      {/* Shared admin email composer (same modal used across every dashboard table). */}
      {composer && (
        <EmailComposerModal
          target={
            composer.kind === 'single'
              ? { kind: 'single', recipient: composer.recipient }
              : {
                  kind: 'all',
                  label: `all ${data.total} subscriber${data.total === 1 ? '' : 's'}`,
                }
          }
          sendEndpoint="/api/admin/program-interest/send"
          buildPayload={({ target, subject, body, ctaLabel, ctaHref }) => {
            const payload: Record<string, unknown> = { subject, body }
            if (ctaLabel && ctaHref) {
              payload.ctaLabel = ctaLabel
              payload.ctaHref = ctaHref
            }
            // Single → restrict to that subscriber's id; 'all' → omit
            // recipientIds so the server emails every subscriber.
            if (target.kind === 'single' && target.recipient.id) {
              payload.recipientIds = [target.recipient.id]
            }
            return payload
          }}
          onClose={() => setComposer(null)}
          onSent={(result) => {
            setComposer(null)
            toast({ ...formatSendResultToast(result), duration: 5000 })
          }}
        />
      )}
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
