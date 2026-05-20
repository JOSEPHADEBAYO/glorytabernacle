import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/users/[id]/dsl
 *
 * Toggle a user's Designated Safeguarding Lead flag. SUPER_ADMIN only.
 * Body: { isDesignatedSafeguardingLead: boolean }
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    })
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only super admins can change the safeguarding-lead flag' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json().catch(() => null)
    const flag = body?.isDesignatedSafeguardingLead
    if (typeof flag !== 'boolean') {
      return NextResponse.json(
        { error: 'isDesignatedSafeguardingLead (boolean) is required' },
        { status: 400 }
      )
    }

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isDesignatedSafeguardingLead: flag },
      select: { id: true, isDesignatedSafeguardingLead: true },
    })

    return NextResponse.json({ success: true, user: updated }, { status: 200 })
  } catch (error) {
    console.error('Error toggling DSL flag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
