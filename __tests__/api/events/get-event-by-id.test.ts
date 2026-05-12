/**
 * Unit tests for GET /api/events/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/events/[id]/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
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

const mockEvent = {
  id: 'event-1',
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
}

describe('GET /api/events/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no session token', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/events/event-1')
    const params = Promise.resolve({ id: 'event-1' })
    const res = await GET(req, { params })
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 404 when event not found', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/events/nope')
    const params = Promise.resolve({ id: 'nope' })
    const res = await GET(req, { params })
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toBe('Event not found')
  })

  it('returns 200 with event when found', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent as never)

    const req = new NextRequest('http://localhost:3000/api/events/event-1')
    const params = Promise.resolve({ id: 'event-1' })
    const res = await GET(req, { params })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.id).toBe('event-1')
    expect(prisma.event.findUnique).toHaveBeenCalledWith({ where: { id: 'event-1' } })
  })
})
