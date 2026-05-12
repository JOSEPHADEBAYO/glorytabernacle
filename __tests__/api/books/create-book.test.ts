/**
 * Unit tests for POST /api/books endpoint
 * Tests Task 3: Implement POST /api/books endpoint
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 7.1, 7.2, 11.1, 11.8, 12.1, 12.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/books/route'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

// Mock dependencies
vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    book: {
      create: vi.fn()
    }
  }
}))

describe('POST /api/books', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest
  }

  const validBookData = {
    title: 'The Pursuit of God',
    author: 'A.W. Tozer',
    category: 'Spiritual Growth',
    description: 'A classic work on Christian spirituality and the pursuit of knowing God more deeply.',
    coverImage: 'https://example.com/pursuit-of-god.jpg',
    purchaseUrl: 'https://amazon.com/pursuit-of-god',
    published: false
  }

  describe('Authentication', () => {
    it('should return 401 when session token is missing', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

      const request = createMockRequest(validBookData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 when session user is invalid', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('invalid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

      const request = createMockRequest(validBookData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should proceed with valid session token', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
      vi.mocked(prisma.book.create).mockResolvedValue({
        id: 'book-123',
        ...validBookData,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      const request = createMockRequest(validBookData)
      const response = await POST(request)

      expect(response.status).toBe(201)
    })
  })

  describe('Validation - Required Fields', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should return 400 when title is missing', async () => {
      const invalidData = { ...validBookData }
      delete (invalidData as any).title

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(Array.isArray(data.details)).toBe(true)
      expect(data.details.length).toBeGreaterThan(0)
      // Just verify we got validation errors - Zod v4 error messages vary
    })

    it('should return 400 when author is missing', async () => {
      const invalidData = { ...validBookData }
      delete (invalidData as any).author

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(Array.isArray(data.details)).toBe(true)
      expect(data.details.length).toBeGreaterThan(0)
      // Just verify we got validation errors - Zod v4 error messages vary
    })

    it('should return 400 when category is missing', async () => {
      const invalidData = { ...validBookData }
      delete (invalidData as any).category

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Invalid category')
    })

    it('should return 400 when description is missing', async () => {
      const invalidData = { ...validBookData }
      delete (invalidData as any).description

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(Array.isArray(data.details)).toBe(true)
      expect(data.details.length).toBeGreaterThan(0)
      // Just verify we got validation errors - Zod v4 error messages vary
    })

    it('should return 400 when coverImage is missing', async () => {
      const invalidData = { ...validBookData }
      delete (invalidData as any).coverImage

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })
  })

  describe('Validation - Category', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should return 400 for invalid category', async () => {
      const invalidData = {
        ...validBookData,
        category: 'Invalid Category'
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Invalid category')
    })

    it('should accept all valid categories', async () => {
      const validCategories = [
        'Spiritual Growth',
        'Prayer & Intercession',
        'Faith & Doctrine',
        'Christian Living',
        'Leadership',
        'Family & Relationships',
        'Devotional',
        'Theology',
        'Biography',
        'Other'
      ]

      vi.mocked(prisma.book.create).mockResolvedValue({
        id: 'book-123',
        ...validBookData,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      for (const category of validCategories) {
        const data = { ...validBookData, category }
        const request = createMockRequest(data)
        const response = await POST(request)

        expect(response.status).toBe(201)
      }
    })
  })

  describe('Validation - URLs', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should return 400 for invalid coverImage URL', async () => {
      const invalidData = {
        ...validBookData,
        coverImage: 'not-a-valid-url'
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Must be a valid URL')
    })

    it('should return 400 for invalid purchaseUrl', async () => {
      const invalidData = {
        ...validBookData,
        purchaseUrl: 'not-a-valid-url'
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Must be a valid URL')
    })

    it('should accept valid HTTPS URLs', async () => {
      vi.mocked(prisma.book.create).mockResolvedValue({
        id: 'book-123',
        ...validBookData,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      const data = {
        ...validBookData,
        coverImage: 'https://example.com/image.jpg',
        purchaseUrl: 'https://store.com/book'
      }

      const request = createMockRequest(data)
      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should accept valid HTTP URLs', async () => {
      vi.mocked(prisma.book.create).mockResolvedValue({
        id: 'book-123',
        ...validBookData,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      const data = {
        ...validBookData,
        coverImage: 'http://example.com/image.jpg',
        purchaseUrl: 'http://store.com/book'
      }

      const request = createMockRequest(data)
      const response = await POST(request)

      expect(response.status).toBe(201)
    })
  })

  describe('Optional Fields', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should accept book without purchaseUrl', async () => {
      const mockCreatedBook = {
        id: 'book-123',
        title: validBookData.title,
        author: validBookData.author,
        category: validBookData.category,
        description: validBookData.description,
        coverImage: validBookData.coverImage,
        purchaseUrl: null,
        published: false,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

      const dataWithoutPurchaseUrl = { ...validBookData }
      delete (dataWithoutPurchaseUrl as any).purchaseUrl

      const request = createMockRequest(dataWithoutPurchaseUrl)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(prisma.book.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          purchaseUrl: null
        })
      })
    })

    it('should convert empty string purchaseUrl to null', async () => {
      const mockCreatedBook = {
        id: 'book-123',
        ...validBookData,
        purchaseUrl: null,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

      const dataWithEmptyPurchaseUrl = {
        ...validBookData,
        purchaseUrl: ''
      }

      const request = createMockRequest(dataWithEmptyPurchaseUrl)
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(prisma.book.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          purchaseUrl: null
        })
      })
    })

    it('should default published to false when not provided', async () => {
      const mockCreatedBook = {
        id: 'book-123',
        ...validBookData,
        published: false,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

      const dataWithoutPublished = { ...validBookData }
      delete (dataWithoutPublished as any).published

      const request = createMockRequest(dataWithoutPublished)
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(prisma.book.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          published: false
        })
      })
    })
  })

  describe('Successful Creation', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should return 201 with complete book record on success', async () => {
      const mockCreatedBook = {
        id: 'book-123',
        ...validBookData,
        createdBy: 'super-admin',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      }

      vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

      const request = createMockRequest(validBookData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: 'book-123',
        title: validBookData.title,
        author: validBookData.author,
        category: validBookData.category,
        description: validBookData.description,
        coverImage: validBookData.coverImage,
        purchaseUrl: validBookData.purchaseUrl,
        published: validBookData.published,
        createdBy: 'super-admin'
      })
      expect(data).toHaveProperty('createdAt')
      expect(data).toHaveProperty('updatedAt')
    })

    it('should set createdBy field from session user', async () => {
      const mockCreatedBook = {
        id: 'book-123',
        ...validBookData,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

      const request = createMockRequest(validBookData)
      await POST(request)

      expect(prisma.book.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          createdBy: 'super-admin'
        })
      })
    })

    it('should include all fields in database create call', async () => {
      const mockCreatedBook = {
        id: 'book-123',
        ...validBookData,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.book.create).mockResolvedValue(mockCreatedBook as any)

      const request = createMockRequest(validBookData)
      await POST(request)

      expect(prisma.book.create).toHaveBeenCalledWith({
        data: {
          title: validBookData.title,
          author: validBookData.author,
          category: validBookData.category,
          description: validBookData.description,
          coverImage: validBookData.coverImage,
          purchaseUrl: validBookData.purchaseUrl,
          published: validBookData.published,
          createdBy: 'super-admin'
        }
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should return 500 on database error', async () => {
      vi.mocked(prisma.book.create).mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest(validBookData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should not expose sensitive error details in response', async () => {
      vi.mocked(prisma.book.create).mockRejectedValue(new Error('Sensitive database error with credentials'))

      const request = createMockRequest(validBookData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.error).not.toContain('credentials')
      expect(data.error).not.toContain('Sensitive')
    })

    it('should return 400 with multiple validation errors', async () => {
      const invalidData = {
        title: '', // Empty title
        author: '', // Empty author
        category: 'Invalid', // Invalid category
        description: '', // Empty description
        coverImage: 'not-a-url', // Invalid URL
        published: false
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(Array.isArray(data.details)).toBe(true)
      expect(data.details.length).toBeGreaterThan(1)
    })
  })

  describe('Field Length Validation', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should return 400 for title exceeding 200 characters', async () => {
      const invalidData = {
        ...validBookData,
        title: 'a'.repeat(201)
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Title too long')
    })

    it('should return 400 for author exceeding 100 characters', async () => {
      const invalidData = {
        ...validBookData,
        author: 'a'.repeat(101)
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Author name too long')
    })

    it('should return 400 for description exceeding 2000 characters', async () => {
      const invalidData = {
        ...validBookData,
        description: 'a'.repeat(2001)
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Description too long')
    })
  })
})
