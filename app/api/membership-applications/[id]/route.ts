import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  MEMBERSHIP_APPLICATION_ADMIN_ROLES,
  type MembershipApplicationAdminRole,
} from '@/lib/types/membership-application'

function isAdmin(
  role: string | undefined
): role is MembershipApplicationAdminRole {
  return MEMBERSHIP_APPLICATION_ADMIN_ROLES.includes(
    role as MembershipApplicationAdminRole
  )
}

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

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.membershipApplication.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Membership application not found' },
        { status: 404 }
      )
    }

    await prisma.membershipApplication.delete({ where: { id } })

    return NextResponse.json(
      { message: 'Membership application deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting membership application:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      applicationId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
