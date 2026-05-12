/**
 * Unit tests for GET /api/groups (list)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/groups/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: { group: { findMany: vi.fn() } },
}))

const adminUser = {
  id: 'super-admin',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'SUPER_ADMIN',
}

describe('GET /api/groups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 with no session', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost:3000/api/groups'))
    expect(res.status).toBe(401)
  })

  it('returns empty array when no groups', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.group.findMany).mockResolvedValue([])

    const res = await GET(new NextRequest('http://localhost:3000/api/groups'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.groups).toEqual([])
  })

  it('orders by `order` asc then createdAt desc', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.group.findMany).mockResolvedValue([])

    await GET(new NextRequest('http://localhost:3000/api/groups'))

    expect(prisma.group.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })
  })

  it('?published=true filters by published=true', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.group.findMany).mockResolvedValue([])

    await GET(new NextRequest('http://localhost:3000/api/groups?published=true'))

    expect(prisma.group.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { published: true } })
    )
  })

  it('returns 400 on bad query value', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)

    const res = await GET(
      new NextRequest('http://localhost:3000/api/groups?published=banana')
    )
    expect(res.status).toBe(400)
  })

  it('returns 500 when prisma throws', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.group.findMany).mockRejectedValue(new Error('db down'))

    const res = await GET(new NextRequest('http://localhost:3000/api/groups'))
    expect(res.status).toBe(500)
  })
})
