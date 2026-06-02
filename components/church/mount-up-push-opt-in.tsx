'use client'

import { useEffect, useState } from 'react'

/**
 * "Get reminders" pill for the daily Mount Up prayer meeting (12:00am UK).
 * Registers the push service worker, requests notification permission,
 * subscribes via the PushManager, and persists the subscription so Super
 * Admin can later trigger a push to every Mount Up subscriber from the
 * dashboard.
 *
 * Anonymous — no login required. Anyone on the public site can opt in.
 * Mirrors the YouthPushOptIn pattern but hits the public
 * /api/mountup/push/* endpoints and is visually tuned for the
 * "Daily / Mount up" highlight in service-days-section.tsx.
 */
export function MountUpPushOptIn({ vapidPublicKey }: { vapidPublicKey: string }) {
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

      const res = await fetch('/api/mountup/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Could not save your reminder settings.')
      }
      setSubscribed(true)
      setMessage("Mount Up reminders are on. We'll nudge you each midnight before prayer.")
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
        await fetch('/api/mountup/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setSubscribed(false)
      setMessage('Mount Up reminders turned off.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  if (!supported) {
    return (
      <p className="mt-3 text-xs leading-relaxed text-[#1B2347]/70">
        Reminders aren&apos;t supported on this browser. On iPhone, add this
        site to your Home Screen first, then open it from there to enable
        them.
      </p>
    )
  }

  return (
    <div className="mt-3">
      {subscribed ? (
        <button
          type="button"
          onClick={disable}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full border border-[#1B2347]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#1B2347] hover:bg-[#1B2347]/5 disabled:opacity-50"
        >
          <span aria-hidden="true">🔔</span>
          {busy ? 'Updating…' : 'Reminders on — turn off'}
        </button>
      ) : (
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--church-green)' }}
        >
          <span aria-hidden="true">🔔</span>
          {busy ? 'Enabling…' : 'Get Mount Up reminders'}
        </button>
      )}
      {message && (
        <p className="mt-2 text-xs leading-relaxed text-[#1B2347]/70">{message}</p>
      )}
    </div>
  )
}

/**
 * Convert a base64url VAPID public key to the Uint8Array the PushManager
 * subscribe call requires. Same helper used by YouthPushOptIn — kept inline
 * here so this component is self-contained and easy to drop anywhere on the
 * public site.
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
