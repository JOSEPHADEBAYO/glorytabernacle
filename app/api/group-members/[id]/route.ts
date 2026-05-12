import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  GROUP_MEMBER_ADMIN_ROLES,
  type GroupMemberAdminRole,
} from '@/lib/types/group-member'

function isAdmin(role: string | undefined): role is GroupMemberAdminRole {
  return GROUP_MEMBER_ADMIN_ROLES.includes(role as GroupMemberAdminRole)
}

/**
 * GET /api/group-members/[id]
 * Returns a single group-member submission with its parent group's title/slug.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const member = await prisma.groupMember.findUnique({
      where: { id },
      include: { group: { select: { id: true, slug: true, title: true } } },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    return NextResponse.json(member, { status: 200 })
  } catch (error) {
    console.error('Error fetching group member:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      memberId: (await params).id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/group-members/[id]
 * Removes a member submission. Auth: SUPER_ADMIN or CONTENT_EDITOR.
 */
export async function DELETE(
  request: NextRequest,
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

    const existing = await prisma.groupMember.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    await prisma.groupMember.delete({ where: { id } })

    return NextResponse.json({ message: 'Member deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting group member:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      memberId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
