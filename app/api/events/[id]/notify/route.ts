import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subscribeNotificationSchema } from '@/lib/validation/event-notification'

/**
 * POST /api/events/[id]/notify
 *
 * Public endpoint — no authentication required.
 * Visitors who click "Get Notified" on the homepage submit their name + email
 * to subscribe to a reminder for a specific event.
 *
 * Idempotent: if the same email subscribes again for the same event, the row
 * is upserted (name updated, notifiedAt reset to null so a re-subscriber will
 * get the next reminder if the cron hasn't fired yet).
 *
 * Returns:
 * - 200 on success (with { subscribed: true })
 * - 400 on validation failure
 * - 404 if event does not exist
 * - 422 if event is already in the past
 * - 500 on internal error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // 1. Validate request body
    const body = await request.json().catch(() => ({}))
    const validation = subscribeNotificationSchema.safeParse(body)

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    // 2. Verify event exists and hasn't already passed
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, date: true, published: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.date.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'This event has already started or passed' },
        { status: 422 }
      )
    }

    // 3. Upsert subscription. The unique (eventId, email) constraint means
    //    a duplicate submission updates rather than throws.
    const { name, email } = validation.data

    await prisma.eventNotification.upsert({
      where: { eventId_email: { eventId: id, email } },
      create: {
        eventId: id,
        name,
        email,
      },
      update: {
        name,
        // Reset notifiedAt so a re-subscription before the cron fires gets
        // the reminder once it does.
        notifiedAt: null,
      },
    })

    return NextResponse.json({ subscribed: true }, { status: 200 })
  } catch (error) {
    console.error('Error subscribing to event notification:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId: id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
