import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  sendBirthdayDigest,
  type BirthdayPerson,
} from '@/lib/email/send-birthday-digest'

/**
 * GET/POST /api/cron/birthday-digest
 *
 * Daily admin digest of every GroupMember whose birthDay/birthMonth matches
 * today (UTC). Intended to run once a day from Railway — early morning UK
 * time is a reasonable schedule (e.g. `0 6 * * *`).
 *
 * Recipient resolution:
 *   1. ADMIN_NOTIFICATION_EMAIL env var, if set — single recipient.
 *   2. Otherwise every active SUPER_ADMIN user — fan-out, isolated per
 *      recipient so one bad address doesn't block the others.
 *
 * No-ops (200, sent=0) on days with no birthdays — admins never get an
 * empty digest. Protected by `Authorization: Bearer ${CRON_SECRET}`.
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

  // 2. Figure out "today" (UTC). The day/month are integers stored on the
  //    GroupMember row, so we just match them.
  const now = new Date()
  const day = now.getUTCDate()
  const month = now.getUTCMonth() + 1 // getUTCMonth is 0-based; the column is 1-based.

  // 3. Find birthday members.
  let members: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    group: { title: string }
  }[]
  try {
    members = await prisma.groupMember.findMany({
      where: { birthDay: day, birthMonth: month },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        group: { select: { title: true } },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })
  } catch (err) {
    console.error('Cron: failed to load birthday members:', err)
    return NextResponse.json(
      { error: 'Failed to load members' },
      { status: 500 }
    )
  }

  if (members.length === 0) {
    return NextResponse.json(
      { day, month, birthdays: 0, recipients: 0, sent: 0, failed: 0 },
      { status: 200 }
    )
  }

  const people: BirthdayPerson[] = members.map((m) => ({
    name: `${m.firstName} ${m.lastName}`.trim(),
    email: m.email,
    phoneNumber: m.phoneNumber,
    groupTitle: m.group.title,
  }))

  // 4. Decide who receives the digest.
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim()
  let recipients: { name: string | null; email: string }[]
  if (adminEmail) {
    recipients = [{ name: null, email: adminEmail }]
  } else {
    try {
      const supers = await prisma.user.findMany({
        where: { isActive: true, role: 'SUPER_ADMIN' },
        select: { name: true, email: true },
      })
      recipients = supers.map((s) => ({ name: s.name, email: s.email }))
    } catch (err) {
      console.error('Cron: failed to load Super Admin recipients:', err)
      return NextResponse.json(
        { error: 'Failed to load recipients' },
        { status: 500 }
      )
    }
  }

  if (recipients.length === 0) {
    console.warn(
      'Birthday digest: birthdays exist but no admin recipient is configured ' +
        '(ADMIN_NOTIFICATION_EMAIL unset and no active SUPER_ADMIN users).'
    )
    return NextResponse.json(
      {
        day,
        month,
        birthdays: people.length,
        recipients: 0,
        sent: 0,
        failed: 0,
      },
      { status: 200 }
    )
  }

  // 5. Send. Per-recipient failures don't block the others.
  let sent = 0
  let failed = 0
  const errors: { email: string; reason: string }[] = []
  for (const r of recipients) {
    const result = await sendBirthdayDigest({
      to: r.email,
      recipientName: r.name,
      people,
    })
    if (result.ok) sent++
    else {
      failed++
      errors.push({ email: r.email, reason: result.detail })
    }
  }

  return NextResponse.json(
    {
      day,
      month,
      birthdays: people.length,
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
