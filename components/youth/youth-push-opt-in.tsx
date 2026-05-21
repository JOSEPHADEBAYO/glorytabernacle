'use client'

import { useEffect, useState } from 'react'

/**
 * "Turn on reminders" control on the youth portal. Registers the push
 * service worker, requests notification permission, subscribes via the
 * PushManager, and persists the subscription server-side so leaders can
 * send "please sign out" reminders.
 */
export function YouthPushOptIn({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [supported, setSupported] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      setSupported(false)
      return
    }
    // Reflect current subscription state.
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {})
  }, [])

  async function enable() {
    setBusy(true)
    setMessage(null)
    try {
      if (!vapidPublicKey) {
        throw new Error('Reminders are not configured yet. Please check back later.')
      }
      const reg = await navigator.serviceWorker.register('/push-sw.js')
      await navigator.serviceWorker.ready

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notifications were blocked. You can enable them in your browser settings.')
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      const res = await fetch('/api/youth/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Could not save your reminder settings.')
      }
      setSubscribed(true)
      setMessage('Reminders are on. We’ll nudge you to sign out after a programme.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    setMessage(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/youth/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setSubscribed(false)
      setMessage('Reminders turned off.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  if (!supported) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
        Reminders aren&apos;t supported on this browser. On iPhone, add this
        site to your Home Screen first, then open it from there to enable
        reminders.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">Sign-out reminders</p>
          <p className="text-xs text-gray-500">
            Get a notification reminding you to sign out after a programme.
          </p>
        </div>
        {subscribed ? (
          <button
            type="button"
            onClick={disable}
            disabled={busy}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? '…' : 'Turn off'}
          </button>
        ) : (
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--church-green)' }}
          >
            {busy ? 'Enabling…' : 'Turn on reminders'}
          </button>
        )}
      </div>
      {message && <p className="mt-2 text-xs text-gray-600">{message}</p>}
    </div>
  )
}

/**
 * Convert a base64url VAPID public key to the Uint8Array the PushManager
 * subscribe call requires.
 *
 * The view is built from an explicit ArrayBuffer so it infers
 * `Uint8Array<ArrayBuffer>` — TS 5.7+ otherwise widens `new Uint8Array(len)`
 * to `Uint8Array<ArrayBufferLike>`, which isn't assignable to the
 * `applicationServerKey: BufferSource` parameter.
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
  return view
}
