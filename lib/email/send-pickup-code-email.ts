/**
 * Pickup-code email — sent to a child's primary guardian when the child is
 * signed in to the children's ministry. The guardian must present this
 * code at pickup before the Children Leader can sign the child out.
 *
 * Re-uses the existing enterprise template via sendBroadcastEmail so the
 * styling stays consistent with every other transactional email.
 */

import { sendBroadcastEmail } from '@/lib/email/send-broadcast-email'

interface SendPickupCodeInput {
  childFirstName: string
  childLastName: string
  guardianName: string
  guardianEmail: string
  code: string
  /** When the child was signed in. Used in the body so the guardian can
   *  see a fresh send vs. an older one. */
  signedInAt: Date
}

function formatTime(d: Date): string {
  return d.toLocaleString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Send the code. Returns { ok: true } on success or { ok: false, reason }
 * if Resend rejected the message or the guardian has no email on file.
 */
export async function sendPickupCodeEmail(
  input: SendPickupCodeInput
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!input.guardianEmail) {
    return { ok: false, reason: 'No primary-guardian email on file.' }
  }

  const childName = `${input.childFirstName} ${input.childLastName}`.trim()
  const when = formatTime(input.signedInAt)

  const subject = `Pickup code for ${childName} — Children's Ministry`
  const body = [
    `${input.childFirstName} was signed in to RCCG Glory Tabernacle, Barnstaple Children's Ministry on ${when}.`,
    '',
    `Your pickup code is:`,
    '',
    `    ${input.code}`,
    '',
    `Please show this code to the children's leader when you come to collect ${input.childFirstName}. They cannot release ${input.childFirstName} without it.`,
    '',
    `If you didn't drop ${input.childFirstName} off or you didn't expect this email, reply right away and we'll look into it.`,
    // Sign-off is owned by the broadcast template (Lead Pastors block) so
    // recipients never see two signatures stacked. Don't add one here.
  ].join('\n')

  const result = await sendBroadcastEmail({
    subject,
    body,
    recipients: [{ name: input.guardianName, email: input.guardianEmail }],
  })

  if (result.sent === 1) return { ok: true }
  return {
    ok: false,
    reason: result.errors[0]?.reason ?? 'Email send failed.',
  }
}
