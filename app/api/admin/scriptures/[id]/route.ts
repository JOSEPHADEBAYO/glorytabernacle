import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken } from '@/lib/auth/session'
import { updateDailyScriptureSchema } from '@/lib/validation/youth'

/**
 * PUT /api/admin/scriptures/[id]
 * Updates a daily scripture (admin only).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.dailyScripture.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Scripture not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const validation = updateDailyScriptureSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues.map((e) => e.message) },
        { status: 400 }
      )
    }

    const { date, ...rest } = validation.data
    const scripture = await prisma.dailyScripture.update({
      where: { id },
      data: {
        ...rest,
        ...(date ? { date: new Date(date) } : {}),
      },
    })

    return NextResponse.json({ scripture }, { status: 200 })
  } catch (error) {
    console.error('Error updating scripture:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/scriptures/[id]
 * Deletes a daily scripture (admin only).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.dailyScripture.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Scripture not found' }, { status: 404 })
    }

    await prisma.dailyScripture.delete({ where: { id } })
    return NextResponse.json({ message: 'Scripture deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting scripture:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
