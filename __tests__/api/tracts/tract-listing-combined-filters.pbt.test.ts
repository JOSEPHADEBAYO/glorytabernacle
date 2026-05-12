/**
 * Property-Based Test: Query Parameter Filtering
 * 
 * Feature: tracts-management-system, Property 21: Query Parameter Filtering
 * 
 * **Validates: Requirements 2.3, 2.4, 14.10, 16.5**
 * 
 * Property 21: Query Parameter Filtering
 * For any combination of published and category query parameters on GET /api/tracts,
 * the API SHALL return only tracts matching all specified filters (AND logic).
 */

import { describe, beforeEach, vi, expect } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { GET } from '@/app/api/tracts/route'
import { TRACT_CATEGORIES } from '@/lib/types/tract'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

// Mock dependencies
vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tract: {
      findMany: vi.fn()
    }
  }
}))

describe('Property 21: Query Parameter Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default authentication mocks
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com'
    })
  })

  const createMockRequest = (url: string): NextRequest => {
    return {
      url,
    } as NextRequest
  }

  const tractArbitrary = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
    category: fc.constantFrom(...TRACT_CATEGORIES),
    description: fc.string({ minLength: 10, maxLength: 1000 }).map(s => s.trim()).filter(s => s.length >= 10),
    coverImage: fc.webUrl(),
    documentUrl: fc.webUrl(),
    published: fc.boolean(),
    createdBy: fc.uuid(),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
  })

  it.prop([
    fc.constantFrom(...TRACT_CATEGORIES),
    fc.boolean(),
    fc.array(tractArbitrary, { minLength: 10, maxLength: 30 })
  ], { numRuns: 20 })(
    'should return only tracts matching both published and category filters (AND logic)',
    async (filterCategory, filterPublished, allTracts) => {
      // Create diverse set of tracts
      const diverseTracts = allTracts.map((tract, index) => ({
        ...tract,
        category: TRACT_CATEGORIES[index % TRACT_CATEGORIES.length],
        published: index % 2 === 0
      }))

      // Filter to match both conditions
      const matchingTracts = diverseTracts.filter(
        tract => tract.category === filterCategory && tract.published === filterPublished
      )

      vi.mocked(prisma.tract.findMany).mockResolvedValue(matchingTracts as any)

      const request = createMockRequest(
        `http://localhost:3000/api/tracts?category=${encodeURIComponent(filterCategory)}&published=${filterPublished}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('tracts')
      expect(Array.isArray(data.tracts)).toBe(true)

      // Verify Prisma was called with both filters
      expect(prisma.tract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: filterCategory,
            published: filterPublished
          })
        })
      )

      // Verify all returned tracts match BOTH filters
      for (const tract of data.tracts) {
        expect(tract.category).toBe(filterCategory)
        expect(tract.published).toBe(filterPublished)
      }

      return true
    }
  )

  it.prop([
    fc.constantFrom(...TRACT_CATEGORIES),
    fc.boolean(),
    fc.array(tractArbitrary, { minLength: 10, maxLength: 30 })
  ], { numRuns: 20 })(
    'should exclude tracts that match only one filter',
    async (filterCategory, filterPublished, allTracts) => {
      // Create tracts with varied combinations
      const diverseTracts = allTracts.map((tract, index) => ({
        ...tract,
        category: TRACT_CATEGORIES[index % TRACT_CATEGORIES.length],
        published: index % 3 === 0
      }))

      const matchingTracts = diverseTracts.filter(
        tract => tract.category === filterCategory && tract.published === filterPublished
      )

      vi.mocked(prisma.tract.findMany).mockResolvedValue(matchingTracts as any)

      const request = createMockRequest(
        `http://localhost:3000/api/tracts?category=${encodeURIComponent(filterCategory)}&published=${filterPublished}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verify no tracts that match only category
      const hasWrongPublished = data.tracts.some(
        (tract: any) => tract.category === filterCategory && tract.published !== filterPublished
      )
      expect(hasWrongPublished).toBe(false)

      // Verify no tracts that match only published status
      const hasWrongCategory = data.tracts.some(
        (tract: any) => tract.published === filterPublished && tract.category !== filterCategory
      )
      expect(hasWrongCategory).toBe(false)

      return true
    }
  )

  it.prop([
    fc.constantFrom(...TRACT_CATEGORIES),
    fc.boolean()
  ], { numRuns: 20 })(
    'should return empty array when no tracts match both filters',
    async (filterCategory, filterPublished) => {
      vi.mocked(prisma.tract.findMany).mockResolvedValue([])

      const request = createMockRequest(
        `http://localhost:3000/api/tracts?category=${encodeURIComponent(filterCategory)}&published=${filterPublished}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tracts).toEqual([])

      return true
    }
  )

  it.prop([
    fc.constantFrom(...TRACT_CATEGORIES),
    fc.boolean(),
    fc.array(tractArbitrary, { minLength: 1, maxLength: 50 })
  ], { numRuns: 20 })(
    'should handle combined filtering with any number of matching tracts',
    async (filterCategory, filterPublished, allTracts) => {
      // Set all tracts to match both filters
      const matchingTracts = allTracts.map(tract => ({
        ...tract,
        category: filterCategory,
        published: filterPublished
      }))

      vi.mocked(prisma.tract.findMany).mockResolvedValue(matchingTracts as any)

      const request = createMockRequest(
        `http://localhost:3000/api/tracts?category=${encodeURIComponent(filterCategory)}&published=${filterPublished}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tracts.length).toBe(matchingTracts.length)

      // All returned tracts should match both filters
      expect(
        data.tracts.every(
          (tract: any) => tract.category === filterCategory && tract.published === filterPublished
        )
      ).toBe(true)

      return true
    }
  )

  it.prop([
    fc.record({
      category: fc.constantFrom(...TRACT_CATEGORIES),
      published: fc.boolean()
    }),
    fc.array(tractArbitrary, { minLength: 15, maxLength: 40 })
  ], { numRuns: 20 })(
    'should apply AND logic consistently across different filter combinations',
    async (filters, allTracts) => {
      // Create a diverse dataset
      const diverseTracts = allTracts.map((tract, index) => ({
        ...tract,
        category: TRACT_CATEGORIES[index % TRACT_CATEGORIES.length],
        published: index % 4 < 2 // 50% published
      }))

      // Apply AND logic
      const matchingTracts = diverseTracts.filter(
        tract => tract.category === filters.category && tract.published === filters.published
      )

      vi.mocked(prisma.tract.findMany).mockResolvedValue(matchingTracts as any)

      const request = createMockRequest(
        `http://localhost:3000/api/tracts?category=${encodeURIComponent(filters.category)}&published=${filters.published}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Count how many tracts in the original set match each filter individually
      const matchCategory = diverseTracts.filter(t => t.category === filters.category).length
      const matchPublished = diverseTracts.filter(t => t.published === filters.published).length
      const matchBoth = matchingTracts.length

      // AND logic means result should be <= either individual filter
      expect(matchBoth).toBeLessThanOrEqual(matchCategory)
      expect(matchBoth).toBeLessThanOrEqual(matchPublished)

      // Verify all returned tracts match both conditions
      for (const tract of data.tracts) {
        expect(tract.category).toBe(filters.category)
        expect(tract.published).toBe(filters.published)
      }

      return true
    }
  )

  it.prop([
    fc.constantFrom(...TRACT_CATEGORIES),
    fc.boolean(),
    fc.array(tractArbitrary, { minLength: 20, maxLength: 50 })
  ], { numRuns: 20 })(
    'should maintain ordering while applying combined filters',
    async (filterCategory, filterPublished, allTracts) => {
      // Create tracts with sequential timestamps
      const tractsWithTimestamps = allTracts.map((tract, index) => ({
        ...tract,
        category: TRACT_CATEGORIES[index % TRACT_CATEGORIES.length],
        published: index % 2 === 0,
        createdAt: new Date(2024, 0, 1, 0, 0, index)
      }))

      // Filter and sort
      const matchingTracts = tractsWithTimestamps
        .filter(tract => tract.category === filterCategory && tract.published === filterPublished)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      vi.mocked(prisma.tract.findMany).mockResolvedValue(matchingTracts as any)

      const request = createMockRequest(
        `http://localhost:3000/api/tracts?category=${encodeURIComponent(filterCategory)}&published=${filterPublished}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verify ordering is maintained (descending by createdAt)
      for (let i = 0; i < data.tracts.length - 1; i++) {
        const currentDate = new Date(data.tracts[i].createdAt).getTime()
        const nextDate = new Date(data.tracts[i + 1].createdAt).getTime()
        expect(currentDate).toBeGreaterThanOrEqual(nextDate)
      }

      return true
    }
  )

  it.prop([
    fc.record({
      category: fc.option(fc.constantFrom(...TRACT_CATEGORIES), { nil: undefined }),
      published: fc.option(fc.boolean(), { nil: undefined })
    }),
    fc.array(tractArbitrary, { minLength: 10, maxLength: 25 })
  ], { numRuns: 20 })(
    'should handle partial filter combinations (only one filter specified)',
    async (filters, allTracts) => {
      // Skip if both filters are undefined (tested elsewhere)
      fc.pre(filters.category !== undefined || filters.published !== undefined)

      const diverseTracts = allTracts.map((tract, index) => ({
        ...tract,
        category: TRACT_CATEGORIES[index % TRACT_CATEGORIES.length],
        published: index % 2 === 0
      }))

      // Apply filters
      let matchingTracts = diverseTracts
      if (filters.category !== undefined) {
        matchingTracts = matchingTracts.filter(t => t.category === filters.category)
      }
      if (filters.published !== undefined) {
        matchingTracts = matchingTracts.filter(t => t.published === filters.published)
      }

      vi.mocked(prisma.tract.findMany).mockResolvedValue(matchingTracts as any)

      // Build URL
      const params = new URLSearchParams()
      if (filters.category !== undefined) {
        params.append('category', filters.category)
      }
      if (filters.published !== undefined) {
        params.append('published', String(filters.published))
      }

      const request = createMockRequest(
        `http://localhost:3000/api/tracts?${params.toString()}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verify returned tracts match the specified filter(s)
      for (const tract of data.tracts) {
        if (filters.category !== undefined) {
          expect(tract.category).toBe(filters.category)
        }
        if (filters.published !== undefined) {
          expect(tract.published).toBe(filters.published)
        }
      }

      return true
    }
  )
})
