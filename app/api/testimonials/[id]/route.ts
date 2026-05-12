import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { updateTestimonialSchema } from '@/lib/validation/testimonial'
import {
  TESTIMONIAL_ADMIN_ROLES,
  type TestimonialAdminRole,
} from '@/lib/types/testimonial'

function isAdmin(role: string | undefined): role is TestimonialAdminRole {
  return TESTIMONIAL_ADMIN_ROLES.includes(role as TestimonialAdminRole)
}

/**
 * GET /api/testimonials/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const testimonial = await prisma.testimonial.findUnique({ where: { id } })

    if (!testimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
    }
    return NextResponse.json(testimonial, { status: 200 })
  } catch (error) {
    console.error('Error fetching testimonial:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      testimonialId: (await params).id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/testimonials/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = updateTestimonialSchema.safeParse(body)

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const existing = await prisma.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
    }

    const updated = await prisma.testimonial.update({
      where: { id },
      data: validation.data,
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Error updating testimonial:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      testimonialId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/testimonials/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
    }

    await prisma.testimonial.delete({ where: { id } })

    return NextResponse.json(
      { message: 'Testimonial deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting testimonial:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      testimonialId: id,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
