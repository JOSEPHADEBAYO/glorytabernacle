import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getYouthUser } from '@/lib/auth/youth-session'

/**
 * POST /api/youth/push/unsubscribe
 *
 * Removes a youth's push subscription. Body: { endpoint }. Only deletes a
 * subscription that belongs to the signed-in youth.
 */
export async function POST(request: NextRequest) {
  try {
    const youth = await getYouthUser()
    if (!youth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const endpoint = body?.endpoint
    if (typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 })
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: youth.id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Youth push unsubscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
