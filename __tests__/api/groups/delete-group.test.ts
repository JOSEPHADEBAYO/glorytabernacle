/**
 * Unit tests for DELETE /api/groups/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE } from '@/app/api/groups/[id]/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    group: {
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

const group = {
  id: 'g-1',
  slug: 'prayer',
  title: 'Prayer',
}

describe('DELETE /api/groups/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without a session', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)
    const req = new NextRequest('http://localhost:3000/api/groups/g-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'g-1' }) })
    expect(res.status).toBe(401)
    expect(prisma.group.delete).not.toHaveBeenCalled()
  })

  it('returns 403 for VIEWER', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({ ...adminUser, role: 'VIEWER' })
    const req = new NextRequest('http://localhost:3000/api/groups/g-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'g-1' }) })
    expect(res.status).toBe(403)
  })

  it('returns 404 when not found', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.group.findUnique).mockResolvedValue(null)
    const req = new NextRequest('http://localhost:3000/api/groups/nope', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nope' }) })
    expect(res.status).toBe(404)
    expect(prisma.group.delete).not.toHaveBeenCalled()
  })

  it('deletes and returns 200 with success message', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.group.findUnique).mockResolvedValue(group as never)
    vi.mocked(prisma.group.delete).mockResolvedValue(group as never)

    const req = new NextRequest('http://localhost:3000/api/groups/g-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'g-1' }) })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.message).toMatch(/deleted/i)
    expect(prisma.group.delete).toHaveBeenCalledWith({ where: { id: 'g-1' } })
  })
})
