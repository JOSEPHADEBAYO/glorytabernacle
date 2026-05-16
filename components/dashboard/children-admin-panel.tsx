'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { useToast } from '@/components/ui/toast-provider'
import {
  ConfirmDeleteModal,
  useConfirmDelete,
} from '@/components/ui/confirm-delete-modal'
import {
  ChildForm,
  EMPTY_CHILD_FORM,
  childToFormValues,
  type ChildFormValues,
} from '@/components/dashboard/child-form'

// ---------------------------------------------------------------------------
// Types — match the API response shapes
// ---------------------------------------------------------------------------

interface AdminCheckIn {
  id: string
  signedInAt: string
  signedOutAt: string | null
  child: {
    id: string
    firstName: string
    lastName: string
    photoUrl: string | null
    allergies: string | null
    specialNeeds: string | null
  }
  signedInBy: { id: string; name: string; email: string }
  signedOutBy: { id: string; name: string; email: string } | null
}

interface AdminChild {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE'
  allergies: string | null
  medicalNotes: string | null
  specialNeeds: string | null
  photoUrl: string | null
  primaryGuardianName: string
  primaryGuardianPhone: string
  primaryGuardianEmail: string | null
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
  checkIns: Array<{ id: string; signedInAt: string; signedOutAt: string | null }>
}

interface Analytics {
  sundays: Array<{ date: string; count: number }>
  months: Array<{ month: string; count: number }>
  totals: { totalChildren: number; totalCheckIns: number; avgPerSunday: number }
}

interface ChildrenAdminPanelProps {
  initialActiveCheckIns: AdminCheckIn[]
  totalChildren: number
  totalCheckInsToday: number
}

type Tab = 'live' | 'children' | 'analytics'

const POLL_INTERVAL_MS = 5000

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChildrenAdminPanel({
  initialActiveCheckIns,
  totalChildren,
  totalCheckInsToday,
}: ChildrenAdminPanelProps) {
  const [tab, setTab] = useState<Tab>('live')

  return (
    <div>
      {/* Top stats — same data as overview page but contextualized for children */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatChip
          label="Currently signed in"
          value={String(initialActiveCheckIns.length)}
          accent="rgb(27, 109, 36)"
        />
        <StatChip label="Check-ins today" value={String(totalCheckInsToday)} />
        <StatChip label="Registered children" value={String(totalChildren)} />
      </div>

      {/* Tab nav */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6" role="tablist">
          {[
            { id: 'live' as const, label: 'Live attendance' },
            { id: 'children' as const, label: 'All children' },
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
      {tab === 'children' && <AllChildren />}
      {tab === 'analytics' && <AnalyticsTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 1: Live attendance — polls every 5s
// ---------------------------------------------------------------------------

function LiveAttendance({ initial }: { initial: AdminCheckIn[] }) {
  const { toast } = useToast()
  const [checkIns, setCheckIns] = useState<AdminCheckIn[]>(initial)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchActive = async () => {
      try {
        const res = await fetch('/api/admin/check-ins?active=true', {
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
      } catch (err) {
        if (!cancelled) {
          console.error('Live attendance poll error:', err)
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

  async function handleCheckOut(checkIn: AdminCheckIn) {
    setBusyId(checkIn.id)
    try {
      const res = await fetch(
        `/api/admin/children/${checkIn.child.id}/check-out`,
        { method: 'POST' }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to check out')
      }
      setCheckIns((current) => current.filter((c) => c.id !== checkIn.id))
      toast({
        title: 'Signed out',
        description: `${checkIn.child.firstName} ${checkIn.child.lastName} has been checked out.`,
        variant: 'success',
      })
    } catch (err) {
      toast({
        title: 'Check-out failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {checkIns.length === 0
            ? 'No children currently signed in.'
            : `${checkIns.length} ${checkIns.length === 1 ? 'child' : 'children'} currently signed in`}
        </p>
        <p className="text-xs text-gray-500">
          {error ?? `Updated ${lastUpdated.toLocaleTimeString('en-GB')}`}
        </p>
      </div>

      {checkIns.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">
          The live board will populate once children are signed in from the
          All children tab.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checkIns.map((c) => (
            <article
              key={c.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                {c.child.photoUrl ? (
                  <Image
                    src={c.child.photoUrl}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-blue-100 flex items-center justify-center text-base font-semibold text-blue-700">
                    {c.child.firstName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {c.child.firstName} {c.child.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Signed in by {c.signedInBy.name}
                  </p>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: 'rgb(27, 109, 36)' }}
                >
                  In
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Since{' '}
                {new Date(c.signedInAt).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {(c.child.allergies || c.child.specialNeeds) && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                  {c.child.allergies && (
                    <p className="text-xs">
                      <span className="font-bold text-red-700">⚠ Allergies:</span>{' '}
                      <span className="text-gray-700">{c.child.allergies}</span>
                    </p>
                  )}
                  {c.child.specialNeeds && (
                    <p className="text-xs">
                      <span className="font-bold text-amber-700">⚠ Special needs:</span>{' '}
                      <span className="text-gray-700">{c.child.specialNeeds}</span>
                    </p>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => handleCheckOut(c)}
                disabled={busyId === c.id}
                className="mt-4 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busyId === c.id ? 'Signing out…' : 'Sign out'}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 2: All children — paginated table with register / edit / check-in/out
// ---------------------------------------------------------------------------

function AllChildren() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25
  const [data, setData] = useState<{
    children: AdminChild[]
    total: number
    totalPages: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Modal state for register + edit
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [editing, setEditing] = useState<AdminChild | null>(null)

  // Delete confirmation
  const {
    isOpen: deleteIsOpen,
    pendingItem: deletePendingId,
    openDelete,
    closeDelete,
  } = useConfirmDelete<string>()

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [search])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/admin/children?${params}`, {
        cache: 'no-store',
      })
      if (res.ok) {
        const json = await res.json()
        setData({
          children: json.children,
          total: json.total,
          totalPages: json.totalPages,
        })
      } else {
        setError('Could not load children')
      }
    } catch (err) {
      console.error('All children fetch error:', err)
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    let cancelled = false
    fetchData().then(() => {
      if (cancelled) return
    })
    return () => {
      cancelled = true
    }
  }, [fetchData])

  async function handleCheckInOut(child: AdminChild, action: 'in' | 'out') {
    setBusyId(child.id)
    try {
      const res = await fetch(
        `/api/admin/children/${child.id}/check-${action}`,
        { method: 'POST' }
      )
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Failed to check ${action}`)
      }
      toast({
        title: action === 'in' ? 'Signed in' : 'Signed out',
        description: `${child.firstName} ${child.lastName} has been checked ${action}.`,
        variant: 'success',
      })
      await fetchData()
    } catch (err) {
      toast({
        title: `Check-${action} failed`,
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/children/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to delete')
      }
      toast({
        title: 'Child removed',
        description: 'The child record has been deleted.',
        variant: 'success',
      })
      await fetchData()
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search by child name or guardian"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        />
        <button
          type="button"
          onClick={() => setIsRegisterOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Register a child
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>Name</Th>
              <Th>DOB</Th>
              <Th>Primary guardian</Th>
              <Th>Status</Th>
              <th className="px-4 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {!data || data.children.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  {isLoading ? 'Loading…' : 'No children registered yet.'}
                </td>
              </tr>
            ) : (
              data.children.map((c) => {
                const isIn = c.checkIns.some((ci) => !ci.signedOutAt)
                const isExpanded = expandedId === c.id
                return (
                  <ChildRow
                    key={c.id}
                    child={c}
                    isIn={isIn}
                    isExpanded={isExpanded}
                    isBusy={busyId === c.id}
                    onToggle={() =>
                      setExpandedId((id) => (id === c.id ? null : c.id))
                    }
                    onCheckIn={() => handleCheckInOut(c, 'in')}
                    onCheckOut={() => handleCheckInOut(c, 'out')}
                    onEdit={() => setEditing(c)}
                    onDelete={() => openDelete(c.id)}
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

      <ConfirmDeleteModal
        open={deleteIsOpen}
        onConfirm={async () => {
          if (deletePendingId) await handleDelete(deletePendingId)
          closeDelete()
        }}
        onCancel={closeDelete}
      />

      {isRegisterOpen && (
        <ChildModalShell title="Register a child" onClose={() => setIsRegisterOpen(false)}>
          <ChildForm
            initialValues={EMPTY_CHILD_FORM}
            uploadEndpoint="/api/upload"
            submitLabel="Register"
            onCancel={() => setIsRegisterOpen(false)}
            onUploadError={(msg) =>
              toast({ title: 'Photo upload failed', description: msg, variant: 'error' })
            }
            onSubmit={async (values) => {
              const res = await fetch('/api/admin/children', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
              })
              if (!res.ok) {
                const json = await res.json().catch(() => ({}))
                throw new Error(json.error ?? 'Failed to register child')
              }
              toast({
                title: 'Child registered',
                description: `${values.firstName} ${values.lastName} is now on the roster.`,
                variant: 'success',
              })
              setIsRegisterOpen(false)
              await fetchData()
            }}
          />
        </ChildModalShell>
      )}

      {editing && (
        <ChildModalShell title="Edit child" onClose={() => setEditing(null)}>
          <ChildForm
            initialValues={childToFormValues(editing)}
            uploadEndpoint="/api/upload"
            submitLabel="Save changes"
            onCancel={() => setEditing(null)}
            onUploadError={(msg) =>
              toast({ title: 'Photo upload failed', description: msg, variant: 'error' })
            }
            onSubmit={async (values: ChildFormValues) => {
              const res = await fetch(`/api/admin/children/${editing.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
              })
              if (!res.ok) {
                const json = await res.json().catch(() => ({}))
                throw new Error(json.error ?? 'Failed to update child')
              }
              toast({
                title: 'Child updated',
                description: `${values.firstName} ${values.lastName} has been updated.`,
                variant: 'success',
              })
              setEditing(null)
              await fetchData()
            }}
          />
        </ChildModalShell>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Row + modal shell
// ---------------------------------------------------------------------------

function ChildRow({
  child,
  isIn,
  isExpanded,
  isBusy,
  onToggle,
  onCheckIn,
  onCheckOut,
  onEdit,
  onDelete,
}: {
  child: AdminChild
  isIn: boolean
  isExpanded: boolean
  isBusy: boolean
  onToggle: () => void
  onCheckIn: () => void
  onCheckOut: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <>
      <tr className="hover:bg-gray-50">
        <Td>
          <span className="font-medium text-gray-900">
            {child.firstName} {child.lastName}
          </span>
        </Td>
        <Td>
          {new Date(child.dateOfBirth).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </Td>
        <Td>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-900">
              {child.primaryGuardianName}
            </span>
            <a
              className="text-xs text-blue-600 hover:underline"
              href={`tel:${child.primaryGuardianPhone}`}
            >
              {child.primaryGuardianPhone}
            </a>
            {child.primaryGuardianEmail && (
              <a
                className="text-xs text-blue-600 hover:underline"
                href={`mailto:${child.primaryGuardianEmail}`}
              >
                {child.primaryGuardianEmail}
              </a>
            )}
          </div>
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
          <div className="flex justify-end gap-2">
            {isIn ? (
              <button
                type="button"
                onClick={onCheckOut}
                disabled={isBusy}
                className="rounded-lg border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
              >
                {isBusy ? 'Working…' : 'Sign out'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onCheckIn}
                disabled={isBusy}
                className="rounded-lg px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: 'rgb(27, 109, 36)' }}
              >
                {isBusy ? 'Working…' : 'Sign in'}
              </button>
            )}
            <button
              type="button"
              onClick={onToggle}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? 'Hide' : 'Details'}
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="text-xs font-medium text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={5} className="px-6 py-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Allergies</dt>
                <dd className="mt-1 text-gray-800">
                  {child.allergies ?? <span className="text-gray-400 italic">None recorded</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Medical notes</dt>
                <dd className="mt-1 text-gray-800">
                  {child.medicalNotes ?? <span className="text-gray-400 italic">None recorded</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Special needs</dt>
                <dd className="mt-1 text-gray-800">
                  {child.specialNeeds ?? <span className="text-gray-400 italic">None recorded</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Emergency contact</dt>
                <dd className="mt-1 text-gray-800">
                  {child.emergencyContactName} ({child.emergencyContactRelation})
                  <br />
                  <a className="text-blue-600 hover:underline" href={`tel:${child.emergencyContactPhone}`}>
                    {child.emergencyContactPhone}
                  </a>
                </dd>
              </div>
            </dl>
          </td>
        </tr>
      )}
    </>
  )
}

function ChildModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </header>
        {children}
      </div>
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
        const res = await fetch('/api/admin/check-ins/analytics', {
          cache: 'no-store',
        })
        if (cancelled) return
        if (res.ok) {
          const json = await res.json()
          setData(json)
          setError(null)
        } else {
          setError('Could not load analytics')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Analytics fetch error:', err)
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
        <StatChip label="Avg. attendance per Sunday" value={String(data.totals.avgPerSunday)} />
        <StatChip label="All-time check-ins" value={String(data.totals.totalCheckIns)} />
        <StatChip label="Registered children" value={String(data.totals.totalChildren)} />
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
        title="Monthly distinct children — last 6 months"
        data={data.months.map((m) => ({
          label: monthKeyToLabel(m.month),
          value: m.count,
        }))}
      />
    </div>
  )
}

function monthKeyToLabel(key: string): string {
  // key is YYYY-MM
  const [y, m] = key.split('-').map(Number)
  if (!y || !m) return key
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Tiny shared UI bits
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
