'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import {
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  type Gender,
  type MaritalStatus,
} from '@/lib/types/group-member'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardMember {
  id: string
  groupId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  birthDay: number
  birthMonth: number
  gender: Gender
  maritalStatus: MaritalStatus
  address: string
  filledWithHolyGhost: boolean
  createdAt: Date | string
  group: {
    id: string
    slug: string
    title: string
  }
}

interface GroupOption {
  id: string
  title: string
}

interface MembersManagerProps {
  initialMembers: DashboardMember[]
  initialTotal: number
  pageSize: number
  groups: GroupOption[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTHS_SHORT = [
  '',
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatBirthday(day: number, month: number): string {
  const m = MONTHS_SHORT[month] ?? String(month)
  return `${day} ${m}`
}

function formatJoinedDate(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MembersManager({
  initialMembers,
  initialTotal,
  pageSize,
  groups,
}: MembersManagerProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [members, setMembers] = useState<DashboardMember[]>(initialMembers)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const queryKey = useMemo(
    () => ({ page, search, groupFilter }),
    [page, search, groupFilter]
  )

  // Skip the initial fetch since we already have server-rendered data when
  // the user hasn't filtered yet. Once they touch a filter or pagination,
  // we hit the API.
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  useEffect(() => {
    if (!hasUserInteracted) return
    let cancelled = false
    const fetchMembers = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('page', String(queryKey.page))
        params.set('pageSize', String(pageSize))
        if (queryKey.search) params.set('search', queryKey.search)
        if (queryKey.groupFilter) params.set('groupId', queryKey.groupFilter)

        const res = await fetch(`/api/group-members?${params.toString()}`, {
          cache: 'no-store',
        })

        if (cancelled) return

        if (res.ok) {
          const data = await res.json()
          setMembers(data.members ?? [])
          setTotal(data.total ?? 0)
        } else {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Failed to load members')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Members fetch error:', err)
          setError('Unable to reach the server')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchMembers()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, pageSize])

  const refetch = async () => {
    setHasUserInteracted(true)
    // re-trigger the effect by bumping page/setting same value
    setPage((p) => p)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this member submission? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/group-members/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast({
          title: 'Member deleted',
          description: 'The submission has been removed.',
          variant: 'success',
          duration: 3000,
        })
        // Optimistic local removal then refetch
        setMembers((prev) => prev.filter((m) => m.id !== id))
        setTotal((t) => Math.max(0, t - 1))
        await refetch()
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        toast({
          title: 'Delete failed',
          description: data.error ?? 'Failed to delete member',
          variant: 'error',
          duration: 5000,
        })
      }
    } catch (err) {
      console.error('Delete member error:', err)
      toast({
        title: 'Delete failed',
        description: 'An error occurred while deleting',
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setDeletingId(null)
    }
  }

  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endIdx = Math.min(page * pageSize, total)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          aria-label="Search members"
          placeholder="Search by name or email"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setHasUserInteracted(true)
          }}
          className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <select
          aria-label="Filter by group"
          value={groupFilter}
          onChange={(e) => {
            setGroupFilter(e.target.value)
            setPage(1)
            setHasUserInteracted(true)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
        >
          <option value="">All groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <p className="text-sm text-gray-600">
        {total === 0
          ? 'No members yet'
          : `Showing ${startIdx}–${endIdx} of ${total}`}
        {isLoading && ' (loading…)'}
      </p>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Group</Th>
              <Th>Gender</Th>
              <Th>Status</Th>
              <Th>Birthday</Th>
              <Th>Joined</Th>
              <th className="px-4 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {members.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500">
                  {total === 0
                    ? 'No member submissions yet. They will appear here once visitors fill the "Get Involved" form on a ministry page.'
                    : 'No matches for current filters.'}
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <RowGroup
                  key={m.id}
                  member={m}
                  expanded={expandedId === m.id}
                  onToggle={() => setExpandedId((id) => (id === m.id ? null : m.id))}
                  onDelete={() => handleDelete(m.id)}
                  isDeleting={deletingId === m.id}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => {
              setHasUserInteracted(true)
              setPage((p) => Math.max(1, p - 1))
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => {
              setHasUserInteracted(true)
              setPage((p) => Math.min(totalPages, p + 1))
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Row + expanded detail row (table-friendly)
// ---------------------------------------------------------------------------

function RowGroup({
  member,
  expanded,
  onToggle,
  onDelete,
  isDeleting,
}: {
  member: DashboardMember
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
            {member.firstName} {member.lastName}
          </span>
        </Td>
        <Td>
          <a className="text-blue-600 hover:underline" href={`mailto:${member.email}`}>
            {member.email}
          </a>
        </Td>
        <Td>{member.phoneNumber}</Td>
        <Td>
          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
            {member.group.title}
          </span>
        </Td>
        <Td>{GENDER_LABELS[member.gender]}</Td>
        <Td>{MARITAL_STATUS_LABELS[member.maritalStatus]}</Td>
        <Td>{formatBirthday(member.birthDay, member.birthMonth)}</Td>
        <Td>{formatJoinedDate(member.createdAt)}</Td>
        <td className="px-4 py-3 whitespace-nowrap text-right">
          <button
            type="button"
            onClick={onToggle}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 mr-3"
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={9} className="px-6 py-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Address</dt>
                <dd className="mt-1 text-gray-800 whitespace-pre-wrap">{member.address}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Filled with the Holy Ghost</dt>
                <dd className="mt-1 text-gray-800">
                  {member.filledWithHolyGhost ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
          </td>
        </tr>
      )}
    </>
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
