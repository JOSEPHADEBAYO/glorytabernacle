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
 * Generate a zero-padded 6-digit code (000000 — 999999). 1M values is
 * plenty for a code that lives only as long as one drop-off/pick-up cycle
 * and is scoped to a specific child.
 */
function generatePickupCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
}

/**
 * POST /api/admin/children/[id]/check-in
 *
 * The Children Leader (or SUPER_ADMIN) signs a child IN. Generates a
 * 6-digit pickup code, stores it on the new check-in row, and emails it
 * to the primary guardian. The code is required at sign-out.
 *
 * Idempotent: if the child already has an open check-in, that existing
 * row is returned untouched and no new code is generated.
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

    if (!child.approved) {
      return NextResponse.json(
        {
          error:
            "This child is awaiting approval and cannot be signed in yet. Approve them from the Pending tab first.",
        },
        { status: 409 }
      )
    }

    // Idempotency: if there's an open (not yet signed-out) check-in for this
    // child, just return it.
    const existingOpen = await prisma.childCheckIn.findFirst({
      where: { childId: id, signedOutAt: null },
      orderBy: { signedInAt: 'desc' },
    })
    if (existingOpen) {
      return NextResponse.json(
        {
          checkIn: existingOpen,
          alreadyOpen: true,
          // Surface whether the existing record has a code so the UI can
          // offer a "resend" action if email delivery is uncertain.
          hasPickupCode: Boolean(existingOpen.pickupCode),
        },
        { status: 200 }
      )
    }

    const pickupCode = generatePickupCode()

    const checkIn = await prisma.childCheckIn.create({
      data: {
        childId: id,
        signedInById: user.id,
        pickupCode,
      },
    })

    // Email the code to the primary guardian. If the email fails (no
    // address, transient Resend error, etc.) we still keep the check-in;
    // the leader can use "Resend code" later or the SUPER_ADMIN can look
    // it up. Surface the outcome so the UI can warn appropriately.
    let emailSent = false
    let emailError: string | null = null
    if (child.primaryGuardianEmail) {
      const result = await sendPickupCodeEmail({
        childFirstName: child.firstName,
        childLastName: child.lastName,
        guardianName: child.primaryGuardianName,
        guardianEmail: child.primaryGuardianEmail,
        code: pickupCode,
        signedInAt: checkIn.signedInAt,
      })
      if (result.ok) {
        emailSent = true
      } else {
        emailError = result.reason
      }
    } else {
      emailError = 'No primary-guardian email on file.'
    }

    return NextResponse.json(
      {
        checkIn,
        alreadyOpen: false,
        emailSent,
        emailError,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error checking child in (admin):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
