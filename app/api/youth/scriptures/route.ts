import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getYouthUser } from '@/lib/auth/youth-session'
import { scriptureQuerySchema } from '@/lib/validation/youth'

/**
 * GET /api/youth/scriptures
 * Returns published daily scriptures ordered by date descending.
 * Requires youth authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const youth = await getYouthUser()
    if (!youth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = scriptureQuerySchema.safeParse({
      published: searchParams.get('published') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    })

    const limit = query.success ? query.data.limit : 10
    const publishedFilter = query.success && query.data.published !== undefined
      ? query.data.published === 'true'
      : true // default: only published

    const scriptures = await prisma.dailyScripture.findMany({
      where: { published: publishedFilter },
      orderBy: { date: 'desc' },
      take: limit,
    })

    return NextResponse.json({ scriptures }, { status: 200 })
  } catch (error) {
    console.error('Error fetching scriptures:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
