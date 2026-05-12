/**
 * Unit tests for PUT /api/tracts/[id] endpoint
 * 
 * Tests the tract update functionality including:
 * - Successful updates with valid data (all fields)
 * - Partial updates (only some fields)
 * - Authentication enforcement
 * - Validation error handling
 * - Not found error handling
 * - Preservation of createdAt and createdBy fields
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.7, 3.8, 3.9
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/tracts/[id]/route'
import { prisma } from '@/lib/prisma'
import * as sessionModule from '@/lib/auth/session'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tract: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}))

vi.mock('@/lib/auth/session', () => ({
  getSessionToken: vi.fn(),
  getSessionUser: vi.fn()
}))

describe('PUT /api/tracts/[id]', () => {
  const mockTractId = 'tract-123'
  const mockToken = 'valid-session-token'
  const mockUser = {
    id: 'super-admin',
    email: 'admin@example.com'
  }

  const mockExistingTract = {
    id: mockTractId,
    title: 'Original Tract Title',
    category: 'Evangelism',
    description: 'Original tract description with sufficient length',
    coverImage: 'https://example.com/original-cover.jpg',
    documentUrl: 'https://example.com/original-document.pdf',
    published: false,
    createdBy: 'super-admin',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  }

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Test: Successful update of all fields
   * Validates: Requirements 3.1, 3.2, 3.5
   */
  it('should update all fields with valid data and return 200', async () => {
    // Arrange
    const updateData = {
      title: 'Updated Tract Title',
      category: 'Theology' as const,
      description: 'Updated tract description with sufficient length for validation',
      coverImage: 'https://example.com/updated-cover.jpg',
      documentUrl: 'https://example.com/updated-document.pdf',
      published: true
    }

    const updatedTract = {
      ...mockExistingTract,
      ...updateData,
      updatedAt: new Date('2024-01-02T00:00:00.000Z')
    }

    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract)
    vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract)

    const request = createMockRequest(updateData)
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.title).toBe('Updated Tract Title')
    expect(data.category).toBe('Theology')
    expect(data.description).toBe('Updated tract description with sufficient length for validation')
    expect(data.coverImage).toBe('https://example.com/updated-cover.jpg')
    expect(data.documentUrl).toBe('https://example.com/updated-document.pdf')
    expect(data.published).toBe(true)
    expect(prisma.tract.findUnique).toHaveBeenCalledWith({
      where: { id: mockTractId }
    })
    expect(prisma.tract.update).toHaveBeenCalledWith({
      where: { id: mockTractId },
      data: updateData
    })
  })

  /**
   * Test: Partial update (only some fields)
   * Validates: Requirements 3.2, 3.8
   */
  it('should update only specified fields - partial update with title only', async () => {
    // Arrange
    const updateData = {
      title: 'Updated Title Only'
    }

    const updatedTract = {
      ...mockExistingTract,
      title: 'Updated Title Only',
      updatedAt: new Date('2024-01-02T00:00:00.000Z')
    }

    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract)
    vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract)

    const request = createMockRequest(updateData)
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.title).toBe('Updated Title Only')
    expect(data.category).toBe('Evangelism') // Unchanged
    expect(data.description).toBe('Original tract description with sufficient length') // Unchanged
    expect(data.coverImage).toBe('https://example.com/original-cover.jpg') // Unchanged
    expect(data.documentUrl).toBe('https://example.com/original-document.pdf') // Unchanged
    expect(data.published).toBe(false) // Unchanged
    expect(prisma.tract.update).toHaveBeenCalledWith({
      where: { id: mockTractId },
      data: updateData
    })
  })

  /**
   * Test: Partial update (published status only)
   * Validates: Requirements 3.2, 3.8
   */
  it('should update only published status - partial update', async () => {
    // Arrange
    const updateData = {
      published: true
    }

    const updatedTract = {
      ...mockExistingTract,
      published: true,
      updatedAt: new Date('2024-01-02T00:00:00.000Z')
    }

    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract)
    vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract)

    const request = createMockRequest(updateData)
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.published).toBe(true)
    expect(data.title).toBe('Original Tract Title') // Unchanged
    expect(prisma.tract.update).toHaveBeenCalledWith({
      where: { id: mockTractId },
      data: updateData
    })
  })

  /**
   * Test: Validation error - invalid category
   * Validates: Requirements 3.4, 3.7
   */
  it('should return 400 when validation fails - invalid category', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)

    const request = createMockRequest({ category: 'Invalid Category' })
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeDefined()
    expect(Array.isArray(data.details)).toBe(true)
    expect(prisma.tract.findUnique).not.toHaveBeenCalled()
    expect(prisma.tract.update).not.toHaveBeenCalled()
  })

  /**
   * Test: Validation error - invalid coverImage URL
   * Validates: Requirements 3.4, 3.7
   */
  it('should return 400 when validation fails - invalid coverImage URL', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)

    const request = createMockRequest({ coverImage: 'not-a-valid-url' })
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeDefined()
    expect(Array.isArray(data.details)).toBe(true)
    expect(prisma.tract.findUnique).not.toHaveBeenCalled()
    expect(prisma.tract.update).not.toHaveBeenCalled()
  })

  /**
   * Test: Validation error - invalid documentUrl URL
   * Validates: Requirements 3.4, 3.7
   */
  it('should return 400 when validation fails - invalid documentUrl URL', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)

    const request = createMockRequest({ documentUrl: 'invalid-url' })
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeDefined()
    expect(Array.isArray(data.details)).toBe(true)
    expect(prisma.tract.findUnique).not.toHaveBeenCalled()
    expect(prisma.tract.update).not.toHaveBeenCalled()
  })

  /**
   * Test: Validation error - title too short
   * Validates: Requirements 3.4, 3.7
   */
  it('should return 400 when validation fails - title too short', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)

    const request = createMockRequest({ title: '' })
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeDefined()
    expect(prisma.tract.findUnique).not.toHaveBeenCalled()
    expect(prisma.tract.update).not.toHaveBeenCalled()
  })

  /**
   * Test: Validation error - title too long
   * Validates: Requirements 3.4, 3.7
   */
  it('should return 400 when validation fails - title too long', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)

    const longTitle = 'a'.repeat(201) // 201 characters, exceeds max of 200

    const request = createMockRequest({ title: longTitle })
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeDefined()
    expect(prisma.tract.findUnique).not.toHaveBeenCalled()
    expect(prisma.tract.update).not.toHaveBeenCalled()
  })

  /**
   * Test: Validation error - description too short
   * Validates: Requirements 3.4, 3.7
   */
  it('should return 400 when validation fails - description too short', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)

    const request = createMockRequest({ description: 'short' }) // Less than 10 characters
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeDefined()
    expect(prisma.tract.findUnique).not.toHaveBeenCalled()
    expect(prisma.tract.update).not.toHaveBeenCalled()
  })

  /**
   * Test: Validation error - description too long
   * Validates: Requirements 3.4, 3.7
   */
  it('should return 400 when validation fails - description too long', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)

    const longDescription = 'a'.repeat(1001) // 1001 characters, exceeds max of 1000

    const request = createMockRequest({ description: longDescription })
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeDefined()
    expect(prisma.tract.findUnique).not.toHaveBeenCalled()
    expect(prisma.tract.update).not.toHaveBeenCalled()
  })

  /**
   * Test: Validation error - empty update payload
   * Validates: Requirements 3.4, 3.7
   */
  it('should return 400 when validation fails - empty update payload', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)

    const request = createMockRequest({})
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeDefined()
    expect(prisma.tract.findUnique).not.toHaveBeenCalled()
    expect(prisma.tract.update).not.toHaveBeenCalled()
  })

  /**
   * Test: 404 response for non-existent tract ID
   * Validates: Requirements 3.3, 3.6
   */
  it('should return 404 when tract does not exist', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.tract.findUnique).mockResolvedValue(null)

    const request = createMockRequest({ title: 'Updated Title' })
    const params = Promise.resolve({ id: 'non-existent-id' })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(404)
    expect(data.error).toBe('Tract not found')
    expect(prisma.tract.update).not.toHaveBeenCalled()
  })

  /**
   * Test: Authentication - missing session token
   * Validates: Requirement 7.2
   */
  it('should return 401 when session token is missing', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

    const request = createMockRequest({ title: 'Updated Title' })
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(prisma.tract.findUnique).not.toHaveBeenCalled()
    expect(prisma.tract.update).not.toHaveBeenCalled()
  })

  /**
   * Test: Authentication - invalid session user
   * Validates: Requirement 7.2
   */
  it('should return 401 when session user is invalid', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

    const request = createMockRequest({ title: 'Updated Title' })
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(prisma.tract.findUnique).not.toHaveBeenCalled()
    expect(prisma.tract.update).not.toHaveBeenCalled()
  })

  /**
   * Test: Preservation of createdAt field
   * Validates: Requirements 3.8, 3.9
   */
  it('should preserve createdAt timestamp when updating', async () => {
    // Arrange
    const originalCreatedAt = new Date('2024-01-01T00:00:00.000Z')
    const updateData = {
      title: 'Updated Title'
    }

    const updatedTract = {
      ...mockExistingTract,
      title: 'Updated Title',
      createdAt: originalCreatedAt, // Should remain unchanged
      updatedAt: new Date('2024-01-02T00:00:00.000Z')
    }

    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract)
    vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract)

    const request = createMockRequest(updateData)
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.createdAt).toEqual(originalCreatedAt.toISOString())
    expect(prisma.tract.update).toHaveBeenCalledWith({
      where: { id: mockTractId },
      data: updateData // Should not include createdAt
    })
  })

  /**
   * Test: Preservation of createdBy field
   * Validates: Requirements 3.8, 3.9
   */
  it('should preserve createdBy field when updating', async () => {
    // Arrange
    const originalCreatedBy = 'super-admin'
    const updateData = {
      title: 'Updated Title'
    }

    const updatedTract = {
      ...mockExistingTract,
      title: 'Updated Title',
      createdBy: originalCreatedBy, // Should remain unchanged
      updatedAt: new Date('2024-01-02T00:00:00.000Z')
    }

    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract)
    vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract)

    const request = createMockRequest(updateData)
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.createdBy).toBe(originalCreatedBy)
    expect(prisma.tract.update).toHaveBeenCalledWith({
      where: { id: mockTractId },
      data: updateData // Should not include createdBy
    })
  })

  /**
   * Test: Database error handling
   * Validates: Requirement 13.5
   */
  it('should handle database errors with 500 status', async () => {
    // Arrange
    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract)
    vi.mocked(prisma.tract.update).mockRejectedValue(new Error('Database connection failed'))

    const request = createMockRequest({ title: 'Updated Title' })
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  /**
   * Test: Update multiple fields at once
   * Validates: Requirements 3.1, 3.2
   */
  it('should update multiple fields at once', async () => {
    // Arrange
    const updateData = {
      title: 'Completely Updated Title',
      category: 'Discipleship' as const,
      description: 'Completely updated description with sufficient length for validation',
      coverImage: 'https://example.com/new-cover.jpg',
      documentUrl: 'https://example.com/new-document.pdf',
      published: true
    }

    const updatedTract = {
      ...mockExistingTract,
      ...updateData,
      updatedAt: new Date('2024-01-02T00:00:00.000Z')
    }

    vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract)
    vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract)

    const request = createMockRequest(updateData)
    const params = Promise.resolve({ id: mockTractId })

    // Act
    const response = await PUT(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.title).toBe('Completely Updated Title')
    expect(data.category).toBe('Discipleship')
    expect(data.description).toBe('Completely updated description with sufficient length for validation')
    expect(data.coverImage).toBe('https://example.com/new-cover.jpg')
    expect(data.documentUrl).toBe('https://example.com/new-document.pdf')
    expect(data.published).toBe(true)
  })

  /**
   * Test: Update with all valid tract categories
   * Validates: Requirements 3.2, 3.4
   */
  it('should accept all valid tract categories', async () => {
    // Test each valid category
    const validCategories = [
      'Theology',
      'Evangelism',
      'Discipleship',
      'Prayer & Intercession',
      'Christian Living',
      'Salvation',
      'Faith & Doctrine',
      'End Times',
      'Other'
    ] as const

    for (const category of validCategories) {
      vi.clearAllMocks()

      const updateData = { category }
      const updatedTract = {
        ...mockExistingTract,
        category,
        updatedAt: new Date('2024-01-02T00:00:00.000Z')
      }

      vi.mocked(sessionModule.getSessionToken).mockResolvedValue(mockToken)
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(mockUser)
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract)
      vi.mocked(prisma.tract.update).mockResolvedValue(updatedTract)

      const request = createMockRequest(updateData)
      const params = Promise.resolve({ id: mockTractId })

      // Act
      const response = await PUT(request, { params })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.category).toBe(category)
    }
  })
})
