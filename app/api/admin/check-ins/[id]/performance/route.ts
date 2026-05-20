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
 * PATCH /api/admin/check-ins/[id]/performance
 *
 * Edit the performance note on an existing check-in. Used by the
 * Performance tab so teachers can fill notes in later or correct them.
 *
 * Body: `{ "performance": "..." }`. Empty string clears the note (sets to
 * NULL). Restricted to CHILDREN_LEADER + SUPER_ADMIN.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const rawPerformance =
      typeof body.performance === 'string' ? body.performance.trim() : ''
    if (rawPerformance.length > 4000) {
      return NextResponse.json(
        { error: 'Performance note is too long (max 4,000 characters).' },
        { status: 400 }
      )
    }

    const existing = await prisma.childCheckIn.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    const updated = await prisma.childCheckIn.update({
      where: { id },
      data: {
        performance: rawPerformance.length > 0 ? rawPerformance : null,
        performanceUpdatedAt: new Date(),
      },
    })

    return NextResponse.json({ checkIn: updated }, { status: 200 })
  } catch (error) {
    console.error('Error updating performance note:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
