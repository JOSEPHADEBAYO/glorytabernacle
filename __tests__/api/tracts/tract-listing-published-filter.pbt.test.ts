/**
 * Property-Based Test: Published Status Filtering
 * 
 * Feature: tracts-management-system, Property 14: Published Status Filtering
 * 
 * **Validates: Requirements 2.3, 6.2, 6.3, 6.8, 8.1**
 * 
 * Property 14: Published Status Filtering
 * For any set of tracts with mixed published values, querying the public tracts page
 * SHALL return only tracts where published equals true, while querying the dashboard
 * SHALL return all tracts regardless of published status.
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

describe('Property 14: Published Status Filtering', () => {
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
    fc.array(tractArbitrary, { minLength: 5, maxLength: 20 })
  ], { numRuns: 20 })(
    'should return only published tracts when filtering by published=true',
    async (allTracts) => {
      // Ensure we have a mix of published and unpublished tracts
      const mixedTracts = allTracts.map((tract, index) => ({
        ...tract,
        published: index % 2 === 0 // Alternate between true and false
      }))

      const publishedTracts = mixedTracts.filter(tract => tract.published === true)

      vi.mocked(prisma.tract.findMany).mockResolvedValue(publishedTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts?published=true')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('tracts')
      expect(Array.isArray(data.tracts)).toBe(true)

      // Verify Prisma was called with correct where clause
      expect(prisma.tract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            published: true
          })
        })
      )

      // Verify all returned tracts are published
      for (const tract of data.tracts) {
        expect(tract.published).toBe(true)
      }

      return true
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 5, maxLength: 20 })
  ], { numRuns: 20 })(
    'should return only unpublished tracts when filtering by published=false',
    async (allTracts) => {
      // Ensure we have a mix of published and unpublished tracts
      const mixedTracts = allTracts.map((tract, index) => ({
        ...tract,
        published: index % 2 === 0
      }))

      const unpublishedTracts = mixedTracts.filter(tract => tract.published === false)

      vi.mocked(prisma.tract.findMany).mockResolvedValue(unpublishedTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts?published=false')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('tracts')

      // Verify Prisma was called with correct where clause
      expect(prisma.tract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            published: false
          })
        })
      )

      // Verify all returned tracts are unpublished
      for (const tract of data.tracts) {
        expect(tract.published).toBe(false)
      }

      return true
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 5, maxLength: 20 })
  ], { numRuns: 20 })(
    'should return all tracts when no published filter is specified',
    async (allTracts) => {
      // Mix of published and unpublished
      const mixedTracts = allTracts.map((tract, index) => ({
        ...tract,
        published: index % 3 === 0 // Some published, some not
      }))

      vi.mocked(prisma.tract.findMany).mockResolvedValue(mixedTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tracts.length).toBe(mixedTracts.length)

      // Verify Prisma was called without published filter
      expect(prisma.tract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {}
        })
      )

      // Should include both published and unpublished tracts
      const hasPublished = data.tracts.some((tract: any) => tract.published === true)
      const hasUnpublished = data.tracts.some((tract: any) => tract.published === false)
      
      // If we have mixed tracts, both should be present
      if (mixedTracts.some(t => t.published) && mixedTracts.some(t => !t.published)) {
        expect(hasPublished).toBe(true)
        expect(hasUnpublished).toBe(true)
      }

      return true
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 10, maxLength: 30 })
  ], { numRuns: 20 })(
    'should exclude unpublished tracts when filtering by published=true',
    async (allTracts) => {
      // Create a mix with specific distribution
      const mixedTracts = allTracts.map((tract, index) => ({
        ...tract,
        published: index % 3 !== 0 // 2/3 published, 1/3 unpublished
      }))

      const publishedTracts = mixedTracts.filter(tract => tract.published === true)

      vi.mocked(prisma.tract.findMany).mockResolvedValue(publishedTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts?published=true')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verify no unpublished tracts are included
      const hasUnpublished = data.tracts.some((tract: any) => tract.published === false)
      expect(hasUnpublished).toBe(false)

      return true
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 10, maxLength: 30 })
  ], { numRuns: 20 })(
    'should exclude published tracts when filtering by published=false',
    async (allTracts) => {
      // Create a mix with specific distribution
      const mixedTracts = allTracts.map((tract, index) => ({
        ...tract,
        published: index % 3 === 0 // 1/3 published, 2/3 unpublished
      }))

      const unpublishedTracts = mixedTracts.filter(tract => tract.published === false)

      vi.mocked(prisma.tract.findMany).mockResolvedValue(unpublishedTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts?published=false')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verify no published tracts are included
      const hasPublished = data.tracts.some((tract: any) => tract.published === true)
      expect(hasPublished).toBe(false)

      return true
    }
  )

  it.prop([
    fc.boolean()
  ], { numRuns: 20 })(
    'should return empty array when no tracts match the published filter',
    async (publishedValue) => {
      vi.mocked(prisma.tract.findMany).mockResolvedValue([])

      const request = createMockRequest(
        `http://localhost:3000/api/tracts?published=${publishedValue}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tracts).toEqual([])

      return true
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 1, maxLength: 50 })
  ], { numRuns: 20 })(
    'should handle published filtering with any number of matching tracts',
    async (allTracts) => {
      // Set all tracts to published
      const publishedTracts = allTracts.map(tract => ({
        ...tract,
        published: true
      }))

      vi.mocked(prisma.tract.findMany).mockResolvedValue(publishedTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts?published=true')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tracts.length).toBe(publishedTracts.length)

      // All returned tracts should be published
      expect(data.tracts.every((tract: any) => tract.published === true)).toBe(true)

      return true
    }
  )
})
