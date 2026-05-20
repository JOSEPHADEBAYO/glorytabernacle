import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { canManageConcerns } from '@/lib/types/safeguarding'
import { updateConcernSchema } from '@/lib/validation/safeguarding'

interface RouteContext {
  params: Promise<{ id: string }>
}

async function isUserDsl(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isDesignatedSafeguardingLead: true },
  })
  return Boolean(u?.isDesignatedSafeguardingLead)
}

/**
 * GET /api/admin/safeguarding-concerns/[id] — DSL + SUPER_ADMIN only.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dsl = await isUserDsl(user.id)
    if (!canManageConcerns(user.role, dsl)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const concern = await prisma.safeguardingConcern.findUnique({
      where: { id },
      include: {
        raisedBy: { select: { id: true, name: true, email: true } },
        closedBy: { select: { id: true, name: true, email: true } },
        child: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true },
        },
      },
    })
    if (!concern) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ concern }, { status: 200 })
  } catch (error) {
    console.error('Error reading safeguarding concern:', {
      error: error instanceof Error ? error.message : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/safeguarding-concerns/[id]
 *
 * DSL + SUPER_ADMIN update status / resolution / MASH referral / notes.
 * Setting status to CLOSED stamps closedBy + closedAt; moving away from
 * CLOSED clears them.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dsl = await isUserDsl(user.id)
    if (!canManageConcerns(user.role, dsl)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const validation = updateConcernSchema.safeParse(body)
    if (!validation.success) {
      const details = validation.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return NextResponse.json(
        { error: 'Validation failed', details },
        { status: 400 }
      )
    }
    const data = validation.data

    const existing = await prisma.safeguardingConcern.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (data.referredToMash !== undefined) updateData.referredToMash = data.referredToMash
    if (data.resolution !== undefined)
      updateData.resolution = data.resolution.trim() || null
    if (data.whoNotified !== undefined)
      updateData.whoNotified = data.whoNotified.trim() || null
    if (data.actionTaken !== undefined)
      updateData.actionTaken = data.actionTaken.trim() || null

    if (data.status !== undefined) {
      updateData.status = data.status
      if (data.status === 'CLOSED') {
        updateData.closedById = user.id
        updateData.closedAt = new Date()
      } else {
        // Re-opened / monitoring — clear the closure stamp.
        updateData.closedById = null
        updateData.closedAt = null
      }
    }

    const updated = await prisma.safeguardingConcern.update({
      where: { id },
      data: updateData,
      include: {
        raisedBy: { select: { id: true, name: true, email: true } },
        closedBy: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ concern: updated }, { status: 200 })
  } catch (error) {
    console.error('Error updating safeguarding concern:', {
      error: error instanceof Error ? error.message : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
