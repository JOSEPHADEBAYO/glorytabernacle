'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { MEMBERSHIP_CLASS_LABELS } from '@/lib/types/membership-application'

export interface DashboardMembershipApplication {
  id: string
  membershipClass: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  gender: 'MALE' | 'FEMALE'
  maritalStatus:
    | 'SINGLE'
    | 'ENGAGED'
    | 'MARRIED'
    | 'SEPARATED'
    | 'DIVORCED'
    | 'WIDOWED'
  streetAddress: string
  city: string
  stateProvince: string
  country: string
  rccgMember: boolean
  saved: boolean
  expectations: string | null
  createdAt: Date | string
}

interface NewMembersManagerProps {
  initialApplications: DashboardMembershipApplication[]
  initialTotal: number
  pageSize: number
}

const GENDER_LABELS = {
  MALE: 'Male',
  FEMALE: 'Female',
}

const MARITAL_STATUS_LABELS = {
  SINGLE: 'Single',
  ENGAGED: 'Engaged',
  MARRIED: 'Married',
  SEPARATED: 'Separated',
  DIVORCED: 'Divorced',
  WIDOWED: 'Widowed',
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

export function NewMembersManager({
  initialApplications,
  initialTotal,
  pageSize,
}: NewMembersManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [applications, setApplications] = useState(initialApplications)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
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

  const queryKey = useMemo(
    () => ({ page, search, classFilter }),
    [page, search, classFilter]
  )

  useEffect(() => {
    if (!hasUserInteracted) return

    let cancelled = false
    const fetchApplications = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('page', String(queryKey.page))
        params.set('pageSize', String(pageSize))
        if (queryKey.search) params.set('search', queryKey.search)
        if (queryKey.classFilter) {
          params.set('membershipClass', queryKey.classFilter)
        }

        const res = await fetch(
          `/api/membership-applications?${params.toString()}`,
          { cache: 'no-store' }
        )

        if (cancelled) return
        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(data.error ?? 'Failed to load applications')
        }

        setApplications(data.applications ?? [])
        setTotal(data.total ?? 0)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load data')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchApplications()
    return () => {
      cancelled = true
    }
  }, [hasUserInteracted, pageSize, queryKey])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this membership application? This cannot be undone.')) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/membership-applications/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to delete application')
      }

      setApplications((current) => current.filter((item) => item.id !== id))
      setTotal((current) => Math.max(0, current - 1))
      toast({
        title: 'Application deleted',
        description: 'The membership application has been removed.',
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          aria-label="Search new members"
          placeholder="Search by name, email or phone"
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value)
            setHasUserInteracted(true)
          }}
          className="max-w-md flex-1 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
        />
        <select
          aria-label="Filter by membership class"
          value={classFilter}
          onChange={(event) => {
            setClassFilter(event.target.value)
            setPage(1)
            setHasUserInteracted(true)
          }}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All classes</option>
          {MEMBERSHIP_CLASS_LABELS.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-600">
        {total === 0
          ? 'No new member applications yet'
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
              <Th>Class</Th>
              <Th>Saved</Th>
              <Th>RCCG</Th>
              <Th>Submitted</Th>
              <th className="px-4 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                  New member applications will appear here after visitors submit
                  the membership form.
                </td>
              </tr>
            ) : (
              applications.map((application) => (
                <ApplicationRows
                  key={application.id}
                  application={application}
                  expanded={expandedId === application.id}
                  onToggle={() =>
                    setExpandedId((current) =>
                      current === application.id ? null : application.id
                    )
                  }
                  onDelete={() => handleDelete(application.id)}
                  isDeleting={deletingId === application.id}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => {
              setHasUserInteracted(true)
              setPage((current) => Math.max(1, current - 1))
            }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => {
              setHasUserInteracted(true)
              setPage((current) => Math.min(totalPages, current + 1))
            }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function ApplicationRows({
  application,
  expanded,
  onToggle,
  onDelete,
  isDeleting,
}: {
  application: DashboardMembershipApplication
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <>
      <tr className="hover:bg-gray-50">
        <Td>
          <span className="font-medium text-gray-900">
            {application.firstName} {application.lastName}
          </span>
        </Td>
        <Td>
          <a className="text-blue-600 hover:underline" href={`mailto:${application.email}`}>
            {application.email}
          </a>
        </Td>
        <Td>{application.phoneNumber}</Td>
        <Td>
          <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {application.membershipClass}
          </span>
        </Td>
        <Td>{application.saved ? 'Yes' : 'No'}</Td>
        <Td>{application.rccgMember ? 'Yes' : 'No'}</Td>
        <Td>{formatDate(application.createdAt)}</Td>
        <td className="whitespace-nowrap px-4 py-3 text-right">
          <button
            type="button"
            onClick={onToggle}
            className="mr-3 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Gender" value={GENDER_LABELS[application.gender]} />
              <Detail
                label="Marital Status"
                value={MARITAL_STATUS_LABELS[application.maritalStatus]}
              />
              <Detail
                label="Address"
                value={`${application.streetAddress}, ${application.city}, ${application.stateProvince}, ${application.country}`}
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <Detail
                  label="Expectations / Prayer Points"
                  value={application.expectations ?? 'Not provided'}
                />
              </div>
            </dl>
          </td>
        </tr>
      )}
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-gray-800">{value}</dd>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{children}</td>
}
