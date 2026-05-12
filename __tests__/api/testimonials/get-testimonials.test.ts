/**
 * Unit tests for GET /api/testimonials
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/testimonials/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: { testimonial: { findMany: vi.fn() } },
}))

const adminUser = {
  id: 'super-admin',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'SUPER_ADMIN',
}

describe('GET /api/testimonials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without a session', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost:3000/api/testimonials'))
    expect(res.status).toBe(401)
  })

  it('returns empty array when no testimonials', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.testimonial.findMany).mockResolvedValue([])

    const res = await GET(new NextRequest('http://localhost:3000/api/testimonials'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.testimonials).toEqual([])
  })

  it('orders by `order` asc then createdAt desc', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.testimonial.findMany).mockResolvedValue([])

    await GET(new NextRequest('http://localhost:3000/api/testimonials'))

    expect(prisma.testimonial.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })
  })

  it('?published=true filters by published=true', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.testimonial.findMany).mockResolvedValue([])

    await GET(
      new NextRequest('http://localhost:3000/api/testimonials?published=true')
    )

    expect(prisma.testimonial.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { published: true } })
    )
  })

  it('returns 400 on invalid query', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)

    const res = await GET(
      new NextRequest('http://localhost:3000/api/testimonials?published=banana')
    )
    expect(res.status).toBe(400)
  })
})
