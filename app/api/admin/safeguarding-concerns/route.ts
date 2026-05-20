import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  canRaiseConcern,
  canManageConcerns,
} from '@/lib/types/safeguarding'
import {
  createConcernSchema,
  concernsQuerySchema,
} from '@/lib/validation/safeguarding'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

/**
 * Look up the current user's DSL flag (the session only carries role).
 */
async function isUserDsl(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isDesignatedSafeguardingLead: true },
  })
  return Boolean(u?.isDesignatedSafeguardingLead)
}

/**
 * POST /api/admin/safeguarding-concerns
 *
 * Raise a safeguarding concern. Allowed for any CHILDREN_LEADER or
 * SUPER_ADMIN. The raiser does NOT need to be able to view the log.
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canRaiseConcern(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const validation = createConcernSchema.safeParse(body)
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

    // Resolve the child link + snapshot the name.
    let childId: string | null = null
    let childName: string | null =
      data.childName && data.childName.trim() ? data.childName.trim() : null

    if (data.childId && data.childId.trim()) {
      const child = await prisma.child.findUnique({
        where: { id: data.childId.trim() },
        select: { id: true, firstName: true, lastName: true },
      })
      if (!child) {
        return NextResponse.json(
          { error: 'Linked child not found' },
          { status: 404 }
        )
      }
      childId = child.id
      if (!childName) childName = `${child.firstName} ${child.lastName}`.trim()
    }

    if (!childId && !childName) {
      return NextResponse.json(
        {
          error:
            'Please either link a registered child or enter who the concern is about.',
        },
        { status: 400 }
      )
    }

    const concern = await prisma.safeguardingConcern.create({
      data: {
        childId,
        childName,
        concernType: data.concernType,
        description: data.description,
        actionTaken: data.actionTaken?.trim() || null,
        whoNotified: data.whoNotified?.trim() || null,
        referredToMash: data.referredToMash ?? false,
        occurredAt: new Date(data.occurredAt as Date),
        raisedById: user.id,
      },
      select: { id: true },
    })

    return NextResponse.json({ id: concern.id, success: true }, { status: 201 })
  } catch (error) {
    console.error('Error raising safeguarding concern:', {
      error: error instanceof Error ? error.message : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/admin/safeguarding-concerns
 *
 * List concerns. Restricted to SUPER_ADMIN + DSL. Supports ?status= and
 * pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dsl = await isUserDsl(user.id)
    if (!canManageConcerns(user.role, dsl)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const validation = concernsQuerySchema.safeParse({
      status: request.nextUrl.searchParams.get('status') ?? undefined,
      page: request.nextUrl.searchParams.get('page') ?? undefined,
      pageSize: request.nextUrl.searchParams.get('pageSize') ?? undefined,
    })
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const page = validation.data.page ?? 1
    const pageSize = Math.min(
      validation.data.pageSize ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    )
    const where = validation.data.status ? { status: validation.data.status } : {}

    const [total, concerns] = await Promise.all([
      prisma.safeguardingConcern.count({ where }),
      prisma.safeguardingConcern.findMany({
        where,
        // Open concerns first, then most recent.
        orderBy: [{ status: 'asc' }, { occurredAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          raisedBy: { select: { id: true, name: true, email: true } },
          closedBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ])

    return NextResponse.json(
      {
        concerns,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error listing safeguarding concerns:', {
      error: error instanceof Error ? error.message : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
