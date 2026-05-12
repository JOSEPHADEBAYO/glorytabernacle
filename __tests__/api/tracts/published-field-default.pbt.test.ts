/**
 * Property-Based Test: Published Field Default Handling
 * 
 * Feature: tracts-management-system, Property 4: Published Field Default Handling
 * 
 * **Validates: Requirements 1.3, 6.1**
 * 
 * Property 4: Published Field Default Handling
 * For any tract creation request, the published field SHALL default to false when not
 * provided, and SHALL be stored correctly when explicitly provided as true or false.
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
      create: vi.fn()
    }
  }
}))

describe('Property 4: Published Field Default Handling', () => {
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

  it.prop([
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
      category: fc.constantFrom(...TRACT_CATEGORIES),
      description: fc.string({ minLength: 10, maxLength: 1000 }).map(s => s.trim()).filter(s => s.length >= 10),
      coverImage: fc.webUrl(),
      documentUrl: fc.webUrl()
      // Note: published field is intentionally omitted
    })
  ], { numRuns: 20 })('should default published to false when not provided', async (tractData) => {
    const mockCreatedTract = {
      id: `tract-${Math.random().toString(36).substring(7)}`,
      ...tractData,
      published: false, // Default value
      createdBy: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

    const request = createMockRequest(tractData)
    const response = await POST(request)
    const createdTract = await response.json()

    expect(response.status).toBe(201)
    expect(createdTract.published).toBe(false)

    // Verify the API called prisma with published: false
    expect(prisma.tract.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        published: false
      })
    })

    return true
  })

  it.prop([
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
      category: fc.constantFrom(...TRACT_CATEGORIES),
      description: fc.string({ minLength: 10, maxLength: 1000 }).map(s => s.trim()).filter(s => s.length >= 10),
      coverImage: fc.webUrl(),
      documentUrl: fc.webUrl(),
      published: fc.constant(true)
    })
  ], { numRuns: 20 })('should store published as true when explicitly provided', async (tractData) => {
    const mockCreatedTract = {
      id: `tract-${Math.random().toString(36).substring(7)}`,
      ...tractData,
      createdBy: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

    const request = createMockRequest(tractData)
    const response = await POST(request)
    const createdTract = await response.json()

    expect(response.status).toBe(201)
    expect(createdTract.published).toBe(true)

    return true
  })

  it.prop([
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
      category: fc.constantFrom(...TRACT_CATEGORIES),
      description: fc.string({ minLength: 10, maxLength: 1000 }).map(s => s.trim()).filter(s => s.length >= 10),
      coverImage: fc.webUrl(),
      documentUrl: fc.webUrl(),
      published: fc.constant(false)
    })
  ], { numRuns: 20 })('should store published as false when explicitly provided', async (tractData) => {
    const mockCreatedTract = {
      id: `tract-${Math.random().toString(36).substring(7)}`,
      ...tractData,
      createdBy: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

    const request = createMockRequest(tractData)
    const response = await POST(request)
    const createdTract = await response.json()

    expect(response.status).toBe(201)
    expect(createdTract.published).toBe(false)

    return true
  })

  it.prop([
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
      category: fc.constantFrom(...TRACT_CATEGORIES),
      description: fc.string({ minLength: 10, maxLength: 1000 }).map(s => s.trim()).filter(s => s.length >= 10),
      coverImage: fc.webUrl(),
      documentUrl: fc.webUrl(),
      published: fc.boolean()
    })
  ], { numRuns: 20 })('should correctly store any boolean value for published', async (tractData) => {
    const mockCreatedTract = {
      id: `tract-${Math.random().toString(36).substring(7)}`,
      ...tractData,
      createdBy: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

    const request = createMockRequest(tractData)
    const response = await POST(request)
    const createdTract = await response.json()

    expect(response.status).toBe(201)
    expect(createdTract.published).toBe(tractData.published)

    return true
  })
})
