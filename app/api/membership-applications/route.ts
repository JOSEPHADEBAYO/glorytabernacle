import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  createMembershipApplicationSchema,
  membershipApplicationsQuerySchema,
} from '@/lib/validation/membership-application'
import {
  MEMBERSHIP_APPLICATION_ADMIN_ROLES,
  type MembershipApplicationAdminRole,
} from '@/lib/types/membership-application'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

function isAdmin(
  role: string | undefined
): role is MembershipApplicationAdminRole {
  return MEMBERSHIP_APPLICATION_ADMIN_ROLES.includes(
    role as MembershipApplicationAdminRole
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = createMembershipApplicationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const existing = await prisma.membershipApplication.findFirst({
      where: {
        email: {
          equals: validation.data.email,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A membership application already exists for this email.' },
        { status: 409 }
      )
    }

    const application = await prisma.membershipApplication.create({
      data: validation.data,
    })

    return NextResponse.json({ application }, { status: 201 })
  } catch (error) {
    console.error('Error creating membership application:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const validation = membershipApplicationsQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      membershipClass: searchParams.get('membershipClass') ?? undefined,
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const page = validation.data.page ?? 1
    const pageSize = Math.min(
      validation.data.pageSize ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    )

    const where: {
      membershipClass?: string
      OR?: Array<Record<string, { contains: string; mode: 'insensitive' }>>
    } = {}

    if (validation.data.membershipClass) {
      where.membershipClass = validation.data.membershipClass
    }

    if (validation.data.search) {
      const q = validation.data.search
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phoneNumber: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, applications] = await Promise.all([
      prisma.membershipApplication.count({ where }),
      prisma.membershipApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return NextResponse.json(
      {
        applications,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error listing membership applications:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
