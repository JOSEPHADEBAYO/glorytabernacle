/**
 * Unit tests for POST /api/events
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/events/route'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      create: vi.fn(),
    },
  },
}))

const validPayload = {
  title: 'Sunday Worship Service',
  description: 'A morning of worship and Word at the main sanctuary.',
  date: '2026-06-07',
  time: '10:00 AM',
  location: 'Main Sanctuary',
  imageSrc: 'https://res.cloudinary.com/example/image/upload/events/sunday.jpg',
  imageAlt: 'Sunday worship congregation',
  registrationHref: 'https://example.com/register',
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

describe('POST /api/events', () => {
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
      expect(prisma.event.create).not.toHaveBeenCalled()
    })

    it('allows CONTENT_EDITOR to create events', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        ...adminUser,
        role: 'CONTENT_EDITOR',
      })
      vi.mocked(prisma.event.create).mockResolvedValue({
        id: 'event-1',
        ...validPayload,
        date: new Date(validPayload.date),
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const res = await POST(mockRequest(validPayload))

      expect(res.status).toBe(201)
      expect(prisma.event.create).toHaveBeenCalledOnce()
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
    })

    it('returns 400 when description is missing', async () => {
      const { description: _omit, ...rest } = validPayload
      void _omit
      const res = await POST(mockRequest(rest))
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('returns 400 when date is invalid', async () => {
      const res = await POST(mockRequest({ ...validPayload, date: 'banana' }))
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('returns 400 when imageSrc is not a valid URL', async () => {
      const res = await POST(mockRequest({ ...validPayload, imageSrc: 'not-a-url' }))
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('accepts empty optional fields', async () => {
      const created = {
        id: 'event-2',
        title: validPayload.title,
        description: validPayload.description,
        date: new Date(validPayload.date),
        time: null,
        location: null,
        imageSrc: null,
        imageAlt: null,
        registrationHref: null,
        published: false,
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(prisma.event.create).mockResolvedValue(created as never)

      const res = await POST(
        mockRequest({
          title: validPayload.title,
          description: validPayload.description,
          date: validPayload.date,
          time: '',
          location: '',
          imageSrc: '',
          imageAlt: '',
          registrationHref: '',
        })
      )

      expect(res.status).toBe(201)
      // Empty strings should be normalized to null in DB write
      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          time: null,
          location: null,
          imageSrc: null,
          imageAlt: null,
          registrationHref: null,
        }),
      })
    })
  })

  describe('Successful creation', () => {
    it('persists event and returns 201', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)

      const created = {
        id: 'event-123',
        title: validPayload.title,
        description: validPayload.description,
        date: new Date(validPayload.date),
        time: validPayload.time,
        location: validPayload.location,
        imageSrc: validPayload.imageSrc,
        imageAlt: validPayload.imageAlt,
        registrationHref: validPayload.registrationHref,
        published: false,
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(prisma.event.create).mockResolvedValue(created as never)

      const res = await POST(mockRequest(validPayload))
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.id).toBe('event-123')
      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: validPayload.title,
          description: validPayload.description,
          createdBy: adminUser.id,
        }),
      })
    })
  })

  describe('Error handling', () => {
    it('returns 500 if Prisma throws', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
      vi.mocked(prisma.event.create).mockRejectedValue(new Error('db down'))

      const res = await POST(mockRequest(validPayload))
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
