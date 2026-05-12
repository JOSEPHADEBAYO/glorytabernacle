import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { updateEventSchema } from '@/lib/validation/event'
import { EVENT_ADMIN_ROLES, type EventAdminRole } from '@/lib/types/event'

function isEventAdmin(role: string | undefined): role is EventAdminRole {
  return EVENT_ADMIN_ROLES.includes(role as EventAdminRole)
}

/**
 * Convert empty strings to null for optional fields.
 */
function nullIfEmpty(value: string | undefined | null): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (value.trim() === '') return null
  return value
}

/**
 * GET /api/events/[id]
 * Retrieves a single event by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const event = await prisma.event.findUnique({ where: { id } })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(event, { status: 200 })
  } catch (error) {
    console.error('Error fetching event:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId: (await params).id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/events/[id]
 * Updates an existing event.
 *
 * Requires authentication AND a SUPER_ADMIN or CONTENT_EDITOR role.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
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

    const body = await request.json()
    const validation = updateEventSchema.safeParse(body)

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

    const existing = await prisma.event.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Normalize empty strings to null for optional fields when present
    const data = validation.data
    const updateData: Record<string, unknown> = { ...data }
    for (const key of [
      'time',
      'location',
      'imageSrc',
      'imageAlt',
      'registrationHref',
    ] as const) {
      if (key in data) {
        updateData[key] = nullIfEmpty(data[key])
      }
    }

    const updated = await prisma.event.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Error updating event:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId: id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/events/[id]
 * Deletes an event permanently.
 *
 * Requires authentication AND a SUPER_ADMIN or CONTENT_EDITOR role.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
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

    const existing = await prisma.event.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    await prisma.event.delete({ where: { id } })

    return NextResponse.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting event:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId: id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
