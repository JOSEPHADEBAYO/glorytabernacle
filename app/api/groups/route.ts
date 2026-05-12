import { NextRequest, NextResponse } from 'next/server'
//import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createGroupSchema, groupQuerySchema } from '@/lib/validation/group'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { GROUP_ADMIN_ROLES, type GroupAdminRole } from '@/lib/types/group'


function isGroupAdmin(role: string | undefined): role is GroupAdminRole {
  return GROUP_ADMIN_ROLES.includes(role as GroupAdminRole)
}

/**
 * Convert empty strings to null for optional text/URL columns so the database
 * stores NULL instead of empty strings.
 */
function nullIfEmpty(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null
  if (value.trim() === '') return null
  return value
}

// function dbNullIfMissing(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
//   if (value === undefined || value === null) return Prisma.DbNull
//   return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
// }

function dbNullIfMissing(value: unknown) {
  if (value === undefined) return undefined
  if (value === null) return null

  return JSON.parse(JSON.stringify(value))
}
/**
 * Detect Prisma unique-constraint violation (e.g. duplicate slug).
 */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  )
}

/**
 * POST /api/groups
 * Creates a new group.
 *
 * Requires SUPER_ADMIN or CONTENT_EDITOR role.
 * Returns 201 on success, 409 if slug already taken.
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isGroupAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = createGroupSchema.safeParse(body)

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const data = validation.data

    try {
      const group = await prisma.group.create({
        data: {
          slug: data.slug,
          title: data.title,
          tag: nullIfEmpty(data.tag),
          description: data.description,
          imageSrc: data.imageSrc,
          imageAlt: data.imageAlt,
          ctaLabel: nullIfEmpty(data.ctaLabel),
          ctaHref: nullIfEmpty(data.ctaHref),
          order: data.order ?? 0,
          published: data.published,

          scripture: nullIfEmpty(data.scripture),
          headTitle: nullIfEmpty(data.headTitle),
          responsibilities: dbNullIfMissing(data.responsibilities),
          programmes: dbNullIfMissing(data.programmes),
          specialRole: dbNullIfMissing(data.specialRole),
          furnishStatement: nullIfEmpty(data.furnishStatement),
          transformStatement: nullIfEmpty(data.transformStatement),
          influenceStatement: nullIfEmpty(data.influenceStatement),

          createdBy: user.id,
        },
      })

      return NextResponse.json(group, { status: 201 })
    } catch (err) {
      if (isUniqueViolation(err)) {
        return NextResponse.json(
          {
            error: 'A group with this slug already exists',
            details: ['Slug must be unique. Try a different value.'],
          },
          { status: 409 }
        )
      }
      throw err
    }
  } catch (error) {
    console.error('Error creating group:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/groups
 * Lists groups with optional ?published filter.
 *
 * Requires authentication.
 * Returns 200 with { groups: [...] } sorted by `order` asc then createdAt desc.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const validation = groupQuerySchema.safeParse({
      published: searchParams.get('published') ?? undefined,
    })

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const whereClause: { published?: boolean } = {}
    if (validation.data.published !== undefined) {
      whereClause.published = validation.data.published === 'true'
    }

    const groups = await prisma.group.findMany({
      where: whereClause,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ groups }, { status: 200 })
  } catch (error) {
    console.error('Error fetching groups:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
