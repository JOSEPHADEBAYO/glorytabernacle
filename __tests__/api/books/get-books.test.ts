/**
 * Unit tests for GET /api/books endpoint
 * Tests Task 4: Implement GET /api/books endpoint
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 11.8, 12.2, 12.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/books/route'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

// Mock dependencies
vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    book: {
      findMany: vi.fn()
    }
  }
}))

describe('GET /api/books', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockRequest = (url: string): NextRequest => {
    return {
      url,
    } as NextRequest
  }

  const mockBooks = [
    {
      id: 'book-1',
      title: 'The Pursuit of God',
      author: 'A.W. Tozer',
      category: 'Spiritual Growth',
      description: 'A classic work on Christian spirituality.',
      coverImage: 'https://example.com/pursuit.jpg',
      purchaseUrl: 'https://amazon.com/pursuit',
      published: true,
      createdBy: 'super-admin',
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-03T00:00:00Z')
    },
    {
      id: 'book-2',
      title: 'Mere Christianity',
      author: 'C.S. Lewis',
      category: 'Faith & Doctrine',
      description: 'A theological book by C.S. Lewis.',
      coverImage: 'https://example.com/mere.jpg',
      purchaseUrl: null,
      published: false,
      createdBy: 'super-admin',
      createdAt: new Date('2024-01-02T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z')
    },
    {
      id: 'book-3',
      title: 'The Cost of Discipleship',
      author: 'Dietrich Bonhoeffer',
      category: 'Christian Living',
      description: 'A book on Christian ethics.',
      coverImage: 'https://example.com/cost.jpg',
      purchaseUrl: 'https://amazon.com/cost',
      published: true,
      createdBy: 'super-admin',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    }
  ]

  describe('Authentication', () => {
    it('should return 401 when session token is missing', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/books')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 when session user is invalid', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('invalid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/books')
      const response = await GET(request)
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
      vi.mocked(prisma.book.findMany).mockResolvedValue([])

      const request = createMockRequest('http://localhost:3000/api/books')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Basic Retrieval', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should return 200 with books array wrapped in { books: [] } object', async () => {
      vi.mocked(prisma.book.findMany).mockResolvedValue(mockBooks as any)

      const request = createMockRequest('http://localhost:3000/api/books')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('books')
      expect(Array.isArray(data.books)).toBe(true)
      expect(data.books.length).toBe(3)
    })

    it('should return empty array when no books exist (not 404)', async () => {
      vi.mocked(prisma.book.findMany).mockResolvedValue([])

      const request = createMockRequest('http://localhost:3000/api/books')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.books).toEqual([])
    })

    it('should include all book fields in response', async () => {
      vi.mocked(prisma.book.findMany).mockResolvedValue([mockBooks[0]] as any)

      const request = createMockRequest('http://localhost:3000/api/books')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      const book = data.books[0]
      expect(book).toHaveProperty('id')
      expect(book).toHaveProperty('title')
      expect(book).toHaveProperty('author')
      expect(book).toHaveProperty('category')
      expect(book).toHaveProperty('description')
      expect(book).toHaveProperty('coverImage')
      expect(book).toHaveProperty('purchaseUrl')
      expect(book).toHaveProperty('published')
      expect(book).toHaveProperty('createdBy')
      expect(book).toHaveProperty('createdAt')
      expect(book).toHaveProperty('updatedAt')
    })
  })

  describe('Ordering', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should order books by createdAt descending (newest first)', async () => {
      vi.mocked(prisma.book.findMany).mockResolvedValue(mockBooks as any)

      const request = createMockRequest('http://localhost:3000/api/books')
      await GET(request)

      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          createdAt: 'desc'
        }
      })
    })
  })

  describe('Query Parameter Filtering - Published', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should filter by published=true', async () => {
      const publishedBooks = mockBooks.filter(b => b.published)
      vi.mocked(prisma.book.findMany).mockResolvedValue(publishedBooks as any)

      const request = createMockRequest('http://localhost:3000/api/books?published=true')
      await GET(request)

      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: { published: true },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should filter by published=false', async () => {
      const draftBooks = mockBooks.filter(b => !b.published)
      vi.mocked(prisma.book.findMany).mockResolvedValue(draftBooks as any)

      const request = createMockRequest('http://localhost:3000/api/books?published=false')
      await GET(request)

      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: { published: false },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should return all books when published parameter is not provided', async () => {
      vi.mocked(prisma.book.findMany).mockResolvedValue(mockBooks as any)

      const request = createMockRequest('http://localhost:3000/api/books')
      await GET(request)

      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' }
      })
    })
  })

  describe('Query Parameter Filtering - Category', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should filter by category', async () => {
      const spiritualBooks = mockBooks.filter(b => b.category === 'Spiritual Growth')
      vi.mocked(prisma.book.findMany).mockResolvedValue(spiritualBooks as any)

      const request = createMockRequest('http://localhost:3000/api/books?category=Spiritual%20Growth')
      await GET(request)

      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: { category: 'Spiritual Growth' },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should return all books when category parameter is not provided', async () => {
      vi.mocked(prisma.book.findMany).mockResolvedValue(mockBooks as any)

      const request = createMockRequest('http://localhost:3000/api/books')
      await GET(request)

      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should return 400 for invalid category', async () => {
      const request = createMockRequest('http://localhost:3000/api/books?category=InvalidCategory')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })
  })

  describe('Combined Filtering', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should filter by both published and category', async () => {
      const filteredBooks = mockBooks.filter(
        b => b.published && b.category === 'Spiritual Growth'
      )
      vi.mocked(prisma.book.findMany).mockResolvedValue(filteredBooks as any)

      const request = createMockRequest(
        'http://localhost:3000/api/books?published=true&category=Spiritual%20Growth'
      )
      await GET(request)

      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: {
          published: true,
          category: 'Spiritual Growth'
        },
        orderBy: { createdAt: 'desc' }
      })
    })
  })

  describe('Query Parameter Validation', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should return 400 for invalid published value', async () => {
      const request = createMockRequest('http://localhost:3000/api/books?published=invalid')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
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

      vi.mocked(prisma.book.findMany).mockResolvedValue([])

      for (const category of validCategories) {
        const encodedCategory = encodeURIComponent(category)
        const request = createMockRequest(`http://localhost:3000/api/books?category=${encodedCategory}`)
        const response = await GET(request)

        expect(response.status).toBe(200)
      }
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
      vi.mocked(prisma.book.findMany).mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest('http://localhost:3000/api/books')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should not expose sensitive error details in response', async () => {
      vi.mocked(prisma.book.findMany).mockRejectedValue(
        new Error('Sensitive database error with credentials')
      )

      const request = createMockRequest('http://localhost:3000/api/books')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.error).not.toContain('credentials')
      expect(data.error).not.toContain('Sensitive')
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should return books wrapped in { books: [] } object', async () => {
      vi.mocked(prisma.book.findMany).mockResolvedValue(mockBooks as any)

      const request = createMockRequest('http://localhost:3000/api/books')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('books')
      expect(Array.isArray(data.books)).toBe(true)
      expect(Object.keys(data)).toEqual(['books'])
    })

    it('should preserve null purchaseUrl values', async () => {
      const bookWithNullPurchaseUrl = {
        ...mockBooks[1],
        purchaseUrl: null
      }
      vi.mocked(prisma.book.findMany).mockResolvedValue([bookWithNullPurchaseUrl] as any)

      const request = createMockRequest('http://localhost:3000/api/books')
      const response = await GET(request)
      const data = await response.json()

      expect(data.books[0].purchaseUrl).toBeNull()
    })
  })
})
