import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentUser } from '@/lib/auth/parent-session'
import { createChildSchema } from '@/lib/validation/child'

/**
 * Convert empty string to null for optional fields so the database stores
 * proper NULL rather than empty strings.
 */
function nullIfEmpty(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null
  if (value.trim() === '') return null
  return value
}

/**
 * GET /api/parents/me/children
 * Lists the children registered to the signed-in parent.
 */
export async function GET() {
  try {
    const parent = await getParentUser()
    if (!parent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const children = await prisma.child.findMany({
      where: { parents: { some: { id: parent.id } } },
      orderBy: { firstName: 'asc' },
      include: {
        // Open check-ins (signedOutAt = null) for the "currently signed in"
        // indicator on the parent dashboard.
        checkIns: {
          where: { signedOutAt: null },
          orderBy: { signedInAt: 'desc' },
          take: 1,
        },
      },
    })

    return NextResponse.json({ children }, { status: 200 })
  } catch (error) {
    console.error('Error fetching parent children:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/parents/me/children
 * Registers a new child against the signed-in parent. The child is linked
 * to the parent via the M:M parents relation.
 */
export async function POST(request: NextRequest) {
  try {
    const parent = await getParentUser()
    if (!parent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createChildSchema.safeParse(body)
    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const data = validation.data
    const child = await prisma.child.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        allergies: nullIfEmpty(data.allergies),
        medicalNotes: nullIfEmpty(data.medicalNotes),
        specialNeeds: nullIfEmpty(data.specialNeeds),
        photoUrl: nullIfEmpty(data.photoUrl),
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        parents: { connect: { id: parent.id } },
      },
    })

    return NextResponse.json(child, { status: 201 })
  } catch (error) {
    console.error('Error registering child:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
