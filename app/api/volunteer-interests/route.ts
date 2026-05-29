import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  createVolunteerInterestSchema,
  volunteerInterestQuerySchema,
} from '@/lib/validation/volunteer-interest'
import {
  VOLUNTEER_INTEREST_ADMIN_ROLES,
  type VolunteerInterestAdminRole,
} from '@/lib/types/volunteer-interest'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

function isAdmin(
  role: string | undefined
): role is VolunteerInterestAdminRole {
  return VOLUNTEER_INTEREST_ADMIN_ROLES.includes(
    role as VolunteerInterestAdminRole
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = createVolunteerInterestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const data = validation.data
    const groups = await prisma.group.findMany({
      where: {
        id: { in: data.areaStrengthIds },
        published: true,
      },
      select: { id: true, title: true },
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
    })

    if (groups.length !== data.areaStrengthIds.length) {
      return NextResponse.json(
        { error: 'One or more selected areas of strength are invalid.' },
        { status: 400 }
      )
    }

    const interest = await prisma.volunteerInterest.create({
      data: {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        gender: data.gender,
        address: data.address,
        areaStrengths: groups,
        pastExperience: data.pastExperience,
        contributionStatement: data.contributionStatement,
        bornAgain: data.bornAgain,
        filledWithHolyGhost: data.filledWithHolyGhost,
      },
    })

    return NextResponse.json({ interest }, { status: 201 })
  } catch (error) {
    console.error('Error creating volunteer interest:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const validation = volunteerInterestQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      search: searchParams.get('search') ?? undefined,
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
      OR?: Array<Record<string, { contains: string; mode: 'insensitive' }>>
    } = {}

    if (validation.data.search) {
      const q = validation.data.search
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phoneNumber: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, interests] = await Promise.all([
      prisma.volunteerInterest.count({ where }),
      prisma.volunteerInterest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return NextResponse.json(
      {
        interests,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error listing volunteer interests:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
