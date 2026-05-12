/**
 * Property-Based Test: Token Security
 * 
 * Feature: tracts-management-system, Property 16: Token Security
 * 
 * **Validates: Requirements 7.7**
 * 
 * Property 16: Token Security
 * For any API response or server log, authentication tokens SHALL NOT be exposed
 * in response bodies or log messages.
 */

import { describe, beforeEach, vi, expect } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { POST as createTract, GET as listTracts } from '@/app/api/tracts/route'
import { GET as getTract, PUT as updateTract, DELETE as deleteTract } from '@/app/api/tracts/[id]/route'
import { POST as uploadFile } from '@/app/api/upload/route'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { TRACT_CATEGORIES } from '@/lib/types/tract'

// Mock dependencies
vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tract: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}))
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn()
    }
  }
}))

describe('Property 16: Token Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create mock request
  const createMockRequest = (body: any, url = 'http://localhost:3000/api/tracts'): NextRequest => {
    return {
      json: async () => body,
      url,
      formData: async () => {
        const formData = new FormData()
        if (body?.file) {
          formData.append('file', body.file)
        }
        return formData
      }
    } as NextRequest
  }

  // Helper to create mock params
  const createMockParams = (id: string) => Promise.resolve({ id })

  // Helper to check if a string contains a token
  const containsToken = (str: string, token: string): boolean => {
    if (!token || token.length === 0) return false
    return str.includes(token)
  }

  // Helper to recursively search for token in object
  const objectContainsToken = (obj: any, token: string): boolean => {
    if (!token || token.length === 0) return false
    
    if (typeof obj === 'string') {
      return containsToken(obj, token)
    }
    
    if (Array.isArray(obj)) {
      return obj.some(item => objectContainsToken(item, token))
    }
    
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(value => objectContainsToken(value, token))
    }
    
    return false
  }

  describe('POST /api/tracts - Create Tract', () => {
    it.prop([
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 200 }),
        category: fc.constantFrom(...TRACT_CATEGORIES),
        description: fc.string({ minLength: 10, maxLength: 1000 }),
        coverImage: fc.webUrl(),
        documentUrl: fc.webUrl(),
        published: fc.boolean()
      }),
      fc.string({ minLength: 10, maxLength: 100 }) // Session token
    ], { numRuns: 100 })(
      'should not expose session token in successful response',
      async (tractData, sessionToken) => {
        // Arrange: Mock valid authentication
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(sessionToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMIN'
        })

        const mockCreatedTract = {
          id: 'tract-123',
          ...tractData,
          createdBy: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

        // Act: Create tract
        const request = createMockRequest(tractData)
        const response = await createTract(request)
        const responseBody = await response.json()
        const responseText = JSON.stringify(responseBody)

        // Assert: Response should not contain the session token
        return !containsToken(responseText, sessionToken) && !objectContainsToken(responseBody, sessionToken)
      }
    )

    it.prop([
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 200 }),
        category: fc.constantFrom(...TRACT_CATEGORIES),
        description: fc.string({ minLength: 10, maxLength: 1000 }),
        coverImage: fc.webUrl(),
        documentUrl: fc.webUrl(),
        published: fc.boolean()
      }),
      fc.string({ minLength: 10, maxLength: 100 }) // Session token
    ], { numRuns: 100 })(
      'should not expose session token in error response',
      async (tractData, sessionToken) => {
        // Arrange: Mock authentication but database error
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(sessionToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMIN'
        })
        vi.mocked(prisma.tract.create).mockRejectedValue(new Error('Database error'))

        // Act: Attempt to create tract (will fail)
        const request = createMockRequest(tractData)
        const response = await createTract(request)
        const responseBody = await response.json()
        const responseText = JSON.stringify(responseBody)

        // Assert: Error response should not contain the session token
        return !containsToken(responseText, sessionToken) && !objectContainsToken(responseBody, sessionToken)
      }
    )
  })

  describe('GET /api/tracts - List Tracts', () => {
    it.prop([
      fc.array(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          category: fc.constantFrom(...TRACT_CATEGORIES),
          description: fc.string({ minLength: 10, maxLength: 1000 }),
          coverImage: fc.webUrl(),
          documentUrl: fc.webUrl(),
          published: fc.boolean(),
          createdBy: fc.string({ minLength: 1, maxLength: 50 }),
          createdAt: fc.date(),
          updatedAt: fc.date()
        }),
        { minLength: 0, maxLength: 10 }
      ),
      fc.string({ minLength: 10, maxLength: 100 }) // Session token
    ], { numRuns: 100 })(
      'should not expose session token in list response',
      async (tracts, sessionToken) => {
        // Arrange: Mock valid authentication
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(sessionToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMIN'
        })
        vi.mocked(prisma.tract.findMany).mockResolvedValue(tracts as any)

        // Act: List tracts
        const request = createMockRequest({})
        const response = await listTracts(request)
        const responseBody = await response.json()
        const responseText = JSON.stringify(responseBody)

        // Assert: Response should not contain the session token
        return !containsToken(responseText, sessionToken) && !objectContainsToken(responseBody, sessionToken)
      }
    )
  })

  describe('GET /api/tracts/[id] - Get Single Tract', () => {
    it.prop([
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 50 }),
        title: fc.string({ minLength: 1, maxLength: 200 }),
        category: fc.constantFrom(...TRACT_CATEGORIES),
        description: fc.string({ minLength: 10, maxLength: 1000 }),
        coverImage: fc.webUrl(),
        documentUrl: fc.webUrl(),
        published: fc.boolean(),
        createdBy: fc.string({ minLength: 1, maxLength: 50 }),
        createdAt: fc.date(),
        updatedAt: fc.date()
      }),
      fc.string({ minLength: 10, maxLength: 100 }) // Session token
    ], { numRuns: 100 })(
      'should not expose session token in single tract response',
      async (tract, sessionToken) => {
        // Arrange: Mock valid authentication
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(sessionToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMIN'
        })
        vi.mocked(prisma.tract.findUnique).mockResolvedValue(tract as any)

        // Act: Get tract
        const request = createMockRequest({}, `http://localhost:3000/api/tracts/${tract.id}`)
        const response = await getTract(request, { params: createMockParams(tract.id) })
        const responseBody = await response.json()
        const responseText = JSON.stringify(responseBody)

        // Assert: Response should not contain the session token
        return !containsToken(responseText, sessionToken) && !objectContainsToken(responseBody, sessionToken)
      }
    )

    it.prop([
      fc.string({ minLength: 1, maxLength: 50 }), // Tract ID
      fc.string({ minLength: 10, maxLength: 100 }) // Session token
    ], { numRuns: 100 })(
      'should not expose session token in 404 response',
      async (tractId, sessionToken) => {
        // Arrange: Mock valid authentication but tract not found
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(sessionToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMIN'
        })
        vi.mocked(prisma.tract.findUnique).mockResolvedValue(null)

        // Act: Attempt to get non-existent tract
        const request = createMockRequest({}, `http://localhost:3000/api/tracts/${tractId}`)
        const response = await getTract(request, { params: createMockParams(tractId) })
        const responseBody = await response.json()
        const responseText = JSON.stringify(responseBody)

        // Assert: 404 response should not contain the session token
        return !containsToken(responseText, sessionToken) && !objectContainsToken(responseBody, sessionToken)
      }
    )
  })

  describe('PUT /api/tracts/[id] - Update Tract', () => {
    it.prop([
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 50 }),
        title: fc.string({ minLength: 1, maxLength: 200 }),
        category: fc.constantFrom(...TRACT_CATEGORIES),
        description: fc.string({ minLength: 10, maxLength: 1000 }),
        coverImage: fc.webUrl(),
        documentUrl: fc.webUrl(),
        published: fc.boolean(),
        createdBy: fc.string({ minLength: 1, maxLength: 50 }),
        createdAt: fc.date(),
        updatedAt: fc.date()
      }),
      fc.record({
        title: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
        description: fc.option(fc.string({ minLength: 10, maxLength: 1000 }), { nil: undefined })
      }).filter(obj => Object.keys(obj).some(key => obj[key as keyof typeof obj] !== undefined)),
      fc.string({ minLength: 10, maxLength: 100 }) // Session token
    ], { numRuns: 100 })(
      'should not expose session token in update response',
      async (existingTract, updateData, sessionToken) => {
        // Arrange: Mock valid authentication
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(sessionToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMIN'
        })
        vi.mocked(prisma.tract.findUnique).mockResolvedValue(existingTract as any)
        
        const updatedTract = { ...existingTract, ...updateData, updatedAt: new Date() }
        vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract as any)

        // Act: Update tract
        const request = createMockRequest(updateData, `http://localhost:3000/api/tracts/${existingTract.id}`)
        const response = await updateTract(request, { params: createMockParams(existingTract.id) })
        const responseBody = await response.json()
        const responseText = JSON.stringify(responseBody)

        // Assert: Response should not contain the session token
        return !containsToken(responseText, sessionToken) && !objectContainsToken(responseBody, sessionToken)
      }
    )
  })

  describe('DELETE /api/tracts/[id] - Delete Tract', () => {
    it.prop([
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 50 }),
        title: fc.string({ minLength: 1, maxLength: 200 }),
        category: fc.constantFrom(...TRACT_CATEGORIES),
        description: fc.string({ minLength: 10, maxLength: 1000 }),
        coverImage: fc.webUrl(),
        documentUrl: fc.webUrl(),
        published: fc.boolean(),
        createdBy: fc.string({ minLength: 1, maxLength: 50 }),
        createdAt: fc.date(),
        updatedAt: fc.date()
      }),
      fc.string({ minLength: 10, maxLength: 100 }) // Session token
    ], { numRuns: 100 })(
      'should not expose session token in delete response',
      async (tract, sessionToken) => {
        // Arrange: Mock valid authentication
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(sessionToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMIN'
        })
        vi.mocked(prisma.tract.findUnique).mockResolvedValue(tract as any)
        vi.mocked(prisma.tract.delete).mockResolvedValue(tract as any)

        // Act: Delete tract
        const request = createMockRequest({}, `http://localhost:3000/api/tracts/${tract.id}`)
        const response = await deleteTract(request, { params: createMockParams(tract.id) })
        const responseBody = await response.json()
        const responseText = JSON.stringify(responseBody)

        // Assert: Response should not contain the session token
        return !containsToken(responseText, sessionToken) && !objectContainsToken(responseBody, sessionToken)
      }
    )
  })

  describe('Unauthorized Requests', () => {
    it.prop([
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 200 }),
        category: fc.constantFrom(...TRACT_CATEGORIES),
        description: fc.string({ minLength: 10, maxLength: 1000 }),
        coverImage: fc.webUrl(),
        documentUrl: fc.webUrl(),
        published: fc.boolean()
      }),
      fc.string({ minLength: 10, maxLength: 100 }) // Invalid session token
    ], { numRuns: 100 })(
      'should not expose invalid token in 401 response',
      async (tractData, invalidToken) => {
        // Arrange: Mock invalid authentication
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(invalidToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

        // Act: Attempt to create tract with invalid token
        const request = createMockRequest(tractData)
        const response = await createTract(request)
        const responseBody = await response.json()
        const responseText = JSON.stringify(responseBody)

        // Assert: 401 response should not contain the invalid token
        return !containsToken(responseText, invalidToken) && !objectContainsToken(responseBody, invalidToken)
      }
    )
  })

  describe('Console Logging Security', () => {
    it.prop([
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 200 }),
        category: fc.constantFrom(...TRACT_CATEGORIES),
        description: fc.string({ minLength: 10, maxLength: 1000 }),
        coverImage: fc.webUrl(),
        documentUrl: fc.webUrl(),
        published: fc.boolean()
      }),
      fc.string({ minLength: 10, maxLength: 100 }) // Session token
    ], { numRuns: 100 })(
      'should not log session token in error logs',
      async (tractData, sessionToken) => {
        // Arrange: Mock authentication and database error
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(sessionToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMIN'
        })
        vi.mocked(prisma.tract.create).mockRejectedValue(new Error('Database connection failed'))

        // Spy on console.error
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        // Act: Attempt to create tract (will fail and log error)
        const request = createMockRequest(tractData)
        await createTract(request)

        // Assert: Console logs should not contain the session token
        const loggedMessages = consoleErrorSpy.mock.calls.map(call => 
          call.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
        )
        
        consoleErrorSpy.mockRestore()

        return loggedMessages.every(message => !containsToken(message, sessionToken))
      }
    )
  })

  describe('Comprehensive Token Security', () => {
    it.prop([
      fc.constantFrom(
        'POST /api/tracts',
        'GET /api/tracts',
        'GET /api/tracts/[id]',
        'PUT /api/tracts/[id]',
        'DELETE /api/tracts/[id]'
      ),
      fc.string({ minLength: 10, maxLength: 100 }), // Session token
      fc.boolean() // Success or error scenario
    ], { numRuns: 100 })(
      'should never expose tokens in any endpoint response',
      async (endpoint, sessionToken, shouldSucceed) => {
        // Arrange: Mock authentication
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(sessionToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMIN'
        })

        // Mock database operations based on success/failure
        if (shouldSucceed) {
          const mockTract = {
            id: 'tract-123',
            title: 'Test Tract',
            category: 'Evangelism',
            description: 'Test description for token security test',
            coverImage: 'https://example.com/image.jpg',
            documentUrl: 'https://example.com/doc.pdf',
            published: false,
            createdBy: 'user-123',
            createdAt: new Date(),
            updatedAt: new Date()
          }
          vi.mocked(prisma.tract.create).mockResolvedValue(mockTract as any)
          vi.mocked(prisma.tract.findMany).mockResolvedValue([mockTract] as any)
          vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockTract as any)
          vi.mocked(prisma.tract.update).mockResolvedValue(mockTract as any)
          vi.mocked(prisma.tract.delete).mockResolvedValue(mockTract as any)
        } else {
          const error = new Error('Database operation failed')
          vi.mocked(prisma.tract.create).mockRejectedValue(error)
          vi.mocked(prisma.tract.findMany).mockRejectedValue(error)
          vi.mocked(prisma.tract.findUnique).mockRejectedValue(error)
          vi.mocked(prisma.tract.update).mockRejectedValue(error)
          vi.mocked(prisma.tract.delete).mockRejectedValue(error)
        }

        // Act: Call the appropriate endpoint
        let response: Response

        switch (endpoint) {
          case 'POST /api/tracts': {
            const tractData = {
              title: 'Test Tract',
              category: 'Evangelism',
              description: 'Test description for token security test',
              coverImage: 'https://example.com/image.jpg',
              documentUrl: 'https://example.com/doc.pdf',
              published: false
            }
            const request = createMockRequest(tractData)
            response = await createTract(request)
            break
          }
          case 'GET /api/tracts': {
            const request = createMockRequest({})
            response = await listTracts(request)
            break
          }
          case 'GET /api/tracts/[id]': {
            const request = createMockRequest({}, 'http://localhost:3000/api/tracts/test-id')
            response = await getTract(request, { params: createMockParams('test-id') })
            break
          }
          case 'PUT /api/tracts/[id]': {
            const updateData = { title: 'Updated Title' }
            const request = createMockRequest(updateData, 'http://localhost:3000/api/tracts/test-id')
            response = await updateTract(request, { params: createMockParams('test-id') })
            break
          }
          case 'DELETE /api/tracts/[id]': {
            const request = createMockRequest({}, 'http://localhost:3000/api/tracts/test-id')
            response = await deleteTract(request, { params: createMockParams('test-id') })
            break
          }
          default:
            throw new Error(`Unknown endpoint: ${endpoint}`)
        }

        const responseBody = await response.json()
        const responseText = JSON.stringify(responseBody)

        // Assert: Response should never contain the session token
        return !containsToken(responseText, sessionToken) && !objectContainsToken(responseBody, sessionToken)
      }
    )
  })
})
