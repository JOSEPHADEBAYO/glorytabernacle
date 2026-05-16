import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  CHILDREN_ADMIN_ROLES,
  type ChildrenAdminRole,
} from '@/lib/types/child'

function isAdmin(role: string | undefined): role is ChildrenAdminRole {
  return CHILDREN_ADMIN_ROLES.includes(role as ChildrenAdminRole)
}

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/children/[id]/check-out
 *
 * The Children Leader (or SUPER_ADMIN) signs a child OUT. Closes the
 * most-recent open check-in for the child by setting signedOutAt / By.
 * Returns 409 if no open check-in exists for the child.
 */
export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const child = await prisma.child.findUnique({ where: { id } })
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const openCheckIn = await prisma.childCheckIn.findFirst({
      where: { childId: id, signedOutAt: null },
      orderBy: { signedInAt: 'desc' },
    })

    if (!openCheckIn) {
      return NextResponse.json(
        { error: 'No open check-in for this child' },
        { status: 409 }
      )
    }

    const closed = await prisma.childCheckIn.update({
      where: { id: openCheckIn.id },
      data: {
        signedOutAt: new Date(),
        signedOutById: user.id,
      },
    })

    return NextResponse.json({ checkIn: closed }, { status: 200 })
  } catch (error) {
    console.error('Error checking child out (admin):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
