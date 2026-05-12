/**
 * Unit tests for GET /api/events (collection endpoint)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/events/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
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

describe('GET /api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when session token is missing', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

    const res = await GET(new NextRequest('http://localhost:3000/api/events'))
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns empty array (not 404) when no events exist', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.event.findMany).mockResolvedValue([])

    const res = await GET(new NextRequest('http://localhost:3000/api/events'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.events).toEqual([])
  })

  it('returns events wrapped in { events: [...] }', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    const mockEvents = [
      {
        id: 'e1',
        title: 'Sunday Service',
        description: 'desc',
        date: new Date('2026-06-07'),
        time: '10:00 AM',
        location: 'Main Sanctuary',
        imageSrc: null,
        imageAlt: null,
        registrationHref: null,
        published: true,
        createdBy: 'super-admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    vi.mocked(prisma.event.findMany).mockResolvedValue(mockEvents as never)

    const res = await GET(new NextRequest('http://localhost:3000/api/events'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.events).toHaveLength(1)
  })

  it('without filters returns events ordered by date desc', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.event.findMany).mockResolvedValue([])

    await GET(new NextRequest('http://localhost:3000/api/events'))

    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { date: 'desc' },
    })
  })

  it('?upcoming=true filters by date >= now and orders ascending', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.event.findMany).mockResolvedValue([])

    await GET(
      new NextRequest('http://localhost:3000/api/events?upcoming=true')
    )

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: expect.objectContaining({ gte: expect.any(Date) }),
        }),
        orderBy: { date: 'asc' },
      })
    )
  })

  it('?published=true filters by published=true', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.event.findMany).mockResolvedValue([])

    await GET(
      new NextRequest('http://localhost:3000/api/events?published=true')
    )

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { published: true } })
    )
  })

  it('returns 400 for invalid query value', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)

    const res = await GET(
      new NextRequest('http://localhost:3000/api/events?published=banana')
    )
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  it('returns 500 when prisma throws', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.event.findMany).mockRejectedValue(new Error('db down'))

    const res = await GET(new NextRequest('http://localhost:3000/api/events'))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})
