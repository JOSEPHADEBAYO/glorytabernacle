import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateSession } from '@/lib/auth/session'

/**
 * GET /api/admin/youth-attendance
 *
 * Query params:
 *   active=true  → only open check-ins (signed in, not yet signed out)
 *   active=false → all check-ins today
 *
 * Returns youth check-ins with user details for the admin dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const isValid = await validateSession()
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const checkIns = await prisma.youthCheckIn.findMany({
      where: {
        ...(activeOnly
          ? { signedOutAt: null }
          : { signedInAt: { gte: startOfToday } }),
      },
      orderBy: { signedInAt: 'desc' },
      take: 200,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    const serialized = checkIns.map((c) => ({
      id: c.id,
      signedInAt: c.signedInAt.toISOString(),
      signedOutAt: c.signedOutAt?.toISOString() ?? null,
      user: c.user,
    }))

    return NextResponse.json({ checkIns: serialized }, { status: 200 })
  } catch (error) {
    console.error('Youth attendance fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
