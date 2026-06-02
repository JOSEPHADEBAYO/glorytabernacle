/**
 * Daily birthday digest sent to the admin team. Triggered by the cron at
 * /api/cron/birthday-digest, which only invokes this helper when there is
 * at least one member with a birthday today — so we never spam the admin
 * with empty digests.
 *
 * Required env vars:
 *   - RESEND_API_KEY              Resend API key
 *   - NOTIFICATION_FROM_EMAIL     "From" address (verified Resend domain)
 *   - EMAIL_LOGO_URL              (optional) logo shown in the email
 */

import { Resend } from 'resend'

export interface BirthdayPerson {
  /** Full name, prebuilt from firstName + lastName. */
  name: string
  email: string
  /** Phone for quick contact from the admin if they want to call. */
  phoneNumber: string
  /** Ministry / group title the member is in. */
  groupTitle: string
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

function formatTodayLong(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function buildSubject(people: BirthdayPerson[]): string {
  const n = people.length
  if (n === 1) {
    return `🎂 Today's birthday: ${people[0]!.name}`
  }
  return `🎂 ${n} member birthdays today`
}

function buildHtml(args: {
  recipientName: string | null
  people: BirthdayPerson[]
}): string {
  const safeName = args.recipientName ? escapeHtml(args.recipientName) : null
  const logoUrl = getLogoUrl()
  const today = formatTodayLong()

  const rows = args.people
    .map(
      (p) => `<tr>
        <td style="padding:12px 14px;border-bottom:1px solid #eee;font-size:13px;color:#1a1a1a;">
          <strong style="color:rgba(27,34,119,1);">${escapeHtml(p.name)}</strong><br />
          <span style="color:#666;">${escapeHtml(p.groupTitle)}</span>
        </td>
        <td style="padding:12px 14px;border-bottom:1px solid #eee;font-size:13px;color:#666;" align="right">
          <a href="mailto:${escapeHtml(p.email)}" style="color:rgb(27,109,36);text-decoration:none;font-weight:600;">${escapeHtml(p.email)}</a><br />
          <span style="font-size:12px;">${escapeHtml(p.phoneNumber)}</span>
        </td>
      </tr>`
    )
    .join('')

  const n = args.people.length

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Today's member birthdays</title>
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
                <p style="margin:0 0 8px 0;font-size:12px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgb(27,109,36);">Member birthdays · ${escapeHtml(today)}</p>
                <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.25;color:rgba(27,34,119,1);">${n === 1 ? '1 birthday today' : `${n} birthdays today`}</h1>
                ${safeName ? `<p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#555;">Hi ${safeName},</p>` : ''}
                <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#555;">Reach out and bless ${n === 1 ? 'them' : 'each of them'} today — a quick call, an email, or a personal note goes a long way.</p>

                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px 0;border:1px solid #eee;border-radius:8px;border-collapse:separate;">
                  ${rows}
                </table>

                <p style="margin:0;font-size:12px;line-height:1.6;color:#999;border-top:1px solid #eee;padding-top:16px;">This is an automated daily digest from the Glory Tabernacle dashboard. It is only sent on days where at least one member's birthday falls today.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function buildText(args: {
  recipientName: string | null
  people: BirthdayPerson[]
}): string {
  const today = formatTodayLong()
  const lines: string[] = []
  if (args.recipientName) {
    lines.push(`Hi ${args.recipientName},`)
    lines.push('')
  }
  const n = args.people.length
  lines.push(
    n === 1
      ? `1 member has their birthday today (${today}):`
      : `${n} members have their birthday today (${today}):`
  )
  lines.push('')
  for (const p of args.people) {
    lines.push(`- ${p.name} — ${p.groupTitle}`)
    lines.push(`    ${p.email} · ${p.phoneNumber}`)
  }
  lines.push('')
  lines.push(
    "Reach out and bless them today — a quick call, an email, or a personal note goes a long way."
  )
  lines.push('')
  lines.push(
    'Automated daily digest. Only sent on days where at least one birthday falls today.'
  )
  return lines.join('\n')
}

/**
 * Send the digest to one admin recipient. Returns { ok, detail } so the
 * caller can isolate per-recipient failures when sending to multiple
 * admins (e.g. when ADMIN_NOTIFICATION_EMAIL isn't set and we fan out to
 * every active Super Admin instead).
 */
export async function sendBirthdayDigest(args: {
  to: string
  recipientName?: string | null
  people: BirthdayPerson[]
}): Promise<SendResult> {
  if (args.people.length === 0) {
    return { ok: true, detail: 'No birthdays today; nothing sent.' }
  }
  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: args.to,
      subject: buildSubject(args.people),
      html: buildHtml({
        recipientName: args.recipientName ?? null,
        people: args.people,
      }),
      text: buildText({
        recipientName: args.recipientName ?? null,
        people: args.people,
      }),
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
