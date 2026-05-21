import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { canHandleErasure } from '@/lib/types/erasure'
import { erasureRequestsQuerySchema } from '@/lib/validation/erasure'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

/**
 * GET /api/admin/erasure-requests
 *
 * List right-to-erasure requests. Restricted to CHILDREN_LEADER + SUPER_ADMIN.
 * Supports ?status= and pagination. Pending requests surface first, then most
 * recent. Each request carries its best-effort matched child (if any) plus a
 * lightweight roster of children sharing the requester's email so the reviewer
 * can pick/confirm the right record before erasing.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canHandleErasure(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const validation = erasureRequestsQuerySchema.safeParse({
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

    const [total, requests] = await Promise.all([
      prisma.erasureRequest.count({ where }),
      prisma.erasureRequest.findMany({
        where,
        // Pending first (PENDING < COMPLETED < DISMISSED alphabetically would
        // be wrong, so order by status priority via a computed sort below is
        // overkill — instead: pending always on top via a two-key sort).
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          child: {
            select: { id: true, firstName: true, lastName: true },
          },
          handledBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ])

    // For each request, surface candidate children that share the requester's
    // email (case-insensitive) so the reviewer can confirm/relink before
    // erasing. Cheap because the queue is small; grouped to one query.
    const emails = Array.from(
      new Set(requests.map((r) => r.guardianEmail.toLowerCase()))
    )
    const candidates = emails.length
      ? await prisma.child.findMany({
          where: {
            primaryGuardianEmail: { in: emails, mode: 'insensitive' },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            primaryGuardianEmail: true,
          },
        })
      : []

    const byEmail = new Map<string, typeof candidates>()
    for (const c of candidates) {
      const key = (c.primaryGuardianEmail ?? '').toLowerCase()
      if (!byEmail.has(key)) byEmail.set(key, [])
      byEmail.get(key)!.push(c)
    }

    const enriched = requests.map((r) => ({
      ...r,
      candidateChildren: byEmail.get(r.guardianEmail.toLowerCase()) ?? [],
    }))

    return NextResponse.json(
      {
        requests: enriched,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error listing erasure requests:', {
      error: error instanceof Error ? error.message : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
