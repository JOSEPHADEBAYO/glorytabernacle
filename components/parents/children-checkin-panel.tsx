'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export interface ChildRow {
  id: string
  firstName: string
  lastName: string
  photoUrl: string | null
  /** Open (not yet signed-out) check-in for this child, if any. */
  openCheckIn: { id: string; signedInAt: string } | null
}

interface ChildrenCheckInPanelProps {
  children: ChildRow[]
}

type Status = {
  type: 'success' | 'error'
  message: string
} | null

/**
 * Tick-and-submit panel for parents:
 *
 * - Shows each registered child with a checkbox
 * - Currently signed-in children show a "Currently in" badge
 * - Sign In button submits POST /api/parents/me/check-in for ticked
 *   children that aren't already in
 * - Sign Out button submits POST /api/parents/me/check-out for ticked
 *   children that ARE already in
 * - After either action we router.refresh() to re-fetch server data
 */
export function ChildrenCheckInPanel({ children }: ChildrenCheckInPanelProps) {
  const router = useRouter()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<Status>(null)

  /** Children IDs currently signed in (have an open check-in). */
  const inIds = useMemo(
    () =>
      new Set(
        children.filter((c) => c.openCheckIn !== null).map((c) => c.id)
      ),
    [children]
  )

  /** Map child id → open check-in id (used by sign-out). */
  const openCheckInIdByChildId = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of children) {
      if (c.openCheckIn) m.set(c.id, c.openCheckIn.id)
    }
    return m
  }, [children])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedArray = useMemo(() => Array.from(selected), [selected])
  const selectedToSignIn = selectedArray.filter((id) => !inIds.has(id))
  const selectedToSignOut = selectedArray.filter((id) => inIds.has(id))

  const handleSignIn = async () => {
    if (selectedToSignIn.length === 0) return
    setIsSubmitting(true)
    setStatus(null)
    try {
      const res = await fetch('/api/parents/me/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childIds: selectedToSignIn }),
      })
      if (res.ok) {
        const data = await res.json()
        const count = data.signedIn ?? 0
        setStatus({
          type: 'success',
          message:
            count === 0
              ? 'No new sign-ins (already in).'
              : `${count} ${count === 1 ? 'child' : 'children'} signed in.`,
        })
        setSelected(new Set())
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setStatus({
          type: 'error',
          message: data.error ?? 'Sign-in failed. Please try again.',
        })
      }
    } catch (err) {
      console.error('Check-in error:', err)
      setStatus({
        type: 'error',
        message: 'Unable to reach the server. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    if (selectedToSignOut.length === 0) return
    setIsSubmitting(true)
    setStatus(null)
    try {
      const checkInIds = selectedToSignOut
        .map((childId) => openCheckInIdByChildId.get(childId))
        .filter((v): v is string => Boolean(v))

      const res = await fetch('/api/parents/me/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkInIds }),
      })
      if (res.ok) {
        const data = await res.json()
        const count = data.signedOut ?? 0
        setStatus({
          type: 'success',
          message:
            count === 0
              ? 'No sign-outs to process.'
              : `${count} ${count === 1 ? 'child' : 'children'} signed out — see you next Sunday!`,
        })
        setSelected(new Set())
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setStatus({
          type: 'error',
          message: data.error ?? 'Sign-out failed. Please try again.',
        })
      }
    } catch (err) {
      console.error('Check-out error:', err)
      setStatus({
        type: 'error',
        message: 'Unable to reach the server. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const allInButSelectedNone = selectedArray.length === 0
  const mixedSelection = selectedToSignIn.length > 0 && selectedToSignOut.length > 0

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
          Sign in / Sign out
        </h2>
        <p className="text-xs text-gray-500">
          {selectedArray.length === 0
            ? 'Tick the children to act on'
            : `${selectedArray.length} selected`}
        </p>
      </div>

      <ul className="divide-y divide-gray-100">
        {children.map((c) => {
          const isIn = inIds.has(c.id)
          const isSelected = selected.has(c.id)
          return (
            <li
              key={c.id}
              className={`flex items-center gap-3 py-3 px-1 rounded-lg transition-colors cursor-pointer ${
                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => toggle(c.id)}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(c.id)}
                onClick={(e) => e.stopPropagation()}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label={`Select ${c.firstName} ${c.lastName}`}
              />
              {c.photoUrl ? (
                <Image
                  src={c.photoUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                  {c.firstName[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {c.firstName} {c.lastName}
                </p>
                {isIn && c.openCheckIn ? (
                  <p className="text-xs" style={{ color: 'rgb(27, 109, 36)' }}>
                    Currently in · since{' '}
                    {new Date(c.openCheckIn.signedInAt).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Not signed in</p>
                )}
              </div>
              {isIn && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: 'rgb(27, 109, 36)' }}
                >
                  In
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {status && (
        <div
          role="status"
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {status.message}
        </div>
      )}

      {mixedSelection && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          You&apos;ve selected children both for sign-in and sign-out. Use one
          button at a time — only the matching ones will be processed.
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSubmitting || allInButSelectedNone || selectedToSignIn.length === 0}
          className="flex-1 inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
        >
          {isSubmitting
            ? 'Working…'
            : selectedToSignIn.length === 0
            ? 'Sign in'
            : `Sign in (${selectedToSignIn.length})`}
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSubmitting || allInButSelectedNone || selectedToSignOut.length === 0}
          className="flex-1 inline-flex items-center justify-center rounded-lg border-2 px-4 py-3 text-sm font-bold transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            borderColor: 'rgba(27, 34, 119, 1)',
            color: 'rgba(27, 34, 119, 1)',
          }}
        >
          {isSubmitting
            ? 'Working…'
            : selectedToSignOut.length === 0
            ? 'Sign out'
            : `Sign out (${selectedToSignOut.length})`}
        </button>
      </div>
    </div>
  )
}
