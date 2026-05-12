import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { updateInformationSchema } from '@/lib/validation/information'
import {
  INFORMATION_ADMIN_ROLES,
  type InformationAdminRole,
} from '@/lib/types/information'

function isAdmin(role: string | undefined): role is InformationAdminRole {
  return INFORMATION_ADMIN_ROLES.includes(role as InformationAdminRole)
}

function nullIfEmpty(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined
  return value.trim().length > 0 ? value.trim() : null
}

async function requireAdmin() {
  const token = await getSessionToken()
  if (!token) return null
  const user = await getSessionUser(token)
  if (!user || !isAdmin(user.role)) return null
  return user
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validation = updateInformationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const existing = await prisma.informationItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Information item not found' }, { status: 404 })
    }

    const data = validation.data
    const updated = await prisma.informationItem.update({
      where: { id },
      data: {
        ...data,
        submittedBy: nullIfEmpty(data.submittedBy),
        submitterEmail: nullIfEmpty(data.submitterEmail),
      },
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Error updating information item:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      itemId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.informationItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Information item not found' }, { status: 404 })
    }

    await prisma.informationItem.delete({ where: { id } })

    return NextResponse.json(
      { message: 'Information item deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting information item:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      itemId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
