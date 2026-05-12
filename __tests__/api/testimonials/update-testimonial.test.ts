/**
 * Unit tests for PUT /api/testimonials/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/testimonials/[id]/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    testimonial: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const adminUser = {
  id: 'super-admin',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'SUPER_ADMIN',
}

const existing = {
  id: 't-1',
  quote: 'A',
  name: 'Sarah',
  memberSince: 2023,
  order: 0,
  published: false,
  createdBy: 'super-admin',
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

describe('PUT /api/testimonials/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 for VIEWER', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      ...adminUser,
      role: 'VIEWER',
    })
    const res = await PUT(makeRequest({ published: true }), {
      params: Promise.resolve({ id: 't-1' }),
    })
    expect(res.status).toBe(403)
  })

  it('returns 400 with empty body', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    const res = await PUT(makeRequest({}), {
      params: Promise.resolve({ id: 't-1' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 404 when not found', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.testimonial.findUnique).mockResolvedValue(null)
    const res = await PUT(makeRequest({ published: true }), {
      params: Promise.resolve({ id: 'nope' }),
    })
    expect(res.status).toBe(404)
  })

  it('updates only the provided fields and returns 200', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.testimonial.findUnique).mockResolvedValue(existing as never)
    vi.mocked(prisma.testimonial.update).mockResolvedValue({
      ...existing,
      published: true,
    } as never)

    const res = await PUT(makeRequest({ published: true }), {
      params: Promise.resolve({ id: 't-1' }),
    })
    expect(res.status).toBe(200)
    expect(prisma.testimonial.update).toHaveBeenCalledWith({
      where: { id: 't-1' },
      data: { published: true },
    })
  })
})
