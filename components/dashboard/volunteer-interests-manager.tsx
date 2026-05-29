'use client'

import { Fragment } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import type { VolunteerAreaStrength } from '@/lib/types/volunteer-interest'
import { GENDER_LABELS, type Gender } from '@/lib/types/group-member'
import {
  ConfirmDeleteModal,
  useConfirmDelete,
} from '@/components/ui/confirm-delete-modal'
import {
  EmailComposerModal,
  formatSendResultToast,
  type EmailRecipient,
} from '@/components/dashboard/email-composer-modal'

export interface DashboardVolunteerInterest {
  id: string
  name: string
  email: string
  phoneNumber: string
  /** Null only for rows created before the 2026-05-29 migration. */
  gender: Gender | null
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
  const { isOpen: deleteIsOpen, pendingItem: deletePendingId, openDelete, closeDelete } = useConfirmDelete<string>()
  const [emailRecipient, setEmailRecipient] = useState<EmailRecipient | null>(null)
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
              <Th>Gender</Th>
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
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500">
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
                        {interest.gender ? (
                          GENDER_LABELS[interest.gender]
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </Td>
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
                              setEmailRecipient({
                                id: interest.id,
                                name: interest.name,
                                email: interest.email,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                            aria-label={`Send email to ${interest.name}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                              />
                            </svg>
                            Email
                          </button>
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
                            onClick={() => openDelete(interest.id)}
                            disabled={deletePendingId === interest.id}
                            className="rounded-lg border border-red-600 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletePendingId === interest.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </Td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={9} className="bg-gray-50 px-6 py-5">
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

      <ConfirmDeleteModal
        open={deleteIsOpen}
        onConfirm={async () => {
          if (deletePendingId) await handleDelete(deletePendingId)
          closeDelete()
        }}
        onCancel={closeDelete}
      />

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

      {/* Per-row Send Email composer — shared across all admin tables. */}
      {emailRecipient && (
        <EmailComposerModal
          target={{ kind: 'single', recipient: emailRecipient }}
          sendEndpoint="/api/admin/email/send"
          buildPayload={({ subject, body, ctaLabel, ctaHref }) => ({
            to: [{ name: emailRecipient.name, email: emailRecipient.email }],
            subject,
            body,
            ...(ctaLabel ? { ctaLabel, ctaHref } : {}),
          })}
          onClose={() => setEmailRecipient(null)}
          onSent={(result) => {
            setEmailRecipient(null)
            const t = formatSendResultToast(result)
            toast({ ...t, duration: 5000 })
          }}
        />
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
