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
  return process.env.NOTIFICATION_FROM_EMAIL ?? 'RCCG Glory Tabernacle <onboarding@resend.dev>'
}

function buildHtml(code: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Verification Code</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 16px 32px;">
                <p style="margin:0 0 16px 0;font-size:12px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgb(27,109,36);">Security</p>
                <h1 style="margin:0 0 8px 0;font-size:22px;line-height:1.3;color:rgba(27,34,119,1);">Password Change Request</h1>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#555;">Hi Admin,</p>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#555;">
                  You requested to change your password. Use the verification code below to proceed.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px 0;">
                  <tr>
                    <td align="center" style="background:#f0f4ff;border-radius:8px;padding:24px;">
                      <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:rgba(27,34,119,1);font-family:monospace;">${code}</span>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#555;">
                  This code expires in 10 minutes. If you did not request this, you can ignore this email.
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#999;">
                  RCCG Glory Tabernacle Barnstaple
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

function buildText(code: string): string {
  return [
    'Security',
    '',
    'Password Change Request',
    '',
    'Hi Admin,',
    '',
    'You requested to change your password. Use the verification code below to proceed.',
    '',
    `Your verification code is: ${code}`,
    '',
    'This code expires in 10 minutes. If you did not request this, you can ignore this email.',
    '',
    'RCCG Glory Tabernacle Barnstaple',
  ].join('\n')
}

export async function sendVerificationCode(
  to: string,
  code: string
): Promise<SendResult> {
  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: 'Your Password Change Verification Code',
      html: buildHtml(code),
      text: buildText(code),
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
