/**
 * Unit tests for POST /api/tracts endpoint
 * Tests Task 3.3: Write unit tests for POST /api/tracts
 * Requirements: 1.1, 1.2, 1.8, 7.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/tracts/route'
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

describe('POST /api/tracts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest
  }

  const validTractData = {
    title: 'The Gospel Message',
    category: 'Evangelism',
    description: 'A clear presentation of the gospel message for sharing with unbelievers.',
    coverImage: 'https://example.com/gospel-tract.jpg',
    documentUrl: 'https://example.com/gospel-tract.pdf',
    published: false
  }

  describe('Authentication', () => {
    it('should return 401 when session token is missing', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

      const request = createMockRequest(validTractData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 when session user is invalid', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('invalid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

      const request = createMockRequest(validTractData)
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
      vi.mocked(prisma.tract.create).mockResolvedValue({
        id: 'tract-123',
        ...validTractData,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      const request = createMockRequest(validTractData)
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
      const invalidData = { ...validTractData }
      delete (invalidData as any).title

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(Array.isArray(data.details)).toBe(true)
      expect(data.details.length).toBeGreaterThan(0)
    })

    it('should return 400 when category is missing', async () => {
      const invalidData = { ...validTractData }
      delete (invalidData as any).category

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(Array.isArray(data.details)).toBe(true)
      expect(data.details.length).toBeGreaterThan(0)
      // Just verify we got validation errors - Zod v4 error messages vary
    })

    it('should return 400 when description is missing', async () => {
      const invalidData = { ...validTractData }
      delete (invalidData as any).description

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(Array.isArray(data.details)).toBe(true)
      expect(data.details.length).toBeGreaterThan(0)
    })

    it('should return 400 when coverImage is missing', async () => {
      const invalidData = { ...validTractData }
      delete (invalidData as any).coverImage

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should return 400 when documentUrl is missing', async () => {
      const invalidData = { ...validTractData }
      delete (invalidData as any).documentUrl

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
        ...validTractData,
        category: 'Invalid Category'
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(Array.isArray(data.details)).toBe(true)
      expect(data.details.length).toBeGreaterThan(0)
      // Just verify we got validation errors - Zod v4 error messages vary
    })

    it('should accept all valid categories', async () => {
      const validCategories = [
        'Theology',
        'Evangelism',
        'Discipleship',
        'Prayer & Intercession',
        'Christian Living',
        'Salvation',
        'Faith & Doctrine',
        'End Times',
        'Other'
      ]

      vi.mocked(prisma.tract.create).mockResolvedValue({
        id: 'tract-123',
        ...validTractData,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      for (const category of validCategories) {
        const data = { ...validTractData, category }
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
        ...validTractData,
        coverImage: 'not-a-valid-url'
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Must be a valid URL')
    })

    it('should return 400 for invalid documentUrl', async () => {
      const invalidData = {
        ...validTractData,
        documentUrl: 'not-a-valid-url'
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Must be a valid URL')
    })

    it('should accept valid HTTPS URLs', async () => {
      vi.mocked(prisma.tract.create).mockResolvedValue({
        id: 'tract-123',
        ...validTractData,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      const data = {
        ...validTractData,
        coverImage: 'https://example.com/image.jpg',
        documentUrl: 'https://example.com/document.pdf'
      }

      const request = createMockRequest(data)
      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should accept valid HTTP URLs', async () => {
      vi.mocked(prisma.tract.create).mockResolvedValue({
        id: 'tract-123',
        ...validTractData,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      const data = {
        ...validTractData,
        coverImage: 'http://example.com/image.jpg',
        documentUrl: 'http://example.com/document.pdf'
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

    it('should default published to false when not provided', async () => {
      const mockCreatedTract = {
        id: 'tract-123',
        ...validTractData,
        published: false,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

      const dataWithoutPublished = { ...validTractData }
      delete (dataWithoutPublished as any).published

      const request = createMockRequest(dataWithoutPublished)
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(prisma.tract.create).toHaveBeenCalledWith({
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

    it('should return 201 with complete tract record on success', async () => {
      const mockCreatedTract = {
        id: 'tract-123',
        ...validTractData,
        createdBy: 'super-admin',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      }

      vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

      const request = createMockRequest(validTractData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: 'tract-123',
        title: validTractData.title,
        category: validTractData.category,
        description: validTractData.description,
        coverImage: validTractData.coverImage,
        documentUrl: validTractData.documentUrl,
        published: validTractData.published,
        createdBy: 'super-admin'
      })
      expect(data).toHaveProperty('createdAt')
      expect(data).toHaveProperty('updatedAt')
    })

    it('should set createdBy field from session user', async () => {
      const mockCreatedTract = {
        id: 'tract-123',
        ...validTractData,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

      const request = createMockRequest(validTractData)
      await POST(request)

      expect(prisma.tract.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          createdBy: 'super-admin'
        })
      })
    })

    it('should include all fields in database create call', async () => {
      const mockCreatedTract = {
        id: 'tract-123',
        ...validTractData,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

      const request = createMockRequest(validTractData)
      await POST(request)

      expect(prisma.tract.create).toHaveBeenCalledWith({
        data: {
          title: validTractData.title,
          category: validTractData.category,
          description: validTractData.description,
          coverImage: validTractData.coverImage,
          documentUrl: validTractData.documentUrl,
          published: validTractData.published,
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
      vi.mocked(prisma.tract.create).mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest(validTractData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should not expose sensitive error details in response', async () => {
      vi.mocked(prisma.tract.create).mockRejectedValue(new Error('Sensitive database error with credentials'))

      const request = createMockRequest(validTractData)
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
        category: 'Invalid', // Invalid category
        description: '', // Empty description
        coverImage: 'not-a-url', // Invalid URL
        documentUrl: 'not-a-url', // Invalid URL
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
        ...validTractData,
        title: 'a'.repeat(201)
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Title too long')
    })

    it('should return 400 for description less than 10 characters', async () => {
      const invalidData = {
        ...validTractData,
        description: 'short'
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Description must be at least 10 characters')
    })

    it('should return 400 for description exceeding 1000 characters', async () => {
      const invalidData = {
        ...validTractData,
        description: 'a'.repeat(1001)
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
