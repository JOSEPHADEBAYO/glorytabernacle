import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  VOLUNTEER_INTEREST_ADMIN_ROLES,
  type VolunteerInterestAdminRole,
} from '@/lib/types/volunteer-interest'

function isAdmin(
  role: string | undefined
): role is VolunteerInterestAdminRole {
  return VOLUNTEER_INTEREST_ADMIN_ROLES.includes(
    role as VolunteerInterestAdminRole
  )
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.volunteerInterest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Volunteer interest not found' },
        { status: 404 }
      )
    }

    await prisma.volunteerInterest.delete({ where: { id } })

    return NextResponse.json(
      { message: 'Volunteer interest deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting volunteer interest:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      interestId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
