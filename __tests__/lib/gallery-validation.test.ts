/**
 * Unit tests for the Gallery Zod validation schemas.
 */

import { describe, it, expect } from 'vitest'
import {
  createGallerySchema,
  updateGallerySchema,
  galleryQuerySchema,
} from '@/lib/validation/gallery'

const validCreate = {
  title: 'Sunday Service',
  description: 'A spirit-filled morning of worship at the main sanctuary.',
  imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  imageAlt: 'Worship team leading praise',
  dateTaken: '2026-04-26',
}

describe('createGallerySchema', () => {
  it('accepts a valid payload and defaults published to false', () => {
    const result = createGallerySchema.safeParse(validCreate)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.published).toBe(false)
      expect(result.data.dateTaken).toBeInstanceOf(Date)
    }
  })

  it('rejects empty title', () => {
    const result = createGallerySchema.safeParse({ ...validCreate, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty description', () => {
    const result = createGallerySchema.safeParse({ ...validCreate, description: '' })
    expect(result.success).toBe(false)
  })

  it('rejects malformed imageUrl', () => {
    const result = createGallerySchema.safeParse({
      ...validCreate,
      imageUrl: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty imageAlt', () => {
    const result = createGallerySchema.safeParse({ ...validCreate, imageAlt: '' })
    expect(result.success).toBe(false)
  })

  it('rejects unparseable dateTaken', () => {
    const result = createGallerySchema.safeParse({
      ...validCreate,
      dateTaken: 'banana',
    })
    expect(result.success).toBe(false)
  })

  it('coerces ISO datetime string to Date', () => {
    const result = createGallerySchema.safeParse({
      ...validCreate,
      dateTaken: '2026-04-26T10:30:00Z',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.dateTaken).toBeInstanceOf(Date)
  })
})

describe('updateGallerySchema', () => {
  it('accepts a single-field update', () => {
    const result = updateGallerySchema.safeParse({ published: true })
    expect(result.success).toBe(true)
  })

  it('rejects an empty object', () => {
    const result = updateGallerySchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('validates field constraints when fields are provided', () => {
    const result = updateGallerySchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })
})

describe('galleryQuerySchema', () => {
  it('accepts no params', () => {
    const result = galleryQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts published=true / published=false', () => {
    expect(galleryQuerySchema.safeParse({ published: 'true' }).success).toBe(true)
    expect(galleryQuerySchema.safeParse({ published: 'false' }).success).toBe(true)
  })

  it('rejects invalid published value', () => {
    expect(galleryQuerySchema.safeParse({ published: 'banana' }).success).toBe(false)
  })
})
