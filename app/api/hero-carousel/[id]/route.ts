import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { updateHeroCarouselImageSchema } from '@/lib/validation/hero-carousel'
import {
  HERO_CAROUSEL_ADMIN_ROLES,
  type HeroCarouselAdminRole,
} from '@/lib/types/hero-carousel'

function isHeroCarouselAdmin(
  role: string | undefined
): role is HeroCarouselAdminRole {
  return HERO_CAROUSEL_ADMIN_ROLES.includes(role as HeroCarouselAdminRole)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const image = await prisma.heroCarouselImage.findUnique({ where: { id } })

    if (!image) {
      return NextResponse.json(
        { error: 'Hero carousel image not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(image, { status: 200 })
  } catch (error) {
    console.error('Error fetching hero carousel image:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      imageId: id,
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
    const validation = updateHeroCarouselImageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const existing = await prisma.heroCarouselImage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Hero carousel image not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.heroCarouselImage.update({
      where: { id },
      data: validation.data,
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Error updating hero carousel image:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      imageId: id,
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

    const existing = await prisma.heroCarouselImage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Hero carousel image not found' },
        { status: 404 }
      )
    }

    await prisma.heroCarouselImage.delete({ where: { id } })

    return NextResponse.json(
      { message: 'Hero carousel image deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting hero carousel image:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      imageId: id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
