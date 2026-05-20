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

function normaliseCode(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\D+/g, '')
}

function trim(value: unknown, max = 500): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

/**
 * POST /api/admin/children/[id]/check-out
 *
 * The Children Leader (or SUPER_ADMIN) signs a child OUT. Two safeguarding
 * checks are enforced here:
 *
 *   1. The 6-digit `code` must match the open check-in's `pickupCode`.
 *   2. The collector must be identified — either by picking a named entry
 *      (the primary guardian or an AuthorisedCollector row), or by
 *      explicitly recording an off-list "Someone else" override with a
 *      reason. The chosen name + relationship are snapshotted onto the
 *      ChildCheckIn so the audit trail survives later edits to the
 *      collectors list.
 *
 * Body:
 *   - code: string                   (required, 6 digits)
 *   - collectedByName: string        (required)
 *   - collectedByRelationship: string (required)
 *   - collectedFromList: boolean     (required — true if from a named entry)
 *   - collectionNotes?: string       (required when collectedFromList=false)
 *   - performance?: string           (optional free-text session note)
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const body = await request.json().catch(() => ({}))
    const code = normaliseCode(body?.code)
    const performance = trim(body?.performance, 4000)
    const collectedByName = trim(body?.collectedByName, 100)
    const collectedByRelationship = trim(body?.collectedByRelationship, 60)
    const collectedFromList = body?.collectedFromList === true
    const collectionNotes = trim(body?.collectionNotes, 2000)

    if (!code || code.length !== 6) {
      return NextResponse.json(
        {
          error:
            'A 6-digit pickup code is required. Ask the guardian for the code from their email.',
        },
        { status: 400 }
      )
    }
    if (!collectedByName) {
      return NextResponse.json(
        { error: 'Please record the name of the person collecting the child.' },
        { status: 400 }
      )
    }
    if (!collectedByRelationship) {
      return NextResponse.json(
        { error: 'Please record the relationship of the person collecting.' },
        { status: 400 }
      )
    }
    if (!collectedFromList && !collectionNotes) {
      return NextResponse.json(
        {
          error:
            'For an off-list collector, please record a short reason (e.g. "Mother in hospital, sister is collecting").',
        },
        { status: 400 }
      )
    }

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

    if (!openCheckIn.pickupCode) {
      return NextResponse.json(
        {
          error:
            'No pickup code is recorded for this check-in. Please contact a Super Admin to release the child.',
        },
        { status: 422 }
      )
    }

    if (openCheckIn.pickupCode !== code) {
      return NextResponse.json(
        {
          error:
            'That code does not match. Please re-check the email the guardian was sent at sign-in.',
        },
        { status: 422 }
      )
    }

    const closed = await prisma.childCheckIn.update({
      where: { id: openCheckIn.id },
      data: {
        signedOutAt: new Date(),
        signedOutById: user.id,
        collectedByName,
        collectedByRelationship,
        collectedFromList,
        collectionNotes: collectionNotes || null,
        ...(performance
          ? { performance, performanceUpdatedAt: new Date() }
          : {}),
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
