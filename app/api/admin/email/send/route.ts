import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { sendBroadcastEmail } from '@/lib/email/send-broadcast-email'

/**
 * Roles allowed to use the generic admin email-send endpoint.
 */
const EMAIL_SEND_ADMIN_ROLES = ['SUPER_ADMIN', 'CONTENT_EDITOR'] as const

function isAdmin(role: string | undefined): boolean {
  return (EMAIL_SEND_ADMIN_ROLES as readonly string[]).includes(role ?? '')
}

const recipientSchema = z.object({
  name: z.string().trim().min(1, 'Recipient name is required').max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Recipient email must be valid')
    .max(254),
})

/**
 * Body schema. Mirrors program-interest send shape but takes ad-hoc
 * recipients in `to` rather than reading them from a database table —
 * lets any dashboard (members / new-members / volunteers / etc.) send
 * the same enterprise-styled email without a per-feature send endpoint.
 */
const sendEmailSchema = z
  .object({
    to: z.array(recipientSchema).min(1, 'At least one recipient is required').max(100),
    subject: z.string().trim().min(1, 'Subject is required').max(200),
    body: z.string().trim().min(1, 'Email body is required').max(20000),
    ctaLabel: z.string().trim().max(60).optional().or(z.literal('')),
    ctaHref: z
      .string()
      .url('CTA URL must be a valid link')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      const hasLabel = Boolean(data.ctaLabel && data.ctaLabel.trim())
      const hasHref = Boolean(data.ctaHref && data.ctaHref.trim())
      return hasLabel === hasHref
    },
    {
      message: 'CTA label and URL must be filled in together',
      path: ['ctaHref'],
    }
  )

/**
 * POST /api/admin/email/send
 *
 * Sends a one-off admin email to the supplied recipients using the
 * enterprise broadcast template. Returns { sent, failed, errors[] } so the
 * client can show per-recipient outcomes in a toast.
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
    const validation = sendEmailSchema.safeParse(body)

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
      to,
      subject,
      body: emailBody,
      ctaLabel,
      ctaHref,
    } = validation.data

    const trimmedLabel = ctaLabel?.trim() ?? ''
    const trimmedHref = ctaHref?.trim() ?? ''

    const result = await sendBroadcastEmail({
      subject,
      body: emailBody,
      ctaLabel: trimmedLabel.length > 0 ? trimmedLabel : undefined,
      ctaHref: trimmedHref.length > 0 ? trimmedHref : undefined,
      recipients: to,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error sending admin email:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
