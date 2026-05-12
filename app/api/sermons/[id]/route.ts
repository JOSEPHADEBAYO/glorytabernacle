import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { normalizeSeries, updateSermonSchema } from '@/lib/validation/sermon'

async function requireUser() {
  const token = await getSessionToken()
  if (!token) return null
  return getSessionUser(token)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sermon = await (prisma.sermon as any).findUnique({ where: { id } })
    if (!sermon) {
      return NextResponse.json({ error: 'Sermon not found' }, { status: 404 })
    }

    return NextResponse.json(sermon, { status: 200 })
  } catch (error) {
    console.error('Error fetching sermon:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sermonId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validation = updateSermonSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const existing = await (prisma.sermon as any).findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Sermon not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = { ...validation.data }
    if ('series' in data) {
      data.series = normalizeSeries(data.series as string | null | undefined)
    }

    const updated = await (prisma.sermon as any).update({
      where: { id },
      data,
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Error updating sermon:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sermonId: id,
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
    const user = await requireUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await (prisma.sermon as any).findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Sermon not found' }, { status: 404 })
    }

    await (prisma.sermon as any).delete({ where: { id } })

    return NextResponse.json(
      { message: 'Sermon deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting sermon:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sermonId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
