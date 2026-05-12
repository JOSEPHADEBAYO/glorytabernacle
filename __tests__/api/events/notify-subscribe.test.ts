/**
 * Unit tests for POST /api/events/[id]/notify (public subscribe endpoint)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/events/[id]/notify/route'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findUnique: vi.fn(),
    },
    eventNotification: {
      upsert: vi.fn(),
    },
  },
}))

const futureEvent = {
  id: 'event-future',
  date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
  published: true,
}

const pastEvent = {
  id: 'event-past',
  date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  published: true,
}

function makeRequest(body: unknown) {
  return {
    json: async () => body,
  } as unknown as Parameters<typeof POST>[0]
}

describe('POST /api/events/[id]/notify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Validation', () => {
    it('returns 400 when name is missing', async () => {
      const req = makeRequest({ email: 'a@b.com' })
      const params = Promise.resolve({ id: 'event-future' })
      const res = await POST(req, { params })
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(prisma.eventNotification.upsert).not.toHaveBeenCalled()
    })

    it('returns 400 when email is missing', async () => {
      const req = makeRequest({ name: 'David' })
      const params = Promise.resolve({ id: 'event-future' })
      const res = await POST(req, { params })
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('returns 400 when email is malformed', async () => {
      const req = makeRequest({ name: 'David', email: 'not-an-email' })
      const params = Promise.resolve({ id: 'event-future' })
      const res = await POST(req, { params })
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('returns 400 when name is blank after trimming', async () => {
      const req = makeRequest({ name: '   ', email: 'a@b.com' })
      const params = Promise.resolve({ id: 'event-future' })
      const res = await POST(req, { params })
      const data = await res.json()

      expect(res.status).toBe(400)
    })
  })

  describe('Event lookup', () => {
    it('returns 404 when event does not exist', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(null)

      const req = makeRequest({ name: 'David', email: 'a@b.com' })
      const params = Promise.resolve({ id: 'nope' })
      const res = await POST(req, { params })
      const data = await res.json()

      expect(res.status).toBe(404)
      expect(data.error).toBe('Event not found')
      expect(prisma.eventNotification.upsert).not.toHaveBeenCalled()
    })

    it('returns 422 when event date has already passed', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(pastEvent as never)

      const req = makeRequest({ name: 'David', email: 'a@b.com' })
      const params = Promise.resolve({ id: 'event-past' })
      const res = await POST(req, { params })
      const data = await res.json()

      expect(res.status).toBe(422)
      expect(data.error).toMatch(/already started or passed/i)
      expect(prisma.eventNotification.upsert).not.toHaveBeenCalled()
    })
  })

  describe('Successful subscription', () => {
    it('upserts subscriber and returns 200 on success', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(futureEvent as never)
      vi.mocked(prisma.eventNotification.upsert).mockResolvedValue({} as never)

      const req = makeRequest({ name: 'David', email: 'David@Example.COM' })
      const params = Promise.resolve({ id: 'event-future' })
      const res = await POST(req, { params })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.subscribed).toBe(true)
      expect(prisma.eventNotification.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId_email: { eventId: 'event-future', email: 'david@example.com' } },
          create: expect.objectContaining({
            eventId: 'event-future',
            name: 'David',
            email: 'david@example.com',
          }),
          update: expect.objectContaining({
            name: 'David',
            notifiedAt: null,
          }),
        })
      )
    })

    it('trims whitespace and lowercases email before storing', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(futureEvent as never)
      vi.mocked(prisma.eventNotification.upsert).mockResolvedValue({} as never)

      const req = makeRequest({ name: '  David  ', email: '  Hi@Foo.com  ' })
      const params = Promise.resolve({ id: 'event-future' })
      const res = await POST(req, { params })

      expect(res.status).toBe(200)
      expect(prisma.eventNotification.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            name: 'David',
            email: 'hi@foo.com',
          }),
        })
      )
    })
  })

  describe('Error handling', () => {
    it('returns 500 if Prisma throws on lookup', async () => {
      vi.mocked(prisma.event.findUnique).mockRejectedValue(new Error('db down'))

      const req = makeRequest({ name: 'David', email: 'a@b.com' })
      const params = Promise.resolve({ id: 'event-future' })
      const res = await POST(req, { params })
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('returns 500 if Prisma throws on upsert', async () => {
      vi.mocked(prisma.event.findUnique).mockResolvedValue(futureEvent as never)
      vi.mocked(prisma.eventNotification.upsert).mockRejectedValue(
        new Error('constraint violation')
      )

      const req = makeRequest({ name: 'David', email: 'a@b.com' })
      const params = Promise.resolve({ id: 'event-future' })
      const res = await POST(req, { params })
      const data = await res.json()

      expect(res.status).toBe(500)
    })
  })
})
