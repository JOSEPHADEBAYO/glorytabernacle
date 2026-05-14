import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateSession, getSessionToken, getSessionUser } from '@/lib/auth/session'
import { createDailyScriptureSchema, scriptureQuerySchema } from '@/lib/validation/youth'

/**
 * GET /api/admin/scriptures
 * Lists all daily scriptures (admin only).
 */
export async function GET(request: NextRequest) {
  try {
    const isValid = await validateSession()
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = scriptureQuerySchema.safeParse({
      published: searchParams.get('published') ?? undefined,
      limit: searchParams.get('limit') ?? '50',
    })

    const publishedFilter =
      query.success && query.data.published !== undefined
        ? query.data.published === 'true'
        : undefined

    const scriptures = await prisma.dailyScripture.findMany({
      where: publishedFilter !== undefined ? { published: publishedFilter } : {},
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ scriptures }, { status: 200 })
  } catch (error) {
    console.error('Error fetching scriptures (admin):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/scriptures
 * Creates a new daily scripture (admin only).
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const validation = createDailyScriptureSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues.map((e) => e.message) },
        { status: 400 }
      )
    }

    const { date, reference, text, videoUrl, published } = validation.data

    const scripture = await prisma.dailyScripture.create({
      data: {
        date: new Date(date),
        reference,
        text,
        videoUrl: videoUrl || null,
        published,
        createdBy: user.id,
      },
    })

    return NextResponse.json({ scripture }, { status: 201 })
  } catch (error) {
    console.error('Error creating scripture:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
