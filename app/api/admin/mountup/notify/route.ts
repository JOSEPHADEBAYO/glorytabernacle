import { NextRequest, NextResponse } from 'next/server'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { canNotifyMountUp, sendPushToTopic } from '@/lib/push'

/**
 * POST /api/admin/mountup/notify
 *
 * Triggered by a Super Admin from the dashboard "Send Mount Up reminder"
 * button. Sends a Web-Push notification to every subscriber of the MOUNT_UP
 * topic (anonymous public-site subscribers). Returns aggregate send stats so
 * the UI can show "Sent to N people".
 *
 * Replaces the daily 11:45pm Vercel cron at
 * /api/cron/send-mount-up-reminder, which broadcast emails to every member +
 * attendee. The new model is opt-in, on demand, and uses web-push instead of
 * email.
 */
export async function POST(_request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canNotifyMountUp(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await sendPushToTopic('MOUNT_UP', {
      title: 'Mount Up — prayer starts soon',
      body: 'Join us on Google Meet for daily prayer at midnight (12:00am UK).',
      url: '/',
    })

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    console.error('Mount Up notify error:', err)
    return NextResponse.json(
      { error: 'Could not send the Mount Up reminder. Please try again.' },
      { status: 500 }
    )
  }
}
