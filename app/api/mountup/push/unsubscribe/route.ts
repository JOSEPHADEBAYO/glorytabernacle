import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/mountup/push/unsubscribe
 *
 * Removes a Mount Up subscription by its push endpoint. Public (no auth) —
 * the endpoint string is the user's own browser push URL, so possession is
 * sufficient proof. Idempotent: deleting a non-existent endpoint returns 200
 * with deleted=false rather than 404, so the client can call this without
 * caring about the prior state.
 */
const schema = z.object({
  endpoint: z.string().url(),
})

export async function POST(request: NextRequest) {
  let parsed
  try {
    const body = await request.json()
    parsed = schema.safeParse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'endpoint is required' },
      { status: 400 }
    )
  }

  try {
    const result = await prisma.pushSubscription.deleteMany({
      where: { endpoint: parsed.data.endpoint, topic: 'MOUNT_UP' },
    })
    return NextResponse.json({ deleted: result.count > 0 }, { status: 200 })
  } catch (err) {
    console.error('Mount Up unsubscribe error:', err)
    return NextResponse.json(
      { error: 'Could not update your reminder settings.' },
      { status: 500 }
    )
  }
}
