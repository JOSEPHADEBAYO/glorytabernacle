/**
 * Focused tests for the new `featured` and `featuredOrder` fields on the
 * Book validation schemas. The existing book-validation tests already
 * cover everything else; these only cover the additions.
 */

import { describe, it, expect } from 'vitest'
import {
  createBookSchema,
  updateBookSchema,
} from '@/lib/validation/book'

const baseValid = {
  title: 'A Book',
  author: 'An Author',
  category: 'Spiritual Growth' as const,
  description: 'A description.',
  coverImage: 'https://example.com/cover.jpg',
}

describe('createBookSchema — featured fields', () => {
  it('defaults featured to false and featuredOrder to 0 when omitted', () => {
    const r = createBookSchema.safeParse(baseValid)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.featured).toBe(false)
      expect(r.data.featuredOrder).toBe(0)
    }
  })

  it('accepts featured: true with explicit featuredOrder', () => {
    const r = createBookSchema.safeParse({
      ...baseValid,
      featured: true,
      featuredOrder: 1,
    })
    expect(r.success).toBe(true)
  })

  it('coerces string featuredOrder to number', () => {
    const r = createBookSchema.safeParse({
      ...baseValid,
      featuredOrder: '2',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.featuredOrder).toBe(2)
  })

  it('rejects negative featuredOrder', () => {
    const r = createBookSchema.safeParse({
      ...baseValid,
      featuredOrder: -1,
    })
    expect(r.success).toBe(false)
  })

  it('rejects non-integer featuredOrder', () => {
    const r = createBookSchema.safeParse({
      ...baseValid,
      featuredOrder: 1.5,
    })
    expect(r.success).toBe(false)
  })

  it('rejects non-boolean featured', () => {
    const r = createBookSchema.safeParse({
      ...baseValid,
      featured: 'yes',
    })
    expect(r.success).toBe(false)
  })
})

describe('updateBookSchema — featured fields', () => {
  it('accepts toggling featured alone', () => {
    expect(updateBookSchema.safeParse({ featured: true }).success).toBe(true)
  })

  it('accepts setting only featuredOrder', () => {
    expect(updateBookSchema.safeParse({ featuredOrder: 2 }).success).toBe(true)
  })

  it('accepts both fields together', () => {
    expect(
      updateBookSchema.safeParse({ featured: true, featuredOrder: 1 }).success
    ).toBe(true)
  })

  it('rejects negative featuredOrder', () => {
    expect(updateBookSchema.safeParse({ featuredOrder: -5 }).success).toBe(false)
  })

  it('rejects non-boolean featured', () => {
    expect(updateBookSchema.safeParse({ featured: 'true' }).success).toBe(false)
  })
})
