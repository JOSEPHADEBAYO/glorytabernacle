import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMountUpReminder } from '@/lib/email/send-mount-up-reminder'

/**
 * POST /api/cron/send-mount-up-reminder
 *
 * Sends a "Mount Up" prayer reminder email to all members and attendees.
 * Triggered by Vercel Cron at 11:45pm daily.
 *
 * Gets unique emails from:
 *   - MembershipApplication (members)
 *   - AdultAttendance (attendance records)
 *
 * Protected by Authorization: Bearer ${CRON_SECRET}.
 */
async function handle(request: NextRequest) {
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

  // Gather unique emails from members and attendance
  let memberRows: { email: string; firstName: string; lastName: string }[]
  let attendeeRows: { email: string; name: string }[]

  try {
    const result = await Promise.all([
      prisma.membershipApplication.findMany({
        where: { email: { not: '' } },
        select: { email: true, firstName: true, lastName: true },
      }),
      prisma.adultAttendance.findMany({
        where: { email: { not: '' } },
        select: { email: true, name: true },
        distinct: ['email'],
      }),
    ])
    memberRows = result[0]
    attendeeRows = result[1]
  } catch (err) {
    console.error('Cron: failed to load recipients:', err)
    return NextResponse.json(
      { error: 'Failed to load recipients' },
      { status: 500 }
    )
  }

  // Merge by email — prefer member name if they exist in both
  const recipientMap = new Map<string, string>()

  for (const m of memberRows) {
    recipientMap.set(m.email.toLowerCase(), `${m.firstName} ${m.lastName}`)
  }
  for (const a of attendeeRows) {
    const key = a.email.toLowerCase()
    if (!recipientMap.has(key)) {
      recipientMap.set(key, a.name)
    }
  }

  const recipients = Array.from(recipientMap.entries())
    .filter(([email]) => email.includes('@'))
    .map(([email, name]) => ({ email, name }))

  let sent = 0
  let failed = 0
  const errors: { email: string; reason: string }[] = []

  for (const recipient of recipients) {
    const result = await sendMountUpReminder(recipient.email, recipient.name)

    if (result.ok) {
      sent++
    } else {
      failed++
      errors.push({ email: recipient.email, reason: result.detail })
    }
  }

  return NextResponse.json(
    {
      total: recipients.length,
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
