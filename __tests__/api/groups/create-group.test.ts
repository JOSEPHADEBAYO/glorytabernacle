/**
 * Unit tests for POST /api/groups
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/groups/route'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    group: {
      create: vi.fn(),
    },
  },
}))

const adminUser = {
  id: 'super-admin',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'SUPER_ADMIN',
}

const validPayload = {
  slug: 'prayer-intercession',
  title: 'Prayer & Intercession',
  description: 'Lead prayer and intercession for the church.',
  imageSrc: 'https://res.cloudinary.com/example/groups/prayer.jpg',
  imageAlt: 'Prayer ministry intercessors gathering',
  ctaLabel: 'Get Involved',
  ctaHref: 'https://example.com/join',
  order: 10,
  published: false,
  scripture: 'Isaiah 40:28-31 — They that wait upon the LORD shall renew their strength',
  headTitle: 'HEAD OF PRAYER & INTERCESSION',
  responsibilities: [
    'Lead and coordinate all weekly corporate prayer meetings for the church',
    'Pray for the church and all upcoming programmes',
  ],
  programmes: [
    { title: 'MOUNT UP', schedule: 'Daily 00:00–00:30' },
    { title: 'Weekly Corporate Prayer Meeting' },
  ],
  specialRole: { title: 'SOUL PIPELINE ROLE', body: 'Administers Holy Ghost baptism' },
  furnishStatement: 'Training and mobilising every member to pray.',
  transformStatement: 'Atmospheres, families and destinies transformed.',
  influenceStatement: 'A praying church that breaks territorial chains.',
}

function mockRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

describe('POST /api/groups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Auth', () => {
    it('returns 401 with no session token', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)
      const res = await POST(mockRequest(validPayload))
      expect(res.status).toBe(401)
    })

    it('returns 403 when role is VIEWER', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        ...adminUser,
        role: 'VIEWER',
      })
      const res = await POST(mockRequest(validPayload))
      expect(res.status).toBe(403)
      expect(prisma.group.create).not.toHaveBeenCalled()
    })

    it('allows CONTENT_EDITOR', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        ...adminUser,
        role: 'CONTENT_EDITOR',
      })
      vi.mocked(prisma.group.create).mockResolvedValue({
        id: 'g-1',
        ...validPayload,
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)
      const res = await POST(mockRequest(validPayload))
      expect(res.status).toBe(201)
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    })

    it('rejects malformed slug (uppercase)', async () => {
      const res = await POST(mockRequest({ ...validPayload, slug: 'Prayer-Intercession' }))
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('rejects empty title', async () => {
      const res = await POST(mockRequest({ ...validPayload, title: '' }))
      expect((await res.json()).error).toBe('Validation failed')
      expect(res.status).toBe(400)
    })

    it('rejects malformed imageSrc', async () => {
      const res = await POST(mockRequest({ ...validPayload, imageSrc: 'not-a-url' }))
      expect(res.status).toBe(400)
    })

    it('accepts payload without optional departmental-board fields', async () => {
      vi.mocked(prisma.group.create).mockResolvedValue({} as never)
      const minimal = {
        slug: 'minimal',
        title: 'Minimal',
        description: 'Just the basics.',
        imageSrc: 'https://example.com/x.jpg',
        imageAlt: 'alt',
      }
      const res = await POST(mockRequest(minimal))
      expect(res.status).toBe(201)
    })
  })

  describe('Slug uniqueness', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    })

    it('returns 409 on Prisma P2002 unique violation', async () => {
      vi.mocked(prisma.group.create).mockRejectedValue({ code: 'P2002' })
      const res = await POST(mockRequest(validPayload))
      const data = await res.json()
      expect(res.status).toBe(409)
      expect(data.error).toMatch(/already exists/i)
    })
  })

  describe('Successful creation', () => {
    it('persists with createdBy = session user id and returns 201', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
      vi.mocked(prisma.group.create).mockResolvedValue({
        id: 'g-123',
        ...validPayload,
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const res = await POST(mockRequest(validPayload))
      expect(res.status).toBe(201)
      expect(prisma.group.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: validPayload.slug,
          title: validPayload.title,
          createdBy: adminUser.id,
          responsibilities: validPayload.responsibilities,
          programmes: validPayload.programmes,
          specialRole: validPayload.specialRole,
        }),
      })
    })

    it('normalizes empty optional strings to null', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
      vi.mocked(prisma.group.create).mockResolvedValue({} as never)

      await POST(
        mockRequest({
          ...validPayload,
          ctaLabel: '',
          ctaHref: '',
          scripture: '',
          headTitle: '',
        })
      )

      expect(prisma.group.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ctaLabel: null,
          ctaHref: null,
          scripture: null,
          headTitle: null,
        }),
      })
    })
  })

  describe('Errors', () => {
    it('returns 500 if Prisma throws non-P2002', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
      vi.mocked(prisma.group.create).mockRejectedValue(new Error('db down'))
      const res = await POST(mockRequest(validPayload))
      expect(res.status).toBe(500)
    })
  })
})
