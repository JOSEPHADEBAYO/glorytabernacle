import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  CHILDREN_ADMIN_ROLES,
  type ChildrenAdminRole,
} from '@/lib/types/child'
import { sendPickupCodeEmail } from '@/lib/email/send-pickup-code-email'

function isAdmin(role: string | undefined): role is ChildrenAdminRole {
  return CHILDREN_ADMIN_ROLES.includes(role as ChildrenAdminRole)
}

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/children/[id]/resend-pickup-code
 *
 * Re-emails the current open check-in's existing pickup code to the
 * primary guardian. Useful when the original email is lost, filtered to
 * spam, or never arrived.
 *
 * Returns 409 if the child has no open check-in, 422 if the open check-in
 * has no stored code, 422 if the primary guardian has no email on file.
 * Restricted to CHILDREN_LEADER + SUPER_ADMIN.
 */
export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const child = await prisma.child.findUnique({ where: { id } })
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const open = await prisma.childCheckIn.findFirst({
      where: { childId: id, signedOutAt: null },
      orderBy: { signedInAt: 'desc' },
    })
    if (!open) {
      return NextResponse.json(
        { error: 'No open check-in for this child' },
        { status: 409 }
      )
    }
    if (!open.pickupCode) {
      return NextResponse.json(
        {
          error:
            'No pickup code is stored for this check-in. Contact a Super Admin.',
        },
        { status: 422 }
      )
    }
    if (!child.primaryGuardianEmail) {
      return NextResponse.json(
        {
          error:
            'No primary-guardian email on file for this child. Edit the child to add one.',
        },
        { status: 422 }
      )
    }

    const result = await sendPickupCodeEmail({
      childFirstName: child.firstName,
      childLastName: child.lastName,
      guardianName: child.primaryGuardianName,
      guardianEmail: child.primaryGuardianEmail,
      code: open.pickupCode,
      signedInAt: open.signedInAt,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 502 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error resending pickup code:', {
      error: error instanceof Error ? error.message : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
