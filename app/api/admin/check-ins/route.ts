import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { adminCheckInsQuerySchema } from '@/lib/validation/child'
import {
  CHILDREN_ADMIN_ROLES,
  type ChildrenAdminRole,
} from '@/lib/types/child'

function isAdmin(role: string | undefined): role is ChildrenAdminRole {
  return CHILDREN_ADMIN_ROLES.includes(role as ChildrenAdminRole)
}

/**
 * GET /api/admin/check-ins
 *
 * - ?active=true → only currently signed-in (open) check-ins. Used by the
 *   live attendance board, which polls every few seconds.
 * - default     → today's check-ins (signed in since midnight), open or closed.
 *
 * Includes child + signed-in/out parent for the live board view.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const validation = adminCheckInsQuerySchema.safeParse({
      active: searchParams.get('active') ?? undefined,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed' },
        { status: 400 }
      )
    }

    const onlyActive = validation.data.active === 'true'

    // "Today" boundary in UTC. For a single-region UK church this is fine;
    // a multi-tz deployment would need per-user TZ resolution.
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const where = onlyActive
      ? { signedOutAt: null }
      : { signedInAt: { gte: startOfToday } }

    const checkIns = await prisma.childCheckIn.findMany({
      where,
      orderBy: { signedInAt: 'desc' },
      take: 200,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            allergies: true,
            specialNeeds: true,
          },
        },
        signedInBy: { select: { id: true, name: true, email: true } },
        signedOutBy: { select: { id: true, name: true, email: true } },
      },
    })

    // Also surface a simple summary the live-board UI can show without an
    // additional fetch.
    const activeCount = onlyActive
      ? checkIns.length
      : checkIns.filter((c) => c.signedOutAt === null).length

    return NextResponse.json(
      {
        checkIns,
        activeCount,
        totalToday: onlyActive ? null : checkIns.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error listing check-ins (admin):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
