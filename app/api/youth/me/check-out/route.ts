import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getYouthUser } from '@/lib/auth/youth-session'

/**
 * POST /api/youth/me/check-out
 *
 * Closes the authenticated youth member's open check-in.
 * Idempotent — if already signed out, returns gracefully.
 */
export async function POST(_request: NextRequest) {
  try {
    const youth = await getYouthUser()
    if (!youth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const openCheckIn = await prisma.youthCheckIn.findFirst({
      where: { userId: youth.id, signedOutAt: null },
      orderBy: { signedInAt: 'desc' },
    })

    if (!openCheckIn) {
      return NextResponse.json(
        { signedOut: false, message: 'No open check-in found' },
        { status: 200 }
      )
    }

    const updated = await prisma.youthCheckIn.update({
      where: { id: openCheckIn.id },
      data: { signedOutAt: new Date() },
    })

    return NextResponse.json({ signedOut: true, checkIn: updated }, { status: 200 })
  } catch (error) {
    console.error('Youth check-out error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
