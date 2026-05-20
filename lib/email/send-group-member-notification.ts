/**
 * Email helper for notifying admins when a visitor submits the
 * "Get Involved" form on a group/ministry detail page.
 *
 * Uses Resend (same client as event notifications).
 *
 * Required environment variables:
 *   - RESEND_API_KEY              — Resend API key
 *   - NOTIFICATION_FROM_EMAIL     — From address (verified Resend sender)
 *   - ADMIN_NOTIFICATION_EMAIL    — Admin recipient (e.g. follow-up team mailbox)
 *                                   Falls back to NOTIFICATION_FROM_EMAIL if unset
 *                                   so emails still send during testing.
 */

import { Resend } from 'resend'
import {
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  type Gender,
  type MaritalStatus,
} from '@/lib/types/group-member'

interface SendGroupMemberNotificationArgs {
  group: {
    id: string
    title: string
    slug: string
  }
  member: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    birthDay: number
    birthMonth: number
    gender: Gender
    maritalStatus: MaritalStatus
    address: string
    filledWithHolyGhost: boolean
  }
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

function getAdminAddress(): string | null {
  const admin = process.env.ADMIN_NOTIFICATION_EMAIL
  if (admin && admin.trim().length > 0) return admin.trim()
  // Last-ditch fallback so testing isn't blocked when the env var is unset.
  // Not safe for production — admins should configure ADMIN_NOTIFICATION_EMAIL.
  return process.env.NOTIFICATION_FROM_EMAIL ?? null
}

const MONTHS = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildSubject({ group, member }: SendGroupMemberNotificationArgs): string {
  return `New ${group.title} member: ${member.firstName} ${member.lastName}`
}

function buildHtml({
  group,
  member,
}: SendGroupMemberNotificationArgs): string {
  const fullName = escapeHtml(`${member.firstName} ${member.lastName}`)
  const groupTitle = escapeHtml(group.title)
  const monthName = MONTHS[member.birthMonth] ?? String(member.birthMonth)
  const rows = [
    ['Name', fullName],
    ['Email', `<a href="mailto:${escapeHtml(member.email)}">${escapeHtml(member.email)}</a>`],
    ['Phone', escapeHtml(member.phoneNumber)],
    ['Date of birth', `${member.birthDay} ${escapeHtml(monthName)}`],
    ['Gender', escapeHtml(GENDER_LABELS[member.gender])],
    ['Marital status', escapeHtml(MARITAL_STATUS_LABELS[member.maritalStatus])],
    ['Address', escapeHtml(member.address)],
    ['Filled with the Holy Ghost', member.filledWithHolyGhost ? 'Yes' : 'No'],
  ]

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>New member submission</title></head>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px 0;font-size:12px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgb(27,109,36);">New Submission</p>
          <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:rgba(27,34,119,1);">${fullName} joined ${groupTitle}</h1>
          <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#555;">A new member has submitted the &ldquo;Get Involved&rdquo; form. Their details are below.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            ${rows
              .map(
                ([label, value]) => `
              <tr>
                <td style="padding:10px 0;border-top:1px solid #eee;font-size:13px;color:#666;width:160px;vertical-align:top;">${escapeHtml(label as string)}</td>
                <td style="padding:10px 0;border-top:1px solid #eee;font-size:13px;color:#1a1a1a;vertical-align:top;">${value}</td>
              </tr>`
              )
              .join('')}
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function buildText({
  group,
  member,
}: SendGroupMemberNotificationArgs): string {
  const monthName = MONTHS[member.birthMonth] ?? String(member.birthMonth)
  return [
    `${member.firstName} ${member.lastName} has joined ${group.title}.`,
    '',
    `Email: ${member.email}`,
    `Phone: ${member.phoneNumber}`,
    `Date of birth: ${member.birthDay} ${monthName}`,
    `Gender: ${GENDER_LABELS[member.gender]}`,
    `Marital status: ${MARITAL_STATUS_LABELS[member.maritalStatus]}`,
    `Address: ${member.address}`,
    `Filled with the Holy Ghost: ${member.filledWithHolyGhost ? 'Yes' : 'No'}`,
  ].join('\n')
}

/**
 * Send the admin notification. Returns a {ok, detail} so the calling route
 * can treat email failure as a non-blocking warning rather than failing the
 * member submission.
 */
export async function sendGroupMemberNotification(
  args: SendGroupMemberNotificationArgs
): Promise<SendResult> {
  const adminTo = getAdminAddress()
  if (!adminTo) {
    return {
      ok: false,
      detail: 'ADMIN_NOTIFICATION_EMAIL not set; skipping notification',
    }
  }

  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: adminTo,
      subject: buildSubject(args),
      html: buildHtml(args),
      text: buildText(args),
      replyTo: args.member.email,
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
