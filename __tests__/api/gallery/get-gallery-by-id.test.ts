/**
 * Unit tests for GET /api/gallery/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/gallery/[id]/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    gallery: {
      findUnique: vi.fn(),
    },
  },
}))

const adminUser = {
  id: 'super-admin',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'SUPER_ADMIN',
}

const mockPhoto = {
  id: 'photo-1',
  title: 'Sunday Service',
  description: 'desc',
  imageUrl: 'https://example.com/1.jpg',
  imageAlt: 'alt',
  dateTaken: new Date('2026-04-26'),
  published: true,
  createdBy: 'super-admin',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('GET /api/gallery/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no session token', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/gallery/photo-1')
    const params = Promise.resolve({ id: 'photo-1' })
    const res = await GET(req, { params })
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 404 when photo not found', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/gallery/nope')
    const params = Promise.resolve({ id: 'nope' })
    const res = await GET(req, { params })
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toBe('Gallery photo not found')
  })

  it('returns 200 with photo when found', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockPhoto as never)

    const req = new NextRequest('http://localhost:3000/api/gallery/photo-1')
    const params = Promise.resolve({ id: 'photo-1' })
    const res = await GET(req, { params })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.id).toBe('photo-1')
    expect(prisma.gallery.findUnique).toHaveBeenCalledWith({ where: { id: 'photo-1' } })
  })
})
