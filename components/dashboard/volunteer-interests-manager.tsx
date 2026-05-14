'use client'

import { Fragment } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import type { VolunteerAreaStrength } from '@/lib/types/volunteer-interest'

export interface DashboardVolunteerInterest {
  id: string
  name: string
  email: string
  phoneNumber: string
  address: string
  areaStrengths: VolunteerAreaStrength[] | unknown
  pastExperience: string
  contributionStatement: string
  bornAgain: boolean
  filledWithHolyGhost: boolean
  createdAt: Date | string
}

interface VolunteerInterestsManagerProps {
  initialInterests: DashboardVolunteerInterest[]
  initialTotal: number
  pageSize: number
}

function formatDate(value: Date | string) {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function normalizeStrengths(value: unknown): VolunteerAreaStrength[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is VolunteerAreaStrength => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { id?: unknown }).id === 'string' &&
      typeof (item as { title?: unknown }).title === 'string'
    )
  })
}

function YesNo({ value }: { value: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
        value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {value ? 'Yes' : 'No'}
    </span>
  )
}

export function VolunteerInterestsManager({
  initialInterests,
  initialTotal,
  pageSize,
}: VolunteerInterestsManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [interests, setInterests] = useState(initialInterests)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const queryKey = useMemo(() => ({ page, search }), [page, search])

  useEffect(() => {
    if (!hasUserInteracted) return

    let cancelled = false
    async function fetchInterests() {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('page', String(queryKey.page))
        params.set('pageSize', String(pageSize))
        if (queryKey.search) params.set('search', queryKey.search)

        const response = await fetch(
          `/api/volunteer-interests?${params.toString()}`,
          { cache: 'no-store' }
        )
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.error ?? 'Failed to load volunteer interests')
        }

        if (!cancelled) {
          setInterests(data.interests ?? [])
          setTotal(data.total ?? 0)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load data')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchInterests()
    return () => {
      cancelled = true
    }
  }, [hasUserInteracted, pageSize, queryKey])

  async function handleDelete(id: string) {
    if (!confirm('Delete this volunteer interest? This cannot be undone.')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/volunteer-interests/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to delete volunteer interest')
      }

      setInterests((current) => current.filter((item) => item.id !== id))
      setTotal((current) => Math.max(0, current - 1))
      toast({
        title: 'Volunteer interest deleted',
        description: 'The submission has been removed.',
        variant: 'success',
      })
      router.refresh()
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endIdx = Math.min(page * pageSize, total)

  return (
    <div className="space-y-4">
      <input
        type="search"
        aria-label="Search volunteer interests"
        placeholder="Search by name, email, phone, or address"
        value={searchInput}
        onChange={(event) => {
          setSearchInput(event.target.value)
          setHasUserInteracted(true)
        }}
        className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-600">
        {total === 0
          ? 'No volunteer interests yet'
          : `Showing ${startIdx}-${endIdx} of ${total}`}
        {isLoading && ' (loading...)'}
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Strengths</Th>
              <Th>Born again</Th>
              <Th>Holy Ghost</Th>
              <Th>Submitted</Th>
              <th className="px-4 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {interests.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                  Volunteer interest submissions will appear here.
                </td>
              </tr>
            ) : (
              interests.map((interest) => {
                const strengths = normalizeStrengths(interest.areaStrengths)
                const expanded = expandedId === interest.id
                return (
                  <Fragment key={interest.id}>
                    <tr key={interest.id} className="align-top">
                      <Td>
                        <span className="font-semibold text-gray-900">{interest.name}</span>
                      </Td>
                      <Td>{interest.email}</Td>
                      <Td>{interest.phoneNumber}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1.5">
                          {strengths.map((strength) => (
                            <span
                              key={strength.id}
                              className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700"
                            >
                              {strength.title}
                            </span>
                          ))}
                        </div>
                      </Td>
                      <Td><YesNo value={interest.bornAgain} /></Td>
                      <Td><YesNo value={interest.filledWithHolyGhost} /></Td>
                      <Td>{formatDate(interest.createdAt)}</Td>
                      <Td>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId((current) =>
                                current === interest.id ? null : interest.id
                              )
                            }
                            className="rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            {expanded ? 'Hide' : 'View'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(interest.id)}
                            disabled={deletingId === interest.id}
                            className="rounded-lg border border-red-600 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === interest.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </Td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={8} className="bg-gray-50 px-6 py-5">
                          <div className="grid gap-5 text-sm md:grid-cols-2">
                            <Detail title="Address" body={interest.address} />
                            <Detail title="Past experience" body={interest.pastExperience} />
                            <div className="md:col-span-2">
                              <Detail
                                title="How they think they can serve"
                                body={interest.contributionStatement}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => {
              setPage((current) => Math.max(1, current - 1))
              setHasUserInteracted(true)
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => {
              setPage((current) => Math.min(totalPages, current + 1))
              setHasUserInteracted(true)
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 text-sm text-gray-700">{children}</td>
}

function Detail({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <p className="mt-2 whitespace-pre-wrap leading-6 text-gray-700">{body}</p>
    </div>
  )
}
