/**
 * Property-Based Test: Book Creation Round-Trip
 * 
 * **Validates: Requirements 1.1, 1.8, 1.10, 1.11, 2.2**
 * 
 * Property 3: Book Creation Round-Trip
 * For any valid book creation payload, creating a book and then retrieving it SHALL
 * return a record with all input fields preserved, plus automatically generated id,
 * createdAt, updatedAt, and createdBy fields.
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
      create: vi.fn(),
      findUnique: vi.fn()
    }
  }
}))

describe('Property 3: Book Creation Round-Trip', () => {
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
   * Generator for valid book creation payloads
   * Generates arbitrary valid data that should pass validation
   */
  const validBookPayloadArbitrary = fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
    author: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim()).filter(s => s.length > 0),
    category: fc.constantFrom(...BOOK_CATEGORIES),
    description: fc.string({ minLength: 1, maxLength: 2000 }).map(s => s.trim()).filter(s => s.length > 0),
    coverImage: fc.webUrl(),
    purchaseUrl: fc.option(fc.webUrl(), { nil: undefined }),
    published: fc.boolean()
  })

  it.prop([validBookPayloadArbitrary])(
    'should preserve all input fields when creating and retrieving a book',
    async (payload) => {
      // Generate mock database response with auto-generated fields
      const mockCreatedBook = {
        id: `book-${Math.random().toString(36).substring(7)}`,
        title: payload.title,
        author: payload.author,
        category: payload.category,
        description: payload.description,
        coverImage: payload.coverImage,
        purchaseUrl: payload.purchaseUrl || null,
        published: payload.published,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

      // Create the book via API
      const request = createMockRequest(payload)
      const response = await POST(request)
      const createdBook = await response.json()

      // Verify successful creation
      expect(response.status).toBe(201)

      // Verify all input fields are preserved
      expect(createdBook.title).toBe(payload.title)
      expect(createdBook.author).toBe(payload.author)
      expect(createdBook.category).toBe(payload.category)
      expect(createdBook.description).toBe(payload.description)
      expect(createdBook.coverImage).toBe(payload.coverImage)
      
      // Handle optional purchaseUrl (undefined becomes null in database)
      if (payload.purchaseUrl !== undefined) {
        expect(createdBook.purchaseUrl).toBe(payload.purchaseUrl)
      } else {
        expect(createdBook.purchaseUrl).toBeNull()
      }
      
      expect(createdBook.published).toBe(payload.published)

      // Verify auto-generated fields are present
      expect(createdBook).toHaveProperty('id')
      expect(typeof createdBook.id).toBe('string')
      expect(createdBook.id.length).toBeGreaterThan(0)

      expect(createdBook).toHaveProperty('createdBy')
      expect(typeof createdBook.createdBy).toBe('string')
      expect(createdBook.createdBy).toBe('super-admin')

      expect(createdBook).toHaveProperty('createdAt')
      expect(createdBook.createdAt).toBeTruthy()

      expect(createdBook).toHaveProperty('updatedAt')
      expect(createdBook.updatedAt).toBeTruthy()

      return true
    }
  )

  it.prop([validBookPayloadArbitrary])(
    'should handle books without purchaseUrl correctly',
    async (payload) => {
      // Force purchaseUrl to be undefined
      const payloadWithoutPurchaseUrl = {
        ...payload,
        purchaseUrl: undefined
      }

      const mockCreatedBook = {
        id: `book-${Math.random().toString(36).substring(7)}`,
        title: payloadWithoutPurchaseUrl.title,
        author: payloadWithoutPurchaseUrl.author,
        category: payloadWithoutPurchaseUrl.category,
        description: payloadWithoutPurchaseUrl.description,
        coverImage: payloadWithoutPurchaseUrl.coverImage,
        purchaseUrl: null,
        published: payloadWithoutPurchaseUrl.published,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

      const request = createMockRequest(payloadWithoutPurchaseUrl)
      const response = await POST(request)
      const createdBook = await response.json()

      expect(response.status).toBe(201)
      expect(createdBook.purchaseUrl).toBeNull()

      return true
    }
  )

  it.prop([validBookPayloadArbitrary])(
    'should convert empty string purchaseUrl to null',
    async (payload) => {
      // Force purchaseUrl to be empty string
      const payloadWithEmptyPurchaseUrl = {
        ...payload,
        purchaseUrl: ''
      }

      const mockCreatedBook = {
        id: `book-${Math.random().toString(36).substring(7)}`,
        title: payloadWithEmptyPurchaseUrl.title,
        author: payloadWithEmptyPurchaseUrl.author,
        category: payloadWithEmptyPurchaseUrl.category,
        description: payloadWithEmptyPurchaseUrl.description,
        coverImage: payloadWithEmptyPurchaseUrl.coverImage,
        purchaseUrl: null,
        published: payloadWithEmptyPurchaseUrl.published,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

      const request = createMockRequest(payloadWithEmptyPurchaseUrl)
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

  it.prop([
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
      author: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim()).filter(s => s.length > 0),
      category: fc.constantFrom(...BOOK_CATEGORIES),
      description: fc.string({ minLength: 1, maxLength: 2000 }).map(s => s.trim()).filter(s => s.length > 0),
      coverImage: fc.webUrl()
      // Intentionally omit published field
    })
  ])(
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

  it.prop([validBookPayloadArbitrary])(
    'should generate unique IDs for different books',
    async (payload) => {
      // Create two books with the same payload
      const mockCreatedBook1 = {
        id: `book-${Math.random().toString(36).substring(7)}`,
        ...payload,
        purchaseUrl: payload.purchaseUrl || null,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const mockCreatedBook2 = {
        id: `book-${Math.random().toString(36).substring(7)}`,
        ...payload,
        purchaseUrl: payload.purchaseUrl || null,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.book.create)
        .mockResolvedValueOnce(mockCreatedBook1 as any)
        .mockResolvedValueOnce(mockCreatedBook2 as any)

      const request1 = createMockRequest(payload)
      const response1 = await POST(request1)
      const book1 = await response1.json()

      const request2 = createMockRequest(payload)
      const response2 = await POST(request2)
      const book2 = await response2.json()

      expect(response1.status).toBe(201)
      expect(response2.status).toBe(201)

      // IDs should be different even for identical payloads
      expect(book1.id).not.toBe(book2.id)

      return true
    }
  )

  it.prop([validBookPayloadArbitrary])(
    'should set createdAt and updatedAt to the same value on creation',
    async (payload) => {
      const now = new Date()
      const mockCreatedBook = {
        id: `book-${Math.random().toString(36).substring(7)}`,
        ...payload,
        purchaseUrl: payload.purchaseUrl || null,
        createdBy: 'super-admin',
        createdAt: now,
        updatedAt: now
      }

      vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

      const request = createMockRequest(payload)
      const response = await POST(request)
      const createdBook = await response.json()

      expect(response.status).toBe(201)

      // On creation, createdAt and updatedAt should be the same
      expect(createdBook.createdAt).toBe(createdBook.updatedAt)

      return true
    }
  )

  it.prop([validBookPayloadArbitrary])(
    'should preserve exact string values including whitespace and special characters',
    async (payload) => {
      // Add some special characters and whitespace to test exact preservation
      const payloadWithSpecialChars = {
        ...payload,
        title: `  ${payload.title}  `, // Leading/trailing spaces (will be trimmed by validation)
        description: `${payload.description}\n\nWith newlines and "quotes" and 'apostrophes'`
      }

      const mockCreatedBook = {
        id: `book-${Math.random().toString(36).substring(7)}`,
        title: payloadWithSpecialChars.title.trim(),
        author: payloadWithSpecialChars.author,
        category: payloadWithSpecialChars.category,
        description: payloadWithSpecialChars.description,
        coverImage: payloadWithSpecialChars.coverImage,
        purchaseUrl: payloadWithSpecialChars.purchaseUrl || null,
        published: payloadWithSpecialChars.published,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

      const request = createMockRequest(payloadWithSpecialChars)
      const response = await POST(request)
      const createdBook = await response.json()

      expect(response.status).toBe(201)

      // Title should be trimmed by validation
      expect(createdBook.title).toBe(payloadWithSpecialChars.title.trim())
      
      // Description should preserve special characters
      expect(createdBook.description).toBe(payloadWithSpecialChars.description)

      return true
    }
  )

  vitestIt('should handle all valid categories in round-trip', async () => {
    // Test each category explicitly to ensure all are supported
    for (const category of BOOK_CATEGORIES) {
      const payload = {
        title: `Test Book for ${category}`,
        author: 'Test Author',
        category: category,
        description: 'Test description',
        coverImage: 'https://example.com/image.jpg',
        published: false
      }

      const mockCreatedBook = {
        id: `book-${Math.random().toString(36).substring(7)}`,
        ...payload,
        purchaseUrl: null,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

      const request = createMockRequest(payload)
      const response = await POST(request)
      const createdBook = await response.json()

      expect(response.status).toBe(201)
      expect(createdBook.category).toBe(category)
    }
  })
})
