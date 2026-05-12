import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/books/[id]/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

// Mock the session module
vi.mock('@/lib/auth/session', () => ({
  getSessionToken: vi.fn(),
  getSessionUser: vi.fn(),
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    book: {
      findUnique: vi.fn(),
    },
  },
}))

describe('GET /api/books/[id]', () => {
  const mockBook = {
    id: 'test-book-id',
    title: 'Test Book',
    author: 'Test Author',
    category: 'Spiritual Growth',
    description: 'Test description',
    coverImage: 'https://example.com/image.jpg',
    purchaseUrl: 'https://example.com/buy',
    published: true,
    createdBy: 'super-admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockUser = {
    id: 'super-admin',
    email: 'test@example.com',
    name: 'Test User',
    role: 'SUPER_ADMIN',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if session token is missing', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/books/test-id')
    const params = Promise.resolve({ id: 'test-id' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 401 if session user is invalid', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/books/test-id')
    const params = Promise.resolve({ id: 'test-id' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 404 if book is not found', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/books/non-existent-id')
    const params = Promise.resolve({ id: 'non-existent-id' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Book not found')
    expect(prisma.book.findUnique).toHaveBeenCalledWith({
      where: { id: 'non-existent-id' },
    })
  })

  it('returns 200 with complete book record if found', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook)

    const request = new NextRequest('http://localhost:3000/api/books/test-book-id')
    const params = Promise.resolve({ id: 'test-book-id' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    // Dates are serialized to strings in JSON response
    expect(data).toEqual({
      ...mockBook,
      createdAt: mockBook.createdAt.toISOString(),
      updatedAt: mockBook.updatedAt.toISOString(),
    })
    expect(prisma.book.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-book-id' },
    })
  })

  it('returns 500 on database error', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/books/test-id')
    const params = Promise.resolve({ id: 'test-id' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('extracts book ID from route params correctly', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook)

    const request = new NextRequest('http://localhost:3000/api/books/custom-book-id-123')
    const params = Promise.resolve({ id: 'custom-book-id-123' })

    await GET(request, { params })

    expect(prisma.book.findUnique).toHaveBeenCalledWith({
      where: { id: 'custom-book-id-123' },
    })
  })

  it('returns book with all required fields', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook)

    const request = new NextRequest('http://localhost:3000/api/books/test-book-id')
    const params = Promise.resolve({ id: 'test-book-id' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('title')
    expect(data).toHaveProperty('author')
    expect(data).toHaveProperty('category')
    expect(data).toHaveProperty('description')
    expect(data).toHaveProperty('coverImage')
    expect(data).toHaveProperty('purchaseUrl')
    expect(data).toHaveProperty('published')
    expect(data).toHaveProperty('createdBy')
    expect(data).toHaveProperty('createdAt')
    expect(data).toHaveProperty('updatedAt')
  })
})
