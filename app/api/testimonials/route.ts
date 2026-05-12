import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  createTestimonialSchema,
  testimonialQuerySchema,
} from '@/lib/validation/testimonial'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  TESTIMONIAL_ADMIN_ROLES,
  type TestimonialAdminRole,
} from '@/lib/types/testimonial'

function isAdmin(role: string | undefined): role is TestimonialAdminRole {
  return TESTIMONIAL_ADMIN_ROLES.includes(role as TestimonialAdminRole)
}

/**
 * POST /api/testimonials
 * Creates a new testimonial. Requires SUPER_ADMIN or CONTENT_EDITOR.
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = createTestimonialSchema.safeParse(body)

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const data = validation.data
    const testimonial = await prisma.testimonial.create({
      data: {
        quote: data.quote,
        name: data.name,
        memberSince: data.memberSince,
        order: data.order ?? 0,
        published: data.published,
        createdBy: user.id,
      },
    })

    return NextResponse.json(testimonial, { status: 201 })
  } catch (error) {
    console.error('Error creating testimonial:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/testimonials
 * Lists testimonials. Auth required.
 * Supports ?published=true|false. Ordered by `order` asc then createdAt desc.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const validation = testimonialQuerySchema.safeParse({
      published: searchParams.get('published') ?? undefined,
    })

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const whereClause: { published?: boolean } = {}
    if (validation.data.published !== undefined) {
      whereClause.published = validation.data.published === 'true'
    }

    const testimonials = await prisma.testimonial.findMany({
      where: whereClause,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ testimonials }, { status: 200 })
  } catch (error) {
    console.error('Error fetching testimonials:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
