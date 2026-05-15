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

function buildHtml(name: string, email: string, password: string, position: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Welcome to the Dashboard</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 16px 32px;">
                <p style="margin:0 0 16px 0;font-size:12px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgb(27,109,36);">Account Created</p>
                <h1 style="margin:0 0 8px 0;font-size:22px;line-height:1.3;color:rgba(27,34,119,1);">Welcome, ${name}!</h1>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#555;">
                  You have been granted access to the RCCG Glory Tabernacle dashboard as <strong>${position}</strong>.
                </p>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#555;">Your login credentials:</p>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px 0;">
                  <tr>
                    <td align="center" style="background:#f0f4ff;border-radius:8px;padding:20px;">
                      <p style="margin:0 0 8px 0;font-size:13px;color:#666;">Email</p>
                      <p style="margin:0 0 16px 0;font-size:16px;font-weight:bold;color:rgba(27,34,119,1);">${email}</p>
                      <p style="margin:0 0 8px 0;font-size:13px;color:#666;">One-Time Password</p>
                      <p style="margin:0 0 0 0;font-size:20px;font-weight:bold;letter-spacing:4px;color:rgba(27,34,119,1);font-family:monospace;">${password}</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#555;">
                  For security reasons, you will be required to change this password on your first login.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/login" style="display:inline-block;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;background:rgba(27,34,119,1);">Log In to Dashboard</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;margin-top:24px;font-size:12px;line-height:1.6;color:#999;">
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

function buildText(name: string, email: string, password: string, position: string): string {
  return [
    'Account Created',
    '',
    `Welcome, ${name}!`,
    '',
    `You have been granted access to the RCCG Glory Tabernacle dashboard as ${position}.`,
    '',
    'Your login credentials:',
    '',
    `Email: ${email}`,
    `One-Time Password: ${password}`,
    '',
    'For security reasons, you will be required to change this password on your first login.',
    '',
    `Log in here: ${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/login`,
    '',
    'RCCG Glory Tabernacle Barnstaple',
  ].join('\n')
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  oneTimePassword: string,
  position: string
): Promise<SendResult> {
  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: `Welcome to RCCG Glory Tabernacle Dashboard — Your Login Credentials`,
      html: buildHtml(name, to, oneTimePassword, position),
      text: buildText(name, to, oneTimePassword, position),
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
