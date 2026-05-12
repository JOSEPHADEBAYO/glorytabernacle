/**
 * Unit tests for POST /api/gallery
 *
 * Mirrors the books test pattern. Covers:
 * - Authentication / authorization (401 / 403)
 * - Validation (400 with detail array)
 * - Successful creation (201)
 * - Internal error handling (500)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/gallery/route'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    gallery: {
      create: vi.fn(),
    },
  },
}))

const validPayload = {
  title: 'Sunday Service',
  description: 'A spirit-filled morning of worship and Word at the main sanctuary.',
  imageUrl: 'https://res.cloudinary.com/example/image/upload/gallery/sunday.jpg',
  imageAlt: 'Worship team leading praise on Sunday',
  dateTaken: '2026-04-26',
  published: false,
}

const adminUser = {
  id: 'super-admin',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'SUPER_ADMIN',
}

function mockRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

describe('POST /api/gallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication & authorization', () => {
    it('returns 401 when session token is missing', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

      const res = await POST(mockRequest(validPayload))
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when session user cannot be resolved', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

      const res = await POST(mockRequest(validPayload))
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 403 when user is not SUPER_ADMIN or CONTENT_EDITOR', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        ...adminUser,
        role: 'VIEWER',
      })

      const res = await POST(mockRequest(validPayload))
      const data = await res.json()

      expect(res.status).toBe(403)
      expect(data.error).toBe('Forbidden')
      expect(prisma.gallery.create).not.toHaveBeenCalled()
    })

    it('allows CONTENT_EDITOR to create photos', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        ...adminUser,
        role: 'CONTENT_EDITOR',
      })
      vi.mocked(prisma.gallery.create).mockResolvedValue({
        id: 'photo-1',
        ...validPayload,
        dateTaken: new Date(validPayload.dateTaken),
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const res = await POST(mockRequest(validPayload))

      expect(res.status).toBe(201)
      expect(prisma.gallery.create).toHaveBeenCalledOnce()
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    })

    it('returns 400 when title is missing', async () => {
      const { title: _omit, ...rest } = validPayload
      void _omit
      const res = await POST(mockRequest(rest))
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(Array.isArray(data.details)).toBe(true)
    })

    it('returns 400 when imageUrl is not a valid URL', async () => {
      const res = await POST(mockRequest({ ...validPayload, imageUrl: 'not-a-url' }))
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('returns 400 when dateTaken is invalid', async () => {
      const res = await POST(mockRequest({ ...validPayload, dateTaken: 'banana' }))
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })
  })

  describe('Successful creation', () => {
    it('persists photo and returns 201 with the created record', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)

      const created = {
        id: 'photo-123',
        title: validPayload.title,
        description: validPayload.description,
        imageUrl: validPayload.imageUrl,
        imageAlt: validPayload.imageAlt,
        dateTaken: new Date(validPayload.dateTaken),
        published: false,
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(prisma.gallery.create).mockResolvedValue(created as never)

      const res = await POST(mockRequest(validPayload))
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.id).toBe('photo-123')
      expect(prisma.gallery.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: validPayload.title,
          description: validPayload.description,
          imageUrl: validPayload.imageUrl,
          imageAlt: validPayload.imageAlt,
          published: false,
          createdBy: adminUser.id,
        }),
      })
    })
  })

  describe('Error handling', () => {
    it('returns 500 if Prisma throws', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
      vi.mocked(prisma.gallery.create).mockRejectedValue(new Error('db down'))

      const res = await POST(mockRequest(validPayload))
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
