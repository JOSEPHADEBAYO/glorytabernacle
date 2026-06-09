'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/toast-provider'
import { GENDER_LABELS, type Gender } from '@/lib/types/group-member'
import { type ChildrenAgeGroup } from '@/lib/types/inaugural-registration'
import { InauguralBadge, type BadgeData } from './inaugural-badge'

export interface DashboardInauguralRegistration {
  id: string
  registrationId: string
  serialNumber: number
  firstName: string
  lastName: string
  email: string
  gender: Gender
  address: string
  isRccgMember: boolean
  fromOutsideBarnstaple: boolean
  homeChurch: string | null
  photographyConsent: boolean
  bringingChildren: boolean
  numberOfChildren: number | null
  childrenAgeGroups: ChildrenAgeGroup[] | null
  childrenSpecialNeeds: string | null
  createdAt: Date | string
}

interface ListResponse {
  registrations: DashboardInauguralRegistration[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface InauguralManagerProps {
  initialRows: DashboardInauguralRegistration[]
  initialTotal: number
  pageSize: number
  /** Base URL used to build the QR target on the badge. Set in the page from
   *  SITE_URL so the QR points at production, not localhost. */
  siteUrl: string
}

function formatDate(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function subtitleFor(r: DashboardInauguralRegistration): string {
  if (r.fromOutsideBarnstaple && r.homeChurch) return r.homeChurch
  return 'RCCG Glory Tabernacle, Barnstaple'
}

export function InauguralManager({
  initialRows,
  initialTotal,
  pageSize,
  siteUrl,
}: InauguralManagerProps) {
  const { toast } = useToast()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ListResponse>({
    registrations: initialRows,
    total: initialTotal,
    page: 1,
    pageSize,
    totalPages: Math.max(1, Math.ceil(initialTotal / pageSize)),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewBadge, setPreviewBadge] = useState<BadgeData | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Debounce the search box.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    if (!hasInteracted) return
    let cancelled = false
    async function fetchRows() {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        if (search) params.set('search', search)
        const res = await fetch(`/api/admin/inaugural-service?${params}`, {
          cache: 'no-store',
        })
        if (cancelled) return
        if (res.ok) {
          setData(await res.json())
        } else {
          const json = await res.json().catch(() => ({}))
          setError(json.error ?? 'Could not load registrations.')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Inaugural fetch error:', err)
          setError('Network error')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchRows()
    return () => {
      cancelled = true
    }
  }, [hasInteracted, page, pageSize, search])

  function viewBadge(r: DashboardInauguralRegistration) {
    setPreviewBadge({
      registrationId: r.registrationId,
      firstName: r.firstName,
      lastName: r.lastName,
      subtitle: subtitleFor(r),
      qrTarget: `${siteUrl}/inaugural-service/programme?id=${encodeURIComponent(
        r.registrationId
      )}`,
    })
  }

  async function copyId(r: DashboardInauguralRegistration) {
    try {
      await navigator.clipboard.writeText(r.registrationId)
      toast({
        title: 'Registration ID copied',
        description: r.registrationId,
        variant: 'success',
        duration: 2500,
      })
    } catch {
      toast({
        title: 'Could not copy',
        variant: 'error',
        duration: 2500,
      })
    }
  }

  const startIdx = data.total === 0 ? 0 : (data.page - 1) * pageSize + 1
  const endIdx = Math.min(data.page * pageSize, data.total)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          aria-label="Search registrations"
          placeholder="Search by name, email, or ID (e.g. GT-2026-0001)"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setHasInteracted(true)
          }}
          className="w-full max-w-lg rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-600">
          {data.total === 0
            ? 'No registrations yet'
            : `Showing ${startIdx}–${endIdx} of ${data.total}`}
          {isLoading && ' · loading…'}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>Registration ID</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Gender</Th>
              <Th>RCCG?</Th>
              <Th>From</Th>
              <Th>Photo</Th>
              <Th>Children</Th>
              <Th>Submitted</Th>
              <th className="px-4 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.registrations.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-sm text-gray-500">
                  {isLoading ? 'Loading…' : 'No registrations match your search.'}
                </td>
              </tr>
            ) : (
              data.registrations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td>
                    <button
                      type="button"
                      onClick={() => copyId(r)}
                      title="Click to copy"
                      className="font-mono text-xs font-bold tracking-wider text-[#000666] hover:underline"
                    >
                      {r.registrationId}
                    </button>
                  </Td>
                  <Td>
                    <span className="font-medium text-gray-900">
                      {r.firstName} {r.lastName}
                    </span>
                  </Td>
                  <Td>
                    <a className="text-blue-600 hover:underline" href={`mailto:${r.email}`}>
                      {r.email}
                    </a>
                  </Td>
                  <Td>{GENDER_LABELS[r.gender]}</Td>
                  <Td>
                    <Pill kind={r.isRccgMember ? 'green' : 'gray'}>
                      {r.isRccgMember ? 'Member' : 'Non-member'}
                    </Pill>
                  </Td>
                  <Td>
                    {r.fromOutsideBarnstaple ? (
                      <span className="text-xs text-gray-700">
                        {r.homeChurch ?? 'Outside Barnstaple'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Barnstaple</span>
                    )}
                  </Td>
                  <Td>
                    <Pill kind={r.photographyConsent ? 'green' : 'gray'}>
                      {r.photographyConsent ? '📸 Yes' : 'No'}
                    </Pill>
                  </Td>
                  <Td>
                    {r.bringingChildren ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-[#000666]">
                          👨‍👩‍👧 {r.numberOfChildren ?? '—'}
                        </span>
                        {r.childrenAgeGroups && r.childrenAgeGroups.length > 0 && (
                          <span className="flex flex-wrap gap-1">
                            {r.childrenAgeGroups.map((age) => (
                              <span
                                key={age}
                                className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
                              >
                                {age}
                              </span>
                            ))}
                          </span>
                        )}
                        {r.childrenSpecialNeeds && (
                          <span
                            className="text-[10px] italic text-gray-500"
                            title={r.childrenSpecialNeeds}
                          >
                            ⚠ note
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </Td>
                  <Td>{formatDate(r.createdAt)}</Td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => viewBadge(r)}
                      className="rounded-lg bg-[#000666] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                    >
                      View badge
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1))
              setHasInteracted(true)
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages || isLoading}
            onClick={() => {
              setPage((p) => Math.min(data.totalPages, p + 1))
              setHasInteracted(true)
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}

      {previewBadge && (
        <InauguralBadge data={previewBadge} onClose={() => setPreviewBadge(null)} />
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{children}</td>
}

function Pill({
  kind,
  children,
}: {
  kind: 'green' | 'gray'
  children: React.ReactNode
}) {
  const cls =
    kind === 'green'
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-600'
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
      {children}
    </span>
  )
}
