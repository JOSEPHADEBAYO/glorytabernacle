import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getYouthUser } from '@/lib/auth/youth-session'

/**
 * POST /api/youth/me/check-in
 *
 * Signs the authenticated youth member in for the current session.
 * Idempotent — if an open check-in already exists, returns it without
 * creating a duplicate.
 */
export async function POST(_request: NextRequest) {
  try {
    const youth = await getYouthUser()
    if (!youth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for an existing open check-in
    const existing = await prisma.youthCheckIn.findFirst({
      where: { userId: youth.id, signedOutAt: null },
      orderBy: { signedInAt: 'desc' },
    })

    if (existing) {
      return NextResponse.json(
        { checkIn: existing, alreadyIn: true },
        { status: 200 }
      )
    }

    const checkIn = await prisma.youthCheckIn.create({
      data: { userId: youth.id },
    })

    return NextResponse.json({ checkIn, alreadyIn: false }, { status: 200 })
  } catch (error) {
    console.error('Youth check-in error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
