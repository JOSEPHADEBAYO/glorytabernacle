/**
 * Unit tests for PUT /api/groups/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/groups/[id]/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    group: {
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

const existingGroup = {
  id: 'g-1',
  slug: 'prayer',
  title: 'Prayer',
  description: 'desc',
  imageSrc: 'https://example.com/i.jpg',
  imageAlt: 'alt',
  ctaLabel: null,
  ctaHref: null,
  order: 10,
  published: false,
  scripture: null,
  headTitle: null,
  responsibilities: null,
  programmes: null,
  specialRole: null,
  furnishStatement: null,
  transformStatement: null,
  influenceStatement: null,
  createdBy: 'super-admin',
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

describe('PUT /api/groups/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without a session', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)
    const res = await PUT(makeRequest({ title: 'X' }), {
      params: Promise.resolve({ id: 'g-1' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 for VIEWER', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({ ...adminUser, role: 'VIEWER' })
    const res = await PUT(makeRequest({ title: 'X' }), {
      params: Promise.resolve({ id: 'g-1' }),
    })
    expect(res.status).toBe(403)
    expect(prisma.group.update).not.toHaveBeenCalled()
  })

  it('returns 400 with empty body', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    const res = await PUT(makeRequest({}), { params: Promise.resolve({ id: 'g-1' }) })
    expect(res.status).toBe(400)
  })

  it('returns 404 when group not found', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.group.findUnique).mockResolvedValue(null)
    const res = await PUT(makeRequest({ title: 'X' }), {
      params: Promise.resolve({ id: 'nope' }),
    })
    expect(res.status).toBe(404)
    expect(prisma.group.update).not.toHaveBeenCalled()
  })

  it('updates only provided fields and returns 200', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.group.findUnique).mockResolvedValue(existingGroup as never)
    vi.mocked(prisma.group.update).mockResolvedValue({
      ...existingGroup,
      published: true,
    } as never)

    const res = await PUT(makeRequest({ published: true }), {
      params: Promise.resolve({ id: 'g-1' }),
    })
    expect(res.status).toBe(200)
    expect(prisma.group.update).toHaveBeenCalledWith({
      where: { id: 'g-1' },
      data: { published: true },
    })
  })

  it('returns 409 on slug conflict', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.group.findUnique).mockResolvedValue(existingGroup as never)
    vi.mocked(prisma.group.update).mockRejectedValue({ code: 'P2002' })

    const res = await PUT(makeRequest({ slug: 'taken' }), {
      params: Promise.resolve({ id: 'g-1' }),
    })
    expect(res.status).toBe(409)
  })
})
