import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { canNotifyYouth, sendPushToUsers } from '@/lib/push'

/**
 * POST /api/admin/youth/notify-checkout
 *
 * The Super Admin / Youth Leader triggers a push reminder to every youth
 * who is currently checked in (signed in, not yet signed out) and has a
 * push subscription. Reminds them to sign out after the programme.
 */
export async function POST() {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canNotifyYouth(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Distinct youth currently checked in (open check-in = no signedOutAt).
    const openCheckIns = await prisma.youthCheckIn.findMany({
      where: { signedOutAt: null },
      select: { userId: true },
      distinct: ['userId'],
    })
    const userIds = openCheckIns.map((c) => c.userId)

    if (userIds.length === 0) {
      return NextResponse.json(
        { sent: 0, failed: 0, pruned: 0, checkedInCount: 0 },
        { status: 200 }
      )
    }

    const result = await sendPushToUsers(userIds, {
      title: 'Please sign out 👋',
      body: "The programme has ended — tap to sign out on the youth portal.",
      url: '/youth',
    })

    return NextResponse.json(
      { ...result, checkedInCount: userIds.length },
      { status: 200 }
    )
  } catch (error) {
    console.error('Youth notify-checkout error:', {
      error: error instanceof Error ? error.message : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    const message =
      error instanceof Error && error.message.includes('VAPID')
        ? 'Push notifications are not configured yet (VAPID keys missing).'
        : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
