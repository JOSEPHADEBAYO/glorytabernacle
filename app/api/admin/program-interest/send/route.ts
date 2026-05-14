import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { sendProgramEmailSchema } from '@/lib/validation/program-interest'
import {
  PROGRAM_INTEREST_ADMIN_ROLES,
  type ProgramInterestAdminRole,
} from '@/lib/types/program-interest'
import { sendBroadcastEmail } from '@/lib/email/send-broadcast-email'

function isAdmin(role: string | undefined): role is ProgramInterestAdminRole {
  return PROGRAM_INTEREST_ADMIN_ROLES.includes(role as ProgramInterestAdminRole)
}

/**
 * POST /api/admin/program-interest/send
 *
 * Body: { subject, body, recipientIds? }
 *
 * - recipientIds omitted or empty → email every subscriber.
 * - recipientIds set            → email only those rows.
 *
 * Returns { sent, failed, errors[] }. Per-recipient failures don't block
 * the rest; admins see which addresses bounced in the response.
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = sendProgramEmailSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((e) => e.message),
        },
        { status: 400 }
      )
    }

    const {
      subject,
      body: emailBody,
      ctaLabel,
      ctaHref,
      recipientIds,
    } = validation.data
    const sendAll = !recipientIds || recipientIds.length === 0

    const recipients = await prisma.programInterest.findMany({
      where: sendAll ? {} : { id: { in: recipientIds } },
      select: { id: true, name: true, email: true },
    })

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients matched the request' },
        { status: 400 }
      )
    }

    const trimmedLabel = ctaLabel?.trim() ?? ''
    const trimmedHref = ctaHref?.trim() ?? ''

    const result = await sendBroadcastEmail({
      subject,
      body: emailBody,
      ctaLabel: trimmedLabel.length > 0 ? trimmedLabel : undefined,
      ctaHref: trimmedHref.length > 0 ? trimmedHref : undefined,
      recipients: recipients.map((r) => ({ name: r.name, email: r.email })),
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error sending program-interest email:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
