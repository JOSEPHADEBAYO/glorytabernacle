/**
 * Confirmation email sent to anyone who submits the public volunteer
 * interest form at /volunteer-interest. Fire-and-forget — the POST route
 * doesn't await this, so a transient Resend failure can't block the form.
 *
 * Required env vars:
 *   - RESEND_API_KEY              Resend API key
 *   - NOTIFICATION_FROM_EMAIL     "From" address (verified Resend domain)
 *   - EMAIL_LOGO_URL              (optional) logo shown at the top
 */

import { Resend } from 'resend'

export interface SendVolunteerConfirmationArgs {
  to: string
  name: string
  /** Group/ministry titles the volunteer ticked as their areas of strength. */
  areaStrengthTitles: string[]
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function firstNameOf(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0]
  return first || fullName.trim()
}

function buildSubject(name: string): string {
  return `Thank you for stepping forward, ${firstNameOf(name)} — RCCG Glory Tabernacle`
}

function buildHtml(args: SendVolunteerConfirmationArgs): string {
  const safeName = escapeHtml(args.name)
  const firstName = escapeHtml(firstNameOf(args.name))
  const logoUrl = getLogoUrl()

  const strengthsList =
    args.areaStrengthTitles.length === 0
      ? ''
      : `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px 0;background:#f9f9f9;border-radius:8px;">
           <tr>
             <td style="padding:16px 20px;font-size:13px;line-height:1.8;color:#333;">
               <p style="margin:0 0 8px 0;font-size:12px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;color:rgb(27,109,36);">Your areas of strength</p>
               ${args.areaStrengthTitles
                 .map(
                   (t) =>
                     `<div style="display:inline-block;margin:2px 6px 2px 0;padding:4px 12px;border-radius:999px;background:#ffffff;border:1px solid #d4dbe6;color:rgba(27,34,119,1);font-weight:600;">${escapeHtml(t)}</div>`
                 )
                 .join('')}
             </td>
           </tr>
         </table>`

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Thank you for your volunteer interest</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:28px 32px 0 32px;background:rgba(0,6,102,1);">
                <img src="${escapeHtml(logoUrl)}" alt="RCCG Glory Tabernacle, Barnstaple" width="64" height="64" style="display:block;border-radius:12px;border:0;outline:none;text-decoration:none;" />
                <p style="margin:14px 0 24px 0;font-size:13px;font-weight:bold;letter-spacing:0.18em;color:#ffffff;text-transform:uppercase;">RCCG Glory Tabernacle, Barnstaple</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <p style="margin:0 0 8px 0;font-size:12px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgb(27,109,36);">Volunteer interest received</p>
                <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.25;color:rgba(27,34,119,1);">Thank you, ${firstName}!</h1>

                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:#555;">Hi ${safeName},</p>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:#555;">
                  We've received your volunteer interest at RCCG Glory Tabernacle, Barnstaple — thank you for stepping forward to serve. Every gift the body of Christ brings strengthens the whole, and we believe yours has a place here.
                </p>
                <p style="margin:0 0 24px 0;font-size:14px;line-height:1.7;color:#555;">
                  A member of our team will review your submission and reach out to you with next steps. In the meantime, you're already part of what God is doing here.
                </p>

                ${strengthsList}

                <p style="margin:0 0 8px 0;font-size:14px;line-height:1.7;color:#555;">In Christ,</p>
                <p style="margin:0 0 24px 0;font-size:14px;line-height:1.7;color:rgba(27,34,119,1);font-weight:bold;">Seye and Tolu Adebayo</p>
                <p style="margin:0 0 24px 0;font-size:14px;line-height:1.7;color:rgba(27,34,119,1);font-weight:bold;">Lead Pastors, RCCG Glory Tabernacle, Barnstaple</p>

                <p style="margin:0;font-size:12px;line-height:1.6;color:#999;border-top:1px solid #eee;padding-top:16px;">You're receiving this because you submitted the volunteer interest form on our website. If this wasn't you, please ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function buildText(args: SendVolunteerConfirmationArgs): string {
  const lines: string[] = []
  lines.push(`Hi ${args.name},`)
  lines.push('')
  lines.push(
    "We've received your volunteer interest at RCCG Glory Tabernacle, Barnstaple. Thank you for stepping forward to serve."
  )
  lines.push('')
  lines.push(
    "A member of our team will review your submission and reach out to you with next steps."
  )
  if (args.areaStrengthTitles.length > 0) {
    lines.push('')
    lines.push('Your areas of strength:')
    for (const t of args.areaStrengthTitles) {
      lines.push(`  - ${t}`)
    }
  }
  lines.push('')
  lines.push('In Christ,')
  lines.push('Seye and Tolu Adebayo')
  lines.push('Lead Pastors, RCCG Glory Tabernacle, Barnstaple')
  lines.push('')
  lines.push(
    "You're receiving this because you submitted the volunteer interest form on our website. If this wasn't you, please ignore this email."
  )
  return lines.join('\n')
}

/**
 * Send the confirmation. Returns { ok, detail } instead of throwing so the
 * caller can log per-recipient failures without aborting the form submit.
 */
export async function sendVolunteerConfirmation(
  args: SendVolunteerConfirmationArgs
): Promise<SendResult> {
  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: args.to,
      subject: buildSubject(args.name),
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
