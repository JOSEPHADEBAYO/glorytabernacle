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
        // Include the full check-in history so the Performance tab can
        // render an accurate timeline across any chosen date range.
        // Cap at 500 to avoid runaway responses on long-running children.
        checkIns: {
          orderBy: { signedInAt: 'desc' },
          take: 500,
          include: {
            signedInBy: { select: { id: true, name: true, email: true } },
            signedOutBy: { select: { id: true, name: true, email: true } },
          },
        },
        authorisedCollectors: {
          orderBy: { createdAt: 'asc' },
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
    // Strip empty strings → null on optional text columns. Pull the
    // collectors out separately because they need a replace-all semantic
    // (delete existing + create the new list).
    const cleaned: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (key === 'authorisedCollectors') continue
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

    // If any consent flag changed in this update, re-stamp when consent
    // was captured so the audit trail reflects the latest agreement.
    const consentKeys = [
      'consentDataProcessing',
      'consentPhotography',
      'consentMedicalInfoSharing',
      'consentEmergencyTreatment',
      'consentByName',
    ]
    if (consentKeys.some((k) => k in cleaned)) {
      cleaned.consentCapturedAt = new Date()
    }

    const existing = await prisma.child.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Replace-all semantic: if the caller provided a collectors array,
      // wipe the existing ones and create the new list. Omitting the array
      // entirely leaves them untouched.
      if (data.authorisedCollectors !== undefined) {
        await tx.authorisedCollector.deleteMany({ where: { childId: id } })
        if (data.authorisedCollectors.length > 0) {
          await tx.authorisedCollector.createMany({
            data: data.authorisedCollectors.map((c) => ({
              childId: id,
              name: c.name,
              relationship: c.relationship,
              phone: c.phone?.trim() || null,
              photoUrl: c.photoUrl?.trim() || null,
              notes: c.notes?.trim() || null,
            })),
          })
        }
      }

      return tx.child.update({
        where: { id },
        data: cleaned,
        include: { authorisedCollectors: { orderBy: { createdAt: 'asc' } } },
      })
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
