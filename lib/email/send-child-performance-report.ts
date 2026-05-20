/**
 * Builds and sends a child's "Children's Ministry performance report" to
 * their primary guardian. The report covers every check-in in a given date
 * range, showing the date and the teacher's performance note (or a
 * friendly placeholder when none has been recorded).
 *
 * Uses the existing enterprise email template via sendBroadcastEmail, so
 * the styling matches every other transactional email the platform sends.
 */

import { sendBroadcastEmail } from '@/lib/email/send-broadcast-email'

export interface ReportCheckIn {
  signedInAt: Date
  signedOutAt: Date | null
  performance: string | null
}

export interface ChildReportInput {
  childFirstName: string
  childLastName: string
  guardianName: string
  guardianEmail: string
  fromDate: Date
  toDate: Date
  checkIns: ReportCheckIn[]
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatRange(from: Date, to: Date): string {
  const sameMonth =
    from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()
  if (sameMonth) {
    return from.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }
  return `${from.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – ${to.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

export function buildReportBody(input: ChildReportInput): {
  subject: string
  body: string
} {
  const childName = `${input.childFirstName} ${input.childLastName}`.trim()
  const rangeLabel = formatRange(input.fromDate, input.toDate)
  const subject = `${childName}'s Children's Ministry report — ${rangeLabel}`

  // Plain-text body (sendBroadcastEmail wraps each paragraph in the
  // enterprise HTML template; newlines become <br />, blank lines become
  // paragraph breaks).
  const intro = [
    `Below is ${input.childFirstName}'s report for ${rangeLabel}.`,
    '',
  ]

  let entries: string[]
  console.log("*888888888", input.checkIns, input)
  if (input.checkIns.length === 0) {
    entries = [
      `${input.childFirstName} was not signed in during this period. If you think this is a mistake, please reply to this email and we'll look into it.`,
    ]
  } else {
    entries = input.checkIns.map((c) => {
      const date = formatDate(c.signedInAt)
      const note = c.performance?.trim()
        ? c.performance.trim()
        : 'Notes have not yet been recorded for this session.'
      return `${date}\n${note}`
    })
  }

  const closing = [
    '',
    `We're thankful for the opportunity to walk alongside ${input.childFirstName} each Sunday. If there's anything you'd like us to know — a prayer request, an update, or something we should be aware of — just reply to this email.`,
    '',
    'In Christ,',
    "RCCG Glory Tabernacle Children's Ministry",
  ]

  const body = [...intro, ...entries, ...closing].join('\n\n')

  return { subject, body }
}

export interface SendReportOptions {
  fromDate: Date
  toDate: Date
  /** Optional CTA. Useful for "View on website" later. */
  ctaLabel?: string
  ctaHref?: string
}

/**
 * Send the report for a single child. Returns { ok: true } on success,
 * { ok: false, reason } when the guardian has no email or the send fails.
 */
export async function sendChildPerformanceReport(
  child: Omit<ChildReportInput, 'fromDate' | 'toDate'>,
  options: SendReportOptions
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!child.guardianEmail) {
    return { ok: false, reason: 'No primary-guardian email on file.' }
  }

  const { subject, body } = buildReportBody({
    ...child,
    fromDate: options.fromDate,
    toDate: options.toDate,
  })

  const result = await sendBroadcastEmail({
    subject,
    body,
    ctaLabel: options.ctaLabel,
    ctaHref: options.ctaHref,
    recipients: [{ name: child.guardianName, email: child.guardianEmail }],
  })

  if (result.sent === 1) return { ok: true }
  return {
    ok: false,
    reason: result.errors[0]?.reason ?? 'Email send failed.',
  }
}
