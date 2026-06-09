/**
 * Confirmation email sent immediately after someone registers for the
 * inaugural service. Fire-and-forget from the POST route — failures are
 * logged but never block the form submit.
 *
 * Required env vars:
 *   - RESEND_API_KEY              Resend API key
 *   - NOTIFICATION_FROM_EMAIL     "From" address (verified Resend domain)
 *   - EMAIL_LOGO_URL              (optional) logo shown at the top
 *   - SITE_URL / NEXT_PUBLIC_SITE_URL / NEXTAUTH_URL   for the programme link
 */

import { Resend } from 'resend'
import {
  INAUGURAL_THEME,
  INAUGURAL_SERVICE_TIME,
  INAUGURAL_SERVICE_VENUE,
} from '@/lib/types/inaugural-registration'

export interface SendInauguralConfirmationArgs {
  to: string
  firstName: string
  lastName: string
  registrationId: string
  /** Date the service is being held — formatted via the date helper below. */
  eventDate: Date
}

export interface SendResult {
  ok: boolean
  detail: string
}

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  return new Resend(apiKey)
}

function getFromAddress(): string {
  return (
    process.env.NOTIFICATION_FROM_EMAIL ??
    'RCCG Glory Tabernacle, Barnstaple <onboarding@resend.dev>'
  )
}

function getLogoUrl(): string {
  return (
    process.env.EMAIL_LOGO_URL ??
    'https://res.cloudinary.com/deckwmsth/image/upload/v1778753747/yu.jpg_u3yacx.jpg'
  )
}

function getSiteUrl(): string {
  const url =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    'https://www.glorytabernacle.co.uk'
  return url.replace(/\/+$/, '')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatEventDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function buildSubject(args: SendInauguralConfirmationArgs): string {
  return `You're registered for the Inaugural Service — ${args.registrationId}`
}

function buildHtml(args: SendInauguralConfirmationArgs): string {
  const safeFirstName = escapeHtml(args.firstName)
  const fullName = escapeHtml(`${args.firstName} ${args.lastName}`)
  const safeRegistrationId = escapeHtml(args.registrationId)
  const logoUrl = getLogoUrl()
  const programmeUrl = `${getSiteUrl()}/inaugural-service/programme?id=${encodeURIComponent(args.registrationId)}`
  const dateLabel = escapeHtml(formatEventDate(args.eventDate))

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Inaugural Service Registration</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:32px 32px 16px 32px;background:rgba(0,6,102,1);">
                <img src="${escapeHtml(logoUrl)}" alt="RCCG Glory Tabernacle, Barnstaple" width="64" height="64" style="display:block;border-radius:12px;border:0;outline:none;text-decoration:none;" />
                <p style="margin:14px 0 4px 0;font-size:11px;font-weight:bold;letter-spacing:0.22em;color:rgba(163,246,156,1);text-transform:uppercase;">Inaugural Service</p>
                <p style="margin:0 0 6px 0;font-size:22px;font-weight:bold;color:#ffffff;font-family:Georgia,serif;">${escapeHtml(INAUGURAL_THEME.title)}</p>
                <p style="margin:0 0 14px 0;font-size:12px;color:rgba(163,246,156,1);letter-spacing:0.08em;">${escapeHtml(INAUGURAL_THEME.scripture)}</p>
                <p style="margin:0 0 24px 0;font-size:14px;color:#ffffff;">${dateLabel}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <p style="margin:0 0 8px 0;font-size:12px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgb(27,109,36);">You're in</p>
                <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.25;color:rgba(27,34,119,1);">Thank you, ${safeFirstName}!</h1>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:#555;">Hi ${fullName},</p>
                <p style="margin:0 0 24px 0;font-size:14px;line-height:1.7;color:#555;">
                  Your registration for the inaugural service at RCCG Glory Tabernacle, Barnstaple is confirmed. We can't wait to celebrate this brand-new beginning with you.
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px 0;background:#f4f7ff;border:1px solid #dde3f2;border-radius:8px;">
                  <tr>
                    <td style="padding:18px 22px;font-size:13px;line-height:1.6;color:#333;">
                      <p style="margin:0 0 4px 0;font-size:11px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgba(27,34,119,1);">Your registration ID</p>
                      <p style="margin:0;font-family:'Courier New',monospace;font-size:22px;font-weight:bold;letter-spacing:0.04em;color:rgba(27,34,119,1);">${safeRegistrationId}</p>
                      <p style="margin:10px 0 0 0;font-size:12px;color:#666;">Please save this email — you'll need this ID at the door so we can issue your printed badge.</p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px 0;border:1px solid #eee;border-radius:8px;">
                  <tr>
                    <td style="padding:16px 22px;font-size:13px;line-height:1.6;color:#1a1a1a;border-bottom:1px solid #eee;">
                      <strong style="color:rgba(27,34,119,1);">Starts:</strong> ${escapeHtml(INAUGURAL_SERVICE_TIME)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 22px;font-size:13px;line-height:1.6;color:#1a1a1a;border-bottom:1px solid #eee;">
                      <strong style="color:rgba(27,34,119,1);">Venue:</strong> ${escapeHtml(INAUGURAL_SERVICE_VENUE.name)}<br />
                      <span style="color:#666;">${escapeHtml(INAUGURAL_SERVICE_VENUE.address)}</span><br />
                      <a href="${escapeHtml(INAUGURAL_SERVICE_VENUE.directionsUrl)}" style="display:inline-block;margin-top:6px;color:rgb(27,109,36);text-decoration:none;font-weight:bold;font-size:12px;">Get directions →</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 22px;font-size:13px;line-height:1.6;color:#1a1a1a;">
                      <strong style="color:rgba(27,34,119,1);">Parking:</strong> ${escapeHtml(INAUGURAL_SERVICE_VENUE.parkingNotes)}
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 24px 0;"><a href="${escapeHtml(programmeUrl)}" style="display:inline-block;padding:12px 24px;background:rgba(27,109,36,1);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">View the programme</a></p>

                <p style="margin:0 0 8px 0;font-size:14px;line-height:1.7;color:#555;">In Christ,</p>
                <p style="margin:0 0 24px 0;font-size:14px;line-height:1.7;color:rgba(27,34,119,1);font-weight:bold;">RCCG Glory Tabernacle, Barnstaple</p>

                <p style="margin:0;font-size:12px;line-height:1.6;color:#999;border-top:1px solid #eee;padding-top:16px;">You're receiving this because you registered on our website for the Inaugural Service. If this wasn't you, please ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function buildText(args: SendInauguralConfirmationArgs): string {
  const lines: string[] = []
  lines.push(`Hi ${args.firstName} ${args.lastName},`)
  lines.push('')
  lines.push(
    "Your registration for the inaugural service at RCCG Glory Tabernacle, Barnstaple is confirmed."
  )
  lines.push('')
  lines.push(`Service date: ${formatEventDate(args.eventDate)}`)
  lines.push(`Starts: ${INAUGURAL_SERVICE_TIME}`)
  lines.push(`Venue: ${INAUGURAL_SERVICE_VENUE.name}, ${INAUGURAL_SERVICE_VENUE.address}`)
  lines.push(`Parking: ${INAUGURAL_SERVICE_VENUE.parkingNotes}`)
  lines.push(`Directions: ${INAUGURAL_SERVICE_VENUE.directionsUrl}`)
  lines.push('')
  lines.push(`Your registration ID: ${args.registrationId}`)
  lines.push("Please save this email — you'll need this ID at the door so we can issue your printed badge.")
  lines.push('')
  lines.push(
    `View the programme: ${getSiteUrl()}/inaugural-service/programme?id=${encodeURIComponent(args.registrationId)}`
  )
  lines.push('')
  lines.push('In Christ,')
  lines.push('RCCG Glory Tabernacle, Barnstaple')
  return lines.join('\n')
}

export async function sendInauguralConfirmation(
  args: SendInauguralConfirmationArgs
): Promise<SendResult> {
  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: args.to,
      subject: buildSubject(args),
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
