'use client'

import { useEffect, useState } from 'react'

interface AdminYouthCheckIn {
  id: string
  userId: string
  signedInAt: string
  signedOutAt: string | null
  user: { id: string; name: string; email: string; image: string | null }
}

interface Analytics {
  sundays: Array<{ date: string; count: number }>
  months: Array<{ month: string; count: number }>
  totals: { totalYouth: number; totalCheckIns: number; avgPerSunday: number }
}

interface YouthAttendancePanelProps {
  initialActiveCheckIns: AdminYouthCheckIn[]
  initialTotalYouth: number
  initialTotalCheckInsToday: number
}

type Tab = 'live' | 'all-youth' | 'analytics'

const POLL_INTERVAL_MS = 5000

export function YouthAttendancePanel({
  initialActiveCheckIns,
  initialTotalYouth,
  initialTotalCheckInsToday,
}: YouthAttendancePanelProps) {
  const [tab, setTab] = useState<Tab>('live')

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatChip
          label="Currently signed in"
          value={String(initialActiveCheckIns.length)}
          accent="rgb(27, 109, 36)"
        />
        <StatChip label="Check-ins today" value={String(initialTotalCheckInsToday)} />
        <StatChip label="Registered youth" value={String(initialTotalYouth)} />
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6" role="tablist">
          {[
            { id: 'live' as const, label: 'Live attendance' },
            { id: 'all-youth' as const, label: 'All youth' },
            { id: 'analytics' as const, label: 'Analytics' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'live' && <LiveAttendance initial={initialActiveCheckIns} />}
      {tab === 'all-youth' && <AllYouthTab totalYouth={initialTotalYouth} />}
      {tab === 'analytics' && <AnalyticsTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 1: Live attendance — polls every 5s
// ---------------------------------------------------------------------------

function LiveAttendance({ initial }: { initial: AdminYouthCheckIn[] }) {
  const [checkIns, setCheckIns] = useState<AdminYouthCheckIn[]>(initial)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchActive = async () => {
      try {
        const res = await fetch('/api/admin/youth/check-ins?active=true', {
          cache: 'no-store',
        })
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setCheckIns(data.checkIns ?? [])
          setLastUpdated(new Date())
          setError(null)
        } else {
          setError('Could not refresh — retrying…')
        }
      } catch {
        if (!cancelled) {
          setError('Network error — retrying…')
        }
      }
    }

    const id = setInterval(fetchActive, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {checkIns.length === 0
            ? 'No youth currently signed in.'
            : `${checkIns.length} ${checkIns.length === 1 ? 'youth member' : 'youth members'} currently signed in`}
        </p>
        <p className="text-xs text-gray-500">
          {error ?? `Updated ${lastUpdated.toLocaleTimeString('en-GB')}`}
        </p>
      </div>

      {checkIns.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">
          The live board will populate once youth members start checking in.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checkIns.map((c) => (
            <article
              key={c.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                {c.user.image ? (
                  <img
                    src={c.user.image}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-indigo-100 flex items-center justify-center text-base font-semibold text-indigo-700">
                    {c.user.name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {c.user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{c.user.email}</p>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: 'rgb(27, 109, 36)' }}
                >
                  In
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Since{' '}
                {new Date(c.signedInAt).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 2: All youth — paginated table
// ---------------------------------------------------------------------------

interface AdminYouthUser {
  id: string
  name: string
  email: string
  image: string | null
  createdAt: string
  checkIns: Array<{ id: string; signedInAt: string; signedOutAt: string | null }>
}

function AllYouthTab({ totalYouth }: { totalYouth: number }) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25
  const [data, setData] = useState<{
    youth: AdminYouthUser[]
    total: number
    totalPages: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        if (debouncedSearch) params.set('search', debouncedSearch)
        const res = await fetch(`/api/admin/youth?${params}`, { cache: 'no-store' })
        if (cancelled) return
        if (res.ok) {
          const json = await res.json()
          setData({ youth: json.youth, total: json.total, totalPages: json.totalPages })
        } else {
          setError('Could not load youth')
        }
      } catch {
        if (!cancelled) setError('Network error')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [debouncedSearch, page])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <p className="text-sm text-gray-500">{totalYouth} registered</p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Status</Th>
              <th className="px-4 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {!data || data.youth.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                  {isLoading ? 'Loading…' : 'No youth members registered yet.'}
                </td>
              </tr>
            ) : (
              data.youth.map((y) => {
                const isIn = y.checkIns.some((ci) => !ci.signedOutAt)
                const isExpanded = expandedId === y.id
                return (
                  <YouthRow
                    key={y.id}
                    youth={y}
                    isIn={isIn}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId((id) => (id === y.id ? null : y.id))}
                  />
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

function YouthRow({
  youth,
  isIn,
  isExpanded,
  onToggle,
}: {
  youth: AdminYouthUser
  isIn: boolean
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr className="hover:bg-gray-50">
        <Td>
          <div className="flex items-center gap-3">
            {youth.image ? (
              <img
                src={youth.image}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                {youth.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="font-medium text-gray-900">{youth.name}</span>
          </div>
        </Td>
        <Td>
          <a href={`mailto:${youth.email}`} className="text-blue-600 hover:underline text-sm">
            {youth.email}
          </a>
        </Td>
        <Td>
          {isIn ? (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: 'rgb(27, 109, 36)' }}
            >
              Signed in
            </span>
          ) : (
            <span className="text-xs text-gray-500">Not in</span>
          )}
        </Td>
        <td className="px-4 py-3 whitespace-nowrap text-right">
          <button
            type="button"
            onClick={onToggle}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Hide' : 'Details'}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={4} className="px-6 py-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500 font-semibold">First check-in</dt>
                <dd className="mt-1 text-gray-800">
                  {youth.checkIns.length > 0
                    ? new Date(youth.checkIns[youth.checkIns.length - 1].signedInAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : <span className="text-gray-400 italic">Never checked in</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total check-ins</dt>
                <dd className="mt-1 text-gray-800">{youth.checkIns.length}</dd>
              </div>
            </dl>
          </td>
        </tr>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Tab 3: Analytics
// ---------------------------------------------------------------------------

function AnalyticsTab() {
  const [data, setData] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/admin/youth/check-ins/analytics', {
          cache: 'no-store',
        })
        if (cancelled) return
        if (res.ok) {
          setData(await res.json())
          setError(null)
        } else {
          setError('Could not load analytics')
        }
      } catch {
        if (!cancelled) setError('Network error')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading analytics…</div>
  }
  if (error || !data) {
    return (
      <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error ?? 'No analytics data'}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatChip label="Avg. attendance per Sunday" value={String(data.totals.avgPerSunday)} />
        <StatChip label="All-time check-ins" value={String(data.totals.totalCheckIns)} />
        <StatChip label="Registered youth" value={String(data.totals.totalYouth)} />
      </div>

      <BarChart
        title="Sunday attendance — last 12 weeks"
        data={data.sundays.map((s) => ({
          label: new Date(s.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
          }),
          value: s.count,
        }))}
      />

      <BarChart
        title="Monthly distinct youth — last 6 months"
        data={data.months.map((m) => ({
          label: monthKeyToLabel(m.month),
          value: m.count,
        }))}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared UI bits
// ---------------------------------------------------------------------------

function StatChip({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
      <p
        className="mt-1 text-3xl font-extrabold"
        style={{ color: accent ?? 'rgba(27, 34, 119, 1)' }}
      >
        {value}
      </p>
    </div>
  )
}

function BarChart({
  title,
  data,
}: {
  title: string
  data: Array<{ label: string; value: number }>
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-bold mb-4" style={{ color: 'rgba(27, 34, 119, 1)' }}>
        {title}
      </h3>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3 text-xs">
            <span className="w-20 shrink-0 text-gray-500 text-right">{d.label}</span>
            <div className="flex-1 h-6 rounded bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${(d.value / max) * 100}%`,
                  backgroundColor: 'rgba(27, 34, 119, 1)',
                  minWidth: d.value > 0 ? '4px' : '0',
                }}
              />
            </div>
            <span className="w-8 shrink-0 font-mono text-gray-700">{d.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function monthKeyToLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  if (!y || !m) return key
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  })
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-gray-700 align-top">{children}</td>
}
