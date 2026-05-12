import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { submitAttendanceSchema } from '@/lib/validation/attendance'

/**
 * POST /api/attendance
 *
 * Public endpoint — no auth required. Anyone walking up to a Sunday
 * service or midweek meeting submits their name, email, and the service
 * they attended.
 *
 * Returns:
 *   - 200 { recorded: true }
 *   - 400 on validation failure
 *   - 500 on internal error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const validation = submitAttendanceSchema.safeParse(body)

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const data = validation.data
    await prisma.adultAttendance.create({
      data: {
        name: data.name,
        email: data.email,
        service: data.service,
      },
    })

    return NextResponse.json({ recorded: true }, { status: 200 })
  } catch (error) {
    console.error('Error recording attendance:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
