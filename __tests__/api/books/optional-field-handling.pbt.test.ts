/**
 * Property-Based Test: Optional Field Handling
 * 
 * **Validates: Requirements 1.3, 1.4, 6.1**
 * 
 * Property 4: Optional Field Handling
 * For any book creation request, the purchaseUrl field SHALL be optional, and the
 * published field SHALL default to false when not provided, while both SHALL be
 * stored correctly when provided.
 */

import { describe, it as vitestIt, expect, vi, beforeEach } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { POST } from '@/app/api/books/route'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { BOOK_CATEGORIES } from '@/lib/types/book'

// Mock dependencies
vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    book: {
      create: vi.fn()
    }
  }
}))

describe('Property 4: Optional Field Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default authentication mocks
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      id: 'super-admin',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'SUPER_ADMIN'
    })
  })

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest
  }

  /**
   * Generator for valid book payloads with required fields only
   * (no purchaseUrl, no published field)
   */
  const minimalBookPayloadArbitrary = fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
    author: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim()).filter(s => s.length > 0),
    category: fc.constantFrom(...BOOK_CATEGORIES),
    description: fc.string({ minLength: 1, maxLength: 2000 }).map(s => s.trim()).filter(s => s.length > 0),
    coverImage: fc.webUrl()
    // Intentionally omit purchaseUrl and published
  })

  /**
   * Generator for book payloads with optional purchaseUrl
   */
  const bookPayloadWithOptionalPurchaseUrlArbitrary = fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
    author: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim()).filter(s => s.length > 0),
    category: fc.constantFrom(...BOOK_CATEGORIES),
    description: fc.string({ minLength: 1, maxLength: 2000 }).map(s => s.trim()).filter(s => s.length > 0),
    coverImage: fc.webUrl(),
    purchaseUrl: fc.option(fc.webUrl(), { nil: undefined }),
    published: fc.boolean()
  })

  /**
   * Generator for book payloads with optional published field
   */
  const bookPayloadWithOptionalPublishedArbitrary = fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
    author: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim()).filter(s => s.length > 0),
    category: fc.constantFrom(...BOOK_CATEGORIES),
    description: fc.string({ minLength: 1, maxLength: 2000 }).map(s => s.trim()).filter(s => s.length > 0),
    coverImage: fc.webUrl(),
    purchaseUrl: fc.webUrl(),
    published: fc.option(fc.boolean(), { nil: undefined })
  })

  describe('purchaseUrl Optional Field Handling', () => {
    it.prop([minimalBookPayloadArbitrary])(
      'should store purchaseUrl as null when not provided',
      async (payload) => {
        const mockCreatedBook = {
          id: `book-${Math.random().toString(36).substring(7)}`,
          title: payload.title,
          author: payload.author,
          category: payload.category,
          description: payload.description,
          coverImage: payload.coverImage,
          purchaseUrl: null, // Should be null when not provided
          published: false, // Default value
          createdBy: 'super-admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

        const request = createMockRequest(payload)
        const response = await POST(request)
        const createdBook = await response.json()

        expect(response.status).toBe(201)
        expect(createdBook.purchaseUrl).toBeNull()

        // Verify the API called prisma with null purchaseUrl
        expect(prisma.book.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            purchaseUrl: null
          })
        })

        return true
      }
    )

    it.prop([bookPayloadWithOptionalPurchaseUrlArbitrary])(
      'should store purchaseUrl correctly when provided',
      async (payload) => {
        // Only test cases where purchaseUrl is provided
        fc.pre(payload.purchaseUrl !== undefined)

        const mockCreatedBook = {
          id: `book-${Math.random().toString(36).substring(7)}`,
          title: payload.title,
          author: payload.author,
          category: payload.category,
          description: payload.description,
          coverImage: payload.coverImage,
          purchaseUrl: payload.purchaseUrl,
          published: payload.published,
          createdBy: 'super-admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

        const request = createMockRequest(payload)
        const response = await POST(request)
        const createdBook = await response.json()

        expect(response.status).toBe(201)
        expect(createdBook.purchaseUrl).toBe(payload.purchaseUrl)

        // Verify the API called prisma with the provided purchaseUrl
        expect(prisma.book.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            purchaseUrl: payload.purchaseUrl
          })
        })

        return true
      }
    )

    it.prop([bookPayloadWithOptionalPurchaseUrlArbitrary])(
      'should store purchaseUrl as null when explicitly undefined',
      async (payload) => {
        // Only test cases where purchaseUrl is undefined
        fc.pre(payload.purchaseUrl === undefined)

        const mockCreatedBook = {
          id: `book-${Math.random().toString(36).substring(7)}`,
          title: payload.title,
          author: payload.author,
          category: payload.category,
          description: payload.description,
          coverImage: payload.coverImage,
          purchaseUrl: null,
          published: payload.published,
          createdBy: 'super-admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

        const request = createMockRequest(payload)
        const response = await POST(request)
        const createdBook = await response.json()

        expect(response.status).toBe(201)
        expect(createdBook.purchaseUrl).toBeNull()

        // Verify the API called prisma with null purchaseUrl
        expect(prisma.book.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            purchaseUrl: null
          })
        })

        return true
      }
    )

    it.prop([
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
        author: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim()).filter(s => s.length > 0),
        category: fc.constantFrom(...BOOK_CATEGORIES),
        description: fc.string({ minLength: 1, maxLength: 2000 }).map(s => s.trim()).filter(s => s.length > 0),
        coverImage: fc.webUrl(),
        purchaseUrl: fc.constant(''), // Empty string
        published: fc.boolean()
      })
    ])(
      'should convert empty string purchaseUrl to null',
      async (payload) => {
        const mockCreatedBook = {
          id: `book-${Math.random().toString(36).substring(7)}`,
          title: payload.title,
          author: payload.author,
          category: payload.category,
          description: payload.description,
          coverImage: payload.coverImage,
          purchaseUrl: null, // Empty string should become null
          published: payload.published,
          createdBy: 'super-admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

        const request = createMockRequest(payload)
        const response = await POST(request)
        const createdBook = await response.json()

        expect(response.status).toBe(201)
        expect(createdBook.purchaseUrl).toBeNull()

        // Verify the API called prisma with null, not empty string
        expect(prisma.book.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            purchaseUrl: null
          })
        })

        return true
      }
    )
  })

  describe('published Field Default Handling', () => {
    it.prop([minimalBookPayloadArbitrary])(
      'should default published to false when not provided',
      async (payload) => {
        const mockCreatedBook = {
          id: `book-${Math.random().toString(36).substring(7)}`,
          title: payload.title,
          author: payload.author,
          category: payload.category,
          description: payload.description,
          coverImage: payload.coverImage,
          purchaseUrl: null,
          published: false, // Should default to false
          createdBy: 'super-admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

        const request = createMockRequest(payload)
        const response = await POST(request)
        const createdBook = await response.json()

        expect(response.status).toBe(201)
        expect(createdBook.published).toBe(false)

        // Verify the API called prisma with published: false
        expect(prisma.book.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            published: false
          })
        })

        return true
      }
    )

    it.prop([bookPayloadWithOptionalPublishedArbitrary])(
      'should store published correctly when provided as true',
      async (payload) => {
        // Only test cases where published is explicitly true
        fc.pre(payload.published === true)

        const mockCreatedBook = {
          id: `book-${Math.random().toString(36).substring(7)}`,
          title: payload.title,
          author: payload.author,
          category: payload.category,
          description: payload.description,
          coverImage: payload.coverImage,
          purchaseUrl: payload.purchaseUrl,
          published: true,
          createdBy: 'super-admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

        const request = createMockRequest(payload)
        const response = await POST(request)
        const createdBook = await response.json()

        expect(response.status).toBe(201)
        expect(createdBook.published).toBe(true)

        // Verify the API called prisma with published: true
        expect(prisma.book.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            published: true
          })
        })

        return true
      }
    )

    it.prop([bookPayloadWithOptionalPublishedArbitrary])(
      'should store published correctly when provided as false',
      async (payload) => {
        // Only test cases where published is explicitly false
        fc.pre(payload.published === false)

        const mockCreatedBook = {
          id: `book-${Math.random().toString(36).substring(7)}`,
          title: payload.title,
          author: payload.author,
          category: payload.category,
          description: payload.description,
          coverImage: payload.coverImage,
          purchaseUrl: payload.purchaseUrl,
          published: false,
          createdBy: 'super-admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

        const request = createMockRequest(payload)
        const response = await POST(request)
        const createdBook = await response.json()

        expect(response.status).toBe(201)
        expect(createdBook.published).toBe(false)

        // Verify the API called prisma with published: false
        expect(prisma.book.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            published: false
          })
        })

        return true
      }
    )

    it.prop([bookPayloadWithOptionalPublishedArbitrary])(
      'should default published to false when explicitly undefined',
      async (payload) => {
        // Only test cases where published is undefined
        fc.pre(payload.published === undefined)

        const mockCreatedBook = {
          id: `book-${Math.random().toString(36).substring(7)}`,
          title: payload.title,
          author: payload.author,
          category: payload.category,
          description: payload.description,
          coverImage: payload.coverImage,
          purchaseUrl: payload.purchaseUrl,
          published: false, // Should default to false
          createdBy: 'super-admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

        const request = createMockRequest(payload)
        const response = await POST(request)
        const createdBook = await response.json()

        expect(response.status).toBe(201)
        expect(createdBook.published).toBe(false)

        // Verify the API called prisma with published: false
        expect(prisma.book.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            published: false
          })
        })

        return true
      }
    )
  })

  describe('Combined Optional Field Handling', () => {
    it.prop([
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
        author: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim()).filter(s => s.length > 0),
        category: fc.constantFrom(...BOOK_CATEGORIES),
        description: fc.string({ minLength: 1, maxLength: 2000 }).map(s => s.trim()).filter(s => s.length > 0),
        coverImage: fc.webUrl(),
        purchaseUrl: fc.option(fc.webUrl(), { nil: undefined }),
        published: fc.option(fc.boolean(), { nil: undefined })
      })
    ])(
      'should handle both optional fields correctly in any combination',
      async (payload) => {
        const expectedPurchaseUrl = payload.purchaseUrl || null
        const expectedPublished = payload.published ?? false

        const mockCreatedBook = {
          id: `book-${Math.random().toString(36).substring(7)}`,
          title: payload.title,
          author: payload.author,
          category: payload.category,
          description: payload.description,
          coverImage: payload.coverImage,
          purchaseUrl: expectedPurchaseUrl,
          published: expectedPublished,
          createdBy: 'super-admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

        const request = createMockRequest(payload)
        const response = await POST(request)
        const createdBook = await response.json()

        expect(response.status).toBe(201)
        expect(createdBook.purchaseUrl).toBe(expectedPurchaseUrl)
        expect(createdBook.published).toBe(expectedPublished)

        // Verify the API called prisma with correct values
        expect(prisma.book.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            purchaseUrl: expectedPurchaseUrl,
            published: expectedPublished
          })
        })

        return true
      }
    )

    it.prop([
      fc.tuple(
        fc.option(fc.webUrl(), { nil: undefined }),
        fc.option(fc.boolean(), { nil: undefined })
      )
    ])(
      'should maintain independence between purchaseUrl and published fields',
      async ([purchaseUrl, published]) => {
        const payload = {
          title: 'Test Book',
          author: 'Test Author',
          category: 'Spiritual Growth' as const,
          description: 'Test description',
          coverImage: 'https://example.com/image.jpg',
          ...(purchaseUrl !== undefined && { purchaseUrl }),
          ...(published !== undefined && { published })
        }

        const expectedPurchaseUrl = purchaseUrl || null
        const expectedPublished = published ?? false

        const mockCreatedBook = {
          id: `book-${Math.random().toString(36).substring(7)}`,
          title: payload.title,
          author: payload.author,
          category: payload.category,
          description: payload.description,
          coverImage: payload.coverImage,
          purchaseUrl: expectedPurchaseUrl,
          published: expectedPublished,
          createdBy: 'super-admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

        const request = createMockRequest(payload)
        const response = await POST(request)
        const createdBook = await response.json()

        expect(response.status).toBe(201)
        
        // Verify purchaseUrl is independent of published
        expect(createdBook.purchaseUrl).toBe(expectedPurchaseUrl)
        
        // Verify published is independent of purchaseUrl
        expect(createdBook.published).toBe(expectedPublished)

        return true
      }
    )
  })

  describe('Edge Cases', () => {
    vitestIt('should handle all four combinations of optional fields', async () => {
      const testCases = [
        { purchaseUrl: undefined, published: undefined, expectedPurchaseUrl: null, expectedPublished: false },
        { purchaseUrl: 'https://example.com/buy', published: undefined, expectedPurchaseUrl: 'https://example.com/buy', expectedPublished: false },
        { purchaseUrl: undefined, published: true, expectedPurchaseUrl: null, expectedPublished: true },
        { purchaseUrl: 'https://example.com/buy', published: true, expectedPurchaseUrl: 'https://example.com/buy', expectedPublished: true }
      ]

      for (const testCase of testCases) {
        const payload: any = {
          title: 'Test Book',
          author: 'Test Author',
          category: 'Spiritual Growth',
          description: 'Test description',
          coverImage: 'https://example.com/image.jpg'
        }

        if (testCase.purchaseUrl !== undefined) {
          payload.purchaseUrl = testCase.purchaseUrl
        }

        if (testCase.published !== undefined) {
          payload.published = testCase.published
        }

        const mockCreatedBook = {
          id: `book-${Math.random().toString(36).substring(7)}`,
          title: payload.title,
          author: payload.author,
          category: payload.category,
          description: payload.description,
          coverImage: payload.coverImage,
          purchaseUrl: testCase.expectedPurchaseUrl,
          published: testCase.expectedPublished,
          createdBy: 'super-admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

        const request = createMockRequest(payload)
        const response = await POST(request)
        const createdBook = await response.json()

        expect(response.status).toBe(201)
        expect(createdBook.purchaseUrl).toBe(testCase.expectedPurchaseUrl)
        expect(createdBook.published).toBe(testCase.expectedPublished)
      }
    })
  })
})
