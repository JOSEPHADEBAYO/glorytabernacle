import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const publicTestimonialSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  quote: z
    .string()
    .trim()
    .min(10, 'Testimony must be at least 10 characters')
    .max(2000, 'Testimony too long'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = publicTestimonialSchema.safeParse(body)

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const data = validation.data
    const currentYear = new Date().getFullYear()

    await prisma.testimonial.create({
      data: {
        quote: data.quote,
        name: data.name,
        memberSince: currentYear,
        order: 0,
        published: false,
        createdBy: 'public',
      },
    })

    return NextResponse.json(
      { success: true, message: 'Testimony submitted for review. Thank you!' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Public testimonial error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
