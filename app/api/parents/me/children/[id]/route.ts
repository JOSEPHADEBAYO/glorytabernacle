import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParentUser } from '@/lib/auth/parent-session'
import { updateChildSchema } from '@/lib/validation/child'

function nullIfEmpty(
  value: string | undefined | null
): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (value.trim() === '') return null
  return value
}

/**
 * Confirm the requesting parent owns the given child. Returns the child
 * record on success; sends a 404 (NOT 403) on mismatch to avoid leaking
 * which child IDs exist.
 */
async function findChildOwnedByParent(childId: string, parentId: string) {
  return prisma.child.findFirst({
    where: {
      id: childId,
      parents: { some: { id: parentId } },
    },
  })
}

/**
 * GET /api/parents/me/children/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const parent = await getParentUser()
    if (!parent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const child = await findChildOwnedByParent(id, parent.id)
    if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

    return NextResponse.json(child, { status: 200 })
  } catch (error) {
    console.error('Error fetching child:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      childId: (await params).id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/parents/me/children/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const parent = await getParentUser()
    if (!parent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validation = updateChildSchema.safeParse(body)
    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const existing = await findChildOwnedByParent(id, parent.id)
    if (!existing) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const data = validation.data
    const updateData: Record<string, unknown> = { ...data }
    for (const key of [
      'allergies',
      'medicalNotes',
      'specialNeeds',
      'photoUrl',
    ] as const) {
      if (key in data) updateData[key] = nullIfEmpty(data[key])
    }

    const updated = await prisma.child.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Error updating child:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      childId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/parents/me/children/[id]
 *
 * Removes the parent-child link rather than the child record itself, since
 * the same child may be linked to other parents (married couple). The
 * Child row is deleted only when no parents remain.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const parent = await getParentUser()
    if (!parent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.child.findFirst({
      where: { id, parents: { some: { id: parent.id } } },
      include: { parents: { select: { id: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    if (existing.parents.length <= 1) {
      // Sole parent — remove the child record entirely.
      await prisma.child.delete({ where: { id } })
    } else {
      // Co-parented — just disconnect the requester so other parents keep access.
      await prisma.child.update({
        where: { id },
        data: { parents: { disconnect: { id: parent.id } } },
      })
    }

    return NextResponse.json({ message: 'Child removed' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting child:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      childId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
