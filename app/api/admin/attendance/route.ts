import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { adminAttendanceQuerySchema } from '@/lib/validation/attendance'
import {
  ATTENDANCE_ADMIN_ROLES,
  type AttendanceAdminRole,
} from '@/lib/types/attendance'

function isAdmin(role: string | undefined): role is AttendanceAdminRole {
  return ATTENDANCE_ADMIN_ROLES.includes(role as AttendanceAdminRole)
}

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

/**
 * GET /api/admin/attendance
 *
 * Admin-only paginated list of attendance submissions, with filters.
 * Supports ?page, ?pageSize (max 100), ?service, ?fromDate, ?toDate, ?search.
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
    const validation = adminAttendanceQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      service: searchParams.get('service') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
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

    // Build where clause from filters.
    const where: {
      service?: string
      attendedAt?: { gte?: Date; lte?: Date }
      OR?: Array<Record<string, { contains: string; mode: 'insensitive' }>>
    } = {}

    if (validation.data.service) where.service = validation.data.service

    if (validation.data.fromDate || validation.data.toDate) {
      where.attendedAt = {}
      if (validation.data.fromDate) where.attendedAt.gte = validation.data.fromDate
      if (validation.data.toDate) where.attendedAt.lte = validation.data.toDate
    }

    const search = validation.data.search?.trim()
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [total, rows] = await Promise.all([
      prisma.adultAttendance.count({ where }),
      prisma.adultAttendance.findMany({
        where,
        orderBy: { attendedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return NextResponse.json(
      {
        rows,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error listing attendance:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
