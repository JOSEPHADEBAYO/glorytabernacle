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
 * POST /api/admin/children/[id]/check-in
 *
 * The Children Leader (or SUPER_ADMIN) signs a child IN. Idempotent: if
 * the child already has an open check-in, the existing record is returned
 * rather than creating a duplicate.
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

    // Idempotency: if there's an open (not yet signed-out) check-in for this
    // child, just return it.
    const existingOpen = await prisma.childCheckIn.findFirst({
      where: { childId: id, signedOutAt: null },
      orderBy: { signedInAt: 'desc' },
    })
    if (existingOpen) {
      return NextResponse.json(
        { checkIn: existingOpen, alreadyOpen: true },
        { status: 200 }
      )
    }

    const checkIn = await prisma.childCheckIn.create({
      data: {
        childId: id,
        signedInById: user.id,
      },
    })

    return NextResponse.json({ checkIn, alreadyOpen: false }, { status: 201 })
  } catch (error) {
    console.error('Error checking child in (admin):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
