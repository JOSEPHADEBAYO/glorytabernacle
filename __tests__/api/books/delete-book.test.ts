import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE } from '@/app/api/books/[id]/route'
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
      delete: vi.fn(),
    },
  },
}))

describe('DELETE /api/books/[id]', () => {
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

    const request = new NextRequest('http://localhost:3000/api/books/test-id', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'test-id' })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(prisma.book.delete).not.toHaveBeenCalled()
  })

  it('returns 401 if session user is invalid', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/books/test-id', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'test-id' })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(prisma.book.delete).not.toHaveBeenCalled()
  })

  it('returns 404 if book is not found', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/books/non-existent-id', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'non-existent-id' })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Book not found')
    expect(prisma.book.findUnique).toHaveBeenCalledWith({
      where: { id: 'non-existent-id' },
    })
    expect(prisma.book.delete).not.toHaveBeenCalled()
  })

  it('deletes book and returns 200 with success message', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook)
    vi.mocked(prisma.book.delete).mockResolvedValue(mockBook)

    const request = new NextRequest('http://localhost:3000/api/books/test-book-id', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'test-book-id' })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Book deleted successfully')
    expect(prisma.book.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-book-id' },
    })
    expect(prisma.book.delete).toHaveBeenCalledWith({
      where: { id: 'test-book-id' },
    })
  })

  it('returns 500 on database error during findUnique', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockRejectedValue(new Error('Database connection error'))

    const request = new NextRequest('http://localhost:3000/api/books/test-id', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'test-id' })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
    expect(prisma.book.delete).not.toHaveBeenCalled()
  })

  it('returns 500 on database error during delete', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook)
    vi.mocked(prisma.book.delete).mockRejectedValue(new Error('Delete operation failed'))

    const request = new NextRequest('http://localhost:3000/api/books/test-book-id', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'test-book-id' })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('extracts book ID from route params correctly', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook)
    vi.mocked(prisma.book.delete).mockResolvedValue(mockBook)

    const request = new NextRequest('http://localhost:3000/api/books/custom-book-id-456', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'custom-book-id-456' })

    await DELETE(request, { params })

    expect(prisma.book.findUnique).toHaveBeenCalledWith({
      where: { id: 'custom-book-id-456' },
    })
    expect(prisma.book.delete).toHaveBeenCalledWith({
      where: { id: 'custom-book-id-456' },
    })
  })

  it('checks book existence before attempting deletion', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook)
    vi.mocked(prisma.book.delete).mockResolvedValue(mockBook)

    const request = new NextRequest('http://localhost:3000/api/books/test-book-id', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'test-book-id' })

    await DELETE(request, { params })

    // Verify findUnique is called before delete
    const findUniqueCall = vi.mocked(prisma.book.findUnique).mock.invocationCallOrder[0]
    const deleteCall = vi.mocked(prisma.book.delete).mock.invocationCallOrder[0]
    expect(findUniqueCall).toBeLessThan(deleteCall)
  })

  it('validates session token before processing deletion', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook)
    vi.mocked(prisma.book.delete).mockResolvedValue(mockBook)

    const request = new NextRequest('http://localhost:3000/api/books/test-book-id', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'test-book-id' })

    await DELETE(request, { params })

    expect(sessionModule.getSessionToken).toHaveBeenCalled()
    expect(sessionModule.getSessionUser).toHaveBeenCalledWith('valid-token')
  })

  it('returns success message in correct format', async () => {
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook)
    vi.mocked(prisma.book.delete).mockResolvedValue(mockBook)

    const request = new NextRequest('http://localhost:3000/api/books/test-book-id', {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: 'test-book-id' })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(data).toHaveProperty('message')
    expect(data.message).toBe('Book deleted successfully')
    expect(data).not.toHaveProperty('error')
  })
})
