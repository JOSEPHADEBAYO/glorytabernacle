/**
 * Unit tests for GET /api/admin/attendance (paginated admin list).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/attendance/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    adultAttendance: {
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

describe('GET /api/admin/attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without session', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost:3000/api/admin/attendance'))
    expect(res.status).toBe(401)
  })

  it('returns 403 for VIEWER role', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({ ...adminUser, role: 'VIEWER' })
    const res = await GET(new NextRequest('http://localhost:3000/api/admin/attendance'))
    expect(res.status).toBe(403)
  })

  it('returns paginated empty result with no data', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.adultAttendance.count).mockResolvedValue(0)
    vi.mocked(prisma.adultAttendance.findMany).mockResolvedValue([])

    const res = await GET(new NextRequest('http://localhost:3000/api/admin/attendance'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toMatchObject({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 25,
      totalPages: 1,
    })
  })

  it('filters by service', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.adultAttendance.count).mockResolvedValue(0)
    vi.mocked(prisma.adultAttendance.findMany).mockResolvedValue([])

    await GET(
      new NextRequest(
        'http://localhost:3000/api/admin/attendance?service=Midweek%20Service'
      )
    )

    expect(prisma.adultAttendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ service: 'Midweek Service' }),
      })
    )
  })

  it('filters by date range', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.adultAttendance.count).mockResolvedValue(0)
    vi.mocked(prisma.adultAttendance.findMany).mockResolvedValue([])

    await GET(
      new NextRequest(
        'http://localhost:3000/api/admin/attendance?fromDate=2026-05-01&toDate=2026-05-31'
      )
    )

    const call = vi.mocked(prisma.adultAttendance.findMany).mock.calls[0][0]
    expect(call?.where?.attendedAt).toEqual(
      expect.objectContaining({
        gte: expect.any(Date),
        lte: expect.any(Date),
      })
    )
  })

  it('builds OR search across name + email', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.adultAttendance.count).mockResolvedValue(0)
    vi.mocked(prisma.adultAttendance.findMany).mockResolvedValue([])

    await GET(
      new NextRequest('http://localhost:3000/api/admin/attendance?search=david')
    )

    expect(prisma.adultAttendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'david', mode: 'insensitive' } },
            { email: { contains: 'david', mode: 'insensitive' } },
          ],
        }),
      })
    )
  })

  it('returns 400 for unknown service filter', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)

    const res = await GET(
      new NextRequest('http://localhost:3000/api/admin/attendance?service=Imaginary')
    )
    expect(res.status).toBe(400)
  })

  it('returns 500 when Prisma throws', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.adultAttendance.count).mockRejectedValue(new Error('db down'))

    const res = await GET(new NextRequest('http://localhost:3000/api/admin/attendance'))
    expect(res.status).toBe(500)
  })
})
