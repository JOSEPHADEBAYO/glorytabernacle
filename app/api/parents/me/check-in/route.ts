import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentUser } from '@/lib/auth/parent-session'
import { checkInSchema } from '@/lib/validation/child'

/**
 * POST /api/parents/me/check-in
 *
 * Body: { childIds: string[] }
 *
 * Creates one open ChildCheckIn per supplied child. Verifies every child
 * actually belongs to the signed-in parent — silently skips foreign IDs.
 *
 * Idempotent across already-signed-in children: if a child is already
 * checked in (open check-in exists), we don't create a duplicate.
 *
 * Returns 200 with { signedIn: number, alreadyIn: number, skipped: number }.
 */
export async function POST(request: NextRequest) {
  try {
    const parent = await getParentUser()
    if (!parent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const validation = checkInSchema.safeParse(body)
    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const requestedIds = Array.from(new Set(validation.data.childIds))

    // Authorization: only this parent's children can be acted on.
    const owned = await prisma.child.findMany({
      where: {
        id: { in: requestedIds },
        parents: { some: { id: parent.id } },
      },
      select: { id: true },
    })
    const ownedIds = owned.map((c) => c.id)
    const skipped = requestedIds.length - ownedIds.length

    if (ownedIds.length === 0) {
      return NextResponse.json(
        { signedIn: 0, alreadyIn: 0, skipped },
        { status: 200 }
      )
    }

    // Skip children who already have an open check-in.
    const alreadyOpen = await prisma.childCheckIn.findMany({
      where: { childId: { in: ownedIds }, signedOutAt: null },
      select: { childId: true },
    })
    const alreadyOpenIds = new Set(alreadyOpen.map((c) => c.childId))
    const toSignIn = ownedIds.filter((id) => !alreadyOpenIds.has(id))

    if (toSignIn.length > 0) {
      await prisma.childCheckIn.createMany({
        data: toSignIn.map((childId) => ({
          childId,
          signedInById: parent.id,
        })),
      })
    }

    return NextResponse.json(
      {
        signedIn: toSignIn.length,
        alreadyIn: alreadyOpenIds.size,
        skipped,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error signing children in:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
