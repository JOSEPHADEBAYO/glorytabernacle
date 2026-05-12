/**
 * Property-Based Test: Authentication Enforcement
 * 
 * Feature: tracts-management-system, Property 15: Authentication Enforcement
 * 
 * **Validates: Requirements 7.1, 7.2, 7.4**
 * 
 * Property 15: Authentication Enforcement
 * For any API request to create, update, delete tracts, or upload files without a valid
 * session token, the API SHALL return HTTP status 401 with an "Unauthorized" error message.
 */

import { describe, beforeEach, vi } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { POST as createTract } from '@/app/api/tracts/route'
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

describe('Property 15: Authentication Enforcement', () => {
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

  describe('POST /api/tracts - Create Tract', () => {
    it.prop([
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 200 }),
        category: fc.constantFrom(...TRACT_CATEGORIES),
        description: fc.string({ minLength: 10, maxLength: 1000 }),
        coverImage: fc.webUrl(),
        documentUrl: fc.webUrl(),
        published: fc.boolean()
      })
    ], { numRuns: 100 })(
      'should return 401 when session token is null',
      async (tractData) => {
        // Arrange: Mock no session token
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

        // Act: Attempt to create tract
        const request = createMockRequest(tractData)
        const response = await createTract(request)
        const data = await response.json()

        // Assert: Should return 401 Unauthorized
        return response.status === 401 && data.error === 'Unauthorized'
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
      fc.string({ minLength: 1, maxLength: 100 }) // Any non-empty token
    ], { numRuns: 100 })(
      'should return 401 when session user is invalid',
      async (tractData, invalidToken) => {
        // Arrange: Mock token exists but user is invalid
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(invalidToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

        // Act: Attempt to create tract
        const request = createMockRequest(tractData)
        const response = await createTract(request)
        const data = await response.json()

        // Assert: Should return 401 Unauthorized
        return response.status === 401 && data.error === 'Unauthorized'
      }
    )
  })

  describe('GET /api/tracts - List Tracts', () => {
    it.prop([
      fc.record({
        published: fc.option(fc.constantFrom('true', 'false'), { nil: undefined }),
        category: fc.option(fc.constantFrom(...TRACT_CATEGORIES), { nil: undefined })
      })
    ], { numRuns: 100 })(
      'should return 401 when session token is null',
      async (queryParams) => {
        // Arrange: Mock no session token
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

        // Build URL with query params
        const url = new URL('http://localhost:3000/api/tracts')
        if (queryParams.published) url.searchParams.set('published', queryParams.published)
        if (queryParams.category) url.searchParams.set('category', queryParams.category)

        // Act: Attempt to list tracts
        const request = createMockRequest({}, url.toString())
        const { GET } = await import('@/app/api/tracts/route')
        const response = await GET(request)
        const data = await response.json()

        // Assert: Should return 401 Unauthorized
        return response.status === 401 && data.error === 'Unauthorized'
      }
    )

    it.prop([
      fc.record({
        published: fc.option(fc.constantFrom('true', 'false'), { nil: undefined }),
        category: fc.option(fc.constantFrom(...TRACT_CATEGORIES), { nil: undefined })
      }),
      fc.string({ minLength: 1, maxLength: 100 })
    ], { numRuns: 100 })(
      'should return 401 when session user is invalid',
      async (queryParams, invalidToken) => {
        // Arrange: Mock token exists but user is invalid
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(invalidToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

        // Build URL with query params
        const url = new URL('http://localhost:3000/api/tracts')
        if (queryParams.published) url.searchParams.set('published', queryParams.published)
        if (queryParams.category) url.searchParams.set('category', queryParams.category)

        // Act: Attempt to list tracts
        const request = createMockRequest({}, url.toString())
        const { GET } = await import('@/app/api/tracts/route')
        const response = await GET(request)
        const data = await response.json()

        // Assert: Should return 401 Unauthorized
        return response.status === 401 && data.error === 'Unauthorized'
      }
    )
  })

  describe('GET /api/tracts/[id] - Get Single Tract', () => {
    it.prop([
      fc.string({ minLength: 1, maxLength: 50 }) // Tract ID
    ], { numRuns: 100 })(
      'should return 401 when session token is null',
      async (tractId) => {
        // Arrange: Mock no session token
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

        // Act: Attempt to get tract
        const request = createMockRequest({}, `http://localhost:3000/api/tracts/${tractId}`)
        const response = await getTract(request, { params: createMockParams(tractId) })
        const data = await response.json()

        // Assert: Should return 401 Unauthorized
        return response.status === 401 && data.error === 'Unauthorized'
      }
    )

    it.prop([
      fc.string({ minLength: 1, maxLength: 50 }), // Tract ID
      fc.string({ minLength: 1, maxLength: 100 }) // Invalid token
    ], { numRuns: 100 })(
      'should return 401 when session user is invalid',
      async (tractId, invalidToken) => {
        // Arrange: Mock token exists but user is invalid
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(invalidToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

        // Act: Attempt to get tract
        const request = createMockRequest({}, `http://localhost:3000/api/tracts/${tractId}`)
        const response = await getTract(request, { params: createMockParams(tractId) })
        const data = await response.json()

        // Assert: Should return 401 Unauthorized
        return response.status === 401 && data.error === 'Unauthorized'
      }
    )
  })

  describe('PUT /api/tracts/[id] - Update Tract', () => {
    it.prop([
      fc.string({ minLength: 1, maxLength: 50 }), // Tract ID
      fc.record({
        title: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
        category: fc.option(fc.constantFrom(...TRACT_CATEGORIES), { nil: undefined }),
        description: fc.option(fc.string({ minLength: 10, maxLength: 1000 }), { nil: undefined }),
        coverImage: fc.option(fc.webUrl(), { nil: undefined }),
        documentUrl: fc.option(fc.webUrl(), { nil: undefined }),
        published: fc.option(fc.boolean(), { nil: undefined })
      }).filter(obj => Object.keys(obj).some(key => obj[key as keyof typeof obj] !== undefined))
    ], { numRuns: 100 })(
      'should return 401 when session token is null',
      async (tractId, updateData) => {
        // Arrange: Mock no session token
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

        // Act: Attempt to update tract
        const request = createMockRequest(updateData, `http://localhost:3000/api/tracts/${tractId}`)
        const response = await updateTract(request, { params: createMockParams(tractId) })
        const data = await response.json()

        // Assert: Should return 401 Unauthorized
        return response.status === 401 && data.error === 'Unauthorized'
      }
    )

    it.prop([
      fc.string({ minLength: 1, maxLength: 50 }), // Tract ID
      fc.record({
        title: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
        category: fc.option(fc.constantFrom(...TRACT_CATEGORIES), { nil: undefined }),
        description: fc.option(fc.string({ minLength: 10, maxLength: 1000 }), { nil: undefined }),
        coverImage: fc.option(fc.webUrl(), { nil: undefined }),
        documentUrl: fc.option(fc.webUrl(), { nil: undefined }),
        published: fc.option(fc.boolean(), { nil: undefined })
      }).filter(obj => Object.keys(obj).some(key => obj[key as keyof typeof obj] !== undefined)),
      fc.string({ minLength: 1, maxLength: 100 }) // Invalid token
    ], { numRuns: 100 })(
      'should return 401 when session user is invalid',
      async (tractId, updateData, invalidToken) => {
        // Arrange: Mock token exists but user is invalid
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(invalidToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

        // Act: Attempt to update tract
        const request = createMockRequest(updateData, `http://localhost:3000/api/tracts/${tractId}`)
        const response = await updateTract(request, { params: createMockParams(tractId) })
        const data = await response.json()

        // Assert: Should return 401 Unauthorized
        return response.status === 401 && data.error === 'Unauthorized'
      }
    )
  })

  describe('DELETE /api/tracts/[id] - Delete Tract', () => {
    it.prop([
      fc.string({ minLength: 1, maxLength: 50 }) // Tract ID
    ], { numRuns: 100 })(
      'should return 401 when session token is null',
      async (tractId) => {
        // Arrange: Mock no session token
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

        // Act: Attempt to delete tract
        const request = createMockRequest({}, `http://localhost:3000/api/tracts/${tractId}`)
        const response = await deleteTract(request, { params: createMockParams(tractId) })
        const data = await response.json()

        // Assert: Should return 401 Unauthorized
        return response.status === 401 && data.error === 'Unauthorized'
      }
    )

    it.prop([
      fc.string({ minLength: 1, maxLength: 50 }), // Tract ID
      fc.string({ minLength: 1, maxLength: 100 }) // Invalid token
    ], { numRuns: 100 })(
      'should return 401 when session user is invalid',
      async (tractId, invalidToken) => {
        // Arrange: Mock token exists but user is invalid
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(invalidToken)
        vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

        // Act: Attempt to delete tract
        const request = createMockRequest({}, `http://localhost:3000/api/tracts/${tractId}`)
        const response = await deleteTract(request, { params: createMockParams(tractId) })
        const data = await response.json()

        // Assert: Should return 401 Unauthorized
        return response.status === 401 && data.error === 'Unauthorized'
      }
    )
  })

  describe('POST /api/upload - Upload File', () => {
    it.prop([
      fc.constantFrom('image/jpeg', 'image/png', 'application/pdf'),
      fc.integer({ min: 1, max: 5 * 1024 * 1024 }) // File size up to 5MB
    ], { numRuns: 100 })(
      'should return 401 when session token is null',
      async (fileType, fileSize) => {
        // Arrange: Mock no session token
        vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

        // Create mock file
        const buffer = new ArrayBuffer(fileSize)
        const file = new File([buffer], 'test-file', { type: fileType })

        // Act: Attempt to upload file
        const request = createMockRequest({ file }, 'http://localhost:3000/api/upload')
        const response = await uploadFile(request)
        const data = await response.json()

        // Assert: Should return 401 Unauthorized
        return response.status === 401 && data.error === 'Unauthorized'
      }
    )
  })

  describe('Comprehensive Authentication Enforcement', () => {
    it.prop([
      fc.constantFrom(
        'POST /api/tracts',
        'GET /api/tracts',
        'GET /api/tracts/[id]',
        'PUT /api/tracts/[id]',
        'DELETE /api/tracts/[id]',
        'POST /api/upload'
      ),
      fc.oneof(
        fc.constant(null), // No token
        fc.string({ minLength: 1, maxLength: 100 }).map(token => ({ token, user: null })) // Invalid token
      )
    ], { numRuns: 100 })(
      'should enforce authentication on all protected endpoints',
      async (endpoint, authState) => {
        // Arrange: Mock authentication state
        if (authState === null) {
          vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)
        } else {
          vi.mocked(sessionModule.getSessionToken).mockResolvedValue(authState.token)
          vi.mocked(sessionModule.getSessionUser).mockResolvedValue(authState.user)
        }

        // Act: Call the appropriate endpoint
        let response: Response

        switch (endpoint) {
          case 'POST /api/tracts': {
            const tractData = {
              title: 'Test Tract',
              category: 'Evangelism',
              description: 'Test description for authentication test',
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
            const { GET } = await import('@/app/api/tracts/route')
            response = await GET(request)
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
          case 'POST /api/upload': {
            const file = new File([new ArrayBuffer(1024)], 'test.jpg', { type: 'image/jpeg' })
            const request = createMockRequest({ file })
            response = await uploadFile(request)
            break
          }
          default:
            throw new Error(`Unknown endpoint: ${endpoint}`)
        }

        const data = await response.json()

        // Assert: All endpoints should return 401 Unauthorized
        return response.status === 401 && data.error === 'Unauthorized'
      }
    )
  })
})
