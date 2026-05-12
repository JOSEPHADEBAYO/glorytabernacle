/**
 * Unit tests for DELETE /api/gallery/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE } from '@/app/api/gallery/[id]/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    gallery: {
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

const photo = {
  id: 'photo-1',
  title: 'Sunday Service',
  description: 'desc',
  imageUrl: 'https://example.com/1.jpg',
  imageAlt: 'alt',
  dateTaken: new Date('2026-04-26'),
  published: true,
  createdBy: 'super-admin',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('DELETE /api/gallery/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without a session', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/gallery/photo-1', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'photo-1' })
    const res = await DELETE(req, { params })

    expect(res.status).toBe(401)
    expect(prisma.gallery.delete).not.toHaveBeenCalled()
  })

  it('returns 403 when user role is not allowed', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      ...adminUser,
      role: 'VIEWER',
    })

    const req = new NextRequest('http://localhost:3000/api/gallery/photo-1', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'photo-1' })
    const res = await DELETE(req, { params })

    expect(res.status).toBe(403)
    expect(prisma.gallery.delete).not.toHaveBeenCalled()
  })

  it('returns 404 when photo does not exist', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/gallery/nope', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'nope' })
    const res = await DELETE(req, { params })
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toBe('Gallery photo not found')
    expect(prisma.gallery.delete).not.toHaveBeenCalled()
  })

  it('deletes photo and returns 200 with success message', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.gallery.findUnique).mockResolvedValue(photo as never)
    vi.mocked(prisma.gallery.delete).mockResolvedValue(photo as never)

    const req = new NextRequest('http://localhost:3000/api/gallery/photo-1', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'photo-1' })
    const res = await DELETE(req, { params })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.message).toBe('Gallery photo deleted successfully')
    expect(prisma.gallery.delete).toHaveBeenCalledWith({ where: { id: 'photo-1' } })
  })
})
