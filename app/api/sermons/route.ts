import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { createSermonSchema, normalizeSeries, sermonQuerySchema } from '@/lib/validation/sermon'

type SermonRouteRow = {
  id: string
  title: string
  series: string | null
  speaker: string
  date: Date
  duration: string
  description: string
  thumbnail: string
  videoUrl: string
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

type SermonWhere = {
  published?: boolean
  series?: string
  title?: {
    contains: string
    mode: 'insensitive'
  }
}

async function requireUser() {
  const token = await getSessionToken()
  if (!token) return null
  return getSessionUser(token)
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validation = createSermonSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const data = validation.data
    const sermon = await (prisma.sermon as any).create({
      data: {
        title: data.title,
        series: normalizeSeries(data.series),
        speaker: data.speaker,
        date: data.date,
        duration: data.duration,
        description: data.description,
        thumbnail: data.thumbnail,
        videoUrl: data.videoUrl,
        published: data.published,
        createdBy: user.id,
      },
    })

    return NextResponse.json(sermon, { status: 201 })
  } catch (error) {
    console.error('Error creating sermon:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const validation = sermonQuerySchema.safeParse({
      published: searchParams.get('published') ?? undefined,
      series: searchParams.get('series') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const where: SermonWhere = {}
    if (validation.data.published !== undefined) {
      where.published = validation.data.published === 'true'
    }
    if (validation.data.series) {
      where.series = validation.data.series
    }
    if (validation.data.search) {
      where.title = {
        contains: validation.data.search,
        mode: 'insensitive',
      }
    }

    const sermons: SermonRouteRow[] = await prisma.sermon.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ sermons }, { status: 200 })
  } catch (error) {
    console.error('Error fetching sermons:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
