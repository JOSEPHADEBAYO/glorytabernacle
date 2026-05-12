/**
 * Unit tests for PUT /api/events/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/events/[id]/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
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

const existingEvent = {
  id: 'event-1',
  title: 'Sunday Service',
  description: 'desc',
  date: new Date('2026-06-07'),
  time: '10:00 AM',
  location: 'Main Sanctuary',
  imageSrc: null,
  imageAlt: null,
  registrationHref: null,
  published: false,
  createdBy: 'super-admin',
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

describe('PUT /api/events/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without a session', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

    const req = makeRequest({ title: 'Updated' })
    const params = Promise.resolve({ id: 'event-1' })
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
    const params = Promise.resolve({ id: 'event-1' })
    const res = await PUT(req, { params })
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toBe('Forbidden')
    expect(prisma.event.update).not.toHaveBeenCalled()
  })

  it('returns 400 with validation errors when body is empty', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)

    const req = makeRequest({})
    const params = Promise.resolve({ id: 'event-1' })
    const res = await PUT(req, { params })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  it('returns 404 when event not found', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null)

    const req = makeRequest({ title: 'Updated' })
    const params = Promise.resolve({ id: 'nope' })
    const res = await PUT(req, { params })
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toBe('Event not found')
    expect(prisma.event.update).not.toHaveBeenCalled()
  })

  it('updates only the provided fields and returns 200', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.event.findUnique).mockResolvedValue(existingEvent as never)
    vi.mocked(prisma.event.update).mockResolvedValue({
      ...existingEvent,
      published: true,
    } as never)

    const req = makeRequest({ published: true })
    const params = Promise.resolve({ id: 'event-1' })
    const res = await PUT(req, { params })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.published).toBe(true)
    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { published: true },
    })
  })

  it('normalizes empty optional strings to null in update', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.event.findUnique).mockResolvedValue(existingEvent as never)
    vi.mocked(prisma.event.update).mockResolvedValue({
      ...existingEvent,
      time: null,
      location: null,
    } as never)

    const req = makeRequest({ time: '', location: '' })
    const params = Promise.resolve({ id: 'event-1' })
    const res = await PUT(req, { params })

    expect(res.status).toBe(200)
    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: expect.objectContaining({ time: null, location: null }),
    })
  })
})
