import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createEventSchema, eventQuerySchema } from '@/lib/validation/event'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { EVENT_ADMIN_ROLES, type EventAdminRole } from '@/lib/types/event'

/**
 * Helper: returns true if the role is allowed to manage events
 * (SUPER_ADMIN or CONTENT_EDITOR).
 */
function isEventAdmin(role: string | undefined): role is EventAdminRole {
  return EVENT_ADMIN_ROLES.includes(role as EventAdminRole)
}

/**
 * Convert empty strings to null for optional URL/text fields so the database
 * stores NULL instead of an empty string.
 */
function nullIfEmpty(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null
  if (value.trim() === '') return null
  return value
}

/**
 * POST /api/events
 * Creates a new event.
 *
 * Requires authentication AND a SUPER_ADMIN or CONTENT_EDITOR role.
 * Returns 201 with created event on success.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isEventAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Validate body
    const body = await request.json()
    const validation = createEventSchema.safeParse(body)

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errorMessages,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // 3. Create record (normalize empty strings to null for optional fields)
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        time: nullIfEmpty(data.time),
        location: nullIfEmpty(data.location),
        imageSrc: nullIfEmpty(data.imageSrc),
        imageAlt: nullIfEmpty(data.imageAlt),
        registrationHref: nullIfEmpty(data.registrationHref),
        published: data.published,
        createdBy: user.id,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/events
 * Lists events with optional filtering.
 *
 * Requires authentication. Supports:
 * - ?published=true|false
 * - ?upcoming=true|false (only events with date >= now when true)
 *
 * Returns 200 with { events: [...] } sorted by date ascending.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate query
    const { searchParams } = new URL(request.url)
    const validation = eventQuerySchema.safeParse({
      published: searchParams.get('published') ?? undefined,
      upcoming: searchParams.get('upcoming') ?? undefined,
    })

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errorMessages,
        },
        { status: 400 }
      )
    }

    // 3. Build where clause
    const whereClause: { published?: boolean; date?: { gte: Date } } = {}

    if (validation.data.published !== undefined) {
      whereClause.published = validation.data.published === 'true'
    }
    if (validation.data.upcoming === 'true') {
      whereClause.date = { gte: new Date() }
    }

    // 4. Query — events ordered by date ascending (soonest first).
    //    Dashboard list will use date desc when calling without filters,
    //    but for upcoming/public consumption ascending is correct.
    const orderDirection = validation.data.upcoming === 'true' ? 'asc' : 'desc'

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { date: orderDirection },
    })

    return NextResponse.json({ events }, { status: 200 })
  } catch (error) {
    console.error('Error fetching events:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
