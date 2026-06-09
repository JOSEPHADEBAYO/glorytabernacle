import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { inauguralRegistrationQuerySchema } from '@/lib/validation/inaugural-registration'
import {
  INAUGURAL_ADMIN_ROLES,
  formatRegistrationId,
  parseRegistrationId,
  type InauguralAdminRole,
} from '@/lib/types/inaugural-registration'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

function isAdmin(role: string | undefined): role is InauguralAdminRole {
  return INAUGURAL_ADMIN_ROLES.includes(role as InauguralAdminRole)
}

/**
 * GET /api/admin/inaugural-service
 *
 * Paginated list of registrants. Search matches:
 *   - email (substring, case-insensitive)
 *   - first name / last name (substring)
 *   - human-readable badge ID (e.g. GT-2026-0001) — parsed back into
 *     serialNumber for an exact lookup.
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
    const validation = inauguralRegistrationQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    })
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((i) => i.message),
        },
        { status: 400 }
      )
    }

    const page = validation.data.page ?? 1
    const pageSize = Math.min(
      validation.data.pageSize ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    )
    const search = validation.data.search?.trim()

    type WhereCondition = Record<string, unknown>
    let where: WhereCondition = {}

    if (search) {
      // If the search looks like a badge ID, jump straight to serialNumber.
      const parsed = parseRegistrationId(search)
      if (parsed !== null) {
        where = { serialNumber: parsed }
      } else {
        const q = search
        where = {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
          ],
        }
      }
    }

    const [total, rows] = await Promise.all([
      prisma.inauguralRegistration.count({ where }),
      prisma.inauguralRegistration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return NextResponse.json(
      {
        registrations: rows.map((r) => ({
          ...r,
          registrationId: formatRegistrationId(r.serialNumber),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error listing inaugural registrations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
