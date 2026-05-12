/**
 * Unit tests for book types and validation schemas
 * Tests Task 1: Set up shared types and validation schemas
 */

import { describe, it, expect } from 'vitest'
import { BOOK_CATEGORIES } from '@/lib/types/book'
import { createBookSchema, updateBookSchema, bookQuerySchema } from '@/lib/validation/book'

describe('Book Types', () => {
  it('should export all 10 predefined categories', () => {
    expect(BOOK_CATEGORIES).toHaveLength(10)
    expect(BOOK_CATEGORIES).toContain('Spiritual Growth')
    expect(BOOK_CATEGORIES).toContain('Prayer & Intercession')
    expect(BOOK_CATEGORIES).toContain('Faith & Doctrine')
    expect(BOOK_CATEGORIES).toContain('Christian Living')
    expect(BOOK_CATEGORIES).toContain('Leadership')
    expect(BOOK_CATEGORIES).toContain('Family & Relationships')
    expect(BOOK_CATEGORIES).toContain('Devotional')
    expect(BOOK_CATEGORIES).toContain('Theology')
    expect(BOOK_CATEGORIES).toContain('Biography')
    expect(BOOK_CATEGORIES).toContain('Other')
  })
})

describe('createBookSchema', () => {
  const validBook = {
    title: 'Test Book',
    author: 'Test Author',
    category: 'Spiritual Growth' as const,
    description: 'A test book description',
    coverImage: 'https://example.com/cover.jpg',
    purchaseUrl: 'https://example.com/buy',
    published: false
  }

  it('should validate a valid book creation payload', () => {
    const result = createBookSchema.safeParse(validBook)
    expect(result.success).toBe(true)
  })

  it('should reject missing title', () => {
    const { title, ...bookWithoutTitle } = validBook
    const result = createBookSchema.safeParse(bookWithoutTitle)
    expect(result.success).toBe(false)
  })

  it('should reject title exceeding 200 characters', () => {
    const longTitle = 'a'.repeat(201)
    const result = createBookSchema.safeParse({ ...validBook, title: longTitle })
    expect(result.success).toBe(false)
    if (!result.success) {
      const titleError = result.error.issues.find(e => e.path[0] === 'title')
      expect(titleError?.message).toBe('Title too long')
    }
  })

  it('should reject author exceeding 100 characters', () => {
    const longAuthor = 'a'.repeat(101)
    const result = createBookSchema.safeParse({ ...validBook, author: longAuthor })
    expect(result.success).toBe(false)
    if (!result.success) {
      const authorError = result.error.issues.find(e => e.path[0] === 'author')
      expect(authorError?.message).toBe('Author name too long')
    }
  })

  it('should reject description exceeding 2000 characters', () => {
    const longDescription = 'a'.repeat(2001)
    const result = createBookSchema.safeParse({ ...validBook, description: longDescription })
    expect(result.success).toBe(false)
    if (!result.success) {
      const descError = result.error.issues.find(e => e.path[0] === 'description')
      expect(descError?.message).toBe('Description too long')
    }
  })

  it('should reject invalid category', () => {
    const result = createBookSchema.safeParse({ ...validBook, category: 'Invalid Category' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const categoryError = result.error.issues.find(e => e.path[0] === 'category')
      expect(categoryError?.message).toBe('Invalid category')
    }
  })

  it('should reject invalid coverImage URL', () => {
    const result = createBookSchema.safeParse({ ...validBook, coverImage: 'not-a-url' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const coverError = result.error.issues.find(e => e.path[0] === 'coverImage')
      expect(coverError?.message).toBe('Must be a valid URL')
    }
  })

  it('should reject invalid purchaseUrl', () => {
    const result = createBookSchema.safeParse({ ...validBook, purchaseUrl: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('should accept empty string for purchaseUrl', () => {
    const result = createBookSchema.safeParse({ ...validBook, purchaseUrl: '' })
    expect(result.success).toBe(true)
  })

  it('should accept missing purchaseUrl', () => {
    const { purchaseUrl, ...bookWithoutPurchaseUrl } = validBook
    const result = createBookSchema.safeParse(bookWithoutPurchaseUrl)
    expect(result.success).toBe(true)
  })

  it('should default published to false when not provided', () => {
    const { published, ...bookWithoutPublished } = validBook
    const result = createBookSchema.safeParse(bookWithoutPublished)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.published).toBe(false)
    }
  })
})

describe('updateBookSchema', () => {
  it('should validate partial update with one field', () => {
    const result = updateBookSchema.safeParse({ title: 'Updated Title' })
    expect(result.success).toBe(true)
  })

  it('should validate partial update with multiple fields', () => {
    const result = updateBookSchema.safeParse({
      title: 'Updated Title',
      published: true
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty update object', () => {
    const result = updateBookSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      const refineError = result.error.issues.find(e => e.code === 'custom')
      expect(refineError?.message).toBe('At least one field must be provided for update')
    }
  })

  it('should apply same validation rules as create schema', () => {
    const longTitle = 'a'.repeat(201)
    const result = updateBookSchema.safeParse({ title: longTitle })
    expect(result.success).toBe(false)
  })

  it('should accept valid URL for coverImage', () => {
    const result = updateBookSchema.safeParse({ coverImage: 'https://example.com/new-cover.jpg' })
    expect(result.success).toBe(true)
  })

  it('should reject invalid URL for coverImage', () => {
    const result = updateBookSchema.safeParse({ coverImage: 'not-a-url' })
    expect(result.success).toBe(false)
  })
})

describe('bookQuerySchema', () => {
  it('should validate published filter with "true"', () => {
    const result = bookQuerySchema.safeParse({ published: 'true' })
    expect(result.success).toBe(true)
  })

  it('should validate published filter with "false"', () => {
    const result = bookQuerySchema.safeParse({ published: 'false' })
    expect(result.success).toBe(true)
  })

  it('should reject invalid published value', () => {
    const result = bookQuerySchema.safeParse({ published: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('should validate category filter', () => {
    const result = bookQuerySchema.safeParse({ category: 'Spiritual Growth' })
    expect(result.success).toBe(true)
  })

  it('should reject invalid category', () => {
    const result = bookQuerySchema.safeParse({ category: 'Invalid Category' })
    expect(result.success).toBe(false)
  })

  it('should validate both filters together', () => {
    const result = bookQuerySchema.safeParse({
      published: 'true',
      category: 'Theology'
    })
    expect(result.success).toBe(true)
  })

  it('should validate empty query object', () => {
    const result = bookQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
