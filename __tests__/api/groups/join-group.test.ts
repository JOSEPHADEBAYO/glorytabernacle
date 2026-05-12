/**
 * Unit tests for POST /api/groups/[id]/join (public submission endpoint).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/groups/[id]/join/route'
import { prisma } from '@/lib/prisma'
import * as emailModule from '@/lib/email/send-group-member-notification'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    group: { findUnique: vi.fn() },
    groupMember: { create: vi.fn() },
  },
}))

vi.mock('@/lib/email/send-group-member-notification', () => ({
  sendGroupMemberNotification: vi.fn(),
}))

const publishedGroup = {
  id: 'g-1',
  title: 'Prayer & Intercession',
  slug: 'prayer-intercession',
  published: true,
}

const draftGroup = { ...publishedGroup, published: false }

const validPayload = {
  firstName: 'David',
  lastName: 'Segun',
  email: 'David@Example.com',
  phoneNumber: '07478 137599',
  birthDay: 12,
  birthMonth: 6,
  gender: 'MALE',
  maritalStatus: 'MARRIED',
  address: '12 Example St, Barnstaple, EX31 2BQ',
  filledWithHolyGhost: true,
}

function makeRequest(body: unknown) {
  return { json: async () => body } as unknown as Parameters<typeof POST>[0]
}

describe('POST /api/groups/[id]/join', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(emailModule.sendGroupMemberNotification).mockResolvedValue({
      ok: true,
      detail: 'msg-id',
    })
  })

  describe('Validation', () => {
    it('returns 400 when firstName is missing', async () => {
      const { firstName: _omit, ...rest } = validPayload
      void _omit
      const res = await POST(makeRequest(rest), {
        params: Promise.resolve({ id: 'g-1' }),
      })
      expect(res.status).toBe(400)
      expect(prisma.groupMember.create).not.toHaveBeenCalled()
    })

    it('rejects malformed UK phone numbers', async () => {
      const res = await POST(
        makeRequest({ ...validPayload, phoneNumber: '12345' }),
        { params: Promise.resolve({ id: 'g-1' }) }
      )
      expect(res.status).toBe(400)
    })

    it('accepts UK number with +44 prefix', async () => {
      vi.mocked(prisma.group.findUnique).mockResolvedValue(publishedGroup as never)
      vi.mocked(prisma.groupMember.create).mockResolvedValue({} as never)

      const res = await POST(
        makeRequest({ ...validPayload, phoneNumber: '+44 7478 137599' }),
        { params: Promise.resolve({ id: 'g-1' }) }
      )
      expect(res.status).toBe(200)
    })

    it('rejects birthDay > 31', async () => {
      const res = await POST(
        makeRequest({ ...validPayload, birthDay: 32 }),
        { params: Promise.resolve({ id: 'g-1' }) }
      )
      expect(res.status).toBe(400)
    })

    it('rejects birthMonth > 12', async () => {
      const res = await POST(
        makeRequest({ ...validPayload, birthMonth: 13 }),
        { params: Promise.resolve({ id: 'g-1' }) }
      )
      expect(res.status).toBe(400)
    })

    it('rejects invalid gender enum', async () => {
      const res = await POST(
        makeRequest({ ...validPayload, gender: 'OTHER' }),
        { params: Promise.resolve({ id: 'g-1' }) }
      )
      expect(res.status).toBe(400)
    })

    it('rejects invalid marital status enum', async () => {
      const res = await POST(
        makeRequest({ ...validPayload, maritalStatus: 'COMPLICATED' }),
        { params: Promise.resolve({ id: 'g-1' }) }
      )
      expect(res.status).toBe(400)
    })
  })

  describe('Group lookup', () => {
    it('returns 404 when group does not exist', async () => {
      vi.mocked(prisma.group.findUnique).mockResolvedValue(null)
      const res = await POST(makeRequest(validPayload), {
        params: Promise.resolve({ id: 'nope' }),
      })
      expect(res.status).toBe(404)
      expect(prisma.groupMember.create).not.toHaveBeenCalled()
    })

    it('returns 404 when group is unpublished (no leak of drafts)', async () => {
      vi.mocked(prisma.group.findUnique).mockResolvedValue(draftGroup as never)
      const res = await POST(makeRequest(validPayload), {
        params: Promise.resolve({ id: 'g-1' }),
      })
      expect(res.status).toBe(404)
      expect(prisma.groupMember.create).not.toHaveBeenCalled()
    })
  })

  describe('Successful submission', () => {
    it('creates member, returns 200, and lowercases email', async () => {
      vi.mocked(prisma.group.findUnique).mockResolvedValue(publishedGroup as never)
      vi.mocked(prisma.groupMember.create).mockResolvedValue({
        id: 'm-1',
        groupId: publishedGroup.id,
        firstName: validPayload.firstName,
        lastName: validPayload.lastName,
        email: 'david@example.com',
        phoneNumber: '07478 137599',
        birthDay: validPayload.birthDay,
        birthMonth: validPayload.birthMonth,
        gender: validPayload.gender,
        maritalStatus: validPayload.maritalStatus,
        address: validPayload.address,
        filledWithHolyGhost: validPayload.filledWithHolyGhost,
        createdAt: new Date(),
      } as never)

      const res = await POST(makeRequest(validPayload), {
        params: Promise.resolve({ id: 'g-1' }),
      })
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.submitted).toBe(true)
      expect(prisma.groupMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          groupId: 'g-1',
          email: 'david@example.com', // lowercased
        }),
      })
    })

    it('does not block on email failure', async () => {
      vi.mocked(prisma.group.findUnique).mockResolvedValue(publishedGroup as never)
      vi.mocked(prisma.groupMember.create).mockResolvedValue({} as never)
      vi.mocked(emailModule.sendGroupMemberNotification).mockResolvedValue({
        ok: false,
        detail: 'sender domain not verified',
      })

      const res = await POST(makeRequest(validPayload), {
        params: Promise.resolve({ id: 'g-1' }),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('Errors', () => {
    it('returns 500 on Prisma error', async () => {
      vi.mocked(prisma.group.findUnique).mockResolvedValue(publishedGroup as never)
      vi.mocked(prisma.groupMember.create).mockRejectedValue(new Error('db down'))

      const res = await POST(makeRequest(validPayload), {
        params: Promise.resolve({ id: 'g-1' }),
      })
      expect(res.status).toBe(500)
    })
  })
})
