/**
 * Unit tests for GET /api/group-members (paginated admin list)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/group-members/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    groupMember: {
      count: vi.fn(),
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

describe('GET /api/group-members', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 with no session', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)
    const res = await GET(
      new NextRequest('http://localhost:3000/api/group-members')
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 when user role is VIEWER', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      ...adminUser,
      role: 'VIEWER',
    })
    const res = await GET(
      new NextRequest('http://localhost:3000/api/group-members')
    )
    expect(res.status).toBe(403)
  })

  it('returns paginated empty result when nothing matches', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.groupMember.count).mockResolvedValue(0)
    vi.mocked(prisma.groupMember.findMany).mockResolvedValue([])

    const res = await GET(
      new NextRequest('http://localhost:3000/api/group-members')
    )
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toMatchObject({
      members: [],
      total: 0,
      page: 1,
      pageSize: 25,
      totalPages: 1,
    })
  })

  it('respects ?page and ?pageSize', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.groupMember.count).mockResolvedValue(60)
    vi.mocked(prisma.groupMember.findMany).mockResolvedValue([])

    await GET(
      new NextRequest('http://localhost:3000/api/group-members?page=2&pageSize=10')
    )

    expect(prisma.groupMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (page-1) * pageSize
        take: 10,
      })
    )
  })

  it('filters by ?groupId', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.groupMember.count).mockResolvedValue(0)
    vi.mocked(prisma.groupMember.findMany).mockResolvedValue([])

    await GET(
      new NextRequest('http://localhost:3000/api/group-members?groupId=g-123')
    )

    expect(prisma.groupMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { groupId: 'g-123' },
      })
    )
  })

  it('builds OR search across firstName, lastName, email', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.groupMember.count).mockResolvedValue(0)
    vi.mocked(prisma.groupMember.findMany).mockResolvedValue([])

    await GET(
      new NextRequest('http://localhost:3000/api/group-members?search=david')
    )

    expect(prisma.groupMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { firstName: { contains: 'david', mode: 'insensitive' } },
            { lastName: { contains: 'david', mode: 'insensitive' } },
            { email: { contains: 'david', mode: 'insensitive' } },
          ]),
        }),
      })
    )
  })

  it('caps pageSize at 100', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    const res = await GET(
      new NextRequest('http://localhost:3000/api/group-members?pageSize=500')
    )
    expect(res.status).toBe(400) // schema rejects pageSize > 100
  })

  it('returns 500 on Prisma error', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.groupMember.count).mockRejectedValue(new Error('db down'))

    const res = await GET(
      new NextRequest('http://localhost:3000/api/group-members')
    )
    expect(res.status).toBe(500)
  })
})
