'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ATTENDANCE_SERVICES,
  type AttendanceService,
} from '@/lib/types/attendance'

// ---------------------------------------------------------------------------
// Types — match the API response shapes
// ---------------------------------------------------------------------------

type DateValue = string | Date

interface AttendanceRow {
  id: string
  name: string
  email: string
  service: string
  attendedAt: DateValue
  createdAt: DateValue
}

interface ListResponse {
  rows: AttendanceRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface Analytics {
  weekly: Array<{ weekStart: string; count: number }>
  byService: Array<{ service: string; count: number }>
  returningSplit: { newAttendees: number; returningAttendees: number }
  totals: {
    totalSubmissions: number
    distinctAttendees: number
    avgWeekly: number
  }
}

interface AttendanceAdminPanelProps {
  initialTodayRows: AttendanceRow[]
  initialTodayTotal: number
  initialAllTimeTotal: number
}

type Tab = 'today' | 'all' | 'analytics'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AttendanceAdminPanel({
  initialTodayRows,
  initialTodayTotal,
  initialAllTimeTotal,
}: AttendanceAdminPanelProps) {
  const [tab, setTab] = useState<Tab>('today')

  // Group today's submissions by service for the "Today" tab.
  const todayByService = useMemo(() => {
    const map = new Map<string, AttendanceRow[]>()
    for (const r of initialTodayRows) {
      const list = map.get(r.service) ?? []
      list.push(r)
      map.set(r.service, list)
    }
    // Stable order: follow the configured ATTENDANCE_SERVICES, then any
    // unrecognised services at the end.
    const ordered: Array<{ service: string; rows: AttendanceRow[] }> = []
    for (const svc of ATTENDANCE_SERVICES) {
      if (map.has(svc)) {
        ordered.push({ service: svc, rows: map.get(svc)! })
        map.delete(svc)
      }
    }
    for (const [service, rows] of map.entries()) {
      ordered.push({ service, rows })
    }
    return ordered
  }, [initialTodayRows])

  return (
    <div>
      {/* Top stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatChip label="Today's submissions" value={String(initialTodayTotal)} accent="rgb(27, 109, 36)" />
        <StatChip label="All-time submissions" value={String(initialAllTimeTotal)} />
        <StatChip
          label="Services tracked"
          value={String(ATTENDANCE_SERVICES.length)}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6" role="tablist">
          {[
            { id: 'today' as const, label: 'Today' },
            { id: 'all' as const, label: 'All attendance' },
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

      {tab === 'today' && (
        <TodayTab grouped={todayByService} totalToday={initialTodayTotal} />
      )}
      {tab === 'all' && <AllTab />}
      {tab === 'analytics' && <AnalyticsTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 1: Today — list grouped by service
// ---------------------------------------------------------------------------

function TodayTab({
  grouped,
  totalToday,
}: {
  grouped: Array<{ service: string; rows: AttendanceRow[] }>
  totalToday: number
}) {
  if (totalToday === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">
        No attendance recorded yet today. As people submit the
        &ldquo;mark me in&rdquo; form on the public site, they&apos;ll appear here.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {grouped.map(({ service, rows }) => (
        <section
          key={service}
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          <header className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
              {service}
            </h3>
            <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-blue-50 text-blue-700">
              {rows.length} {rows.length === 1 ? 'attendee' : 'attendees'}
            </span>
          </header>
          <ul className="divide-y divide-gray-100">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{r.name}</p>
                  <a
                    href={`mailto:${r.email}`}
                    className="text-xs text-blue-600 hover:underline truncate block"
                  >
                    {r.email}
                  </a>
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {new Date(r.attendedAt).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 2: All attendance — paginated table with filters
// ---------------------------------------------------------------------------

function AllTab() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState<'' | AttendanceService>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  const [data, setData] = useState<ListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debounce the search input
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
        if (serviceFilter) params.set('service', serviceFilter)
        if (fromDate) params.set('fromDate', fromDate)
        if (toDate) params.set('toDate', toDate)

        const res = await fetch(`/api/admin/attendance?${params}`, {
          cache: 'no-store',
        })
        if (cancelled) return
        if (res.ok) {
          setData(await res.json())
        } else {
          const json = await res.json().catch(() => ({}))
          setError(json.error ?? 'Could not load attendance')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('All attendance fetch error:', err)
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
  }, [debouncedSearch, serviceFilter, fromDate, toDate, page])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <select
          aria-label="Filter by service"
          value={serviceFilter}
          onChange={(e) => {
            setServiceFilter(e.target.value as '' | AttendanceService)
            setPage(1)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
        >
          <option value="">All services</option>
          {ATTENDANCE_SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="From date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <input
          type="date"
          aria-label="To date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
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
              <Th>Service</Th>
              <Th>When</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {!data || data.rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                  {isLoading ? 'Loading…' : 'No matches.'}
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
                    <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
                      {r.service}
                    </span>
                  </Td>
                  <Td>
                    {new Date(r.attendedAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Td>
                </tr>
              ))
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
        const res = await fetch('/api/admin/attendance/analytics', {
          cache: 'no-store',
        })
        if (cancelled) return
        if (res.ok) {
          setData(await res.json())
          setError(null)
        } else {
          const json = await res.json().catch(() => ({}))
          setError(json.error ?? 'Could not load analytics')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Attendance analytics fetch error:', err)
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
        <StatChip label="Average / week" value={String(data.totals.avgWeekly)} />
        <StatChip label="Distinct attendees" value={String(data.totals.distinctAttendees)} />
        <StatChip label="All-time submissions" value={String(data.totals.totalSubmissions)} />
      </div>

      <BarChart
        title="Weekly attendance — last 12 weeks"
        data={data.weekly.map((w) => ({
          label: new Date(w.weekStart).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
          }),
          value: w.count,
        }))}
      />

      <BarChart
        title="By service — last 4 weeks"
        data={data.byService.map((s) => ({
          label: s.service,
          value: s.count,
        }))}
      />

      <BarChart
        title="Returning vs new — distinct emails"
        data={[
          { label: 'New', value: data.returningSplit.newAttendees },
          { label: 'Returning', value: data.returningSplit.returningAttendees },
        ]}
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
      <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
        {label}
      </p>
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
      <h3
        className="text-sm font-bold mb-4"
        style={{ color: 'rgba(27, 34, 119, 1)' }}
      >
        {title}
      </h3>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3 text-xs">
            <span className="w-32 shrink-0 text-gray-500 text-right truncate">
              {d.label}
            </span>
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
            <span className="w-10 shrink-0 font-mono text-gray-700 text-right">
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

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
