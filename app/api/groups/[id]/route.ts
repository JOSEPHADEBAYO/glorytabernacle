import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { updateGroupSchema } from '@/lib/validation/group'
import { GROUP_ADMIN_ROLES, type GroupAdminRole } from '@/lib/types/group'


function isGroupAdmin(role: string | undefined): role is GroupAdminRole {
  return GROUP_ADMIN_ROLES.includes(role as GroupAdminRole)
}

function nullIfEmpty(value: string | undefined | null): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (value.trim() === '') return null
  return value
}

function dbNullIfMissing(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull | undefined {
  if (value === undefined) return undefined
  if (value === null) return Prisma.DbNull
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  )
}

/**
 * GET /api/groups/[id]
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

    const { id } = await params
    const group = await prisma.group.findUnique({ where: { id } })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }
    return NextResponse.json(group, { status: 200 })
  } catch (error) {
    console.error('Error fetching group:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      groupId: (await params).id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/groups/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isGroupAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = updateGroupSchema.safeParse(body)

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const existing = await prisma.group.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Normalize empty optional strings to null where applicable.
    const data = validation.data
    const updateData: Record<string, unknown> = { ...data }
    for (const key of [
      'tag',
      'ctaLabel',
      'ctaHref',
      'scripture',
      'headTitle',
      'furnishStatement',
      'transformStatement',
      'influenceStatement',
    ] as const) {
      if (key in data) {
        updateData[key] = nullIfEmpty(data[key])
      }
    }
    for (const key of ['responsibilities', 'programmes', 'specialRole'] as const) {
      if (key in data) {
        updateData[key] = dbNullIfMissing(data[key])
      }
    }

    try {
      const updated = await prisma.group.update({
        where: { id },
        data: updateData,
      })
      return NextResponse.json(updated, { status: 200 })
    } catch (err) {
      if (isUniqueViolation(err)) {
        return NextResponse.json(
          {
            error: 'A group with this slug already exists',
            details: ['Slug must be unique. Try a different value.'],
          },
          { status: 409 }
        )
      }
      throw err
    }
  } catch (error) {
    console.error('Error updating group:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      groupId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/groups/[id]
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

    if (!isGroupAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.group.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    await prisma.group.delete({ where: { id } })

    return NextResponse.json(
      { message: 'Group deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting group:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      groupId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
