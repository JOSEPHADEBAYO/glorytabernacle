'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/toast-provider'
import {
  CONCERN_TYPE_LABELS,
  CONCERN_STATUS_LABELS,
  CONCERN_STATUSES,
  type ConcernType,
  type ConcernStatus,
} from '@/lib/types/safeguarding'

interface ConcernPerson {
  id: string
  name: string
  email: string
}

interface Concern {
  id: string
  childId: string | null
  childName: string | null
  concernType: ConcernType
  description: string
  actionTaken: string | null
  whoNotified: string | null
  referredToMash: boolean
  occurredAt: string
  status: ConcernStatus
  resolution: string | null
  raisedBy: ConcernPerson
  closedBy: ConcernPerson | null
  closedAt: string | null
  createdAt: string
}

const STATUS_STYLES: Record<ConcernStatus, string> = {
  OPEN: 'bg-red-100 text-red-800',
  MONITORING: 'bg-amber-100 text-amber-800',
  CLOSED: 'bg-gray-100 text-gray-600',
}

export function SafeguardingManager() {
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<ConcernStatus | 'ALL'>('ALL')
  const [data, setData] = useState<{ concerns: Concern[]; total: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ pageSize: '100' })
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      const res = await fetch(`/api/admin/safeguarding-concerns?${params}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        if (res.status === 403) throw new Error('You do not have access to the safeguarding log.')
        throw new Error('Could not load concerns')
      }
      const json = await res.json()
      setData({ concerns: json.concerns, total: json.total })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function updateConcern(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/admin/safeguarding-concerns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error ?? 'Update failed')
    }
    await fetchData()
  }

  const openCount =
    data?.concerns.filter((c) => c.status !== 'CLOSED').length ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(['ALL', ...CONCERN_STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'ALL' ? 'All' : CONCERN_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        {data && (
          <p className="text-sm text-gray-600">
            {data.total} total · {openCount} open / monitoring
          </p>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">
          Loading…
        </div>
      ) : !data || data.concerns.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">
          No concerns recorded{statusFilter !== 'ALL' ? ' with this status' : ''}.
        </div>
      ) : (
        <div className="space-y-3">
          {data.concerns.map((c) => (
            <ConcernCard
              key={c.id}
              concern={c}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId((id) => (id === c.id ? null : c.id))}
              onUpdate={updateConcern}
              onToast={(t) => toast(t)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ConcernCard({
  concern,
  expanded,
  onToggle,
  onUpdate,
  onToast,
}: {
  concern: Concern
  expanded: boolean
  onToggle: () => void
  onUpdate: (id: string, patch: Record<string, unknown>) => Promise<void>
  onToast: (t: { title: string; description?: string; variant?: 'success' | 'error' }) => void
}) {
  const [resolution, setResolution] = useState(concern.resolution ?? '')
  const [referredToMash, setReferredToMash] = useState(concern.referredToMash)
  const [busy, setBusy] = useState(false)

  async function setStatus(status: ConcernStatus) {
    setBusy(true)
    try {
      await onUpdate(concern.id, { status, resolution, referredToMash })
      onToast({ title: `Marked ${CONCERN_STATUS_LABELS[status].toLowerCase()}`, variant: 'success' })
    } catch (err) {
      onToast({ title: 'Update failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function saveNotes() {
    setBusy(true)
    try {
      await onUpdate(concern.id, { resolution, referredToMash })
      onToast({ title: 'Saved', variant: 'success' })
    } catch (err) {
      onToast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLES[concern.status]}`}>
              {CONCERN_STATUS_LABELS[concern.status]}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {CONCERN_TYPE_LABELS[concern.concernType]}
            </span>
            {concern.referredToMash && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800">
                Referred to MASH
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 truncate">
            About: {concern.childName ?? 'Unspecified'} · Raised by{' '}
            {concern.raisedBy.name} ·{' '}
            {new Date(concern.occurredAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <span className="text-xs font-medium text-blue-600 shrink-0">
          {expanded ? 'Hide' : 'Review'}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          <Detail label="What happened">{concern.description}</Detail>
          {concern.actionTaken && <Detail label="Action taken at the time">{concern.actionTaken}</Detail>}
          {concern.whoNotified && <Detail label="Who was notified">{concern.whoNotified}</Detail>}
          <Detail label="Raised by">
            {concern.raisedBy.name} ({concern.raisedBy.email}) on{' '}
            {new Date(concern.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
          </Detail>
          {concern.closedBy && concern.closedAt && (
            <Detail label="Closed by">
              {concern.closedBy.name} on{' '}
              {new Date(concern.closedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
            </Detail>
          )}

          {/* DSL working area */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-3">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={referredToMash}
                onChange={(e) => setReferredToMash(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Referred to social care / Devon MASH</span>
            </label>
            <label className="block text-sm">
              <span className="block mb-1 text-xs font-semibold text-gray-700">
                DSL notes / resolution
              </span>
              <textarea
                rows={3}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Record decisions, actions, referrals, and the outcome."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                maxLength={8000}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveNotes}
                disabled={busy}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-50"
              >
                Save notes
              </button>
              {concern.status !== 'MONITORING' && (
                <button
                  type="button"
                  onClick={() => setStatus('MONITORING')}
                  disabled={busy}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#d97706' }}
                >
                  Mark monitoring
                </button>
              )}
              {concern.status !== 'CLOSED' ? (
                <button
                  type="button"
                  onClick={() => setStatus('CLOSED')}
                  disabled={busy}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: 'rgb(27, 109, 36)' }}
                >
                  Close concern
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStatus('OPEN')}
                  disabled={busy}
                  className="rounded-lg border border-red-600 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Re-open
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-gray-800 whitespace-pre-wrap">{children}</p>
    </div>
  )
}
