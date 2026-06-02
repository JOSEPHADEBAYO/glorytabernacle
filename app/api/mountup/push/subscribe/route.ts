import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/mountup/push/subscribe
 *
 * Stores an anonymous Web-Push subscription for the daily Mount Up prayer
 * reminder. Anyone on the public site can subscribe from the
 * `MountUpPushOptIn` widget — no authentication required.
 *
 * The browser PushManager.subscribe() result is forwarded directly; we
 * persist endpoint + p256dh + auth so the admin send button can later push
 * to every subscriber via lib/push.ts → sendPushToTopic('MOUNT_UP', …).
 *
 * Idempotent on endpoint: if the same subscription is sent twice (e.g. the
 * user re-enables in another tab), we just update the timestamp instead of
 * raising a unique-constraint error.
 */
const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

export async function POST(request: NextRequest) {
  let parsed
  try {
    const body = await request.json()
    parsed = subscribeSchema.safeParse(body)
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => i.message),
      },
      { status: 400 }
    )
  }

  const { endpoint, keys } = parsed.data
  const userAgent = request.headers.get('user-agent') ?? null

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        topic: 'MOUNT_UP',
        // Anonymous — no userId.
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        topic: 'MOUNT_UP',
      },
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('Mount Up subscribe error:', err)
    return NextResponse.json(
      { error: 'Could not save your reminder settings.' },
      { status: 500 }
    )
  }
}
