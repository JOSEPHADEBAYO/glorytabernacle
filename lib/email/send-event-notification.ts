/**
 * Email helper for sending event notification reminders via Resend.
 *
 * Used by the /api/cron/send-event-notifications cron handler.
 *
 * Required environment variables:
 *   - RESEND_API_KEY              — your Resend API key
 *   - NOTIFICATION_FROM_EMAIL     — From address (must be on a verified domain
 *                                   in Resend, e.g. "RCCG Glory Tabernacle
 *                                   <notifications@gloryt.org>")
 */

import { Resend } from 'resend'

interface SendEventNotificationArgs {
  to: string
  recipientName: string
  event: {
    title: string
    description: string
    date: Date
    time: string | null
    location: string | null
    registrationHref: string | null
  }
}

interface SendResult {
  ok: boolean
  /** Provider message id when ok, error message when not. */
  detail: string
}

/** Lazily-instantiated Resend client so module load doesn't fail without the key. */
function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set')
  }
  return new Resend(apiKey)
}

function getFromAddress(): string {
  const from = process.env.NOTIFICATION_FROM_EMAIL
  if (!from) {
    // Reasonable default for development. Resend requires the sender to be on
    // a verified domain in production; the user is expected to set this env
    // var before going live.
    return 'RCCG Glory Tabernacle <onboarding@resend.dev>'
  }
  return from
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Escape user-supplied text before interpolating into the HTML body to prevent
 * HTML injection (e.g. event titles containing `<` or `&`).
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildSubject(event: SendEventNotificationArgs['event']): string {
  return `Reminder: ${event.title} starts soon`
}

function buildHtml({ recipientName, event }: SendEventNotificationArgs): string {
  const safeName = escapeHtml(recipientName)
  const safeTitle = escapeHtml(event.title)
  const safeDescription = escapeHtml(event.description)
  const safeDate = escapeHtml(formatLongDate(event.date))
  const safeTime = event.time ? escapeHtml(event.time) : null
  const safeLocation = event.location ? escapeHtml(event.location) : null
  const registerUrl = event.registrationHref ?? null

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 16px 32px;">
                <p style="margin:0 0 8px 0;font-size:12px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgb(27,109,36);">Starting Soon</p>
                <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.25;color:rgba(27,34,119,1);">${safeTitle}</h1>
                <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#555;">Hi ${safeName},</p>
                <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#555;">This is your friendly reminder that <strong>${safeTitle}</strong> begins shortly.</p>

                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px 0;background:#f9f9f9;border-radius:8px;">
                  <tr>
                    <td style="padding:16px 20px;font-size:13px;line-height:1.6;color:#333;">
                      <strong style="color:rgba(27,34,119,1);">Date:</strong> ${safeDate}<br />
                      ${safeTime ? `<strong style="color:rgba(27,34,119,1);">Time:</strong> ${safeTime}<br />` : ''}
                      ${safeLocation ? `<strong style="color:rgba(27,34,119,1);">Location:</strong> ${safeLocation}` : ''}
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#555;">${safeDescription}</p>

                ${
                  registerUrl
                    ? `<p style="margin:0 0 24px 0;"><a href="${escapeHtml(registerUrl)}" style="display:inline-block;padding:12px 24px;background:rgba(27,34,119,1);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">Register / Join</a></p>`
                    : ''
                }

                <p style="margin:0;font-size:12px;line-height:1.6;color:#999;">You're receiving this because you signed up for reminders on RCCG Glory Tabernacle's website.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function buildText({ recipientName, event }: SendEventNotificationArgs): string {
  const lines: string[] = []
  lines.push(`Hi ${recipientName},`)
  lines.push('')
  lines.push(`This is your reminder that "${event.title}" begins shortly.`)
  lines.push('')
  lines.push(`Date: ${formatLongDate(event.date)}`)
  if (event.time) lines.push(`Time: ${event.time}`)
  if (event.location) lines.push(`Location: ${event.location}`)
  lines.push('')
  lines.push(event.description)
  if (event.registrationHref) {
    lines.push('')
    lines.push(`Register / Join: ${event.registrationHref}`)
  }
  lines.push('')
  lines.push("You're receiving this because you signed up for reminders on RCCG Glory Tabernacle's website.")
  return lines.join('\n')
}

/**
 * Send an event-notification email via Resend.
 * Returns a { ok, detail } result rather than throwing so the cron can
 * isolate per-recipient failures and continue processing other subscribers.
 */
export async function sendEventNotification(
  args: SendEventNotificationArgs
): Promise<SendResult> {
  try {
    const resend = getResend()

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: args.to,
      subject: buildSubject(args.event),
      html: buildHtml(args),
      text: buildText(args),
    })

    if (error) {
      return { ok: false, detail: error.message ?? 'Unknown Resend error' }
    }
    return { ok: true, detail: data?.id ?? '(no id returned)' }
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
