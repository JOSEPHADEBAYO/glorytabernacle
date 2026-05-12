/**
 * Unit tests for /api/cron/send-event-notifications
 *
 * Covers:
 *  - Auth check via Bearer CRON_SECRET
 *  - Per-recipient send isolation
 *  - notifiedAt is set on successful send
 *  - Failures don't stop processing other subscribers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/cron/send-event-notifications/route'
import { prisma } from '@/lib/prisma'
import * as emailModule from '@/lib/email/send-event-notification'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    eventNotification: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/email/send-event-notification', () => ({
  sendEventNotification: vi.fn(),
}))

const SECRET = 'test-cron-secret'

function makeRequest(authHeader?: string): NextRequest {
  return new NextRequest(
    'http://localhost:3000/api/cron/send-event-notifications',
    {
      headers: authHeader ? { authorization: authHeader } : undefined,
    }
  )
}

const eventInWindow = {
  id: 'event-1',
  title: 'Sunday Service',
  description: 'Morning service.',
  date: new Date(Date.now() + 30 * 60 * 1000), // 30 min from now
  time: '10:00 AM',
  location: 'Main Sanctuary',
  registrationHref: null,
}

describe('Cron: send-event-notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = SECRET
  })

  afterEach(() => {
    delete process.env.CRON_SECRET
  })

  describe('Auth', () => {
    it('returns 500 when CRON_SECRET is not set', async () => {
      delete process.env.CRON_SECRET

      const res = await GET(makeRequest('Bearer anything'))
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.error).toMatch(/CRON_SECRET missing/i)
    })

    it('returns 401 with no auth header', async () => {
      const res = await GET(makeRequest())
      expect(res.status).toBe(401)
    })

    it('returns 401 with wrong bearer token', async () => {
      const res = await GET(makeRequest('Bearer wrong-token'))
      expect(res.status).toBe(401)
    })

    it('accepts both GET and POST with valid token', async () => {
      vi.mocked(prisma.eventNotification.findMany).mockResolvedValue([])

      const getRes = await GET(makeRequest(`Bearer ${SECRET}`))
      const postRes = await POST(makeRequest(`Bearer ${SECRET}`))

      expect(getRes.status).toBe(200)
      expect(postRes.status).toBe(200)
    })
  })

  describe('Processing', () => {
    it('returns 200 with zero counts when no pending notifications', async () => {
      vi.mocked(prisma.eventNotification.findMany).mockResolvedValue([])

      const res = await GET(makeRequest(`Bearer ${SECRET}`))
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toEqual({ processed: 0, sent: 0, failed: 0 })
      expect(emailModule.sendEventNotification).not.toHaveBeenCalled()
    })

    it('sends email and marks notifiedAt for each successful subscriber', async () => {
      vi.mocked(prisma.eventNotification.findMany).mockResolvedValue([
        {
          id: 'sub-1',
          eventId: 'event-1',
          name: 'David',
          email: 'david@example.com',
          notifiedAt: null,
          createdAt: new Date(),
          event: eventInWindow,
        },
        {
          id: 'sub-2',
          eventId: 'event-1',
          name: 'Sarah',
          email: 'sarah@example.com',
          notifiedAt: null,
          createdAt: new Date(),
          event: eventInWindow,
        },
      ] as never)

      vi.mocked(emailModule.sendEventNotification).mockResolvedValue({
        ok: true,
        detail: 'msg-id',
      })
      vi.mocked(prisma.eventNotification.update).mockResolvedValue({} as never)

      const res = await GET(makeRequest(`Bearer ${SECRET}`))
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.processed).toBe(2)
      expect(data.sent).toBe(2)
      expect(data.failed).toBe(0)
      expect(emailModule.sendEventNotification).toHaveBeenCalledTimes(2)
      expect(prisma.eventNotification.update).toHaveBeenCalledTimes(2)
      expect(prisma.eventNotification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({ notifiedAt: expect.any(Date) }),
        })
      )
    })

    it('isolates per-recipient failures and reports errors', async () => {
      vi.mocked(prisma.eventNotification.findMany).mockResolvedValue([
        {
          id: 'sub-1',
          eventId: 'event-1',
          name: 'David',
          email: 'david@example.com',
          notifiedAt: null,
          createdAt: new Date(),
          event: eventInWindow,
        },
        {
          id: 'sub-2',
          eventId: 'event-1',
          name: 'Sarah',
          email: 'sarah@example.com',
          notifiedAt: null,
          createdAt: new Date(),
          event: eventInWindow,
        },
      ] as never)

      vi.mocked(emailModule.sendEventNotification).mockImplementation(
        async ({ to }) => {
          if (to === 'david@example.com') {
            return { ok: false, detail: 'Bounced' }
          }
          return { ok: true, detail: 'msg-id' }
        }
      )
      vi.mocked(prisma.eventNotification.update).mockResolvedValue({} as never)

      const res = await GET(makeRequest(`Bearer ${SECRET}`))
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.processed).toBe(2)
      expect(data.sent).toBe(1)
      expect(data.failed).toBe(1)
      expect(data.errors).toHaveLength(1)
      expect(data.errors[0]).toMatchObject({
        id: 'sub-1',
        email: 'david@example.com',
        reason: 'Bounced',
      })
      // Only the successful send should mark notifiedAt
      expect(prisma.eventNotification.update).toHaveBeenCalledTimes(1)
      expect(prisma.eventNotification.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'sub-2' } })
      )
    })

    it('returns 500 if pending lookup throws', async () => {
      vi.mocked(prisma.eventNotification.findMany).mockRejectedValue(
        new Error('db down')
      )

      const res = await GET(makeRequest(`Bearer ${SECRET}`))
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.error).toMatch(/load pending/i)
    })
  })
})
