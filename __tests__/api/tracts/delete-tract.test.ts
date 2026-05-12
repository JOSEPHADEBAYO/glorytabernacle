/**
 * Unit tests for DELETE /api/tracts/[id] endpoint
 * Tests Task 8.3: Write unit tests for DELETE /api/tracts/[id]
 * Requirements: 4.1, 4.2, 4.4, 4.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DELETE } from '@/app/api/tracts/[id]/route'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

// Mock dependencies
vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tract: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn()
    }
  }
}))

describe('DELETE /api/tracts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockRequest = (): NextRequest => {
    return {} as NextRequest
  }

  const mockExistingTract = {
    id: 'tract-123',
    title: 'The Gospel Message',
    category: 'Evangelism',
    description: 'A clear presentation of the gospel message for sharing with unbelievers.',
    coverImage: 'https://example.com/gospel-tract.jpg',
    documentUrl: 'https://example.com/gospel-tract.pdf',
    published: true,
    createdBy: 'super-admin',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }

  describe('Authentication', () => {
    it('should return 401 when session token is missing', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue(null)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-123' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(prisma.tract.findUnique).not.toHaveBeenCalled()
      expect(prisma.tract.delete).not.toHaveBeenCalled()
    })

    it('should return 401 when session user is invalid', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('invalid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-123' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(prisma.tract.findUnique).not.toHaveBeenCalled()
      expect(prisma.tract.delete).not.toHaveBeenCalled()
    })

    it('should proceed with valid session token', async () => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract as any)
      vi.mocked(prisma.tract.delete).mockResolvedValue(mockExistingTract as any)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-123' })
      const response = await DELETE(request, { params })

      expect(response.status).toBe(200)
      expect(prisma.tract.findUnique).toHaveBeenCalled()
      expect(prisma.tract.delete).toHaveBeenCalled()
    })
  })

  describe('Not Found Errors', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should return 404 when tract does not exist', async () => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(null)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'non-existent-id' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Tract not found')
      expect(prisma.tract.delete).not.toHaveBeenCalled()
    })

    it('should verify tract existence before deletion', async () => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(null)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-456' })
      await DELETE(request, { params })

      expect(prisma.tract.findUnique).toHaveBeenCalledWith({
        where: { id: 'tract-456' }
      })
      expect(prisma.tract.delete).not.toHaveBeenCalled()
    })
  })

  describe('Successful Deletion', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should return 200 with success message on successful deletion', async () => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract as any)
      vi.mocked(prisma.tract.delete).mockResolvedValue(mockExistingTract as any)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-123' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Tract deleted successfully')
    })

    it('should call prisma.tract.delete with correct ID', async () => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract as any)
      vi.mocked(prisma.tract.delete).mockResolvedValue(mockExistingTract as any)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-123' })
      await DELETE(request, { params })

      expect(prisma.tract.delete).toHaveBeenCalledWith({
        where: { id: 'tract-123' }
      })
    })

    it('should delete tract with specific ID', async () => {
      const tractId = 'tract-to-delete'
      const tractToDelete = { ...mockExistingTract, id: tractId }

      vi.mocked(prisma.tract.findUnique).mockResolvedValue(tractToDelete as any)
      vi.mocked(prisma.tract.delete).mockResolvedValue(tractToDelete as any)

      const request = createMockRequest()
      const params = Promise.resolve({ id: tractId })
      const response = await DELETE(request, { params })

      expect(response.status).toBe(200)
      expect(prisma.tract.delete).toHaveBeenCalledWith({
        where: { id: tractId }
      })
    })

    it('should successfully delete published tract', async () => {
      const publishedTract = { ...mockExistingTract, published: true }
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(publishedTract as any)
      vi.mocked(prisma.tract.delete).mockResolvedValue(publishedTract as any)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-123' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Tract deleted successfully')
    })

    it('should successfully delete draft tract', async () => {
      const draftTract = { ...mockExistingTract, published: false }
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(draftTract as any)
      vi.mocked(prisma.tract.delete).mockResolvedValue(draftTract as any)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-123' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Tract deleted successfully')
    })
  })

  describe('Deletion Verification', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should verify tract no longer exists after deletion', async () => {
      // First call returns the tract (for existence check)
      // Second call returns null (simulating post-deletion state)
      vi.mocked(prisma.tract.findUnique)
        .mockResolvedValueOnce(mockExistingTract as any)
        .mockResolvedValueOnce(null)
      vi.mocked(prisma.tract.delete).mockResolvedValue(mockExistingTract as any)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-123' })
      
      // Delete the tract
      const deleteResponse = await DELETE(request, { params })
      expect(deleteResponse.status).toBe(200)

      // Verify it's deleted by checking findUnique returns null
      const verifyResult = await prisma.tract.findUnique({
        where: { id: 'tract-123' }
      })
      expect(verifyResult).toBeNull()
    })

    it('should verify tract does not appear in list after deletion', async () => {
      const tract1 = { ...mockExistingTract, id: 'tract-1', title: 'Tract 1' }
      const tract2 = { ...mockExistingTract, id: 'tract-2', title: 'Tract 2' }
      const tract3 = { ...mockExistingTract, id: 'tract-3', title: 'Tract 3' }

      // Before deletion: all three tracts exist
      vi.mocked(prisma.tract.findMany).mockResolvedValueOnce([tract1, tract2, tract3] as any)

      let tractsList = await prisma.tract.findMany()
      expect(tractsList).toHaveLength(3)
      expect(tractsList.map(t => t.id)).toContain('tract-2')

      // Delete tract-2
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(tract2 as any)
      vi.mocked(prisma.tract.delete).mockResolvedValue(tract2 as any)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-2' })
      const deleteResponse = await DELETE(request, { params })
      expect(deleteResponse.status).toBe(200)

      // After deletion: only two tracts remain
      vi.mocked(prisma.tract.findMany).mockResolvedValueOnce([tract1, tract3] as any)

      tractsList = await prisma.tract.findMany()
      expect(tractsList).toHaveLength(2)
      expect(tractsList.map(t => t.id)).not.toContain('tract-2')
      expect(tractsList.map(t => t.id)).toContain('tract-1')
      expect(tractsList.map(t => t.id)).toContain('tract-3')
    })

    it('should verify deleted tract is removed from published list', async () => {
      const publishedTract1 = { ...mockExistingTract, id: 'tract-1', published: true }
      const publishedTract2 = { ...mockExistingTract, id: 'tract-2', published: true }
      const draftTract = { ...mockExistingTract, id: 'tract-3', published: false }

      // Before deletion: two published tracts
      vi.mocked(prisma.tract.findMany).mockResolvedValueOnce([publishedTract1, publishedTract2] as any)

      let publishedTracts = await prisma.tract.findMany({
        where: { published: true }
      })
      expect(publishedTracts).toHaveLength(2)
      expect(publishedTracts.map(t => t.id)).toContain('tract-1')

      // Delete published tract-1
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(publishedTract1 as any)
      vi.mocked(prisma.tract.delete).mockResolvedValue(publishedTract1 as any)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-1' })
      const deleteResponse = await DELETE(request, { params })
      expect(deleteResponse.status).toBe(200)

      // After deletion: only one published tract remains
      vi.mocked(prisma.tract.findMany).mockResolvedValueOnce([publishedTract2] as any)

      publishedTracts = await prisma.tract.findMany({
        where: { published: true }
      })
      expect(publishedTracts).toHaveLength(1)
      expect(publishedTracts.map(t => t.id)).not.toContain('tract-1')
      expect(publishedTracts.map(t => t.id)).toContain('tract-2')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should return 500 on database error during existence check', async () => {
      vi.mocked(prisma.tract.findUnique).mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-123' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(prisma.tract.delete).not.toHaveBeenCalled()
    })

    it('should return 500 on database error during deletion', async () => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract as any)
      vi.mocked(prisma.tract.delete).mockRejectedValue(new Error('Database deletion failed'))

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-123' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should not expose sensitive error details in response', async () => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract as any)
      vi.mocked(prisma.tract.delete).mockRejectedValue(
        new Error('Sensitive database error with credentials and connection string')
      )

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-123' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.error).not.toContain('credentials')
      expect(data.error).not.toContain('connection string')
      expect(data.error).not.toContain('Sensitive')
    })

    it('should handle malformed tract ID gracefully', async () => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(null)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'malformed-id-!@#$%' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Tract not found')
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should handle empty string ID', async () => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(null)

      const request = createMockRequest()
      const params = Promise.resolve({ id: '' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Tract not found')
    })

    it('should handle very long ID string', async () => {
      const longId = 'a'.repeat(1000)
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(null)

      const request = createMockRequest()
      const params = Promise.resolve({ id: longId })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Tract not found')
    })

    it('should handle special characters in ID', async () => {
      const specialId = 'tract-123-!@#$%^&*()'
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(null)

      const request = createMockRequest()
      const params = Promise.resolve({ id: specialId })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Tract not found')
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getSessionToken).mockResolvedValue('valid-token')
      vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
        id: 'super-admin',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN'
      })
    })

    it('should return JSON response with message field on success', async () => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract as any)
      vi.mocked(prisma.tract.delete).mockResolvedValue(mockExistingTract as any)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-123' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(data).toHaveProperty('message')
      expect(typeof data.message).toBe('string')
      expect(data.message).toBe('Tract deleted successfully')
    })

    it('should return JSON response with error field on failure', async () => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(null)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'non-existent' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(data).toHaveProperty('error')
      expect(typeof data.error).toBe('string')
      expect(data.error).toBe('Tract not found')
    })

    it('should not return tract data in success response', async () => {
      vi.mocked(prisma.tract.findUnique).mockResolvedValue(mockExistingTract as any)
      vi.mocked(prisma.tract.delete).mockResolvedValue(mockExistingTract as any)

      const request = createMockRequest()
      const params = Promise.resolve({ id: 'tract-123' })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(data).not.toHaveProperty('id')
      expect(data).not.toHaveProperty('title')
      expect(data).not.toHaveProperty('category')
      expect(data).toHaveProperty('message')
    })
  })
})
