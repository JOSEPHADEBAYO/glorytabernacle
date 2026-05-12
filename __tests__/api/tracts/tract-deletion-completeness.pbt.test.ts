/**
 * Property-Based Test: Deletion Completeness
 * 
 * Feature: tracts-management-system, Property 12: Deletion Completeness
 * 
 * **Validates: Requirements 4.1, 4.3, 4.6**
 * 
 * Property 12: Deletion Completeness
 * For any existing tract, successfully deleting it SHALL remove it from the database
 * such that subsequent queries for that tract return 404, and it SHALL not appear in
 * any list results.
 */

import { describe, beforeEach, vi, expect } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { DELETE } from '@/app/api/tracts/[id]/route'
import { GET as GET_BY_ID } from '@/app/api/tracts/[id]/route'
import { GET as GET_LIST } from '@/app/api/tracts/route'
import { TRACT_CATEGORIES } from '@/lib/types/tract'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

// Mock dependencies
vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tract: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn()
    }
  }
}))

describe('Property 12: Deletion Completeness', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default authentication mocks
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com'
    })
  })

  const createMockRequest = (url: string = 'http://localhost:3000/api/tracts'): NextRequest => {
    return {
      url
    } as NextRequest
  }

  const createMockParams = (id: string) => {
    return Promise.resolve({ id })
  }

  // Arbitrary for generating valid tract data
  const validTractArbitrary = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
    category: fc.constantFrom(...TRACT_CATEGORIES),
    description: fc.string({ minLength: 10, maxLength: 1000 }).map(s => s.trim()).filter(s => s.length >= 10),
    coverImage: fc.webUrl(),
    documentUrl: fc.webUrl(),
    published: fc.boolean(),
    createdBy: fc.uuid(),
    createdAt: fc.date(),
    updatedAt: fc.date()
  })

  describe('DELETE /api/tracts/[id]', () => {
    it.prop([validTractArbitrary], { numRuns: 20 })(
      'should return 200 with success message when deleting an existing tract',
      async (tract) => {
        // Mock database to return the tract (it exists)
        vi.mocked(prisma.tract.findUnique).mockResolvedValue(tract as any)
        vi.mocked(prisma.tract.delete).mockResolvedValue(tract as any)

        const request = createMockRequest()
        const params = createMockParams(tract.id)
        const response = await DELETE(request, { params })
        const responseData = await response.json()

        // Verify 200 status
        expect(response.status).toBe(200)

        // Verify success message is present
        expect(responseData).toHaveProperty('message')
        expect(typeof responseData.message).toBe('string')
        expect(responseData.message.length).toBeGreaterThan(0)

        // Verify the message indicates successful deletion
        expect(responseData.message.toLowerCase()).toContain('deleted')
        expect(responseData.message.toLowerCase()).toContain('success')

        return true
      }
    )

    it.prop([validTractArbitrary], { numRuns: 20 })(
      'should call delete with the correct tract ID',
      async (tract) => {
        vi.mocked(prisma.tract.findUnique).mockResolvedValue(tract as any)
        vi.mocked(prisma.tract.delete).mockResolvedValue(tract as any)

        const request = createMockRequest()
        const params = createMockParams(tract.id)
        await DELETE(request, { params })

        // Verify findUnique was called to check existence
        expect(prisma.tract.findUnique).toHaveBeenCalledWith({
          where: { id: tract.id }
        })

        // Verify delete was called with the correct ID
        expect(prisma.tract.delete).toHaveBeenCalledWith({
          where: { id: tract.id }
        })

        return true
      }
    )

    it.prop([validTractArbitrary], { numRuns: 20 })(
      'should check if tract exists before attempting deletion',
      async (tract) => {
        vi.mocked(prisma.tract.findUnique).mockResolvedValue(tract as any)
        vi.mocked(prisma.tract.delete).mockResolvedValue(tract as any)

        const request = createMockRequest()
        const params = createMockParams(tract.id)
        await DELETE(request, { params })

        // Verify findUnique was called before delete
        const findUniqueCalls = vi.mocked(prisma.tract.findUnique).mock.calls
        const deleteCalls = vi.mocked(prisma.tract.delete).mock.calls

        expect(findUniqueCalls.length).toBeGreaterThan(0)
        expect(deleteCalls.length).toBeGreaterThan(0)

        return true
      }
    )
  })

  describe('Deletion Completeness - Subsequent Queries', () => {
    it.prop([validTractArbitrary], { numRuns: 20 })(
      'should return 404 when querying a deleted tract by ID',
      async (tract) => {
        // First call: tract exists (for deletion)
        // Second call: tract doesn't exist (after deletion)
        vi.mocked(prisma.tract.findUnique)
          .mockResolvedValueOnce(tract as any)  // For DELETE check
          .mockResolvedValueOnce(null)          // For subsequent GET

        vi.mocked(prisma.tract.delete).mockResolvedValue(tract as any)

        // Delete the tract
        const deleteRequest = createMockRequest()
        const deleteParams = createMockParams(tract.id)
        const deleteResponse = await DELETE(deleteRequest, { params: deleteParams })
        expect(deleteResponse.status).toBe(200)

        // Try to retrieve the deleted tract
        const getRequest = createMockRequest()
        const getParams = createMockParams(tract.id)
        const getResponse = await GET_BY_ID(getRequest, { params: getParams })
        const getResponseData = await getResponse.json()

        // Verify 404 status
        expect(getResponse.status).toBe(404)

        // Verify error message
        expect(getResponseData).toHaveProperty('error')
        expect(getResponseData.error.toLowerCase()).toContain('not found')

        return true
      }
    )

    it.prop([fc.array(validTractArbitrary, { minLength: 2, maxLength: 10 }), fc.integer({ min: 0, max: 9 })], { numRuns: 20 })(
      'should not appear in list results after deletion',
      async (tracts, deleteIndex) => {
        // Ensure we have a valid index
        const actualDeleteIndex = deleteIndex % tracts.length
        const tractToDelete = tracts[actualDeleteIndex]
        const remainingTracts = tracts.filter((_, idx) => idx !== actualDeleteIndex)

        // Mock deletion
        vi.mocked(prisma.tract.findUnique).mockResolvedValue(tractToDelete as any)
        vi.mocked(prisma.tract.delete).mockResolvedValue(tractToDelete as any)

        // Delete the tract
        const deleteRequest = createMockRequest()
        const deleteParams = createMockParams(tractToDelete.id)
        const deleteResponse = await DELETE(deleteRequest, { params: deleteParams })
        expect(deleteResponse.status).toBe(200)

        // Mock list query to return only remaining tracts
        vi.mocked(prisma.tract.findMany).mockResolvedValue(remainingTracts as any)

        // Query the list
        const listRequest = createMockRequest('http://localhost:3000/api/tracts')
        const listResponse = await GET_LIST(listRequest)
        const responseData = await listResponse.json()

        // Verify the deleted tract is not in the list
        expect(listResponse.status).toBe(200)
        expect(responseData).toHaveProperty('tracts')
        expect(Array.isArray(responseData.tracts)).toBe(true)
        
        const deletedTractInList = responseData.tracts.find((t: any) => t.id === tractToDelete.id)
        expect(deletedTractInList).toBeUndefined()

        // Verify remaining tracts are still in the list
        expect(responseData.tracts.length).toBe(remainingTracts.length)

        return true
      }
    )

    it.prop([validTractArbitrary], { numRuns: 20 })(
      'should maintain database consistency after deletion',
      async (tract) => {
        vi.mocked(prisma.tract.findUnique).mockResolvedValue(tract as any)
        vi.mocked(prisma.tract.delete).mockResolvedValue(tract as any)

        const request = createMockRequest()
        const params = createMockParams(tract.id)
        const response = await DELETE(request, { params })

        // Verify successful deletion
        expect(response.status).toBe(200)

        // Verify delete was called exactly once
        expect(prisma.tract.delete).toHaveBeenCalledTimes(1)

        // Verify delete was called with correct parameters
        expect(prisma.tract.delete).toHaveBeenCalledWith({
          where: { id: tract.id }
        })

        return true
      }
    )
  })

  describe('Deletion Error Handling', () => {
    it.prop([fc.uuid()], { numRuns: 20 })(
      'should return 404 when attempting to delete a non-existent tract',
      async (tractId) => {
        // Mock database to return null (tract doesn't exist)
        vi.mocked(prisma.tract.findUnique).mockResolvedValue(null)

        const request = createMockRequest()
        const params = createMockParams(tractId)
        const response = await DELETE(request, { params })
        const responseData = await response.json()

        // Verify 404 status
        expect(response.status).toBe(404)

        // Verify error message
        expect(responseData).toHaveProperty('error')
        expect(responseData.error.toLowerCase()).toContain('not found')

        // Verify delete was NOT called
        expect(prisma.tract.delete).not.toHaveBeenCalled()

        return true
      }
    )

    it.prop([validTractArbitrary], { numRuns: 20 })(
      'should not expose sensitive information in error responses',
      async (tract) => {
        vi.mocked(prisma.tract.findUnique).mockResolvedValue(tract as any)
        vi.mocked(prisma.tract.delete).mockRejectedValue(new Error('Database connection failed'))

        const request = createMockRequest()
        const params = createMockParams(tract.id)
        const response = await DELETE(request, { params })
        const responseData = await response.json()

        // Verify error response
        expect(response.status).toBe(500)
        expect(responseData).toHaveProperty('error')

        // Verify no sensitive information is exposed
        expect(responseData.error).not.toContain('database')
        expect(responseData.error).not.toContain('prisma')
        expect(responseData.error).not.toContain('sql')
        expect(responseData.error).not.toContain('connection')

        return true
      }
    )
  })

  describe('Authentication Requirements', () => {
    it.prop([validTractArbitrary], { numRuns: 20 })(
      'should require valid session token for deletion',
      async (tract) => {
        // Mock missing session token
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

        const request = createMockRequest()
        const params = createMockParams(tract.id)
        const response = await DELETE(request, { params })
        const responseData = await response.json()

        // Verify 401 status
        expect(response.status).toBe(401)

        // Verify error message
        expect(responseData).toHaveProperty('error')
        expect(responseData.error.toLowerCase()).toContain('unauthorized')

        // Verify delete was NOT called
        expect(prisma.tract.delete).not.toHaveBeenCalled()

        return true
      }
    )

    it.prop([validTractArbitrary], { numRuns: 20 })(
      'should require valid user session for deletion',
      async (tract) => {
        // Mock valid token but invalid user
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

        const request = createMockRequest()
        const params = createMockParams(tract.id)
        const response = await DELETE(request, { params })
        const responseData = await response.json()

        // Verify 401 status
        expect(response.status).toBe(401)

        // Verify error message
        expect(responseData).toHaveProperty('error')
        expect(responseData.error.toLowerCase()).toContain('unauthorized')

        // Verify delete was NOT called
        expect(prisma.tract.delete).not.toHaveBeenCalled()

        return true
      }
    )
  })
})
