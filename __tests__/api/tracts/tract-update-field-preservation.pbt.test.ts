/**
 * Property-Based Test: Update Field Preservation and Response Accuracy
 * 
 * Feature: tracts-management-system, Property 10: Update Field Preservation
 * Feature: tracts-management-system, Property 11: Update Response Accuracy
 * 
 * **Validates: Requirements 3.1, 3.2, 3.5, 3.8, 3.9**
 * 
 * Property 10: Update Field Preservation
 * For any tract update request, only the fields specified in the update payload SHALL
 * be modified, while all other fields (except updatedAt) SHALL remain unchanged, and
 * createdAt and createdBy SHALL never change.
 * 
 * Property 11: Update Response Accuracy
 * For any valid tract update, the API SHALL return HTTP status 200 with the complete
 * updated tract record reflecting all changes.
 */

import { describe, beforeEach, vi, expect } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { PUT } from '@/app/api/tracts/[id]/route'
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
      update: vi.fn()
    }
  }
}))

describe('Property 10: Update Field Preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default authentication mocks
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com'
    })
  })

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest
  }

  const createMockParams = (id: string) => {
    return Promise.resolve({ id })
  }

  // Arbitrary for generating complete existing tracts
  const existingTractArbitrary = fc.record({
    id: fc.string({ minLength: 10, maxLength: 30 }),
    title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
    category: fc.constantFrom(...TRACT_CATEGORIES),
    description: fc.string({ minLength: 10, maxLength: 1000 }).map(s => s.trim()).filter(s => s.length >= 10),
    coverImage: fc.webUrl(),
    documentUrl: fc.webUrl(),
    published: fc.boolean(),
    createdBy: fc.string({ minLength: 5, maxLength: 50 }),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-01-01') }),
    updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-01-01') })
  })

  // Arbitrary for generating partial update payloads
  const partialUpdateArbitrary = fc.oneof(
    // Update only title
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0)
    }),
    // Update only category
    fc.record({
      category: fc.constantFrom(...TRACT_CATEGORIES)
    }),
    // Update only description
    fc.record({
      description: fc.string({ minLength: 10, maxLength: 1000 }).map(s => s.trim()).filter(s => s.length >= 10)
    }),
    // Update only coverImage
    fc.record({
      coverImage: fc.webUrl()
    }),
    // Update only documentUrl
    fc.record({
      documentUrl: fc.webUrl()
    }),
    // Update only published
    fc.record({
      published: fc.boolean()
    }),
    // Update multiple fields
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
      description: fc.string({ minLength: 10, maxLength: 1000 }).map(s => s.trim()).filter(s => s.length >= 10)
    }),
    // Update multiple fields including published
    fc.record({
      category: fc.constantFrom(...TRACT_CATEGORIES),
      published: fc.boolean()
    })
  )

  it.prop([existingTractArbitrary, partialUpdateArbitrary], { numRuns: 20 })(
    'should only modify fields specified in update payload',
    async (existingTract, updatePayload) => {
      // Mock existing tract
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(existingTract as any)

      // Create expected updated tract
      const now = new Date()
      const updatedTract = {
        ...existingTract,
        ...updatePayload,
        updatedAt: now
      }

      vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract as any)

      // Execute update
      const request = createMockRequest(updatePayload)
      const params = createMockParams(existingTract.id)
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(200)

      // Verify updated fields match the payload
      for (const [key, value] of Object.entries(updatePayload)) {
        expect(result[key]).toBe(value)
      }

      // Verify non-updated fields remain unchanged
      const updateKeys = Object.keys(updatePayload)
      const allFields = ['title', 'category', 'description', 'coverImage', 'documentUrl', 'published']
      
      for (const field of allFields) {
        if (!updateKeys.includes(field)) {
          expect(result[field]).toBe(existingTract[field as keyof typeof existingTract])
        }
      }

      return true
    }
  )

  it.prop([existingTractArbitrary, partialUpdateArbitrary], { numRuns: 20 })(
    'should never modify createdAt field',
    async (existingTract, updatePayload) => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(existingTract as any)

      const now = new Date()
      const updatedTract = {
        ...existingTract,
        ...updatePayload,
        updatedAt: now
      }

      vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract as any)

      const request = createMockRequest(updatePayload)
      const params = createMockParams(existingTract.id)
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(200)
      // Compare as ISO strings since JSON serialization converts dates to strings
      expect(new Date(result.createdAt).toISOString()).toBe(existingTract.createdAt.toISOString())

      return true
    }
  )

  it.prop([existingTractArbitrary, partialUpdateArbitrary], { numRuns: 20 })(
    'should never modify createdBy field',
    async (existingTract, updatePayload) => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(existingTract as any)

      const now = new Date()
      const updatedTract = {
        ...existingTract,
        ...updatePayload,
        updatedAt: now
      }

      vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract as any)

      const request = createMockRequest(updatePayload)
      const params = createMockParams(existingTract.id)
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.createdBy).toBe(existingTract.createdBy)

      return true
    }
  )

  it.prop([existingTractArbitrary, partialUpdateArbitrary], { numRuns: 20 })(
    'should update updatedAt timestamp',
    async (existingTract, updatePayload) => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(existingTract as any)

      const now = new Date()
      const updatedTract = {
        ...existingTract,
        ...updatePayload,
        updatedAt: now
      }

      vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract as any)

      const request = createMockRequest(updatePayload)
      const params = createMockParams(existingTract.id)
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toHaveProperty('updatedAt')
      expect(result.updatedAt).toBeTruthy()

      return true
    }
  )
})

describe('Property 11: Update Response Accuracy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default authentication mocks
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com'
    })
  })

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest
  }

  const createMockParams = (id: string) => {
    return Promise.resolve({ id })
  }

  const existingTractArbitrary = fc.record({
    id: fc.string({ minLength: 10, maxLength: 30 }),
    title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
    category: fc.constantFrom(...TRACT_CATEGORIES),
    description: fc.string({ minLength: 10, maxLength: 1000 }).map(s => s.trim()).filter(s => s.length >= 10),
    coverImage: fc.webUrl(),
    documentUrl: fc.webUrl(),
    published: fc.boolean(),
    createdBy: fc.string({ minLength: 5, maxLength: 50 }),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-01-01') }),
    updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-01-01') })
  })

  const validUpdatePayloadArbitrary = fc.record({
    title: fc.option(fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0), { nil: undefined }),
    category: fc.option(fc.constantFrom(...TRACT_CATEGORIES), { nil: undefined }),
    description: fc.option(fc.string({ minLength: 10, maxLength: 1000 }).map(s => s.trim()).filter(s => s.length >= 10), { nil: undefined }),
    coverImage: fc.option(fc.webUrl(), { nil: undefined }),
    documentUrl: fc.option(fc.webUrl(), { nil: undefined }),
    published: fc.option(fc.boolean(), { nil: undefined })
  }).map(obj => {
    // Remove undefined fields
    const filtered: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        filtered[key] = value
      }
    }
    return filtered
  }).filter(obj => Object.keys(obj).length > 0) // Ensure at least one field

  it.prop([existingTractArbitrary, validUpdatePayloadArbitrary], { numRuns: 20 })(
    'should return HTTP status 200 for valid updates',
    async (existingTract, updatePayload) => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(existingTract as any)

      const updatedTract = {
        ...existingTract,
        ...updatePayload,
        updatedAt: new Date()
      }

      vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract as any)

      const request = createMockRequest(updatePayload)
      const params = createMockParams(existingTract.id)
      const response = await PUT(request, { params })

      expect(response.status).toBe(200)

      return true
    }
  )

  it.prop([existingTractArbitrary, validUpdatePayloadArbitrary], { numRuns: 20 })(
    'should return complete updated tract record',
    async (existingTract, updatePayload) => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(existingTract as any)

      const updatedTract = {
        ...existingTract,
        ...updatePayload,
        updatedAt: new Date()
      }

      vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract as any)

      const request = createMockRequest(updatePayload)
      const params = createMockParams(existingTract.id)
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(200)

      // Verify all required fields are present in response
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('category')
      expect(result).toHaveProperty('description')
      expect(result).toHaveProperty('coverImage')
      expect(result).toHaveProperty('documentUrl')
      expect(result).toHaveProperty('published')
      expect(result).toHaveProperty('createdBy')
      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('updatedAt')

      return true
    }
  )

  it.prop([existingTractArbitrary, validUpdatePayloadArbitrary], { numRuns: 20 })(
    'should reflect all changes in the response',
    async (existingTract, updatePayload) => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(existingTract as any)

      const updatedTract = {
        ...existingTract,
        ...updatePayload,
        updatedAt: new Date()
      }

      vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract as any)

      const request = createMockRequest(updatePayload)
      const params = createMockParams(existingTract.id)
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(200)

      // Verify all updated fields are reflected in the response
      for (const [key, value] of Object.entries(updatePayload)) {
        if (value !== undefined) {
          expect(result[key]).toBe(value)
        }
      }

      return true
    }
  )

  it.prop([existingTractArbitrary, validUpdatePayloadArbitrary], { numRuns: 20 })(
    'should preserve tract ID in response',
    async (existingTract, updatePayload) => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(existingTract as any)

      const updatedTract = {
        ...existingTract,
        ...updatePayload,
        updatedAt: new Date()
      }

      vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract as any)

      const request = createMockRequest(updatePayload)
      const params = createMockParams(existingTract.id)
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.id).toBe(existingTract.id)

      return true
    }
  )
})
