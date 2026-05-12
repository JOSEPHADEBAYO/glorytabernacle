import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  createHeroCarouselImageSchema,
  heroCarouselQuerySchema,
} from '@/lib/validation/hero-carousel'
import {
  HERO_CAROUSEL_ADMIN_ROLES,
  type HeroCarouselAdminRole,
} from '@/lib/types/hero-carousel'

function isHeroCarouselAdmin(
  role: string | undefined
): role is HeroCarouselAdminRole {
  return HERO_CAROUSEL_ADMIN_ROLES.includes(role as HeroCarouselAdminRole)
}

export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const validation = heroCarouselQuerySchema.safeParse({
      published: searchParams.get('published') ?? undefined,
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

    const where =
      validation.data.published === undefined
        ? {}
        : { published: validation.data.published === 'true' }

    const images = await prisma.heroCarouselImage.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ images }, { status: 200 })
  } catch (error) {
    console.error('Error fetching hero carousel images:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    if (!isHeroCarouselAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = createHeroCarouselImageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const image = await prisma.heroCarouselImage.create({
      data: {
        ...validation.data,
        createdBy: user.id,
      },
    })

    return NextResponse.json(image, { status: 201 })
  } catch (error) {
    console.error('Error creating hero carousel image:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
