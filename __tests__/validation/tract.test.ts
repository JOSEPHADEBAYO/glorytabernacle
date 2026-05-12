/**
 * Unit tests for tract validation schemas
 * 
 * Tests validation rules for creating, updating, and querying tracts
 */

import { describe, it, expect } from 'vitest'
import { createTractSchema, updateTractSchema, tractQuerySchema } from '@/lib/validation/tract'

describe('createTractSchema', () => {
  it('validates a valid tract creation payload', () => {
    const validData = {
      title: 'Test Tract',
      category: 'Evangelism',
      description: 'This is a test description with at least 10 characters',
      coverImage: 'https://example.com/image.jpg',
      documentUrl: 'https://example.com/document.pdf',
      published: false
    }

    const result = createTractSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects title longer than 200 characters', () => {
    const invalidData = {
      title: 'a'.repeat(201),
      category: 'Evangelism',
      description: 'Valid description',
      coverImage: 'https://example.com/image.jpg',
      documentUrl: 'https://example.com/document.pdf',
      published: false
    }

    const result = createTractSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('rejects description shorter than 10 characters', () => {
    const invalidData = {
      title: 'Test Tract',
      category: 'Evangelism',
      description: 'Short',
      coverImage: 'https://example.com/image.jpg',
      documentUrl: 'https://example.com/document.pdf',
      published: false
    }

    const result = createTractSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('rejects description longer than 1000 characters', () => {
    const invalidData = {
      title: 'Test Tract',
      category: 'Evangelism',
      description: 'a'.repeat(1001),
      coverImage: 'https://example.com/image.jpg',
      documentUrl: 'https://example.com/document.pdf',
      published: false
    }

    const result = createTractSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('rejects invalid category', () => {
    const invalidData = {
      title: 'Test Tract',
      category: 'InvalidCategory',
      description: 'Valid description',
      coverImage: 'https://example.com/image.jpg',
      documentUrl: 'https://example.com/document.pdf',
      published: false
    }

    const result = createTractSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('rejects invalid coverImage URL', () => {
    const invalidData = {
      title: 'Test Tract',
      category: 'Evangelism',
      description: 'Valid description',
      coverImage: 'not-a-url',
      documentUrl: 'https://example.com/document.pdf',
      published: false
    }

    const result = createTractSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('rejects invalid documentUrl URL', () => {
    const invalidData = {
      title: 'Test Tract',
      category: 'Evangelism',
      description: 'Valid description',
      coverImage: 'https://example.com/image.jpg',
      documentUrl: 'not-a-url',
      published: false
    }

    const result = createTractSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('defaults published to false when not provided', () => {
    const dataWithoutPublished = {
      title: 'Test Tract',
      category: 'Evangelism',
      description: 'Valid description',
      coverImage: 'https://example.com/image.jpg',
      documentUrl: 'https://example.com/document.pdf'
    }

    const result = createTractSchema.safeParse(dataWithoutPublished)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.published).toBe(false)
    }
  })
})

describe('updateTractSchema', () => {
  it('validates a valid tract update payload', () => {
    const validData = {
      title: 'Updated Title',
      description: 'Updated description'
    }

    const result = updateTractSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects empty update payload', () => {
    const emptyData = {}

    const result = updateTractSchema.safeParse(emptyData)
    expect(result.success).toBe(false)
  })

  it('validates partial updates with only one field', () => {
    const partialData = {
      published: true
    }

    const result = updateTractSchema.safeParse(partialData)
    expect(result.success).toBe(true)
  })

  it('applies same validation rules as create schema', () => {
    const invalidData = {
      title: 'a'.repeat(201) // Too long
    }

    const result = updateTractSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})

describe('tractQuerySchema', () => {
  it('validates published filter', () => {
    const validQuery = {
      published: 'true'
    }

    const result = tractQuerySchema.safeParse(validQuery)
    expect(result.success).toBe(true)
  })

  it('validates category filter', () => {
    const validQuery = {
      category: 'Evangelism'
    }

    const result = tractQuerySchema.safeParse(validQuery)
    expect(result.success).toBe(true)
  })

  it('validates combined filters', () => {
    const validQuery = {
      published: 'false',
      category: 'Theology'
    }

    const result = tractQuerySchema.safeParse(validQuery)
    expect(result.success).toBe(true)
  })

  it('rejects invalid published value', () => {
    const invalidQuery = {
      published: 'maybe'
    }

    const result = tractQuerySchema.safeParse(invalidQuery)
    expect(result.success).toBe(false)
  })

  it('rejects invalid category', () => {
    const invalidQuery = {
      category: 'InvalidCategory'
    }

    const result = tractQuerySchema.safeParse(invalidQuery)
    expect(result.success).toBe(false)
  })
})
