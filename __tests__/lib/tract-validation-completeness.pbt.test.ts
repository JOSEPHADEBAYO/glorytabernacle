/**
 * Property-Based Test: Input Validation Completeness (Tract Creation)
 * 
 * Feature: tracts-management-system, Property 1: Input Validation Completeness
 * 
 * **Validates: Requirements 1.2, 1.4, 1.5, 1.6, 3.4, 5.1, 18.1, 18.2, 18.3, 18.4, 18.5**
 * 
 * Property 1: Input Validation Completeness
 * For any tract creation or update request, the API SHALL validate all required fields
 * (title, category, description, coverImage, documentUrl) are present, category is one of
 * the nine predefined values, and all URL fields (coverImage, documentUrl) are properly
 * formatted URLs.
 */

import { describe } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { createTractSchema, updateTractSchema } from '@/lib/validation/tract'
import { TRACT_CATEGORIES } from '@/lib/types/tract'

describe('Property 1: Input Validation Completeness', () => {
  describe('Create Tract Validation', () => {
    it.prop([
        fc.record({
          title: fc.option(fc.string(), { nil: undefined }),
          category: fc.option(fc.constantFrom(...TRACT_CATEGORIES), { nil: undefined }),
          description: fc.option(fc.string(), { nil: undefined }),
          coverImage: fc.option(fc.webUrl(), { nil: undefined }),
          documentUrl: fc.option(fc.webUrl(), { nil: undefined }),
          published: fc.option(fc.boolean(), { nil: undefined })
        })
      ], { numRuns: 20 })('should reject payloads with missing required fields', (payload) => {
        // Filter to only test cases where at least one required field is missing
        const hasAllRequired = 
          payload.title !== undefined &&
          payload.category !== undefined &&
          payload.description !== undefined &&
          payload.coverImage !== undefined &&
          payload.documentUrl !== undefined

        // Skip if all required fields are present (we're testing missing fields)
        fc.pre(!hasAllRequired)

        const result = createTractSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          category: fc.string().filter(cat => !TRACT_CATEGORIES.includes(cat as any)),
          description: fc.string({ minLength: 10, maxLength: 1000 }),
          coverImage: fc.webUrl(),
          documentUrl: fc.webUrl(),
          published: fc.boolean()
        })
      ], { numRuns: 20 })('should reject payloads with invalid categories', (payload) => {
        const result = createTractSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          category: fc.constantFrom(...TRACT_CATEGORIES),
          description: fc.string({ minLength: 10, maxLength: 1000 }),
          coverImage: fc.string().filter(s => {
            try {
              new URL(s)
              return false // Valid URL, skip it
            } catch {
              return s.length > 0 // Invalid URL, use it
            }
          }),
          documentUrl: fc.webUrl(),
          published: fc.boolean()
        })
      ], { numRuns: 20 })('should reject payloads with malformed coverImage URLs', (payload) => {
        const result = createTractSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          category: fc.constantFrom(...TRACT_CATEGORIES),
          description: fc.string({ minLength: 10, maxLength: 1000 }),
          coverImage: fc.webUrl(),
          documentUrl: fc.string().filter(s => {
            try {
              new URL(s)
              return false // Valid URL, skip it
            } catch {
              return s.length > 0 // Invalid URL, use it
            }
          }),
          published: fc.boolean()
        })
      ], { numRuns: 20 })('should reject payloads with malformed documentUrl', (payload) => {
        const result = createTractSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.oneof(
          // Empty title
          fc.record({
            title: fc.constant(''),
            category: fc.constantFrom(...TRACT_CATEGORIES),
            description: fc.string({ minLength: 10, maxLength: 1000 }),
            coverImage: fc.webUrl(),
            documentUrl: fc.webUrl(),
            published: fc.boolean()
          }),
          // Empty description (less than 10 chars)
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }),
            category: fc.constantFrom(...TRACT_CATEGORIES),
            description: fc.string({ maxLength: 9 }),
            coverImage: fc.webUrl(),
            documentUrl: fc.webUrl(),
            published: fc.boolean()
          })
        )
      ], { numRuns: 20 })('should reject payloads with empty or too short required string fields', (payload) => {
        const result = createTractSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.oneof(
          // Title too long
          fc.record({
            title: fc.string({ minLength: 201, maxLength: 300 }),
            category: fc.constantFrom(...TRACT_CATEGORIES),
            description: fc.string({ minLength: 10, maxLength: 1000 }),
            coverImage: fc.webUrl(),
            documentUrl: fc.webUrl(),
            published: fc.boolean()
          }),
          // Description too long
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }),
            category: fc.constantFrom(...TRACT_CATEGORIES),
            description: fc.string({ minLength: 1001, maxLength: 1500 }),
            coverImage: fc.webUrl(),
            documentUrl: fc.webUrl(),
            published: fc.boolean()
          })
        )
      ], { numRuns: 20 })('should reject payloads exceeding field length limits', (payload) => {
        const result = createTractSchema.safeParse(payload)
        return !result.success
      })
  })

  describe('Update Tract Validation', () => {
    it.prop([
        fc.record({
          category: fc.string().filter(cat => !TRACT_CATEGORIES.includes(cat as any))
        })
      ], { numRuns: 20 })('should reject update payloads with invalid categories', (payload) => {
        const result = updateTractSchema.safeParse(payload)
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
      ], { numRuns: 20 })('should reject update payloads with malformed coverImage URLs', (payload) => {
        const result = updateTractSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.record({
          documentUrl: fc.string().filter(s => {
            try {
              new URL(s)
              return false // Valid URL, skip it
            } catch {
              return s.length > 0 // Invalid URL, use it
            }
          })
        })
      ], { numRuns: 20 })('should reject update payloads with malformed documentUrl', (payload) => {
        const result = updateTractSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.oneof(
          fc.record({ title: fc.constant('') }),
          fc.record({ description: fc.string({ maxLength: 9 }) })
        )
      ], { numRuns: 20 })('should reject update payloads with empty or too short string fields', (payload) => {
        const result = updateTractSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.oneof(
          fc.record({ title: fc.string({ minLength: 201, maxLength: 300 }) }),
          fc.record({ description: fc.string({ minLength: 1001, maxLength: 1500 }) })
        )
      ], { numRuns: 20 })('should reject update payloads exceeding field length limits', (payload) => {
        const result = updateTractSchema.safeParse(payload)
        return !result.success
      })

    it.prop([
        fc.constant({})
      ], { numRuns: 20 })('should reject empty update payloads', (payload) => {
        const result = updateTractSchema.safeParse(payload)
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
          category: fc.option(fc.oneof(
            fc.string().filter(cat => !TRACT_CATEGORIES.includes(cat as any)), // Invalid
            fc.constant(undefined) // Missing
          )),
          description: fc.option(fc.oneof(
            fc.string({ maxLength: 9 }), // Too short
            fc.string({ minLength: 1001, maxLength: 1500 }), // Too long
            fc.constant(undefined) // Missing
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
          documentUrl: fc.option(fc.oneof(
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
          published: fc.option(fc.boolean())
        })
      ], { numRuns: 20 })('should reject any combination of validation violations for create', (payload) => {
        // Only test if there's at least one violation
        const hasViolation = 
          payload.title === '' || 
          payload.title === undefined ||
          (typeof payload.title === 'string' && payload.title.length > 200) ||
          payload.category === undefined ||
          (typeof payload.category === 'string' && !TRACT_CATEGORIES.includes(payload.category as any)) ||
          payload.description === undefined ||
          (typeof payload.description === 'string' && (payload.description.length < 10 || payload.description.length > 1000)) ||
          payload.coverImage === undefined ||
          (typeof payload.coverImage === 'string' && (() => {
            try {
              new URL(payload.coverImage)
              return false
            } catch {
              return true
            }
          })()) ||
          payload.documentUrl === undefined ||
          (typeof payload.documentUrl === 'string' && (() => {
            try {
              new URL(payload.documentUrl)
              return false
            } catch {
              return true
            }
          })())

        fc.pre(hasViolation)

        const result = createTractSchema.safeParse(payload)
        return !result.success
      })
  })
})
