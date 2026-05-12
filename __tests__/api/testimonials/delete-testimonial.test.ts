/**
 * Unit tests for DELETE /api/testimonials/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE } from '@/app/api/testimonials/[id]/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    testimonial: {
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

const t = { id: 't-1', name: 'Sarah' }

describe('DELETE /api/testimonials/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without a session', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)
    const req = new NextRequest('http://localhost:3000/api/testimonials/t-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 't-1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 403 for VIEWER', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      ...adminUser,
      role: 'VIEWER',
    })
    const req = new NextRequest('http://localhost:3000/api/testimonials/t-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 't-1' }) })
    expect(res.status).toBe(403)
  })

  it('returns 404 when not found', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.testimonial.findUnique).mockResolvedValue(null)
    const req = new NextRequest('http://localhost:3000/api/testimonials/nope', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nope' }) })
    expect(res.status).toBe(404)
  })

  it('deletes and returns 200', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.testimonial.findUnique).mockResolvedValue(t as never)
    vi.mocked(prisma.testimonial.delete).mockResolvedValue(t as never)

    const req = new NextRequest('http://localhost:3000/api/testimonials/t-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 't-1' }) })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.message).toMatch(/deleted/i)
    expect(prisma.testimonial.delete).toHaveBeenCalledWith({
      where: { id: 't-1' },
    })
  })
})
