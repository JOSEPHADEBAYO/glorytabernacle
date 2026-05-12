/**
 * Unit tests for parent check-in / check-out endpoints, focusing on
 * authorization (parent A cannot act on parent B's children) and
 * idempotency (re-signing-in already-in children doesn't duplicate).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST as POST_CHECKIN } from '@/app/api/parents/me/check-in/route'
import { POST as POST_CHECKOUT } from '@/app/api/parents/me/check-out/route'
import { NextRequest } from 'next/server'
import * as parentSession from '@/lib/auth/parent-session'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/auth/parent-session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    child: { findMany: vi.fn() },
    childCheckIn: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

const parent = {
  id: 'parent-1',
  email: 'p@example.com',
  name: 'P',
  image: null,
}

function req(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

describe('POST /api/parents/me/check-in', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 with no session', async () => {
    vi.mocked(parentSession.getParentUser).mockResolvedValue(null)
    const res = await POST_CHECKIN(req({ childIds: ['c1'] }))
    expect(res.status).toBe(401)
  })

  it('skips foreign children', async () => {
    vi.mocked(parentSession.getParentUser).mockResolvedValue(parent)
    // 'c2' is not owned by the parent
    vi.mocked(prisma.child.findMany).mockResolvedValue([{ id: 'c1' }] as never)
    vi.mocked(prisma.childCheckIn.findMany).mockResolvedValue([])
    vi.mocked(prisma.childCheckIn.createMany).mockResolvedValue({ count: 1 } as never)

    const res = await POST_CHECKIN(req({ childIds: ['c1', 'c2'] }))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.signedIn).toBe(1)
    expect(data.skipped).toBe(1)
  })

  it('does not double-sign-in an already-open child', async () => {
    vi.mocked(parentSession.getParentUser).mockResolvedValue(parent)
    vi.mocked(prisma.child.findMany).mockResolvedValue([
      { id: 'c1' },
      { id: 'c2' },
    ] as never)
    vi.mocked(prisma.childCheckIn.findMany).mockResolvedValue([
      { childId: 'c1' },
    ] as never)
    vi.mocked(prisma.childCheckIn.createMany).mockResolvedValue({ count: 1 } as never)

    const res = await POST_CHECKIN(req({ childIds: ['c1', 'c2'] }))
    const data = await res.json()
    expect(data.signedIn).toBe(1)
    expect(data.alreadyIn).toBe(1)
    // Only c2 should be in the create payload
    expect(prisma.childCheckIn.createMany).toHaveBeenCalledWith({
      data: [{ childId: 'c2', signedInById: 'parent-1' }],
    })
  })

  it('rejects empty childIds via validation', async () => {
    vi.mocked(parentSession.getParentUser).mockResolvedValue(parent)
    const res = await POST_CHECKIN(req({ childIds: [] }))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/parents/me/check-out', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 with no session', async () => {
    vi.mocked(parentSession.getParentUser).mockResolvedValue(null)
    const res = await POST_CHECKOUT(req({ checkInIds: ['ci1'] }))
    expect(res.status).toBe(401)
  })

  it('only closes check-ins whose child is owned by the parent', async () => {
    vi.mocked(parentSession.getParentUser).mockResolvedValue(parent)
    // ci1 belongs to parent-1's child, ci2 does not
    vi.mocked(prisma.childCheckIn.findMany).mockResolvedValue([
      {
        id: 'ci1',
        signedOutAt: null,
        child: { parents: [{ id: 'parent-1' }] },
      },
      {
        id: 'ci2',
        signedOutAt: null,
        child: { parents: [{ id: 'parent-2' }] },
      },
    ] as never)
    vi.mocked(prisma.childCheckIn.updateMany).mockResolvedValue({ count: 1 } as never)

    const res = await POST_CHECKOUT(req({ checkInIds: ['ci1', 'ci2'] }))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.signedOut).toBe(1)
    expect(data.skipped).toBe(1)
    expect(prisma.childCheckIn.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['ci1'] } },
      data: expect.objectContaining({ signedOutById: 'parent-1' }),
    })
  })

  it('counts already-closed check-ins separately', async () => {
    vi.mocked(parentSession.getParentUser).mockResolvedValue(parent)
    vi.mocked(prisma.childCheckIn.findMany).mockResolvedValue([
      {
        id: 'ci1',
        signedOutAt: new Date(),
        child: { parents: [{ id: 'parent-1' }] },
      },
    ] as never)

    const res = await POST_CHECKOUT(req({ checkInIds: ['ci1'] }))
    const data = await res.json()
    expect(data.signedOut).toBe(0)
    expect(data.alreadyOut).toBe(1)
    expect(prisma.childCheckIn.updateMany).not.toHaveBeenCalled()
  })

  it('allows the OTHER parent (not the one who signed in) to sign out', async () => {
    // This is the explicit policy: any registered parent can pick up.
    const otherParent = { ...parent, id: 'parent-2' }
    vi.mocked(parentSession.getParentUser).mockResolvedValue(otherParent)
    vi.mocked(prisma.childCheckIn.findMany).mockResolvedValue([
      {
        id: 'ci1',
        signedOutAt: null,
        // child has TWO parents
        child: {
          parents: [{ id: 'parent-1' }, { id: 'parent-2' }],
        },
      },
    ] as never)
    vi.mocked(prisma.childCheckIn.updateMany).mockResolvedValue({ count: 1 } as never)

    const res = await POST_CHECKOUT(req({ checkInIds: ['ci1'] }))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.signedOut).toBe(1)
    expect(prisma.childCheckIn.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['ci1'] } },
      data: expect.objectContaining({ signedOutById: 'parent-2' }),
    })
  })
})
