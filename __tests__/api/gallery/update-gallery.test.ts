/**
 * Unit tests for PUT /api/gallery/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/gallery/[id]/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    gallery: {
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

const existingPhoto = {
  id: 'photo-1',
  title: 'Sunday Service',
  description: 'desc',
  imageUrl: 'https://example.com/1.jpg',
  imageAlt: 'alt',
  dateTaken: new Date('2026-04-26'),
  published: false,
  createdBy: 'super-admin',
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest
}

describe('PUT /api/gallery/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without a session', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

    const req = makeRequest({ title: 'Updated' })
    const params = Promise.resolve({ id: 'photo-1' })
    const res = await PUT(req, { params })

    expect(res.status).toBe(401)
  })

  it('returns 403 when user role is not allowed', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      ...adminUser,
      role: 'VIEWER',
    })

    const req = makeRequest({ title: 'Updated' })
    const params = Promise.resolve({ id: 'photo-1' })
    const res = await PUT(req, { params })
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toBe('Forbidden')
    expect(prisma.gallery.update).not.toHaveBeenCalled()
  })

  it('returns 400 with validation errors when body is empty', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)

    const req = makeRequest({})
    const params = Promise.resolve({ id: 'photo-1' })
    const res = await PUT(req, { params })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  it('returns 404 when photo not found', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null)

    const req = makeRequest({ title: 'Updated' })
    const params = Promise.resolve({ id: 'nope' })
    const res = await PUT(req, { params })
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toBe('Gallery photo not found')
    expect(prisma.gallery.update).not.toHaveBeenCalled()
  })

  it('updates only the provided fields and returns 200', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.gallery.findUnique).mockResolvedValue(existingPhoto as never)
    vi.mocked(prisma.gallery.update).mockResolvedValue({
      ...existingPhoto,
      published: true,
    } as never)

    const req = makeRequest({ published: true })
    const params = Promise.resolve({ id: 'photo-1' })
    const res = await PUT(req, { params })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.published).toBe(true)
    expect(prisma.gallery.update).toHaveBeenCalledWith({
      where: { id: 'photo-1' },
      data: { published: true },
    })
  })
})
