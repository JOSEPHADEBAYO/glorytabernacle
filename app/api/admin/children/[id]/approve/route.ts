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
 * POST /api/admin/children/[id]/approve
 *
 * Approves a parent-submitted child registration so it appears on the
 * active roster. Idempotent — calling on an already-approved child is a
 * no-op success.
 *
 * Restricted to CHILDREN_LEADER + SUPER_ADMIN.
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

    if (child.approved) {
      return NextResponse.json({ child, alreadyApproved: true }, { status: 200 })
    }

    const updated = await prisma.child.update({
      where: { id },
      data: { approved: true },
    })

    return NextResponse.json({ child: updated, alreadyApproved: false }, {
      status: 200,
    })
  } catch (error) {
    console.error('Error approving child:', {
      error: error instanceof Error ? error.message : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
