import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { groupMembersQuerySchema } from '@/lib/validation/group-member'
import {
  GROUP_MEMBER_ADMIN_ROLES,
  type GroupMemberAdminRole,
} from '@/lib/types/group-member'

function isAdmin(role: string | undefined): role is GroupMemberAdminRole {
  return GROUP_MEMBER_ADMIN_ROLES.includes(role as GroupMemberAdminRole)
}

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

/**
 * GET /api/group-members
 *
 * Lists submitted group members with pagination, optional groupId filter,
 * and optional fuzzy search by name or email.
 *
 * Auth: SUPER_ADMIN or CONTENT_EDITOR (read-only access).
 *
 * Query params:
 *   - page=1
 *   - pageSize=25 (max 100)
 *   - groupId=<cuid>          // filter to a single group
 *   - search=<text>           // case-insensitive match against firstName,
 *                                lastName, or email
 *
 * Returns:
 *   { members, total, page, pageSize, totalPages }
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const validation = groupMembersQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      groupId: searchParams.get('groupId') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    })

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const page = validation.data.page ?? 1
    const pageSize = Math.min(
      validation.data.pageSize ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    )

    // Build where clause
    const where: {
      groupId?: string
      OR?: Array<Record<string, { contains: string; mode: 'insensitive' }>>
    } = {}

    if (validation.data.groupId) {
      where.groupId = validation.data.groupId
    }

    if (validation.data.search && validation.data.search.trim().length > 0) {
      const q = validation.data.search.trim()
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, members] = await Promise.all([
      prisma.groupMember.count({ where }),
      prisma.groupMember.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          group: { select: { id: true, slug: true, title: true } },
        },
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return NextResponse.json(
      {
        members,
        total,
        page,
        pageSize,
        totalPages,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error listing group members:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
