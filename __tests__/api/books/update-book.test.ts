/**
 * Unit tests for PUT /api/books/[id] endpoint
 * 
 * Tests the book update functionality including:
 * - Successful updates with valid data
 * - Authentication enforcement
 * - Validation error handling
 * - Not found error handling
 * - Partial field updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/books/[id]/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    book: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}))

vi.mock('@/lib/auth/session', () => ({
  getSessionToken: vi.fn(),
  getSessionUser: vi.fn()
}))

describe('PUT /api/books/[id]', () => {
  const mockBookId = 'book-123'
  const mockToken = 'valid-session-token'
  const mockUser = {
    id: 'super-admin',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'SUPER_ADMIN'
  }

  const mockExistingBook = {
    id: mockBookId,
    title: 'Original Title',
    author: 'Original Author',
    category: 'Spiritual Growth',
    description: 'Original description',
    coverImage: 'https://example.com/original.jpg',
    purchaseUrl: 'https://example.com/buy-original',
    published: false,
    createdBy: 'super-admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update a book with valid data and return 200', async () => {
    // Arrange
    const updateData = {
      title: 'Updated Title',
      published: true
    }

    const updatedBook = {
      ...mockExistingBook,
      ...updateData,
      updatedAt: new Date('2024-01-02')
    }

    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockExistingBook)
    vi.mocked(prisma.book.update).mockResolvedValue(updatedBook)

    const request = createMockRequest(updateData)
    const params = Promise.resolve({ id: mockBookId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.title).toBe('Updated Title')
    expect(data.published).toBe(true)
    expect(prisma.book.findUnique).toHaveBeenCalledWith({
      where: { id: mockBookId }
    })
    expect(prisma.book.update).toHaveBeenCalledWith({
      where: { id: mockBookId },
      data: updateData
    })
  })

  it('should return 401 when session token is missing', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

    const request = createMockRequest({ title: 'Updated Title' })
    const params = Promise.resolve({ id: mockBookId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(prisma.book.findUnique).not.toHaveBeenCalled()
    expect(prisma.book.update).not.toHaveBeenCalled()
  })

  it('should return 401 when session user is invalid', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

    const request = createMockRequest({ title: 'Updated Title' })
    const params = Promise.resolve({ id: mockBookId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(prisma.book.findUnique).not.toHaveBeenCalled()
    expect(prisma.book.update).not.toHaveBeenCalled()
  })

  it('should return 404 when book does not exist', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(null)

    const request = createMockRequest({ title: 'Updated Title' })
    const params = Promise.resolve({ id: mockBookId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(404)
    expect(data.error).toBe('Book not found')
    expect(prisma.book.update).not.toHaveBeenCalled()
  })

  it('should return 400 when validation fails - invalid category', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)

    const request = createMockRequest({ category: 'Invalid Category' })
    const params = Promise.resolve({ id: mockBookId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeDefined()
    expect(prisma.book.findUnique).not.toHaveBeenCalled()
    expect(prisma.book.update).not.toHaveBeenCalled()
  })

  it('should return 400 when validation fails - invalid URL', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)

    const request = createMockRequest({ coverImage: 'not-a-valid-url' })
    const params = Promise.resolve({ id: mockBookId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeDefined()
    expect(prisma.book.findUnique).not.toHaveBeenCalled()
    expect(prisma.book.update).not.toHaveBeenCalled()
  })

  it('should return 400 when validation fails - empty update payload', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)

    const request = createMockRequest({})
    const params = Promise.resolve({ id: mockBookId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeDefined()
    expect(prisma.book.findUnique).not.toHaveBeenCalled()
    expect(prisma.book.update).not.toHaveBeenCalled()
  })

  it('should update only specified fields - partial update', async () => {
    // Arrange
    const updateData = {
      published: true
    }

    const updatedBook = {
      ...mockExistingBook,
      published: true,
      updatedAt: new Date('2024-01-02')
    }

    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockExistingBook)
    vi.mocked(prisma.book.update).mockResolvedValue(updatedBook)

    const request = createMockRequest(updateData)
    const params = Promise.resolve({ id: mockBookId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.published).toBe(true)
    expect(data.title).toBe('Original Title') // Unchanged
    expect(data.author).toBe('Original Author') // Unchanged
    expect(prisma.book.update).toHaveBeenCalledWith({
      where: { id: mockBookId },
      data: updateData
    })
  })

  it('should handle database errors with 500 status', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockExistingBook)
    vi.mocked(prisma.book.update).mockRejectedValue(new Error('Database connection failed'))

    const request = createMockRequest({ title: 'Updated Title' })
    const params = Promise.resolve({ id: mockBookId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('should accept empty string for optional purchaseUrl', async () => {
    // Arrange
    const updateData = {
      purchaseUrl: ''
    }

    const updatedBook = {
      ...mockExistingBook,
      purchaseUrl: null,
      updatedAt: new Date('2024-01-02')
    }

    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockExistingBook)
    vi.mocked(prisma.book.update).mockResolvedValue(updatedBook)

    const request = createMockRequest(updateData)
    const params = Promise.resolve({ id: mockBookId })

    // Act
    const response = await PUT(request, { params })

    // Assert
    expect(response.status).toBe(200)
    expect(prisma.book.update).toHaveBeenCalledWith({
      where: { id: mockBookId },
      data: updateData
    })
  })

  it('should update multiple fields at once', async () => {
    // Arrange
    const updateData = {
      title: 'Updated Title',
      author: 'Updated Author',
      category: 'Prayer & Intercession' as const,
      description: 'Updated description',
      coverImage: 'https://example.com/updated.jpg',
      purchaseUrl: 'https://example.com/buy-updated',
      published: true
    }

    const updatedBook = {
      ...mockExistingBook,
      ...updateData,
      updatedAt: new Date('2024-01-02')
    }

    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockExistingBook)
    vi.mocked(prisma.book.update).mockResolvedValue(updatedBook)

    const request = createMockRequest(updateData)
    const params = Promise.resolve({ id: mockBookId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.title).toBe('Updated Title')
    expect(data.author).toBe('Updated Author')
    expect(data.category).toBe('Prayer & Intercession')
    expect(data.description).toBe('Updated description')
    expect(data.coverImage).toBe('https://example.com/updated.jpg')
    expect(data.purchaseUrl).toBe('https://example.com/buy-updated')
    expect(data.published).toBe(true)
  })
})
