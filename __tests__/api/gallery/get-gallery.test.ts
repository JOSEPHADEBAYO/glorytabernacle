/**
 * Unit tests for GET /api/gallery (collection endpoint)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/gallery/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    gallery: {
      findMany: vi.fn(),
    },
  },
}))

const adminUser = {
  id: 'super-admin',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'SUPER_ADMIN',
}

describe('GET /api/gallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when session token is missing', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

    const res = await GET(new NextRequest('http://localhost:3000/api/gallery'))
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns empty array (not 404) when no photos exist', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.gallery.findMany).mockResolvedValue([])

    const res = await GET(new NextRequest('http://localhost:3000/api/gallery'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.photos).toEqual([])
  })

  it('returns photos wrapped in { photos: [...] } and sorted newest dateTaken first', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    const mockPhotos = [
      {
        id: 'p1',
        title: 'Sunday Service',
        description: 'desc',
        imageUrl: 'https://example.com/1.jpg',
        imageAlt: 'alt 1',
        dateTaken: new Date('2026-04-26'),
        published: true,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    vi.mocked(prisma.gallery.findMany).mockResolvedValue(mockPhotos as never)

    const res = await GET(new NextRequest('http://localhost:3000/api/gallery'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.photos).toHaveLength(1)
    expect(prisma.gallery.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ dateTaken: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('filters by ?published=true', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.gallery.findMany).mockResolvedValue([])

    await GET(new NextRequest('http://localhost:3000/api/gallery?published=true'))

    expect(prisma.gallery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { published: true } })
    )
  })

  it('filters by ?published=false', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.gallery.findMany).mockResolvedValue([])

    await GET(new NextRequest('http://localhost:3000/api/gallery?published=false'))

    expect(prisma.gallery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { published: false } })
    )
  })

  it('returns 400 for invalid published query value', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)

    const res = await GET(
      new NextRequest('http://localhost:3000/api/gallery?published=banana')
    )
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  it('returns 500 when prisma throws', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.gallery.findMany).mockRejectedValue(new Error('db down'))

    const res = await GET(new NextRequest('http://localhost:3000/api/gallery'))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})
