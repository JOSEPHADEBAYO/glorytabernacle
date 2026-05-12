/**
 * Focused tests confirming featured + featuredOrder are persisted by the
 * Book POST/PUT handlers. The existing book API tests cover everything else.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/books/route'
import { PUT } from '@/app/api/books/[id]/route'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    book: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const adminUser = {
  id: 'super-admin',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'SUPER_ADMIN',
}

const validPayload = {
  title: 'The Pursuit of God',
  author: 'A.W. Tozer',
  category: 'Spiritual Growth',
  description: 'A classic on Christian spirituality.',
  coverImage: 'https://example.com/cover.jpg',
  published: false,
}

function mockRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

describe('POST /api/books — featured fields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
  })

  it('persists featured=true with explicit featuredOrder', async () => {
    vi.mocked(prisma.book.create).mockResolvedValue({} as never)

    await POST(
      mockRequest({ ...validPayload, featured: true, featuredOrder: 1 })
    )

    expect(prisma.book.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        featured: true,
        featuredOrder: 1,
      }),
    })
  })

  it('defaults featured=false and featuredOrder=0 when omitted', async () => {
    vi.mocked(prisma.book.create).mockResolvedValue({} as never)

    await POST(mockRequest(validPayload))

    expect(prisma.book.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        featured: false,
        featuredOrder: 0,
      }),
    })
  })
})

describe('PUT /api/books/[id] — featured fields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('tok')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(adminUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue({ id: 'b-1' } as never)
  })

  it('toggles featured on its own', async () => {
    vi.mocked(prisma.book.update).mockResolvedValue({} as never)

    await PUT(mockRequest({ featured: true }), {
      params: Promise.resolve({ id: 'b-1' }),
    })

    expect(prisma.book.update).toHaveBeenCalledWith({
      where: { id: 'b-1' },
      data: { featured: true },
    })
  })

  it('updates featuredOrder on its own', async () => {
    vi.mocked(prisma.book.update).mockResolvedValue({} as never)

    await PUT(mockRequest({ featuredOrder: 2 }), {
      params: Promise.resolve({ id: 'b-1' }),
    })

    expect(prisma.book.update).toHaveBeenCalledWith({
      where: { id: 'b-1' },
      data: { featuredOrder: 2 },
    })
  })

  it('updates both fields in one request', async () => {
    vi.mocked(prisma.book.update).mockResolvedValue({} as never)

    await PUT(mockRequest({ featured: true, featuredOrder: 1 }), {
      params: Promise.resolve({ id: 'b-1' }),
    })

    expect(prisma.book.update).toHaveBeenCalledWith({
      where: { id: 'b-1' },
      data: { featured: true, featuredOrder: 1 },
    })
  })
})
