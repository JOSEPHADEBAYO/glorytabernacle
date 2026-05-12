/**
 * Unit tests for the Testimonial Zod validation schemas.
 */

import { describe, it, expect } from 'vitest'
import {
  createTestimonialSchema,
  updateTestimonialSchema,
  testimonialQuerySchema,
} from '@/lib/validation/testimonial'

const validCreate = {
  quote: 'I came to Glory Tabernacle and found my purpose.',
  name: 'Sarah Johnson',
  memberSince: 2023,
}

describe('createTestimonialSchema', () => {
  it('accepts a minimal valid payload', () => {
    const r = createTestimonialSchema.safeParse(validCreate)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.published).toBe(false)
  })

  it('rejects empty quote', () => {
    expect(createTestimonialSchema.safeParse({ ...validCreate, quote: '' }).success).toBe(false)
  })

  it('rejects empty name', () => {
    expect(createTestimonialSchema.safeParse({ ...validCreate, name: '' }).success).toBe(false)
  })

  it('rejects memberSince before 1900', () => {
    expect(
      createTestimonialSchema.safeParse({ ...validCreate, memberSince: 1899 }).success
    ).toBe(false)
  })

  it('rejects memberSince more than one year in future', () => {
    const future = new Date().getFullYear() + 5
    expect(
      createTestimonialSchema.safeParse({ ...validCreate, memberSince: future }).success
    ).toBe(false)
  })

  it('accepts memberSince = current year + 1', () => {
    const next = new Date().getFullYear() + 1
    expect(
      createTestimonialSchema.safeParse({ ...validCreate, memberSince: next }).success
    ).toBe(true)
  })

  it('coerces string memberSince to number', () => {
    const r = createTestimonialSchema.safeParse({ ...validCreate, memberSince: '2024' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.memberSince).toBe(2024)
  })

  it('rejects non-integer memberSince', () => {
    expect(
      createTestimonialSchema.safeParse({ ...validCreate, memberSince: 2023.5 }).success
    ).toBe(false)
  })
})

describe('updateTestimonialSchema', () => {
  it('accepts single-field update', () => {
    expect(updateTestimonialSchema.safeParse({ published: true }).success).toBe(true)
  })

  it('rejects empty object', () => {
    expect(updateTestimonialSchema.safeParse({}).success).toBe(false)
  })

  it('validates memberSince when provided', () => {
    expect(
      updateTestimonialSchema.safeParse({ memberSince: 1800 }).success
    ).toBe(false)
  })
})

describe('testimonialQuerySchema', () => {
  it('accepts no params', () => {
    expect(testimonialQuerySchema.safeParse({}).success).toBe(true)
  })

  it('accepts published true / false', () => {
    expect(testimonialQuerySchema.safeParse({ published: 'true' }).success).toBe(true)
    expect(testimonialQuerySchema.safeParse({ published: 'false' }).success).toBe(true)
  })

  it('rejects invalid published value', () => {
    expect(testimonialQuerySchema.safeParse({ published: 'banana' }).success).toBe(false)
  })
})
