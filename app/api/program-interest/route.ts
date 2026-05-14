import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { submitProgramInterestSchema } from '@/lib/validation/program-interest'

/**
 * POST /api/program-interest
 *
 * Public endpoint — no auth. Anyone submits name + email via the
 * "Get Notified" modal. Idempotent: re-submissions with the same email
 * update the name and bump nothing else (the original createdAt is
 * preserved).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const validation = submitProgramInterestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((e) => e.message),
        },
        { status: 400 }
      )
    }

    const { name, email } = validation.data

    await prisma.programInterest.upsert({
      where: { email },
      create: { name, email },
      update: { name },
    })

    return NextResponse.json({ recorded: true }, { status: 200 })
  } catch (error) {
    console.error('Error recording program interest:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
