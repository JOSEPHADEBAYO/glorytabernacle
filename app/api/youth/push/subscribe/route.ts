import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getYouthUser } from '@/lib/auth/youth-session'

/**
 * POST /api/youth/push/subscribe
 *
 * A signed-in youth registers a browser push subscription so they can
 * receive "please sign out" reminders. Body is the JSON of a PushSubscription
 * object from the browser: { endpoint, keys: { p256dh, auth } }.
 */
export async function POST(request: NextRequest) {
  try {
    const youth = await getYouthUser()
    if (!youth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const endpoint = body?.endpoint
    const p256dh = body?.keys?.p256dh
    const auth = body?.keys?.auth
    if (
      typeof endpoint !== 'string' ||
      typeof p256dh !== 'string' ||
      typeof auth !== 'string'
    ) {
      return NextResponse.json(
        { error: 'A valid push subscription is required.' },
        { status: 400 }
      )
    }

    const userAgent = request.headers.get('user-agent')?.slice(0, 300) ?? null

    // Upsert by endpoint so re-subscribing on the same browser updates the
    // keys / owner rather than creating duplicates.
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: youth.id, p256dh, auth, userAgent },
      create: { userId: youth.id, endpoint, p256dh, auth, userAgent },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Youth push subscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
