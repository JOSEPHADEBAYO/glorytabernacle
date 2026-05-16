import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { updateChildSchema } from '@/lib/validation/child'
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
 * GET /api/admin/children/[id]
 *
 * Full child record plus its check-in history (most recent 20). Restricted to
 * CHILDREN_LEADER + SUPER_ADMIN.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const child = await prisma.child.findUnique({
      where: { id },
      include: {
        checkIns: {
          orderBy: { signedInAt: 'desc' },
          take: 20,
          include: {
            signedInBy: { select: { id: true, name: true, email: true } },
            signedOutBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!child) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ child }, { status: 200 })
  } catch (error) {
    console.error('Error reading child (admin):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/children/[id]
 *
 * Partial update of a child record. Body validated against updateChildSchema.
 * Restricted to CHILDREN_LEADER + SUPER_ADMIN.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
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
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validation = updateChildSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    const data = validation.data
    // Strip empty strings → null on optional text columns.
    const cleaned: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue
      if (typeof value === 'string' && value.trim() === '') {
        // Only optional fields can be cleared by sending empty string.
        const optional = new Set([
          'allergies',
          'medicalNotes',
          'specialNeeds',
          'photoUrl',
          'primaryGuardianEmail',
        ])
        if (optional.has(key)) {
          cleaned[key] = null
          continue
        }
      }
      cleaned[key] = value
    }

    const existing = await prisma.child.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await prisma.child.update({
      where: { id },
      data: cleaned,
    })

    return NextResponse.json({ child: updated }, { status: 200 })
  } catch (error) {
    console.error('Error updating child (admin):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/children/[id]
 *
 * Permanently removes a child record. Cascade deletes all of the child's
 * check-in history. Restricted to CHILDREN_LEADER + SUPER_ADMIN.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.child.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.child.delete({ where: { id } })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting child (admin):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
