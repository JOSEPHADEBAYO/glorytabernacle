import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { joinGroupSchema } from '@/lib/validation/group-member'
import { sendGroupMemberNotification } from '@/lib/email/send-group-member-notification'

/**
 * POST /api/groups/[id]/join
 *
 * Public endpoint — no authentication required.
 * Persists a new GroupMember row from the "Get Involved" form on the
 * group/ministry detail page, then fires an admin notification email
 * (failure is logged but does NOT fail the request).
 *
 * Returns:
 * - 200 on success ({ submitted: true })
 * - 400 on validation failure
 * - 404 if the group does not exist or is not published
 * - 500 on internal error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // 1. Validate body
    const body = await request.json().catch(() => ({}))
    const validation = joinGroupSchema.safeParse(body)

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    // 2. Verify group exists and is published. We treat unpublished as 404
    //    so we don't leak the existence of draft ministries.
    const group = await prisma.group.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true, published: true },
    })

    if (!group || !group.published) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // 3. Create member row.
    const data = validation.data
    const member = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        birthDay: data.birthDay,
        birthMonth: data.birthMonth,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        address: data.address,
        filledWithHolyGhost: data.filledWithHolyGhost,
      },
    })

    // 4. Fire-and-log admin notification. Email failures should not fail
    //    the user-facing submission — the member was already saved.
    sendGroupMemberNotification({
      group: { id: group.id, title: group.title, slug: group.slug },
      member: {
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phoneNumber: member.phoneNumber,
        birthDay: member.birthDay,
        birthMonth: member.birthMonth,
        gender: member.gender,
        maritalStatus: member.maritalStatus,
        address: member.address,
        filledWithHolyGhost: member.filledWithHolyGhost,
      },
    })
      .then((result) => {
        if (!result.ok) {
          console.warn('Group member admin notification failed:', result.detail)
        }
      })
      .catch((err) => {
        console.warn('Group member admin notification threw:', err)
      })

    return NextResponse.json({ submitted: true }, { status: 200 })
  } catch (error) {
    console.error('Error submitting group join form:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      groupId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
