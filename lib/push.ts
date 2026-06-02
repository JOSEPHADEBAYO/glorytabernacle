/**
 * Web-Push helper. Sends browser push notifications to youth members who
 * have opted in, and prunes dead subscriptions.
 *
 * Requires the `web-push` package (`npm install web-push`) and these env
 * vars (generate the keys once with `npx web-push generate-vapid-keys`):
 *   - VAPID_PUBLIC_KEY
 *   - VAPID_PRIVATE_KEY
 *   - VAPID_SUBJECT              e.g. "mailto:admin@glorytabernacle.co.uk"
 *   - NEXT_PUBLIC_VAPID_PUBLIC_KEY  (same value as VAPID_PUBLIC_KEY; the
 *                                    client needs it to subscribe)
 */

import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

/** Roles permitted to trigger youth push reminders. */
export const YOUTH_NOTIFY_ROLES = ['SUPER_ADMIN', 'YOUTH_LEADER'] as const
export type YouthNotifyRole = (typeof YOUTH_NOTIFY_ROLES)[number]

export function canNotifyYouth(role: string | undefined): boolean {
  return YOUTH_NOTIFY_ROLES.includes(role as YouthNotifyRole)
}

/** Roles permitted to trigger the Mount Up daily prayer push reminder. */
export const MOUNT_UP_NOTIFY_ROLES = ['SUPER_ADMIN'] as const
export type MountUpNotifyRole = (typeof MOUNT_UP_NOTIFY_ROLES)[number]

export function canNotifyMountUp(role: string | undefined): boolean {
  return MOUNT_UP_NOTIFY_ROLES.includes(role as MountUpNotifyRole)
}

/** Push topic mirrors the PushTopic enum in prisma/schema.prisma. */
export type PushTopic = 'YOUTH_CHECKOUT' | 'MOUNT_UP'

const DEFAULT_VAPID_SUBJECT = 'mailto:admin@glorytabernacle.co.uk'

/**
 * The VAPID "subject" must be a `mailto:` address or an `https://` URL (it's
 * a contact URI from the VAPID spec — NOT the notification title). If the
 * configured value is missing or malformed, fall back to a safe default and
 * warn, rather than letting web-push throw and break the send.
 */
function normaliseVapidSubject(raw: string | undefined): string {
  const value = raw?.trim()
  if (value && (value.startsWith('mailto:') || value.startsWith('https://'))) {
    return value
  }
  if (value) {
    console.warn(
      `Invalid VAPID_SUBJECT "${value}" — it must be a mailto: address or https:// URL. ` +
        `Falling back to ${DEFAULT_VAPID_SUBJECT}.`
    )
  }
  return DEFAULT_VAPID_SUBJECT
}

let configured = false
function ensureConfigured(): boolean {
  if (configured) return true
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = normaliseVapidSubject(process.env.VAPID_SUBJECT)
  if (!publicKey || !privateKey) {
    console.error('Web push not configured: VAPID keys missing.')
    return false
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  /** Where the notification click should land. */
  url?: string
}

/**
 * Send a payload to every push subscription belonging to the given users.
 * Dead subscriptions (404/410) are deleted. Returns aggregate counts.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; pruned: number }> {
  if (userIds.length === 0) return { sent: 0, failed: 0, pruned: 0 }
  if (!ensureConfigured()) {
    throw new Error('Web push is not configured (VAPID keys missing).')
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  })

  const data = JSON.stringify(payload)
  let sent = 0
  let failed = 0
  const deadIds: string[] = []

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          data
        )
        sent++
      } catch (err: unknown) {
        const statusCode =
          typeof err === 'object' && err !== null && 'statusCode' in err
            ? (err as { statusCode?: number }).statusCode
            : undefined
        // 404/410 = subscription gone; prune it. Other errors = transient.
        if (statusCode === 404 || statusCode === 410) {
          deadIds.push(sub.id)
        } else {
          failed++
        }
      }
    })
  )

  if (deadIds.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: deadIds } } })
  }

  return { sent, failed, pruned: deadIds.length }
}

/**
 * Send a payload to every push subscription with the given topic, regardless
 * of whether the subscription is tied to a user (Mount Up subscriptions are
 * anonymous — no `userId`). Dead subscriptions (404/410) are pruned, same as
 * sendPushToUsers. Returns aggregate counts.
 */
export async function sendPushToTopic(
  topic: PushTopic,
  payload: PushPayload
): Promise<{ sent: number; failed: number; pruned: number }> {
  if (!ensureConfigured()) {
    throw new Error('Web push is not configured (VAPID keys missing).')
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { topic },
  })

  if (subs.length === 0) return { sent: 0, failed: 0, pruned: 0 }

  const data = JSON.stringify(payload)
  let sent = 0
  let failed = 0
  const deadIds: string[] = []

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          data
        )
        sent++
      } catch (err: unknown) {
        const statusCode =
          typeof err === 'object' && err !== null && 'statusCode' in err
            ? (err as { statusCode?: number }).statusCode
            : undefined
        if (statusCode === 404 || statusCode === 410) {
          deadIds.push(sub.id)
        } else {
          failed++
        }
      }
    })
  )

  if (deadIds.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: deadIds } } })
  }

  return { sent, failed, pruned: deadIds.length }
}
