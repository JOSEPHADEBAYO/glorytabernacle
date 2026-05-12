/**
 * Unit tests for GET /api/tracts endpoint
 * Tests Task 4.3: Write unit tests for GET /api/tracts
 * Requirements: 2.1, 2.3, 2.4, 2.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/tracts/route'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

// Mock dependencies
vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tract: {
      findMany: vi.fn()
    }
  }
}))

describe('GET /api/tracts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockRequest = (url: string): NextRequest => {
    return {
      url,
    } as NextRequest
  }

  const mockTracts = [
    {
      id: 'tract-1',
      title: 'The Gospel Message',
      category: 'Evangelism',
      description: 'A clear presentation of the gospel for seekers and new believers.',
      coverImage: 'https://example.com/gospel.jpg',
      documentUrl: 'https://example.com/gospel.pdf',
      published: true,
      createdBy: 'super-admin',
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-03T00:00:00Z')
    },
    {
      id: 'tract-2',
      title: 'Understanding Prayer',
      category: 'Prayer & Intercession',
      description: 'A guide to developing a meaningful prayer life.',
      coverImage: 'https://example.com/prayer.jpg',
      documentUrl: 'https://example.com/prayer.pdf',
      published: false,
      createdBy: 'super-admin',
      createdAt: new Date('2024-01-02T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z')
    },
    {
      id: 'tract-3',
      title: 'Living by Faith',
      category: 'Christian Living',
      description: 'Practical wisdom for daily Christian living and faith application.',
      coverImage: 'https://example.com/faith.jpg',
      documentUrl: 'https://example.com/faith.pdf',
      published: true,
      createdBy: 'super-admin',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    }
  ]

  describe('Authentication', () => {
    it('should return 401 when session token is missing', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/tracts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 when session user is invalid', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('invalid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/tracts')
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
      vi.mocked(prisma.tract.findMany).mockResolvedValue([])

      const request = createMockRequest('http://localhost:3000/api/tracts')
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

    it('should return 200 with tracts array wrapped in { tracts: [] } object', async () => {
      vi.mocked(prisma.tract.findMany).mockResolvedValue(mockTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('tracts')
      expect(Array.isArray(data.tracts)).toBe(true)
      expect(data.tracts.length).toBe(3)
    })

    it('should return empty array when no tracts exist (not 404)', async () => {
      vi.mocked(prisma.tract.findMany).mockResolvedValue([])

      const request = createMockRequest('http://localhost:3000/api/tracts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tracts).toEqual([])
    })

    it('should include all tract fields in response', async () => {
      vi.mocked(prisma.tract.findMany).mockResolvedValue([mockTracts[0]] as any)

      const request = createMockRequest('http://localhost:3000/api/tracts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      const tract = data.tracts[0]
      expect(tract).toHaveProperty('id')
      expect(tract).toHaveProperty('title')
      expect(tract).toHaveProperty('category')
      expect(tract).toHaveProperty('description')
      expect(tract).toHaveProperty('coverImage')
      expect(tract).toHaveProperty('documentUrl')
      expect(tract).toHaveProperty('published')
      expect(tract).toHaveProperty('createdBy')
      expect(tract).toHaveProperty('createdAt')
      expect(tract).toHaveProperty('updatedAt')
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

    it('should order tracts by createdAt descending (newest first)', async () => {
      vi.mocked(prisma.tract.findMany).mockResolvedValue(mockTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts')
      await GET(request)

      expect(prisma.tract.findMany).toHaveBeenCalledWith({
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
      const publishedTracts = mockTracts.filter(t => t.published)
      vi.mocked(prisma.tract.findMany).mockResolvedValue(publishedTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts?published=true')
      await GET(request)

      expect(prisma.tract.findMany).toHaveBeenCalledWith({
        where: { published: true },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should filter by published=false', async () => {
      const draftTracts = mockTracts.filter(t => !t.published)
      vi.mocked(prisma.tract.findMany).mockResolvedValue(draftTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts?published=false')
      await GET(request)

      expect(prisma.tract.findMany).toHaveBeenCalledWith({
        where: { published: false },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should return all tracts when published parameter is not provided', async () => {
      vi.mocked(prisma.tract.findMany).mockResolvedValue(mockTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts')
      await GET(request)

      expect(prisma.tract.findMany).toHaveBeenCalledWith({
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
      const evangelismTracts = mockTracts.filter(t => t.category === 'Evangelism')
      vi.mocked(prisma.tract.findMany).mockResolvedValue(evangelismTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts?category=Evangelism')
      await GET(request)

      expect(prisma.tract.findMany).toHaveBeenCalledWith({
        where: { category: 'Evangelism' },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should return all tracts when category parameter is not provided', async () => {
      vi.mocked(prisma.tract.findMany).mockResolvedValue(mockTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts')
      await GET(request)

      expect(prisma.tract.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should return 400 for invalid category', async () => {
      const request = createMockRequest('http://localhost:3000/api/tracts?category=InvalidCategory')
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
      const filteredTracts = mockTracts.filter(
        t => t.published && t.category === 'Evangelism'
      )
      vi.mocked(prisma.tract.findMany).mockResolvedValue(filteredTracts as any)

      const request = createMockRequest(
        'http://localhost:3000/api/tracts?published=true&category=Evangelism'
      )
      await GET(request)

      expect(prisma.tract.findMany).toHaveBeenCalledWith({
        where: {
          published: true,
          category: 'Evangelism'
        },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should filter by published=false and category', async () => {
      const filteredTracts = mockTracts.filter(
        t => !t.published && t.category === 'Prayer & Intercession'
      )
      vi.mocked(prisma.tract.findMany).mockResolvedValue(filteredTracts as any)

      const request = createMockRequest(
        'http://localhost:3000/api/tracts?published=false&category=Prayer%20%26%20Intercession'
      )
      await GET(request)

      expect(prisma.tract.findMany).toHaveBeenCalledWith({
        where: {
          published: false,
          category: 'Prayer & Intercession'
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
      const request = createMockRequest('http://localhost:3000/api/tracts?published=invalid')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
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

      vi.mocked(prisma.tract.findMany).mockResolvedValue([])

      for (const category of validCategories) {
        const encodedCategory = encodeURIComponent(category)
        const request = createMockRequest(`http://localhost:3000/api/tracts?category=${encodedCategory}`)
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
      vi.mocked(prisma.tract.findMany).mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest('http://localhost:3000/api/tracts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should not expose sensitive error details in response', async () => {
      vi.mocked(prisma.tract.findMany).mockRejectedValue(
        new Error('Sensitive database error with credentials')
      )

      const request = createMockRequest('http://localhost:3000/api/tracts')
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

    it('should return tracts wrapped in { tracts: [] } object', async () => {
      vi.mocked(prisma.tract.findMany).mockResolvedValue(mockTracts as any)

      const request = createMockRequest('http://localhost:3000/api/tracts')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('tracts')
      expect(Array.isArray(data.tracts)).toBe(true)
      expect(Object.keys(data)).toEqual(['tracts'])
    })

    it('should preserve all tract fields including URLs', async () => {
      vi.mocked(prisma.tract.findMany).mockResolvedValue([mockTracts[0]] as any)

      const request = createMockRequest('http://localhost:3000/api/tracts')
      const response = await GET(request)
      const data = await response.json()

      expect(data.tracts[0].coverImage).toBe('https://example.com/gospel.jpg')
      expect(data.tracts[0].documentUrl).toBe('https://example.com/gospel.pdf')
    })
  })
})
