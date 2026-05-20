import { Resend } from 'resend'

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
  return process.env.NOTIFICATION_FROM_EMAIL ?? 'RCCG Glory Tabernacle, Barnstaple <onboarding@resend.dev>'
}

function getSiteUrl(): string {
  return process.env.SITE_URL ?? 'https://rccgglory.org'
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildHtml(recipientName: string): string {
  const safeName = escapeHtml(recipientName)
  const imageUrl = `${getSiteUrl()}/mountup.png`

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Mount Up Prayer</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:0;">
                <img src="${imageUrl}" alt="Mount Up" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 16px 32px;">
                <p style="margin:0 0 16px 0;font-size:12px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgb(27,109,36);">Prayer Reminder</p>
                <h1 style="margin:0 0 8px 0;font-size:22px;line-height:1.3;color:rgba(27,34,119,1);">Mount Up!</h1>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#555;">Hi ${safeName},</p>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#555;">
                  Join us tonight as we mount up with wings as eagles. It's time to set the day on fire with prayers in the Holy Ghost.
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px 0;background:#f0f4ff;border-radius:8px;">
                  <tr>
                    <td style="padding:20px;font-size:14px;line-height:1.7;color:#333;font-style:italic;">
                      <p style="margin:0 0 12px 0;font-weight:bold;color:rgba(27,34,119,1);font-style:normal;">Isaiah 40:28-31</p>
                      <p style="margin:0;">
                        "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint."
                      </p>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#555;">
                  Everyone prays in the Holy Ghost. Sets the day on fire. Signs and wonders follow. Open to all members.
                </p>

                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#555;">
                  <strong style="color:rgba(27,34,119,1);">Time:</strong> 12:00am &amp; 12:30am
                </p>

                <p style="margin:0;font-size:12px;line-height:1.6;color:#999;">
                  You're receiving this because you're part of the RCCG Glory Tabernacle, Barnstaple family.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function buildText(recipientName: string): string {
  return [
    `Hi ${recipientName},`,
    '',
    'Mount Up!',
    '',
    'Join us tonight as we mount up with wings as eagles.',
    '',
    'Isaiah 40:28-31',
    '"But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint."',
    '',
    'Everyone prays in the Holy Ghost. Sets the day on fire. Signs and wonders follow. Open to all members.',
    '',
    'Time: 12:00am & 12:30am',
    '',
    "You're receiving this because you're part of the RCCG Glory Tabernacle, Barnstaple family.",
  ].join('\n')
}

export async function sendMountUpReminder(
  to: string,
  recipientName: string
): Promise<SendResult> {
  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: '🌅 Mount Up! — Prayer Reminder Tonight at 12:00am & 12:30am',
      html: buildHtml(recipientName),
      text: buildText(recipientName),
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
