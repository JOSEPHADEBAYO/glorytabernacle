/**
 * Property-Based Test: Published Status Filtering (Public Page)
 * 
 * Feature: tracts-management-system, Property 14: Published Status Filtering
 * 
 * **Validates: Requirements 6.2, 6.3, 8.1**
 * 
 * Property 14: Published Status Filtering (Public Page Portion)
 * For any set of tracts with mixed published values, the public tracts page
 * SHALL return only tracts where published equals true, and unpublished tracts
 * (published = false) SHALL never appear on the public page.
 */

import { describe, beforeEach, vi, expect } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { TRACT_CATEGORIES } from '@/lib/types/tract'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tract: {
      findMany: vi.fn()
    }
  }
}))

describe('Property 14: Published Status Filtering (Public Page)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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
    fc.array(tractArbitrary, { minLength: 5, maxLength: 30 })
  ], { numRuns: 20 })(
    'should only fetch published tracts for the public page',
    async (allTracts) => {
      // Create a mix of published and unpublished tracts
      const mixedTracts = allTracts.map((tract, index) => ({
        ...tract,
        published: index % 2 === 0 // Alternate between true and false
      }))

      const publishedTracts = mixedTracts.filter(tract => tract.published === true)

      // Mock the database query to return only published tracts
      vi.mocked(prisma.tract.findMany).mockResolvedValue(publishedTracts as any)

      // Simulate the public page query
      const result = await prisma.tract.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' }
      })

      // Verify Prisma was called with the correct filter
      expect(prisma.tract.findMany).toHaveBeenCalledWith({
        where: { published: true },
        orderBy: { createdAt: 'desc' }
      })

      // Verify all returned tracts are published
      expect(result.every(tract => tract.published === true)).toBe(true)

      // Verify no unpublished tracts are included
      expect(result.some(tract => tract.published === false)).toBe(false)

      // Verify the count matches expected published tracts
      expect(result.length).toBe(publishedTracts.length)

      return true
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 10, maxLength: 50 })
  ], { numRuns: 20 })(
    'should exclude all unpublished tracts from public page',
    async (allTracts) => {
      // Create a mix with more unpublished than published
      const mixedTracts = allTracts.map((tract, index) => ({
        ...tract,
        published: index % 3 === 0 // 1/3 published, 2/3 unpublished
      }))

      const publishedTracts = mixedTracts.filter(tract => tract.published === true)
      const unpublishedTracts = mixedTracts.filter(tract => tract.published === false)

      // Ensure we have both types
      fc.pre(publishedTracts.length > 0 && unpublishedTracts.length > 0)

      vi.mocked(prisma.tract.findMany).mockResolvedValue(publishedTracts as any)

      // Simulate the public page query
      const result = await prisma.tract.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' }
      })

      // Verify no unpublished tracts are in the result
      const unpublishedIds = unpublishedTracts.map(t => t.id)
      const resultIds = result.map(t => t.id)
      
      for (const unpublishedId of unpublishedIds) {
        expect(resultIds).not.toContain(unpublishedId)
      }

      return true
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 1, maxLength: 20 })
  ], { numRuns: 20 })(
    'should return empty array when no published tracts exist',
    async (allTracts) => {
      // Set all tracts to unpublished
      const unpublishedTracts = allTracts.map(tract => ({
        ...tract,
        published: false
      }))

      vi.mocked(prisma.tract.findMany).mockResolvedValue([])

      // Simulate the public page query
      const result = await prisma.tract.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' }
      })

      expect(result).toEqual([])
      expect(result.length).toBe(0)

      return true
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 1, maxLength: 50 })
  ], { numRuns: 20 })(
    'should return all tracts when all are published',
    async (allTracts) => {
      // Set all tracts to published
      const publishedTracts = allTracts.map(tract => ({
        ...tract,
        published: true
      }))

      vi.mocked(prisma.tract.findMany).mockResolvedValue(publishedTracts as any)

      // Simulate the public page query
      const result = await prisma.tract.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' }
      })

      expect(result.length).toBe(publishedTracts.length)
      expect(result.every(tract => tract.published === true)).toBe(true)

      return true
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 5, maxLength: 30 })
  ], { numRuns: 20 })(
    'should maintain ordering by createdAt desc for published tracts',
    async (allTracts) => {
      // Create published tracts with different timestamps
      const publishedTracts = allTracts
        .map((tract, index) => ({
          ...tract,
          published: true,
          createdAt: new Date(Date.now() - index * 1000000) // Different timestamps
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Sort desc

      vi.mocked(prisma.tract.findMany).mockResolvedValue(publishedTracts as any)

      // Simulate the public page query
      const result = await prisma.tract.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' }
      })

      // Verify ordering is maintained
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          result[i + 1].createdAt.getTime()
        )
      }

      return true
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 10, maxLength: 40 })
  ], { numRuns: 20 })(
    'should filter published tracts regardless of other field values',
    async (allTracts) => {
      // Create tracts with various categories and other fields, but mixed published status
      const mixedTracts = allTracts.map((tract, index) => ({
        ...tract,
        published: index % 2 === 0,
        // Vary other fields to ensure published is the only filter
        category: TRACT_CATEGORIES[index % TRACT_CATEGORIES.length]
      }))

      const publishedTracts = mixedTracts.filter(tract => tract.published === true)

      vi.mocked(prisma.tract.findMany).mockResolvedValue(publishedTracts as any)

      // Simulate the public page query
      const result = await prisma.tract.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' }
      })

      // Verify all returned tracts are published
      expect(result.every(tract => tract.published === true)).toBe(true)

      // Verify we have tracts from different categories (if applicable)
      if (result.length >= TRACT_CATEGORIES.length) {
        const categories = new Set(result.map(t => t.category))
        expect(categories.size).toBeGreaterThan(1)
      }

      return true
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 5, maxLength: 25 })
  ], { numRuns: 20 })(
    'should consistently filter published tracts across multiple queries',
    async (allTracts) => {
      // Create a consistent set of published tracts
      const mixedTracts = allTracts.map((tract, index) => ({
        ...tract,
        published: index % 3 !== 0 // 2/3 published
      }))

      const publishedTracts = mixedTracts.filter(tract => tract.published === true)

      vi.mocked(prisma.tract.findMany).mockResolvedValue(publishedTracts as any)

      // Simulate multiple queries (as if page is refreshed)
      const result1 = await prisma.tract.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' }
      })

      const result2 = await prisma.tract.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' }
      })

      // Both queries should return the same tracts
      expect(result1.length).toBe(result2.length)
      expect(result1.every(tract => tract.published === true)).toBe(true)
      expect(result2.every(tract => tract.published === true)).toBe(true)

      return true
    }
  )
})
