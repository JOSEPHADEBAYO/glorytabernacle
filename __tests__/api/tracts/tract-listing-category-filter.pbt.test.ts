/**
 * Property-Based Test: Category Filtering Accuracy
 * 
 * Feature: tracts-management-system, Property 6: Category Filtering Accuracy
 * 
 * **Validates: Requirements 2.4, 5.5, 8.6**
 * 
 * Property 6: Category Filtering Accuracy
 * For any tract category and any set of tracts with various categories, filtering by
 * that category SHALL return only tracts matching that exact category.
 */

import { describe, beforeEach, vi, expect } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { GET } from '@/app/api/tracts/route'
import { TRACT_CATEGORIES, TractCategory } from '@/lib/types/tract'
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

describe('Property 6: Category Filtering Accuracy', () => {
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
    fc.array(tractArbitrary, { minLength: 5, maxLength: 20 })
  ], { numRuns: 20 })(
    'should return only tracts matching the specified category',
    async (filterCategory, allTracts) => {
      // Filter tracts to only those matching the category
      const matchingTracts = allTracts.filter(tract => tract.category === filterCategory)

      vi.mocked(prisma.tract.findMany).mockResolvedValue(matchingTracts as any)

      const request = createMockRequest(
        `http://localhost:3000/api/tracts?category=${encodeURIComponent(filterCategory)}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('tracts')
      expect(Array.isArray(data.tracts)).toBe(true)

      // Verify Prisma was called with correct where clause
      expect(prisma.tract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: filterCategory
          })
        })
      )

      // Verify all returned tracts match the filter category
      for (const tract of data.tracts) {
        expect(tract.category).toBe(filterCategory)
      }

      return true
    }
  )

  it.prop([
    fc.constantFrom(...TRACT_CATEGORIES),
    fc.array(tractArbitrary, { minLength: 10, maxLength: 30 })
  ], { numRuns: 20 })(
    'should exclude tracts from other categories',
    async (filterCategory, allTracts) => {
      // Ensure we have tracts from multiple categories
      const tractsWithVariedCategories = allTracts.map((tract, index) => ({
        ...tract,
        category: TRACT_CATEGORIES[index % TRACT_CATEGORIES.length]
      }))

      const matchingTracts = tractsWithVariedCategories.filter(
        tract => tract.category === filterCategory
      )

      vi.mocked(prisma.tract.findMany).mockResolvedValue(matchingTracts as any)

      const request = createMockRequest(
        `http://localhost:3000/api/tracts?category=${encodeURIComponent(filterCategory)}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verify no tracts from other categories are included
      const otherCategories = TRACT_CATEGORIES.filter(cat => cat !== filterCategory)
      for (const tract of data.tracts) {
        expect(otherCategories).not.toContain(tract.category)
      }

      return true
    }
  )

  it.prop([
    fc.constantFrom(...TRACT_CATEGORIES)
  ], { numRuns: 20 })(
    'should return empty array when no tracts match the category',
    async (filterCategory) => {
      // Mock empty result
      vi.mocked(prisma.tract.findMany).mockResolvedValue([])

      const request = createMockRequest(
        `http://localhost:3000/api/tracts?category=${encodeURIComponent(filterCategory)}`
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
    fc.array(tractArbitrary, { minLength: 1, maxLength: 50 })
  ], { numRuns: 20 })(
    'should handle category filtering with any number of matching tracts',
    async (filterCategory, allTracts) => {
      // Set all tracts to the filter category
      const matchingTracts = allTracts.map(tract => ({
        ...tract,
        category: filterCategory
      }))

      vi.mocked(prisma.tract.findMany).mockResolvedValue(matchingTracts as any)

      const request = createMockRequest(
        `http://localhost:3000/api/tracts?category=${encodeURIComponent(filterCategory)}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tracts.length).toBe(matchingTracts.length)

      // All returned tracts should match the category
      expect(data.tracts.every((tract: any) => tract.category === filterCategory)).toBe(true)

      return true
    }
  )

  it.prop([
    fc.constantFrom(...TRACT_CATEGORIES),
    fc.array(tractArbitrary, { minLength: 5, maxLength: 15 })
  ], { numRuns: 20 })(
    'should perform exact category matching (case-sensitive)',
    async (filterCategory, allTracts) => {
      const matchingTracts = allTracts.filter(tract => tract.category === filterCategory)

      vi.mocked(prisma.tract.findMany).mockResolvedValue(matchingTracts as any)

      const request = createMockRequest(
        `http://localhost:3000/api/tracts?category=${encodeURIComponent(filterCategory)}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verify exact match (not partial or case-insensitive)
      for (const tract of data.tracts) {
        expect(tract.category).toBe(filterCategory)
        expect(tract.category).not.toBe(filterCategory.toLowerCase())
        expect(tract.category).not.toBe(filterCategory.toUpperCase())
      }

      return true
    }
  )
})
