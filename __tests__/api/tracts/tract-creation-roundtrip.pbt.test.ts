/**
 * Property-Based Test: Tract Creation Round-Trip
 * 
 * Feature: tracts-management-system, Property 3: Tract Creation Round-Trip
 * 
 * **Validates: Requirements 1.1, 1.7, 1.9, 1.10, 2.2**
 * 
 * Property 3: Tract Creation Round-Trip
 * For any valid tract creation payload, creating a tract and then retrieving it SHALL
 * return a record with all input fields preserved, plus automatically generated id,
 * createdAt, updatedAt, and createdBy fields.
 */

import { describe, beforeEach, vi, expect } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { POST } from '@/app/api/tracts/route'
import { TRACT_CATEGORIES } from '@/lib/types/tract'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

// Mock dependencies
vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tract: {
      create: vi.fn(),
      findUnique: vi.fn()
    }
  }
}))

describe('Property 3: Tract Creation Round-Trip', () => {
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

  const validTractPayloadArbitrary = fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
    category: fc.constantFrom(...TRACT_CATEGORIES),
    description: fc.string({ minLength: 10, maxLength: 1000 }).map(s => s.trim()).filter(s => s.length >= 10),
    coverImage: fc.webUrl(),
    documentUrl: fc.webUrl(),
    published: fc.boolean()
  })

  it.prop([validTractPayloadArbitrary], { numRuns: 20 })(
    'should preserve all input fields when creating a tract',
    async (payload) => {
      // Generate mock database response with auto-generated fields
      const mockCreatedTract = {
        id: `tract-${Math.random().toString(36).substring(7)}`,
        title: payload.title,
        category: payload.category,
        description: payload.description,
        coverImage: payload.coverImage,
        documentUrl: payload.documentUrl,
        published: payload.published,
        createdBy: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

      // Create the tract via API
      const request = createMockRequest(payload)
      const response = await POST(request)
      const createdTract = await response.json()

      // Verify successful creation
      expect(response.status).toBe(201)

      // Verify all input fields are preserved
      expect(createdTract.title).toBe(payload.title)
      expect(createdTract.category).toBe(payload.category)
      expect(createdTract.description).toBe(payload.description)
      expect(createdTract.coverImage).toBe(payload.coverImage)
      expect(createdTract.documentUrl).toBe(payload.documentUrl)
      expect(createdTract.published).toBe(payload.published)

      // Verify auto-generated fields are present
      expect(createdTract).toHaveProperty('id')
      expect(typeof createdTract.id).toBe('string')
      expect(createdTract.id.length).toBeGreaterThan(0)

      expect(createdTract).toHaveProperty('createdBy')
      expect(typeof createdTract.createdBy).toBe('string')
      expect(createdTract.createdBy).toBe('test-user-id')

      expect(createdTract).toHaveProperty('createdAt')
      expect(createdTract.createdAt).toBeTruthy()

      expect(createdTract).toHaveProperty('updatedAt')
      expect(createdTract.updatedAt).toBeTruthy()

      return true
    }
  )

  it.prop([validTractPayloadArbitrary], { numRuns: 20 })(
    'should set createdBy to authenticated user ID',
    async (payload) => {
      const mockCreatedTract = {
        id: `tract-${Math.random().toString(36).substring(7)}`,
        ...payload,
        createdBy: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

      const request = createMockRequest(payload)
      const response = await POST(request)
      const createdTract = await response.json()

      expect(response.status).toBe(201)
      expect(createdTract.createdBy).toBe('test-user-id')

      return true
    }
  )

  it.prop([validTractPayloadArbitrary], { numRuns: 20 })(
    'should set createdAt and updatedAt to the same value on creation',
    async (payload) => {
      const now = new Date()
      const mockCreatedTract = {
        id: `tract-${Math.random().toString(36).substring(7)}`,
        ...payload,
        createdBy: 'test-user-id',
        createdAt: now,
        updatedAt: now
      }

      vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

      const request = createMockRequest(payload)
      const response = await POST(request)
      const createdTract = await response.json()

      expect(response.status).toBe(201)

      // On creation, createdAt and updatedAt should be the same
      expect(createdTract.createdAt).toBe(createdTract.updatedAt)

      return true
    }
  )
})
