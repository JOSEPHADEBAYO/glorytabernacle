/**
 * Property-Based Test: Ordering Consistency
 * 
 * Feature: tracts-management-system, Property 5: Ordering Consistency
 * 
 * **Validates: Requirements 2.1, 8.3**
 * 
 * Property 5: Ordering Consistency
 * For any set of tracts with different creation timestamps, querying the tracts list
 * SHALL return them ordered by createdAt descending (newest first).
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

describe('Property 5: Ordering Consistency', () => {
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
    fc.array(tractArbitrary, { minLength: 2, maxLength: 20 })
  ], { numRuns: 20 })(
    'should return tracts ordered by createdAt descending (newest first)',
    async (tracts) => {
      // Ensure tracts have different createdAt timestamps
      const tractsWithUniqueTimestamps = tracts.map((tract, index) => ({
        ...tract,
        createdAt: new Date(Date.now() - index * 1000 * 60) // Each tract 1 minute apart
      }))

      // Mock database to return tracts in random order
      const shuffledTracts = [...tractsWithUniqueTimestamps].sort(() => Math.random() - 0.5)
      vi.mocked(prisma.tract.findMany).mockResolvedValue(shuffledTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('tracts')
      expect(Array.isArray(data.tracts)).toBe(true)

      // Verify Prisma was called with correct orderBy
      expect(prisma.tract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }
        })
      )

      return true
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 3, maxLength: 10 })
  ], { numRuns: 20 })(
    'should maintain descending order for any set of tracts',
    async (tracts) => {
      // Create tracts with specific timestamps to verify ordering
      const tractsWithTimestamps = tracts.map((tract, index) => ({
        ...tract,
        createdAt: new Date(2024, 0, index + 1) // Jan 1, Jan 2, Jan 3, etc.
      }))

      // Sort in descending order (newest first) as the API should return
      const sortedTracts = [...tractsWithTimestamps].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )

      vi.mocked(prisma.tract.findMany).mockResolvedValue(sortedTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tracts).toBeDefined()

      // Verify the returned tracts are in descending order
      const returnedTracts = data.tracts
      for (let i = 0; i < returnedTracts.length - 1; i++) {
        const currentDate = new Date(returnedTracts[i].createdAt).getTime()
        const nextDate = new Date(returnedTracts[i + 1].createdAt).getTime()
        
        // Current tract should be newer than or equal to next tract
        expect(currentDate).toBeGreaterThanOrEqual(nextDate)
      }

      return true
    }
  )

  it.prop([
    fc.integer({ min: 5, max: 50 })
  ], { numRuns: 20 })(
    'should order any number of tracts consistently',
    async (count) => {
      // Generate tracts with sequential timestamps
      const tracts = Array.from({ length: count }, (_, index) => ({
        id: `tract-${index}`,
        title: `Tract ${index}`,
        category: TRACT_CATEGORIES[index % TRACT_CATEGORIES.length],
        description: `Description for tract ${index} with enough characters`,
        coverImage: `https://example.com/image-${index}.jpg`,
        documentUrl: `https://example.com/doc-${index}.pdf`,
        published: true,
        createdBy: 'user-1',
        createdAt: new Date(2024, 0, 1, 0, 0, index), // Sequential seconds
        updatedAt: new Date(2024, 0, 1, 0, 0, index)
      }))

      // Sort in descending order
      const sortedTracts = [...tracts].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )

      vi.mocked(prisma.tract.findMany).mockResolvedValue(sortedTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tracts.length).toBe(count)

      // Verify ordering
      for (let i = 0; i < data.tracts.length - 1; i++) {
        const currentDate = new Date(data.tracts[i].createdAt).getTime()
        const nextDate = new Date(data.tracts[i + 1].createdAt).getTime()
        expect(currentDate).toBeGreaterThanOrEqual(nextDate)
      }

      return true
    }
  )
})
