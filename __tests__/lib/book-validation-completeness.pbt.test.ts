/**
 * Property-Based Test: Input Validation Completeness
 * 
 * **Validates: Requirements 1.2, 1.5, 1.6, 1.7, 3.4, 5.1, 10.1, 10.2**
 * 
 * Property 1: Input Validation Completeness
 * For any book creation or update request, the API SHALL validate all required fields
 * (title, author, category, description, coverImage) are present, category is one of
 * the ten predefined values, and all URL fields (coverImage, purchaseUrl) are properly
 * formatted URLs.
 */

import { describe } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { createBookSchema, updateBookSchema } from '@/lib/validation/book'
import { BOOK_CATEGORIES } from '@/lib/types/book'

describe('Property 1: Input Validation Completeness', () => {
  describe('Create Book Validation', () => {
    it.prop([
        fc.record({
          title: fc.option(fc.string(), { nil: undefined }),
          author: fc.option(fc.string(), { nil: undefined }),
          category: fc.option(fc.constantFrom(...BOOK_CATEGORIES), { nil: undefined }),
          description: fc.option(fc.string(), { nil: undefined }),
          coverImage: fc.option(fc.webUrl(), { nil: undefined }),
          purchaseUrl: fc.option(fc.webUrl(), { nil: undefined }),
          published: fc.option(fc.boolean(), { nil: undefined })
        })
      ])('should reject payloads with missing required fields', (payload) => {
        // Filter to only test cases where at least one required field is missing
        const hasAllRequired = 
          payload.title !== undefined &&
          payload.author !== undefined &&
          payload.category !== undefined &&
          payload.description !== undefined &&
          payload.coverImage !== undefined

        // Skip if all required fields are present (we're testing missing fields)
        fc.pre(!hasAllRequired)

        const result = createBookSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          author: fc.string({ minLength: 1, maxLength: 100 }),
          category: fc.string().filter(cat => !BOOK_CATEGORIES.includes(cat as any)),
          description: fc.string({ minLength: 1, maxLength: 2000 }),
          coverImage: fc.webUrl(),
          purchaseUrl: fc.option(fc.webUrl()),
          published: fc.boolean()
        })
      ])('should reject payloads with invalid categories', (payload) => {
        const result = createBookSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          author: fc.string({ minLength: 1, maxLength: 100 }),
          category: fc.constantFrom(...BOOK_CATEGORIES),
          description: fc.string({ minLength: 1, maxLength: 2000 }),
          coverImage: fc.string().filter(s => {
            try {
              new URL(s)
              return false // Valid URL, skip it
            } catch {
              return s.length > 0 // Invalid URL, use it
            }
          }),
          purchaseUrl: fc.option(fc.webUrl()),
          published: fc.boolean()
        })
      ])('should reject payloads with malformed coverImage URLs', (payload) => {
        const result = createBookSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          author: fc.string({ minLength: 1, maxLength: 100 }),
          category: fc.constantFrom(...BOOK_CATEGORIES),
          description: fc.string({ minLength: 1, maxLength: 2000 }),
          coverImage: fc.webUrl(),
          purchaseUrl: fc.string().filter(s => {
            // Empty string is valid, so exclude it
            if (s === '') return false
            try {
              new URL(s)
              return false // Valid URL, skip it
            } catch {
              return s.length > 0 // Invalid URL, use it
            }
          }),
          published: fc.boolean()
        })
      ])('should reject payloads with malformed purchaseUrl', (payload) => {
        const result = createBookSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.oneof(
          // Empty title
          fc.record({
            title: fc.constant(''),
            author: fc.string({ minLength: 1, maxLength: 100 }),
            category: fc.constantFrom(...BOOK_CATEGORIES),
            description: fc.string({ minLength: 1, maxLength: 2000 }),
            coverImage: fc.webUrl(),
            published: fc.boolean()
          }),
          // Empty author
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }),
            author: fc.constant(''),
            category: fc.constantFrom(...BOOK_CATEGORIES),
            description: fc.string({ minLength: 1, maxLength: 2000 }),
            coverImage: fc.webUrl(),
            published: fc.boolean()
          }),
          // Empty description
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }),
            author: fc.string({ minLength: 1, maxLength: 100 }),
            category: fc.constantFrom(...BOOK_CATEGORIES),
            description: fc.constant(''),
            coverImage: fc.webUrl(),
            published: fc.boolean()
          })
        )
      ])('should reject payloads with empty required string fields', (payload) => {
        const result = createBookSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.oneof(
          // Title too long
          fc.record({
            title: fc.string({ minLength: 201, maxLength: 300 }),
            author: fc.string({ minLength: 1, maxLength: 100 }),
            category: fc.constantFrom(...BOOK_CATEGORIES),
            description: fc.string({ minLength: 1, maxLength: 2000 }),
            coverImage: fc.webUrl(),
            published: fc.boolean()
          }),
          // Author too long
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }),
            author: fc.string({ minLength: 101, maxLength: 200 }),
            category: fc.constantFrom(...BOOK_CATEGORIES),
            description: fc.string({ minLength: 1, maxLength: 2000 }),
            coverImage: fc.webUrl(),
            published: fc.boolean()
          }),
          // Description too long
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }),
            author: fc.string({ minLength: 1, maxLength: 100 }),
            category: fc.constantFrom(...BOOK_CATEGORIES),
            description: fc.string({ minLength: 2001, maxLength: 3000 }),
            coverImage: fc.webUrl(),
            published: fc.boolean()
          })
        )
      ])('should reject payloads exceeding field length limits', (payload) => {
        const result = createBookSchema.safeParse(payload)
        return !result.success
      })
  })

  describe('Update Book Validation', () => {
    it.prop([
        fc.record({
          category: fc.string().filter(cat => !BOOK_CATEGORIES.includes(cat as any))
        })
      ])('should reject update payloads with invalid categories', (payload) => {
        const result = updateBookSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.record({
          coverImage: fc.string().filter(s => {
            try {
              new URL(s)
              return false // Valid URL, skip it
            } catch {
              return s.length > 0 // Invalid URL, use it
            }
          })
        })
      ])('should reject update payloads with malformed coverImage URLs', (payload) => {
        const result = updateBookSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.record({
          purchaseUrl: fc.string().filter(s => {
            // Empty string is valid, so exclude it
            if (s === '') return false
            try {
              new URL(s)
              return false // Valid URL, skip it
            } catch {
              return s.length > 0 // Invalid URL, use it
            }
          })
        })
      ])('should reject update payloads with malformed purchaseUrl', (payload) => {
        const result = updateBookSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.oneof(
          fc.record({ title: fc.constant('') }),
          fc.record({ author: fc.constant('') }),
          fc.record({ description: fc.constant('') })
        )
      ])('should reject update payloads with empty string fields', (payload) => {
        const result = updateBookSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.oneof(
          fc.record({ title: fc.string({ minLength: 201, maxLength: 300 }) }),
          fc.record({ author: fc.string({ minLength: 101, maxLength: 200 }) }),
          fc.record({ description: fc.string({ minLength: 2001, maxLength: 3000 }) })
        )
      ])('should reject update payloads exceeding field length limits', (payload) => {
        const result = updateBookSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.constant({})
      ])('should reject empty update payloads', (payload) => {
        const result = updateBookSchema.safeParse(payload)
        return !result.success
      })
  })

  describe('Comprehensive Invalid Input Generation', () => {
    it.prop([
        fc.record({
          title: fc.option(fc.oneof(
            fc.constant(''), // Empty
            fc.string({ minLength: 201, maxLength: 300 }), // Too long
            fc.constant(undefined) // Missing
          )),
          author: fc.option(fc.oneof(
            fc.constant(''),
            fc.string({ minLength: 101, maxLength: 200 }),
            fc.constant(undefined)
          )),
          category: fc.option(fc.oneof(
            fc.string().filter(cat => !BOOK_CATEGORIES.includes(cat as any)), // Invalid
            fc.constant(undefined) // Missing
          )),
          description: fc.option(fc.oneof(
            fc.constant(''),
            fc.string({ minLength: 2001, maxLength: 3000 }),
            fc.constant(undefined)
          )),
          coverImage: fc.option(fc.oneof(
            fc.string().filter(s => {
              try {
                new URL(s)
                return false
              } catch {
                return s.length > 0
              }
            }), // Invalid URL
            fc.constant(undefined) // Missing
          )),
          purchaseUrl: fc.option(fc.string().filter(s => {
            if (s === '') return false
            try {
              new URL(s)
              return false
            } catch {
              return s.length > 0
            }
          })),
          published: fc.option(fc.boolean())
        })
      ])('should reject any combination of validation violations for create', (payload) => {
        // Only test if there's at least one violation
        const hasViolation = 
          payload.title === '' || 
          payload.title === undefined ||
          (typeof payload.title === 'string' && payload.title.length > 200) ||
          payload.author === '' ||
          payload.author === undefined ||
          (typeof payload.author === 'string' && payload.author.length > 100) ||
          payload.category === undefined ||
          (typeof payload.category === 'string' && !BOOK_CATEGORIES.includes(payload.category as any)) ||
          payload.description === '' ||
          payload.description === undefined ||
          (typeof payload.description === 'string' && payload.description.length > 2000) ||
          payload.coverImage === undefined ||
          (typeof payload.coverImage === 'string' && (() => {
            try {
              new URL(payload.coverImage)
              return false
            } catch {
              return true
            }
          })()) ||
          (payload.purchaseUrl !== undefined && payload.purchaseUrl !== '' && typeof payload.purchaseUrl === 'string' && (() => {
            try {
              new URL(payload.purchaseUrl)
              return false
            } catch {
              return true
            }
          })())

        fc.pre(hasViolation)

        const result = createBookSchema.safeParse(payload)
        return !result.success
      })
  })
})
