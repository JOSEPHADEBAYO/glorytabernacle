import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth/parent-auth'

/**
 * POST /api/youth/register
 *
 * Called after Google sign-in from the youth portal.
 * Sets the authenticated user's role to YOUTH if they are currently PARENT or VIEWER.
 * This handles the case where the OAuth user was created with a different
 * role (e.g. legacy PARENT or default VIEWER) and is now signing in via
 * the youth portal.
 */
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, passwordHash: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Never touch admin users
    if (dbUser.passwordHash) {
      return NextResponse.json({ role: dbUser.role }, { status: 200 })
    }

    // Set to YOUTH if not already
    if (dbUser.role !== 'YOUTH') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: 'YOUTH' },
      })
    }

    return NextResponse.json({ role: 'YOUTH' }, { status: 200 })
  } catch (error) {
    console.error('Youth register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
