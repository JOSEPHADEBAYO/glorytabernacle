/**
 * Unit tests for POST /api/testimonials
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/testimonials/route'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: { testimonial: { create: vi.fn() } },
}))

const adminUser = {
  id: 'super-admin',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'SUPER_ADMIN',
}

const validPayload = {
  quote: 'I came to Glory Tabernacle broken and found my purpose.',
  name: 'Sarah Johnson',
  memberSince: 2023,
  order: 10,
  published: false,
}

function mockRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

describe('POST /api/testimonials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 with no session', async () => {
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
  })

  it('returns 400 with empty quote', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    const res = await POST(mockRequest({ ...validPayload, quote: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when memberSince is too old (< 1900)', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    const res = await POST(mockRequest({ ...validPayload, memberSince: 1800 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when memberSince is too far in future', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    const res = await POST(
      mockRequest({ ...validPayload, memberSince: new Date().getFullYear() + 5 })
    )
    expect(res.status).toBe(400)
  })

  it('persists testimonial and returns 201', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.testimonial.create).mockResolvedValue({
      id: 't-1',
      ...validPayload,
      createdBy: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)

    const res = await POST(mockRequest(validPayload))
    expect(res.status).toBe(201)
    expect(prisma.testimonial.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        quote: validPayload.quote,
        name: validPayload.name,
        memberSince: validPayload.memberSince,
        createdBy: adminUser.id,
      }),
    })
  })

  it('returns 500 on Prisma error', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.testimonial.create).mockRejectedValue(new Error('db down'))
    const res = await POST(mockRequest(validPayload))
    expect(res.status).toBe(500)
  })
})
