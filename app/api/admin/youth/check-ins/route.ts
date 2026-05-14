import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'

type AdminYouthCheckIn = {
  id: string
  userId: string
  signedInAt: Date
  signedOutAt: Date | null
  user: { id: string; name: string; email: string; image: string | null }
}

/**
 * GET /api/admin/youth/check-ins
 *
 * - ?active=true → only currently signed-in youth (signedOutAt is null)
 * - default     → today's check-ins (signed in since midnight), ordered newest first
 *
 * Returns youth check-ins with user details for the admin dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const onlyActive = searchParams.get('active') === 'true'

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const where = onlyActive
      ? { signedOutAt: null }
      : { signedInAt: { gte: startOfToday } }

    const checkIns: AdminYouthCheckIn[] = await prisma.youthCheckIn.findMany({
      where,
      orderBy: { signedInAt: 'desc' },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    })

    const activeCount = onlyActive
      ? checkIns.length
      : checkIns.filter((c) => c.signedOutAt === null).length

    return NextResponse.json(
      { checkIns, activeCount, totalToday: onlyActive ? null : checkIns.length },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error listing youth check-ins (admin):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
