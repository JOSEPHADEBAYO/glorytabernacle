'use client'

import { useState } from 'react'

interface MountUpNotifyCardProps {
  subscriberCount: number
}

/**
 * Super Admin–only dashboard card that triggers a one-shot Web-Push reminder
 * to every Mount Up subscriber. Replaces the old daily Vercel cron that
 * blast-emailed all members at 11:45pm; this is now manual, opt-in, and
 * delivered as a browser push.
 *
 * The subscriber count is server-rendered (passed in via props). The send
 * action calls /api/admin/mountup/notify and shows the result inline.
 */
export function MountUpNotifyCard({ subscriberCount }: MountUpNotifyCardProps) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{
    sent: number
    failed: number
    pruned: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/mountup/notify', { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error ?? 'Could not send the reminder.')
      }
      setResult(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span aria-hidden="true" className="text-lg">🌅</span>
            <p
              className="text-sm font-semibold"
              style={{ color: 'rgba(27, 34, 119, 1)' }}
            >
              Mount Up Reminder
            </p>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            {subscriberCount} subscriber{subscriberCount === 1 ? '' : 's'}
          </p>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Send a one-off push notification to everyone who&apos;s opted in
            to Mount Up reminders from the public site. Use this just before
            the midnight prayer meeting; subscribers will be nudged in their
            browser.
          </p>
        </div>
        <button
          type="button"
          onClick={send}
          disabled={busy || subscriberCount === 0}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--church-green)' }}
        >
          {busy ? 'Sending…' : subscriberCount === 0 ? 'No subscribers yet' : 'Send reminder now'}
        </button>
      </div>

      {result && (
        <div
          role="status"
          className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          Sent to {result.sent} subscriber{result.sent === 1 ? '' : 's'}.
          {result.failed > 0 && ` ${result.failed} delivery failure${result.failed === 1 ? '' : 's'}.`}
          {result.pruned > 0 && ` ${result.pruned} stale subscription${result.pruned === 1 ? '' : 's'} pruned.`}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
    </div>
  )
}
