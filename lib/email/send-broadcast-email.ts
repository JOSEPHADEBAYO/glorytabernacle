/**
 * Generic admin broadcast-email helper.
 *
 * Used by /api/admin/program-interest/send to deliver a free-text subject +
 * body to one or more recipients via Resend. Per-recipient errors are
 * isolated so a single bounce doesn't block the rest.
 *
 * Required env vars:
 *   - RESEND_API_KEY
 *   - NOTIFICATION_FROM_EMAIL   (verified Resend sender)
 */

import { Resend } from 'resend'

interface BroadcastTarget {
  name: string
  email: string
}

interface SendBroadcastArgs {
  subject: string
  /** Plain-text body. Newlines are preserved in both text + HTML output. */
  body: string
  /** Optional call-to-action button label (e.g. "Register Now"). */
  ctaLabel?: string
  /** Optional CTA destination URL. Both ctaLabel and ctaHref must be set together. */
  ctaHref?: string
  recipients: BroadcastTarget[]
}

interface PerRecipientResult {
  email: string
  ok: boolean
  detail: string
}

interface BroadcastResult {
  sent: number
  failed: number
  errors: Array<{ email: string; reason: string }>
}

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  return new Resend(apiKey)
}

function getFromAddress(): string {
  return (
    process.env.NOTIFICATION_FROM_EMAIL ??
    'RCCG Glory Tabernacle <onboarding@resend.dev>'
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

/**
 * Absolute base URL the email's images and links resolve against. Falls back
 * sensibly when env vars aren't set so dev/test still produces something
 * coherent.
 */
function getSiteUrl(): string {
  const url =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    'https://glorytabernacle.co.uk'
  return url.replace(/\/+$/, '') // strip trailing slashes
}

// Brand tokens — keep in sync with the public-site CSS variables. Email
// HTML can't reference CSS custom properties so we inline the hex values.
const BRAND = {
  navy: '#001E66', // church-navy
  navyDark: '#000A33', // header band
  green: '#1B6D24', // church-green accent
  text: '#1a1a1a',
  textMuted: '#666666',
  textSubtle: '#999999',
  divider: '#e5e7eb',
  bg: '#f6f7f9',
  cardBg: '#ffffff',
  footerBg: '#0b1230',
}

/**
 * Social links shown in the footer band. Edit here to add/remove.
 * Icons come from Simple Icons' public CDN — they're served as PNG and
 * render reliably across Gmail / Outlook / Apple Mail / mobile clients.
 */
const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/glorytabernaclebarnstaple',
    iconUrl: 'https://cdn.simpleicons.org/instagram/ffffff',
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@glorytabernaclehq',
    iconUrl: 'https://cdn.simpleicons.org/youtube/ffffff',
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/share/1CDurcWmxG',
    iconUrl: 'https://cdn.simpleicons.org/facebook/ffffff',
  },
]

interface BuildHtmlArgs {
  name: string
  subject: string
  body: string
  ctaLabel?: string
  ctaHref?: string
}

/**
 * Enterprise-grade transactional email template. Uses bulletproof tables +
 * inline styles for maximum client compatibility (Outlook, Gmail, Apple
 * Mail, mobile clients). Renders:
 *
 *   - Navy header band with the church logo, name, and email subject as a sub-headline
 *   - Thin green stripe at the top of the body card
 *   - White card body with greeting + free-text paragraphs
 *   - Optional CTA button block when ctaLabel + ctaHref are supplied
 *   - Dark footer band with contact info, social icons, copyright
 *   - Hidden preheader so the inbox preview is clean
 */
function buildHtml({ name, subject, body, ctaLabel, ctaHref }: BuildHtmlArgs): string {
  const siteUrl = getSiteUrl()
  // Email-only logo URL. Must be publicly reachable (Gmail/Outlook fetch
  // from the public internet — they can't see localhost or private hosts).
  // Override via EMAIL_LOGO_URL env var. Falls back to the hosted Cloudinary
  // copy so emails work out-of-the-box even before deploy.
  const logoUrl =
    process.env.EMAIL_LOGO_URL ??
    'https://res.cloudinary.com/deckwmsth/image/upload/v1778753747/yu.jpg_u3yacx.jpg'

  const safeBody = escapeHtml(body)
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:${BRAND.text};">${p.replace(/\n/g, '<br />')}</p>`
    )
    .join('')

  // First ~90 chars of body becomes the inbox preview ("preheader").
  const preheader = body.trim().slice(0, 90).replace(/\s+/g, ' ')

  const ctaBlock =
    ctaLabel && ctaHref
      ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0;">
                <tr>
                  <td align="center" bgcolor="${BRAND.green}" style="border-radius:8px;">
                    <a href="${escapeHtml(ctaHref)}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">
                      ${escapeHtml(ctaLabel)} →
                    </a>
                  </td>
                </tr>
              </table>`
      : ''

  const socialIconsRow = SOCIAL_LINKS.map(
    (s) => `
                  <td style="padding:0 6px;">
                    <a href="${s.href}" target="_blank" style="text-decoration:none;">
                      <img src="${s.iconUrl}" alt="${s.name}" width="20" height="20" style="display:block;border:0;outline:none;opacity:0.85;" />
                    </a>
                  </td>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>RCCG Glory Tabernacle</title>
<!--[if mso]>
<style type="text/css">
  body, table, td, p, a { font-family: Arial, sans-serif !important; }
</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};-webkit-font-smoothing:antialiased;">

  <!-- Preheader (hidden inbox preview) -->
  <div style="display:none;font-size:1px;color:${BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Outer card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${BRAND.cardBg};border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

          <!-- Header band -->
          <tr>
            <td align="center" style="background:${BRAND.navy};padding:28px 32px 26px 32px;">
              <!--
                Inline color + font on the <img> so when the image fails to
                load, the alt text is rendered in white on the navy band
                rather than the client's default dark colour.
              -->
              <img
                src="${logoUrl}"
                alt="RCCG Glory Tabernacle"
                width="180"
                height="48"
                style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:180px;margin:0 auto;color:#ffffff;font-size:18px;font-weight:700;line-height:48px;letter-spacing:0.01em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"
              />
              <p style="margin:18px 0 0 0;font-size:13px;font-weight:600;line-height:1.4;color:#ffffff;">
                ${escapeHtml(subject)}
              </p>
            </td>
          </tr>

          <!-- Thin green accent stripe -->
          <tr>
            <td style="background:${BRAND.green};font-size:0;line-height:0;height:3px;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px 36px;">
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.7;color:${BRAND.text};">
                Hi ${escapeHtml(name)},
              </p>
              ${safeBody}
              ${ctaBlock}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="border-top:1px solid ${BRAND.divider};font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:24px 36px 32px 36px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.textMuted};">
                In Christ,<br />
                <strong style="color:${BRAND.text};">RCCG Glory Tabernacle</strong>
              </p>
            </td>
          </tr>

          <!-- Footer band -->
          <tr>
            <td style="background:${BRAND.footerBg};padding:28px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:18px;">
                    <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#ffffff;letter-spacing:0.01em;">
                      RCCG Glory Tabernacle
                    </p>
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.55);">
                      Furnish · Transform · Influence
                    </p>
                  </td>
                </tr>

                <!-- Social icons row -->
                <tr>
                  <td align="center" style="padding-bottom:18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>${socialIconsRow}</tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="font-size:12px;line-height:1.7;color:rgba(255,255,255,0.7);">
                    <p style="margin:0;">
                      North Devon College, Old Sticklepath Hill<br />
                      Barnstaple EX31 2BQ, United Kingdom
                    </p>
                    <p style="margin:10px 0 0 0;">
                      <a href="mailto:admin@glorytabernacle.co.uk" style="color:#ffffff;text-decoration:underline;">admin@glorytabernacle.co.uk</a>
                      &nbsp;·&nbsp;
                      <a href="${siteUrl}" style="color:#ffffff;text-decoration:underline;">glorytabernacle.co.uk</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="border-top:1px solid rgba(255,255,255,0.12);font-size:0;line-height:0;">&nbsp;</td></tr>
                    </table>
                    <p style="margin:16px 0 0 0;font-size:11px;line-height:1.6;color:rgba(255,255,255,0.45);">
                      You&apos;re receiving this because you signed up via the
                      &ldquo;Get Notified&rdquo; form on our website. If this
                      isn&apos;t for you, just reply and let us know — we&apos;ll remove you.
                    </p>
                    <p style="margin:8px 0 0 0;font-size:11px;color:rgba(255,255,255,0.45);">
                      © ${new Date().getFullYear()} RCCG Glory Tabernacle. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body></html>`
}

/**
 * Plain-text fallback for clients that strip HTML (or for accessibility).
 * Includes the CTA as a labelled link so it isn't lost.
 */
function buildPlainText({
  name,
  body,
  ctaLabel,
  ctaHref,
}: {
  name: string
  body: string
  ctaLabel?: string
  ctaHref?: string
}): string {
  const lines = [`Hi ${name},`, '', body]
  if (ctaLabel && ctaHref) {
    lines.push('', `${ctaLabel}: ${ctaHref}`)
  }
  lines.push('', '— RCCG Glory Tabernacle')
  return lines.join('\n')
}

/**
 * Send the broadcast email. Returns aggregate counts plus per-failure
 * details. Sends are issued in parallel (capped at 10 in flight at once)
 * to keep total wall time reasonable without overwhelming Resend.
 */
export async function sendBroadcastEmail(
  args: SendBroadcastArgs
): Promise<BroadcastResult> {
  const resend = getResend()
  const from = getFromAddress()

  const CONCURRENCY = 10
  const results: PerRecipientResult[] = []

  // Simple chunked-parallel send to bound concurrency.
  for (let i = 0; i < args.recipients.length; i += CONCURRENCY) {
    const batch = args.recipients.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map(async (r): Promise<PerRecipientResult> => {
        try {
          const { error } = await resend.emails.send({
            from,
            to: r.email,
            subject: args.subject,
            html: buildHtml({
              name: r.name,
              subject: args.subject,
              body: args.body,
              ctaLabel: args.ctaLabel,
              ctaHref: args.ctaHref,
            }),
            text: buildPlainText({
              name: r.name,
              body: args.body,
              ctaLabel: args.ctaLabel,
              ctaHref: args.ctaHref,
            }),
          })
          if (error) {
            return {
              email: r.email,
              ok: false,
              detail: error.message ?? 'Unknown Resend error',
            }
          }
          return { email: r.email, ok: true, detail: 'sent' }
        } catch (err) {
          return {
            email: r.email,
            ok: false,
            detail: err instanceof Error ? err.message : 'Unknown error',
          }
        }
      })
    )
    results.push(...batchResults)
  }

  const sent = results.filter((r) => r.ok).length
  const failed = results.length - sent
  const errors = results
    .filter((r) => !r.ok)
    .map((r) => ({ email: r.email, reason: r.detail }))

  return { sent, failed, errors }
}
