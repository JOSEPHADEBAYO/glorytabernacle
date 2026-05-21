import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  sendErasureDigest,
  type ErasureDigestItem,
} from '@/lib/email/send-erasure-digest'
import { ERASURE_ADMIN_ROLES } from '@/lib/types/erasure'

/**
 * Requests older than this many days are flagged "overdue" in the digest. UK
 * GDPR requires a response within one month, so 21 days leaves roughly a week
 * of runway to act before the deadline.
 */
const OVERDUE_DAYS = 21

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * GET/POST /api/cron/erasure-reminders
 *
 * Protected by Authorization: Bearer ${CRON_SECRET}. Intended to run weekly
 * (see vercel.json). Emails every Children Leader + Super Admin a digest of
 * the pending right-to-erasure queue, flagging any request older than
 * OVERDUE_DAYS. No-ops (sends nothing) when the queue is empty.
 *
 * Returns { pending, overdue, recipients, sent, failed, errors? }.
 */
async function handle(request: NextRequest) {
  // 1. Auth.
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

  // 2. Load the pending queue (oldest first).
  let pending: { childName: string; guardianName: string; guardianEmail: string; createdAt: Date }[]
  try {
    pending = await prisma.erasureRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: {
        childName: true,
        guardianName: true,
        guardianEmail: true,
        createdAt: true,
      },
    })
  } catch (err) {
    console.error('Cron: failed to load pending erasure requests:', err)
    return NextResponse.json(
      { error: 'Failed to load pending requests' },
      { status: 500 }
    )
  }

  // Nothing pending → nothing to send.
  if (pending.length === 0) {
    return NextResponse.json(
      { pending: 0, overdue: 0, recipients: 0, sent: 0, failed: 0 },
      { status: 200 }
    )
  }

  const now = Date.now()
  const items: ErasureDigestItem[] = pending.map((r) => {
    const ageDays = Math.floor((now - r.createdAt.getTime()) / MS_PER_DAY)
    return {
      childName: r.childName,
      guardianName: r.guardianName,
      guardianEmail: r.guardianEmail,
      createdAt: r.createdAt,
      ageDays,
      overdue: ageDays >= OVERDUE_DAYS,
    }
  })
  const overdueCount = items.filter((i) => i.overdue).length

  // 3. Recipients: active Children Leaders + Super Admins with an email.
  let recipients: { name: string; email: string }[]
  try {
    recipients = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: [...ERASURE_ADMIN_ROLES] },
      },
      select: { name: true, email: true },
    })
  } catch (err) {
    console.error('Cron: failed to load erasure recipients:', err)
    return NextResponse.json(
      { error: 'Failed to load recipients' },
      { status: 500 }
    )
  }

  if (recipients.length === 0) {
    console.warn(
      'Erasure reminder: pending requests exist but no CHILDREN_LEADER / SUPER_ADMIN to notify.'
    )
    return NextResponse.json(
      { pending: items.length, overdue: overdueCount, recipients: 0, sent: 0, failed: 0 },
      { status: 200 }
    )
  }

  // 4. Send. Per-recipient failures are isolated.
  let sent = 0
  let failed = 0
  const errors: { email: string; reason: string }[] = []

  for (const r of recipients) {
    const result = await sendErasureDigest({
      to: r.email,
      recipientName: r.name,
      items,
      overdueCount,
    })
    if (result.ok) sent++
    else {
      failed++
      errors.push({ email: r.email, reason: result.detail })
    }
  }

  return NextResponse.json(
    {
      pending: items.length,
      overdue: overdueCount,
      recipients: recipients.length,
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
