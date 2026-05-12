/**
 * Unit tests for DELETE /api/events/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE } from '@/app/api/events/[id]/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

const adminUser = {
  id: 'super-admin',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'SUPER_ADMIN',
}

const event = {
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

describe('DELETE /api/events/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without a session', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/events/event-1', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'event-1' })
    const res = await DELETE(req, { params })

    expect(res.status).toBe(401)
    expect(prisma.event.delete).not.toHaveBeenCalled()
  })

  it('returns 403 when user role is not allowed', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      ...adminUser,
      role: 'VIEWER',
    })

    const req = new NextRequest('http://localhost:3000/api/events/event-1', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'event-1' })
    const res = await DELETE(req, { params })

    expect(res.status).toBe(403)
    expect(prisma.event.delete).not.toHaveBeenCalled()
  })

  it('returns 404 when event does not exist', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/events/nope', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'nope' })
    const res = await DELETE(req, { params })
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toBe('Event not found')
    expect(prisma.event.delete).not.toHaveBeenCalled()
  })

  it('deletes event and returns 200 with success message', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.event.findUnique).mockResolvedValue(event as never)
    vi.mocked(prisma.event.delete).mockResolvedValue(event as never)

    const req = new NextRequest('http://localhost:3000/api/events/event-1', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'event-1' })
    const res = await DELETE(req, { params })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.message).toBe('Event deleted successfully')
    expect(prisma.event.delete).toHaveBeenCalledWith({ where: { id: 'event-1' } })
  })
})
