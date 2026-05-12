import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentUser } from '@/lib/auth/parent-session'
import { checkOutSchema } from '@/lib/validation/child'

/**
 * POST /api/parents/me/check-out
 *
 * Body: { checkInIds: string[] }
 *
 * Closes the supplied open check-ins (sets signedOutAt + signedOutById).
 * Authorization rule: any registered parent of the child may sign them out
 * — not just the parent who signed them in. Foreign IDs (other parents'
 * children) are silently skipped.
 *
 * Idempotent: already-closed check-ins are left alone.
 *
 * Returns 200 with { signedOut: number, alreadyOut: number, skipped: number }.
 */
export async function POST(request: NextRequest) {
  try {
    const parent = await getParentUser()
    if (!parent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const validation = checkOutSchema.safeParse(body)
    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const requestedIds = Array.from(new Set(validation.data.checkInIds))

    // Pull the check-ins along with the child's parent list. We only allow
    // the close if the requester is one of that child's registered parents.
    const checkIns = await prisma.childCheckIn.findMany({
      where: { id: { in: requestedIds } },
      include: { child: { select: { parents: { select: { id: true } } } } },
    })

    

    const allowed = checkIns.filter(
  (c: any) => c.child.parents.some((p: any) => p.id === parent.id)
)

const skipped = requestedIds.length - allowed.length

const open = allowed.filter((c: any) => c.signedOutAt === null)

const alreadyOut = allowed.length - open.length

if (open.length > 0) {
  await prisma.childCheckIn.updateMany({
    where: { id: { in: open.map((c: any) => c.id) } },
    data: {
      signedOutAt: new Date(),
      signedOutById: parent.id,
    },
  })
}

    return NextResponse.json(
      { signedOut: open.length, alreadyOut, skipped },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error signing children out:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
