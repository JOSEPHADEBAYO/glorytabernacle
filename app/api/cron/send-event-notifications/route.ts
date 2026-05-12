import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEventNotification } from '@/lib/email/send-event-notification'

type PendingEventNotification = {
  id: string
  name: string
  email: string
  event: {
    id: string
    title: string
    description: string
    date: Date
    time: string | null
    location: string | null
    registrationHref: string | null
  }
}

/**
 * Window: how far in the future an event must start to be eligible for a
 * "starting soon" notification. We use 35 minutes so that a cron firing every
 * 5 minutes always catches an event roughly 30 minutes before it begins, even
 * if the cron is slightly delayed.
 *
 * Once a subscriber is notified, notifiedAt is set so they won't be re-notified
 * by subsequent cron runs.
 */
const NOTIFY_WINDOW_MS = 35 * 60 * 1000

/**
 * POST /api/cron/send-event-notifications
 *
 * Protected by Authorization: Bearer ${CRON_SECRET}.
 * Designed to be triggered by Vercel Cron (or any external cron) every ~5
 * minutes. Finds subscribers whose event begins within the next 35 minutes
 * and sends a reminder email. Per-recipient failures are caught so a single
 * bad address doesn't block other sends.
 *
 * Returns a JSON summary: { processed, sent, failed, errors? }.
 *
 * Vercel Cron sends GET by default; we accept both GET and POST so external
 * triggers (cron-job.org / EasyCron / GitHub Actions) work either way.
 */
async function handle(request: NextRequest) {
  // 1. Auth — require Bearer token matching CRON_SECRET.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET is not set; refusing to run cron.')
    return NextResponse.json(
      { error: 'Server misconfigured: CRON_SECRET missing' },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get('authorization') ?? ''
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Find pending notifications whose events are about to start.
  const now = new Date()
  const cutoff = new Date(now.getTime() + NOTIFY_WINDOW_MS)

  let pending: PendingEventNotification[]
  try {
    pending = await prisma.eventNotification.findMany({
      where: {
        notifiedAt: null,
        event: {
          published: true,
          date: {
            gte: now,
            lte: cutoff,
          },
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            time: true,
            location: true,
            registrationHref: true,
          },
        },
      },
    })
  } catch (err) {
    console.error('Cron: failed to load pending notifications:', err)
    return NextResponse.json(
      { error: 'Failed to load pending notifications' },
      { status: 500 }
    )
  }

  // 3. Send each email, marking notifiedAt on success. Per-recipient failures
  //    are isolated so a bad address doesn't block the rest.
  let sent = 0
  let failed = 0
  const errors: { id: string; email: string; reason: string }[] = []

  for (const subscription of pending) {
    const result = await sendEventNotification({
      to: subscription.email,
      recipientName: subscription.name,
      event: subscription.event,
    })

    if (result.ok) {
      try {
        await prisma.eventNotification.update({
          where: { id: subscription.id },
          data: { notifiedAt: new Date() },
        })
        sent++
      } catch (err) {
        // Email was sent, but we couldn't mark it — log loudly. Worst case the
        // subscriber gets a duplicate next run; better than losing the send.
        failed++
        errors.push({
          id: subscription.id,
          email: subscription.email,
          reason: `mark-sent failed: ${
            err instanceof Error ? err.message : 'unknown error'
          }`,
        })
      }
    } else {
      failed++
      errors.push({
        id: subscription.id,
        email: subscription.email,
        reason: result.detail,
      })
    }
  }

  return NextResponse.json(
    {
      processed: pending.length,
      sent,
      failed,
      ...(errors.length > 0 ? { errors } : {}),
    },
    { status: 200 }
  )
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
