/**
 * Email helper for the weekly right-to-erasure (UK GDPR Article 17) digest.
 *
 * Sent by /api/cron/erasure-reminders to Children Leaders + Super Admins when
 * the pending-erasure queue isn't empty. Lists every pending request with its
 * age, and flags any older than the overdue threshold (so nothing slips past
 * the one-month statutory deadline).
 *
 * Required environment variables:
 *   - RESEND_API_KEY            — your Resend API key
 *   - NOTIFICATION_FROM_EMAIL   — From address on a verified Resend domain
 *   - one of SITE_URL / NEXT_PUBLIC_SITE_URL / NEXTAUTH_URL  — for the
 *     dashboard link (falls back to the production URL)
 */

import { Resend } from 'resend'

export interface ErasureDigestItem {
  childName: string
  guardianName: string
  guardianEmail: string
  createdAt: Date
  /** Whole days since the request was submitted. */
  ageDays: number
  /** True when ageDays exceeds the overdue threshold. */
  overdue: boolean
}

interface SendErasureDigestArgs {
  to: string
  recipientName: string
  /** Pending requests, oldest first. */
  items: ErasureDigestItem[]
  overdueCount: number
}

interface SendResult {
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

function getSiteUrl(): string {
  const url =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    'https://glorytabernacle.co.uk'
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

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function buildSubject(items: ErasureDigestItem[], overdueCount: number): string {
  const n = items.length
  const base = `${n} pending data-erasure request${n === 1 ? '' : 's'}`
  return overdueCount > 0 ? `Action needed: ${base} (${overdueCount} overdue)` : base
}

function buildHtml({ recipientName, items, overdueCount }: SendErasureDigestArgs): string {
  const dashboardUrl = `${getSiteUrl()}/dashboard/children`
  const safeName = escapeHtml(recipientName)

  const rows = items
    .map((it) => {
      const ageLabel = `${it.ageDays} day${it.ageDays === 1 ? '' : 's'} ago`
      const flag = it.overdue
        ? `<span style="display:inline-block;margin-left:8px;padding:1px 8px;border-radius:999px;background:#fde8e8;color:#b42318;font-size:11px;font-weight:bold;">OVERDUE</span>`
        : ''
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;color:#1a1a1a;">
          <strong style="color:rgba(27,34,119,1);">${escapeHtml(it.childName)}</strong>${flag}<br />
          <span style="color:#666;">Requested by ${escapeHtml(it.guardianName)} &middot; ${escapeHtml(it.guardianEmail)}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;color:#666;white-space:nowrap;" align="right">
          ${escapeHtml(formatLongDate(it.createdAt))}<br /><span style="font-size:11px;">${ageLabel}</span>
        </td>
      </tr>`
    })
    .join('')

  const overdueBanner =
    overdueCount > 0
      ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px 0;background:#fde8e8;border-radius:8px;">
           <tr><td style="padding:14px 18px;font-size:13px;line-height:1.6;color:#b42318;">
             <strong>${overdueCount} request${overdueCount === 1 ? ' is' : 's are'} now overdue.</strong>
             UK GDPR requires a response within one month — please action ${overdueCount === 1 ? 'it' : 'these'} as a priority.
           </td></tr>
         </table>`
      : ''

  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>Pending data-erasure requests</title></head>
  <body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:32px 32px 8px 32px;">
            <p style="margin:0 0 8px 0;font-size:12px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgb(27,109,36);">Children's Ministry &middot; Data requests</p>
            <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.25;color:rgba(27,34,119,1);">Pending data-erasure requests</h1>
            <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#555;">Hi ${safeName},</p>
            <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#555;">There ${items.length === 1 ? 'is' : 'are'} <strong>${items.length}</strong> right-to-erasure request${items.length === 1 ? '' : 's'} waiting to be reviewed. Verify the requester's identity, then erase or dismiss each one from the dashboard.</p>
            ${overdueBanner}
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px 0;border:1px solid #eee;border-radius:8px;border-collapse:separate;">
              ${rows}
            </table>
            <p style="margin:0 0 24px 0;"><a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;padding:12px 24px;background:rgba(27,34,119,1);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">Open Data requests</a></p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#999;">You're receiving this because you're a Children's Leader or Super Admin. This is an automated weekly reminder; it's only sent when the queue isn't empty.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

function buildText({ recipientName, items, overdueCount }: SendErasureDigestArgs): string {
  const dashboardUrl = `${getSiteUrl()}/dashboard/children`
  const lines: string[] = []
  lines.push(`Hi ${recipientName},`)
  lines.push('')
  lines.push(
    `There ${items.length === 1 ? 'is' : 'are'} ${items.length} pending right-to-erasure request${items.length === 1 ? '' : 's'} to review.`
  )
  if (overdueCount > 0) {
    lines.push('')
    lines.push(
      `*** ${overdueCount} ${overdueCount === 1 ? 'is' : 'are'} OVERDUE — UK GDPR requires a response within one month. ***`
    )
  }
  lines.push('')
  for (const it of items) {
    lines.push(
      `- ${it.childName}${it.overdue ? ' [OVERDUE]' : ''} — requested by ${it.guardianName} (${it.guardianEmail}) on ${formatLongDate(it.createdAt)}, ${it.ageDays} day(s) ago`
    )
  }
  lines.push('')
  lines.push(`Review them here: ${dashboardUrl}`)
  lines.push('')
  lines.push(
    "Automated weekly reminder for Children's Leaders / Super Admins; sent only when the queue isn't empty."
  )
  return lines.join('\n')
}

/**
 * Send the weekly pending-erasure digest to one recipient. Returns { ok,
 * detail } instead of throwing so the cron can isolate per-recipient failures.
 */
export async function sendErasureDigest(
  args: SendErasureDigestArgs
): Promise<SendResult> {
  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: args.to,
      subject: buildSubject(args.items, args.overdueCount),
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
