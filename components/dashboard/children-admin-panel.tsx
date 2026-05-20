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
    primaryGuardianName: string
    primaryGuardianPhone: string
    primaryGuardianEmail: string | null
    authorisedCollectors: AdminCollector[]
  }
  signedInBy: { id: string; name: string; email: string }
  signedOutBy: { id: string; name: string; email: string } | null
}

interface AdminCollector {
  id: string
  name: string
  relationship: string
  phone: string | null
  photoUrl: string | null
  notes: string | null
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
  approved: boolean
  createdAt: string
  consentDataProcessing?: boolean
  consentPhotography?: boolean
  consentMedicalInfoSharing?: boolean
  consentEmergencyTreatment?: boolean
  consentCapturedAt?: string | null
  consentByName?: string | null
  checkIns: Array<{ id: string; signedInAt: string; signedOutAt: string | null }>
  authorisedCollectors?: AdminCollector[]
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

type Tab = 'live' | 'children' | 'pending' | 'performance' | 'analytics'

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
            { id: 'pending' as const, label: 'Pending' },
            { id: 'performance' as const, label: 'Performance' },
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
      {tab === 'pending' && <PendingTab />}
      {tab === 'performance' && <PerformanceTab />}
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
  const [signOutFor, setSignOutFor] = useState<AdminCheckIn | null>(null)
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null)

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

  async function handleCheckOut(
    checkIn: AdminCheckIn,
    args: SignOutConfirmArgs
  ) {
    const res = await fetch(
      `/api/admin/children/${checkIn.child.id}/check-out`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: args.code,
          collectedByName: args.collectedByName,
          collectedByRelationship: args.collectedByRelationship,
          collectedFromList: args.collectedFromList,
          ...(args.collectionNotes ? { collectionNotes: args.collectionNotes } : {}),
          ...(args.performance ? { performance: args.performance } : {}),
        }),
      }
    )
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Failed to check out')
    }
    setCheckIns((current) => current.filter((c) => c.id !== checkIn.id))
    toast({
      title: 'Signed out',
      description: `${checkIn.child.firstName} ${checkIn.child.lastName} has been checked out by ${args.collectedByName}.`,
      variant: 'success',
    })
  }

  async function handleResendCode(checkIn: AdminCheckIn) {
    const res = await fetch(
      `/api/admin/children/${checkIn.child.id}/resend-pickup-code`,
      { method: 'POST' }
    )
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Failed to resend the code.')
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
                <PhotoThumb
                  photoUrl={c.child.photoUrl}
                  firstName={c.child.firstName}
                  onClick={() =>
                    c.child.photoUrl &&
                    setLightbox({
                      url: c.child.photoUrl,
                      alt: `${c.child.firstName} ${c.child.lastName}`,
                    })
                  }
                />
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
                onClick={() => setSignOutFor(c)}
                className="mt-4 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Sign out
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await handleResendCode(c)
                    toast({
                      title: 'Code re-sent',
                      description: `Pickup code re-sent to ${c.child.firstName}'s guardian.`,
                      variant: 'success',
                    })
                  } catch (err) {
                    toast({
                      title: 'Resend failed',
                      description: err instanceof Error ? err.message : 'Please try again.',
                      variant: 'error',
                    })
                  }
                }}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Resend pickup code
              </button>
            </article>
          ))}
        </div>
      )}

      {lightbox && (
        <PhotoLightbox
          url={lightbox.url}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}

      {signOutFor && (
        <SignOutModal
          childName={`${signOutFor.child.firstName} ${signOutFor.child.lastName}`}
          collectorContext={{
            primaryGuardianName: signOutFor.child.primaryGuardianName,
            collectors: signOutFor.child.authorisedCollectors ?? [],
          }}
          onCancel={() => setSignOutFor(null)}
          onConfirm={async (args) => {
            await handleCheckOut(signOutFor, args)
            setSignOutFor(null)
          }}
          onResendCode={() => handleResendCode(signOutFor)}
        />
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

  // Photo lightbox state — { url, alt } when open, null when closed.
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null)

  // Sign-out modal state — which child is being signed out right now.
  const [signOutFor, setSignOutFor] = useState<AdminChild | null>(null)

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

  async function handleCheckIn(child: AdminChild) {
    setBusyId(child.id)
    try {
      const res = await fetch(`/api/admin/children/${child.id}/check-in`, {
        method: 'POST',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to check in')
      }

      // Pickup code email status — be transparent so the leader knows
      // whether the guardian got the code or needs to be told verbally.
      if (json.emailSent) {
        toast({
          title: 'Signed in',
          description: `${child.firstName} ${child.lastName} signed in. Pickup code sent to ${child.primaryGuardianEmail}.`,
          variant: 'success',
        })
      } else {
        toast({
          title: 'Signed in — code email failed',
          description:
            (json.emailError as string | undefined) ??
            'The pickup code could not be emailed. Use Resend on the live card.',
          variant: 'error',
          duration: 8000,
        })
      }
      await fetchData()
    } catch (err) {
      toast({
        title: 'Check-in failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleResendCode(child: AdminChild) {
    const res = await fetch(
      `/api/admin/children/${child.id}/resend-pickup-code`,
      { method: 'POST' }
    )
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Failed to resend the code.')
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
              <Th>Photo</Th>
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
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
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
                    onCheckIn={() => handleCheckIn(c)}
                    // Open the sign-out modal so the teacher can record a
                    // performance note before closing the check-in.
                    onCheckOut={() => setSignOutFor(c)}
                    onEdit={() => setEditing(c)}
                    onDelete={() => openDelete(c.id)}
                    onPhotoClick={() =>
                      c.photoUrl &&
                      setLightbox({
                        url: c.photoUrl,
                        alt: `${c.firstName} ${c.lastName}`,
                      })
                    }
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

      {lightbox && (
        <PhotoLightbox
          url={lightbox.url}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}

      {signOutFor && (
        <SignOutModal
          childName={`${signOutFor.firstName} ${signOutFor.lastName}`}
          collectorContext={{
            primaryGuardianName: signOutFor.primaryGuardianName,
            collectors: signOutFor.authorisedCollectors ?? [],
          }}
          onCancel={() => setSignOutFor(null)}
          onResendCode={() => handleResendCode(signOutFor)}
          onConfirm={async (args) => {
            const res = await fetch(
              `/api/admin/children/${signOutFor.id}/check-out`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  code: args.code,
                  collectedByName: args.collectedByName,
                  collectedByRelationship: args.collectedByRelationship,
                  collectedFromList: args.collectedFromList,
                  ...(args.collectionNotes
                    ? { collectionNotes: args.collectionNotes }
                    : {}),
                  ...(args.performance ? { performance: args.performance } : {}),
                }),
              }
            )
            if (!res.ok) {
              const json = await res.json().catch(() => ({}))
              throw new Error(json.error ?? 'Failed to sign out')
            }
            toast({
              title: 'Signed out',
              description: `${signOutFor.firstName} ${signOutFor.lastName} has been checked out by ${args.collectedByName}.`,
              variant: 'success',
            })
            setSignOutFor(null)
            await fetchData()
          }}
        />
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
  onPhotoClick,
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
  onPhotoClick: () => void
}) {
  return (
    <>
      <tr className="hover:bg-gray-50">
        <Td>
          <PhotoThumb
            photoUrl={child.photoUrl}
            firstName={child.firstName}
            onClick={onPhotoClick}
          />
        </Td>
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
          <td colSpan={6} className="px-6 py-4">
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
              {child.authorisedCollectors && child.authorisedCollectors.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                    Authorised collectors
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {child.authorisedCollectors.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-700"
                      >
                        {c.photoUrl ? (
                          <span className="relative h-7 w-7 rounded-full overflow-hidden">
                            <Image
                              src={c.photoUrl}
                              alt=""
                              fill
                              sizes="28px"
                              className="object-cover"
                              unoptimized
                            />
                          </span>
                        ) : (
                          <span className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-700">
                            {c.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="font-medium">{c.name}</span>
                        <span className="text-gray-400">— {c.relationship}</span>
                        {c.phone && (
                          <a
                            href={`tel:${c.phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {c.phone}
                          </a>
                        )}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Consent (UK GDPR)
                </dt>
                <dd className="mt-2">
                  <ConsentBadges child={child} />
                </dd>
              </div>
            </dl>
          </td>
        </tr>
      )}
    </>
  )
}

/**
 * Compact consent status display. Green = granted, grey = not granted.
 * Used in the All Children details and the Pending tab.
 */
function ConsentBadges({
  child,
}: {
  child: Pick<
    AdminChild,
    | 'consentDataProcessing'
    | 'consentMedicalInfoSharing'
    | 'consentEmergencyTreatment'
    | 'consentPhotography'
    | 'consentCapturedAt'
    | 'consentByName'
  >
}) {
  const items: Array<{ label: string; granted: boolean | undefined }> = [
    { label: 'Data processing', granted: child.consentDataProcessing },
    { label: 'Medical sharing', granted: child.consentMedicalInfoSharing },
    { label: 'Emergency treatment', granted: child.consentEmergencyTreatment },
    { label: 'Photography', granted: child.consentPhotography },
  ]
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span
            key={it.label}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              it.granted
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <span aria-hidden="true">{it.granted ? '✓' : '—'}</span>
            {it.label}
          </span>
        ))}
      </div>
      {(child.consentByName || child.consentCapturedAt) && (
        <p className="text-[11px] text-gray-400">
          {child.consentByName && <>Given by {child.consentByName}</>}
          {child.consentByName && child.consentCapturedAt && ' · '}
          {child.consentCapturedAt && (
            <>
              {new Date(child.consentCapturedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </>
          )}
        </p>
      )}
    </div>
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
// Tab: Pending registrations — parent-submitted children awaiting Children
// Leader approval. Each card shows the full record + Approve / Delete
// actions so the leader can review before the child appears on the
// active roster.
// ---------------------------------------------------------------------------

function PendingTab() {
  const { toast } = useToast()
  const [pending, setPending] = useState<AdminChild[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null)
  const {
    isOpen: deleteIsOpen,
    pendingItem: deletePendingId,
    openDelete,
    closeDelete,
  } = useConfirmDelete<string>()

  const fetchPending = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/admin/children?status=pending&pageSize=100', {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Could not load pending registrations')
      const json = await res.json()
      setPending(json.children ?? [])
    } catch (err) {
      console.error('Pending fetch error:', err)
      setError(err instanceof Error ? err.message : 'Network error')
    }
  }, [])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  async function handleApprove(child: AdminChild) {
    setBusyId(child.id)
    try {
      const res = await fetch(`/api/admin/children/${child.id}/approve`, {
        method: 'POST',
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Approval failed')
      }
      toast({
        title: 'Approved',
        description: `${child.firstName} ${child.lastName} is now on the roster.`,
        variant: 'success',
      })
      await fetchPending()
    } catch (err) {
      toast({
        title: 'Approval failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id: string) {
    try {
      const res = await fetch(`/api/admin/children/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Rejection failed')
      }
      toast({
        title: 'Submission rejected',
        description: 'The pending registration has been removed.',
        variant: 'success',
      })
      await fetchPending()
    } catch (err) {
      toast({
        title: 'Rejection failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-gray-600">
          {pending === null
            ? 'Loading pending submissions…'
            : pending.length === 0
              ? 'No pending parent submissions. Anything submitted via /parent/register will appear here for review.'
              : `${pending.length} submission${pending.length === 1 ? '' : 's'} awaiting approval`}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {pending && pending.length > 0 && (
        <div className="space-y-4">
          {pending.map((child) => (
            <article
              key={child.id}
              className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <PhotoThumb
                    photoUrl={child.photoUrl}
                    firstName={child.firstName}
                    size="md"
                    onClick={() =>
                      child.photoUrl &&
                      setLightbox({
                        url: child.photoUrl,
                        alt: `${child.firstName} ${child.lastName}`,
                      })
                    }
                  />
                  <div className="min-w-0">
                    <span className="inline-block rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                      Pending review
                    </span>
                    <h3
                      className="text-base font-bold truncate"
                      style={{ color: 'rgba(27, 34, 119, 1)' }}
                    >
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      Submitted{' '}
                      {new Date(child.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(child)}
                    disabled={busyId === child.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'rgb(27, 109, 36)' }}
                  >
                    {busyId === child.id ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openDelete(child.id)}
                    className="rounded-lg border border-red-600 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              </header>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <PendingField label="Date of birth">
                  {new Date(child.dateOfBirth).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </PendingField>
                <PendingField label="Gender">
                  {child.gender === 'MALE' ? 'Male' : 'Female'}
                </PendingField>
                <PendingField label="Primary guardian">
                  {child.primaryGuardianName}
                  <br />
                  <a
                    href={`tel:${child.primaryGuardianPhone}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {child.primaryGuardianPhone}
                  </a>
                  {child.primaryGuardianEmail && (
                    <>
                      <br />
                      <a
                        href={`mailto:${child.primaryGuardianEmail}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {child.primaryGuardianEmail}
                      </a>
                    </>
                  )}
                </PendingField>
                <PendingField label="Emergency contact">
                  {child.emergencyContactName} ({child.emergencyContactRelation})
                  <br />
                  <a
                    href={`tel:${child.emergencyContactPhone}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {child.emergencyContactPhone}
                  </a>
                </PendingField>
                {child.allergies && (
                  <PendingField label="Allergies">
                    <span className="text-red-700">{child.allergies}</span>
                  </PendingField>
                )}
                {child.medicalNotes && (
                  <PendingField label="Medical notes">{child.medicalNotes}</PendingField>
                )}
                {child.specialNeeds && (
                  <PendingField label="Special needs">{child.specialNeeds}</PendingField>
                )}
                {child.authorisedCollectors && child.authorisedCollectors.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Authorised collectors
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {child.authorisedCollectors.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs text-gray-700"
                        >
                          {c.photoUrl ? (
                            <span className="relative h-6 w-6 rounded-full overflow-hidden">
                              <Image
                                src={c.photoUrl}
                                alt=""
                                fill
                                sizes="24px"
                                className="object-cover"
                                unoptimized
                              />
                            </span>
                          ) : (
                            <span className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                              {c.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="font-medium">{c.name}</span>
                          <span className="text-gray-400">— {c.relationship}</span>
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Consent (UK GDPR)
                  </dt>
                  <dd>
                    <ConsentBadges child={child} />
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        open={deleteIsOpen}
        title="Reject submission"
        message="Are you sure you want to reject this registration? The record will be permanently removed."
        onConfirm={async () => {
          if (deletePendingId) await handleReject(deletePendingId)
          closeDelete()
        }}
        onCancel={closeDelete}
      />

      {lightbox && (
        <PhotoLightbox
          url={lightbox.url}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

function PendingField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-gray-800">{children}</dd>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 3: Performance — per-child timeline of every check-in with the
// teacher's performance note. Notes can be edited inline. Reports can be
// sent to the primary guardian's email individually or in bulk.
// ---------------------------------------------------------------------------

interface PerformanceCheckIn {
  id: string
  signedInAt: string
  signedOutAt: string | null
  performance: string | null
  performanceUpdatedAt: string | null
}

interface PerformanceChild {
  id: string
  firstName: string
  lastName: string
  photoUrl: string | null
  primaryGuardianName: string
  primaryGuardianEmail: string | null
  checkIns: PerformanceCheckIn[]
}

function startOfMonthISO(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function PerformanceTab() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState(startOfMonthISO())
  const [toDate, setToDate] = useState(todayISO())
  const [children, setChildren] = useState<PerformanceChild[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [busyChildId, setBusyChildId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Pull every child + their check-ins in one go. We re-use the
      // existing list endpoint with a large page size, then ask each
      // child's detail endpoint for the full check-in history. To keep
      // this simple we fetch in parallel via Promise.all.
      const listRes = await fetch('/api/admin/children?pageSize=100', {
        cache: 'no-store',
      })
      if (!listRes.ok) throw new Error('Could not load roster')
      const listJson = await listRes.json()
      const childIds: string[] = (listJson.children as Array<{ id: string }>).map(
        (c) => c.id
      )

      const details = await Promise.all(
        childIds.map((id) =>
          fetch(`/api/admin/children/${id}`, { cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      )

      const mapped: PerformanceChild[] = details
        .filter((d): d is { child: PerformanceChild } => !!d?.child)
        .map((d) => d.child)

      setChildren(mapped)
    } catch (err) {
      console.error('Performance fetch error:', err)
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Filter: search by child name; date range filtering of timeline entries
  // happens per-child inside the card so the search list still shows every
  // child even if a child has no entries in the range.
  const filteredChildren =
    children?.filter((c) => {
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
    }) ?? []

  function inRange(iso: string): boolean {
    const d = new Date(iso)
    const from = new Date(fromDate + 'T00:00:00')
    const to = new Date(toDate + 'T23:59:59')
    return d >= from && d <= to
  }

  async function handleEmailOne(childId: string) {
    setBusyChildId(childId)
    try {
      const res = await fetch(
        `/api/admin/children/${childId}/email-performance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromDate, toDate }),
        }
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to send report')
      }
      toast({
        title: 'Report sent',
        description: 'The primary guardian has been emailed.',
        variant: 'success',
      })
    } catch (err) {
      toast({
        title: 'Send failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setBusyChildId(null)
    }
  }

  async function handleEmailAll() {
    if (!children || children.length === 0) return
    if (
      !confirm(
        `Send ${children.length} report${
          children.length === 1 ? '' : 's'
        } to primary guardians for ${fromDate} → ${toDate}?`
      )
    ) {
      return
    }
    setBulkBusy(true)
    try {
      const res = await fetch('/api/admin/children/email-performances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromDate, toDate }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error ?? 'Bulk send failed')
      }
      const sent = json.sent ?? 0
      const skipped = json.skipped ?? 0
      const failed = json.failed ?? 0
      toast({
        title: 'Bulk reports complete',
        description: `Sent ${sent}, skipped ${skipped}, failed ${failed}.`,
        variant: failed > 0 ? 'error' : 'success',
        duration: 6000,
      })
    } catch (err) {
      toast({
        title: 'Bulk send failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setBulkBusy(false)
    }
  }

  async function handleSavePerformance(checkInId: string, value: string) {
    const res = await fetch(`/api/admin/check-ins/${checkInId}/performance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performance: value }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error ?? 'Could not save')
    }
    // Mutate locally to avoid a full refetch.
    setChildren((current) =>
      current
        ? current.map((c) => ({
            ...c,
            checkIns: c.checkIns.map((ci) =>
              ci.id === checkInId
                ? {
                    ...ci,
                    performance: value.trim() || null,
                    performanceUpdatedAt: new Date().toISOString(),
                  }
                : ci
            ),
          }))
        : current
    )
  }

  return (
    <div className="space-y-5">
      {/* Top controls — date range + search + bulk send */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="block mb-1 text-xs font-semibold text-gray-700">
              From
            </span>
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm">
            <span className="block mb-1 text-xs font-semibold text-gray-700">
              To
            </span>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <input
            type="search"
            placeholder="Search child name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={handleEmailAll}
          disabled={bulkBusy || !children || children.length === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {bulkBusy ? 'Sending all reports…' : 'Email all guardians'}
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

      {isLoading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">
          Loading performance history…
        </div>
      ) : filteredChildren.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">
          No children match your search.
        </div>
      ) : (
        <div className="space-y-5">
          {filteredChildren.map((child) => {
            const entries = child.checkIns
              .filter((ci) => inRange(ci.signedInAt))
              .sort(
                (a, b) =>
                  new Date(b.signedInAt).getTime() -
                  new Date(a.signedInAt).getTime()
              )
            return (
              <ChildPerformanceCard
                key={child.id}
                child={child}
                entriesInRange={entries}
                isEmailing={busyChildId === child.id}
                onEmail={() => handleEmailOne(child.id)}
                onSavePerformance={handleSavePerformance}
                onPhotoClick={() =>
                  child.photoUrl &&
                  setLightbox({
                    url: child.photoUrl,
                    alt: `${child.firstName} ${child.lastName}`,
                  })
                }
              />
            )
          })}
        </div>
      )}

      {lightbox && (
        <PhotoLightbox
          url={lightbox.url}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

function ChildPerformanceCard({
  child,
  entriesInRange,
  isEmailing,
  onEmail,
  onSavePerformance,
  onPhotoClick,
}: {
  child: PerformanceChild
  entriesInRange: PerformanceCheckIn[]
  isEmailing: boolean
  onEmail: () => void
  onSavePerformance: (checkInId: string, value: string) => Promise<void>
  onPhotoClick: () => void
}) {
  const hasGuardianEmail = Boolean(child.primaryGuardianEmail)

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <PhotoThumb
            photoUrl={child.photoUrl}
            firstName={child.firstName}
            size="md"
            onClick={onPhotoClick}
          />
          <div className="min-w-0">
            <h3
              className="text-base font-bold truncate"
              style={{ color: 'rgba(27, 34, 119, 1)' }}
            >
              {child.firstName} {child.lastName}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              Guardian: {child.primaryGuardianName}
              {child.primaryGuardianEmail && (
                <>
                  {' · '}
                  <a
                    href={`mailto:${child.primaryGuardianEmail}`}
                    className="text-blue-600 hover:underline"
                  >
                    {child.primaryGuardianEmail}
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEmail}
          disabled={isEmailing || !hasGuardianEmail}
          title={
            hasGuardianEmail
              ? 'Email this report to the primary guardian'
              : 'No primary-guardian email on file. Edit the child to add one.'
          }
          className="rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEmailing ? 'Sending…' : 'Send report'}
        </button>
      </header>

      {entriesInRange.length === 0 ? (
        <p className="text-sm text-gray-500">
          No check-ins in this date range.
        </p>
      ) : (
        <ol className="space-y-3">
          {entriesInRange.map((ci) => (
            <li
              key={ci.id}
              className="rounded-xl border border-gray-100 bg-gray-50 p-3"
            >
              <PerformanceEntry
                checkIn={ci}
                onSave={(value) => onSavePerformance(ci.id, value)}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function PerformanceEntry({
  checkIn,
  onSave,
}: {
  checkIn: PerformanceCheckIn
  onSave: (value: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(checkIn.performance ?? '')
  const [saving, setSaving] = useState(false)

  const dateLabel = new Date(checkIn.signedInAt).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(draft.trim())
      setEditing(false)
    } catch {
      // toast surfaced upstream — keep edit mode open so the teacher can retry.
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {dateLabel}
        </p>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(checkIn.performance ?? '')
              setEditing(true)
            }}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            {checkIn.performance ? 'Edit note' : 'Add note'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="How did the session go?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 outline-none"
            maxLength={4000}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setDraft(checkIn.performance ?? '')
              }}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-800 whitespace-pre-wrap">
          {checkIn.performance ?? (
            <span className="italic text-gray-400">
              No performance note recorded. Click &ldquo;Add note&rdquo; to fill one in.
            </span>
          )}
        </p>
      )}
      {checkIn.performanceUpdatedAt && !editing && (
        <p className="text-[11px] text-gray-400">
          Last updated{' '}
          {new Date(checkIn.performanceUpdatedAt).toLocaleString('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 4: Analytics
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

// ---------------------------------------------------------------------------
// Photo lightbox — click a thumbnail anywhere in the panel to open this.
// Closes on backdrop click or Escape.
// ---------------------------------------------------------------------------

function PhotoLightbox({
  url,
  alt,
  onClose,
}: {
  url: string
  alt: string
  onClose: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-full max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={url}
          alt={alt}
          width={1024}
          height={1024}
          className="max-h-[85vh] w-auto rounded-lg object-contain shadow-2xl"
          unoptimized
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-white shadow-md text-gray-700 hover:text-gray-900 flex items-center justify-center text-xl leading-none"
          aria-label="Close photo"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sign-out + performance modal — opens before closing a check-in. The
// performance note is optional; the teacher can backfill it later from the
// Performance tab.
// ---------------------------------------------------------------------------

/** Shape of the data SignOutModal needs to render the collector picker. */
export interface SignOutCollectorContext {
  primaryGuardianName: string
  primaryGuardianRelationship?: string
  collectors: AdminCollector[]
}

export interface SignOutConfirmArgs {
  code: string
  performance: string
  collectedByName: string
  collectedByRelationship: string
  collectedFromList: boolean
  collectionNotes: string
}

function SignOutModal({
  childName,
  collectorContext,
  defaultPerformance = '',
  onConfirm,
  onCancel,
  onResendCode,
}: {
  childName: string
  collectorContext: SignOutCollectorContext
  defaultPerformance?: string
  onConfirm: (args: SignOutConfirmArgs) => Promise<void>
  onCancel: () => void
  onResendCode?: () => Promise<void>
}) {
  const PRIMARY_KEY = 'primary'
  const OTHER_KEY = 'other'

  const [code, setCode] = useState('')
  const [pickedKey, setPickedKey] = useState<string>(PRIMARY_KEY)
  const [otherName, setOtherName] = useState('')
  const [otherRelationship, setOtherRelationship] = useState('')
  const [otherNotes, setOtherNotes] = useState('')
  const [performance, setPerformance] = useState(defaultPerformance)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const trimmedCode = code.replace(/\D+/g, '')
  const codeReady = trimmedCode.length === 6

  function buildCollectorPayload(): {
    name: string
    relationship: string
    fromList: boolean
    notes: string
  } | null {
    if (pickedKey === PRIMARY_KEY) {
      return {
        name: collectorContext.primaryGuardianName,
        relationship:
          collectorContext.primaryGuardianRelationship ?? 'Primary guardian',
        fromList: true,
        notes: '',
      }
    }
    if (pickedKey === OTHER_KEY) {
      if (!otherName.trim() || !otherRelationship.trim()) {
        return null
      }
      return {
        name: otherName.trim(),
        relationship: otherRelationship.trim(),
        fromList: false,
        notes: otherNotes.trim(),
      }
    }
    const match = collectorContext.collectors.find((c) => c.id === pickedKey)
    if (!match) return null
    return {
      name: match.name,
      relationship: match.relationship,
      fromList: true,
      notes: '',
    }
  }

  async function handleConfirm() {
    if (!codeReady) {
      setError('Enter the 6-digit pickup code from the guardian.')
      return
    }
    const collector = buildCollectorPayload()
    if (!collector) {
      setError('Please record the collector’s name and relationship.')
      return
    }
    if (!collector.fromList && !collector.notes) {
      setError(
        'For an off-list collector, please add a short reason (e.g. "Mother in hospital, sister collecting").'
      )
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm({
        code: trimmedCode,
        performance: performance.trim(),
        collectedByName: collector.name,
        collectedByRelationship: collector.relationship,
        collectedFromList: collector.fromList,
        collectionNotes: collector.notes,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    if (!onResendCode) return
    setResending(true)
    setResendStatus(null)
    try {
      await onResendCode()
      setResendStatus('Code re-sent to the guardian.')
    } catch (err) {
      setResendStatus(err instanceof Error ? err.message : 'Resend failed.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Sign out ${childName}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">
            Sign out {childName}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="px-6 py-5 space-y-5">
          {/* Who is collecting */}
          <fieldset>
            <legend className="block mb-2 text-xs font-semibold uppercase tracking-wider text-gray-700">
              Who is collecting? <span className="text-red-600">*</span>
            </legend>
            <div className="space-y-2">
              <CollectorOption
                checked={pickedKey === PRIMARY_KEY}
                onChange={() => setPickedKey(PRIMARY_KEY)}
                title={collectorContext.primaryGuardianName}
                subtitle="Primary guardian"
              />
              {collectorContext.collectors.map((c) => (
                <CollectorOption
                  key={c.id}
                  checked={pickedKey === c.id}
                  onChange={() => setPickedKey(c.id)}
                  title={c.name}
                  subtitle={c.relationship}
                  photoUrl={c.photoUrl}
                />
              ))}
              <CollectorOption
                checked={pickedKey === OTHER_KEY}
                onChange={() => setPickedKey(OTHER_KEY)}
                title="Someone else (record details)"
                subtitle="Off-list collector — please record a reason below."
              />
            </div>

            {pickedKey === OTHER_KEY && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="block mb-1 text-xs font-semibold text-gray-700">
                    Name <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={otherName}
                    onChange={(e) => setOtherName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </label>
                <label className="block text-sm">
                  <span className="block mb-1 text-xs font-semibold text-gray-700">
                    Relationship to child <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={otherRelationship}
                    onChange={(e) => setOtherRelationship(e.target.value)}
                    placeholder="e.g. Family friend"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="block mb-1 text-xs font-semibold text-gray-700">
                    Reason / context <span className="text-red-600">*</span>
                  </span>
                  <textarea
                    rows={2}
                    value={otherNotes}
                    onChange={(e) => setOtherNotes(e.target.value)}
                    placeholder="Why is this person collecting instead of someone on the list?"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                    maxLength={2000}
                  />
                </label>
              </div>
            )}
          </fieldset>

          {/* Pickup code */}
          <label className="block text-sm">
            <span className="block mb-1 text-xs font-semibold text-gray-700">
              Pickup code <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base font-mono tracking-widest text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="mt-1 block text-xs text-gray-500">
              Ask the guardian for the 6-digit code from the email they
              received at sign-in.
            </span>
            {onResendCode && (
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || submitting}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {resending ? 'Resending…' : "Resend code to guardian's email"}
                </button>
                {resendStatus && (
                  <span className="text-[11px] text-gray-500">{resendStatus}</span>
                )}
              </div>
            )}
          </label>

          {/* Performance */}
          <label className="block text-sm">
            <span className="block mb-1 text-xs font-semibold text-gray-700">
              Performance note (optional)
            </span>
            <textarea
              rows={3}
              value={performance}
              onChange={(e) => setPerformance(e.target.value)}
              placeholder="How did the session go? Any highlights, areas to encourage, things to flag?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              maxLength={4000}
            />
            <span className="mt-1 block text-xs text-gray-500">
              You can leave this blank and fill it in later from the
              Performance tab.
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
              onClick={onCancel}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !codeReady}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Signing out…' : 'Verify & sign out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CollectorOption({
  checked,
  onChange,
  title,
  subtitle,
  photoUrl,
}: {
  checked: boolean
  onChange: () => void
  title: string
  subtitle: string
  photoUrl?: string | null
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 cursor-pointer transition-colors ${
        checked
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <input
        type="radio"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      {photoUrl ? (
        <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden border border-gray-200 bg-white">
          <Image
            src={photoUrl}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
          {title.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
    </label>
  )
}

// ---------------------------------------------------------------------------
// Photo thumbnail used in the All Children + Performance tabs. Click to
// enlarge via the parent's lightbox state.
// ---------------------------------------------------------------------------

function PhotoThumb({
  photoUrl,
  firstName,
  onClick,
  size = 'sm',
}: {
  photoUrl: string | null
  firstName: string
  onClick?: () => void
  size?: 'sm' | 'md'
}) {
  const dim = size === 'md' ? 56 : 40
  if (!photoUrl) {
    return (
      <div
        className={`rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700`}
        style={{ width: dim, height: dim }}
        aria-hidden="true"
      >
        {firstName[0]?.toUpperCase()}
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors"
      style={{ width: dim, height: dim }}
      aria-label={`Enlarge ${firstName}'s photo`}
    >
      <Image
        src={photoUrl}
        alt={`${firstName}'s photo`}
        width={dim}
        height={dim}
        className="object-cover w-full h-full"
        unoptimized
      />
    </button>
  )
}
