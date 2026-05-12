/**
 * Unit Tests: File Upload Endpoint
 * 
 * Tests the /api/upload endpoint for both image and PDF uploads
 * with appropriate validation for file types and sizes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/upload/route'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { v2 as cloudinary } from 'cloudinary'

// Mock dependencies
vi.mock('@/lib/auth/session')
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn()
    }
  }
}))

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default authentication mock
    vi.mocked(sessionModule.getSessionToken).mockReturnValue('valid-token')
  })

  const createMockRequest = (file: File | null): NextRequest => {
    const formData = new FormData()
    if (file) {
      formData.append('file', file)
    }
    
    return {
      formData: async () => formData,
    } as NextRequest
  }

  const mockCloudinaryUpload = (success: boolean = true) => {
    vi.mocked(cloudinary.uploader.upload_stream).mockImplementation((options: any, callback: any) => {
      const stream = {
        end: (buffer: Buffer) => {
          if (success) {
            callback(null, {
              secure_url: 'https://res.cloudinary.com/test/image/upload/v1234567890/test.jpg',
              public_id: 'test/test-file'
            })
          } else {
            callback(new Error('Upload failed'), null)
          }
        }
      }
      return stream as any
    })
  }

  describe('Authentication', () => {
    it('should return 401 when session token is missing', async () => {
      vi.mocked(sessionModule.getSessionToken).mockReturnValue(null)
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const request = createMockRequest(file)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('File Validation', () => {
    it('should return 400 when no file is provided', async () => {
      const request = createMockRequest(null)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('No file provided')
    })

    it('should accept JPG images', async () => {
      mockCloudinaryUpload(true)
      
      const file = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' })
      const request = createMockRequest(file)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.url).toBeDefined()
      expect(data.publicId).toBeDefined()
    })

    it('should accept PNG images', async () => {
      mockCloudinaryUpload(true)
      
      const file = new File(['test image content'], 'test.png', { type: 'image/png' })
      const request = createMockRequest(file)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.url).toBeDefined()
      expect(data.publicId).toBeDefined()
    })

    it('should accept PDF files', async () => {
      mockCloudinaryUpload(true)
      
      const file = new File(['test pdf content'], 'test.pdf', { type: 'application/pdf' })
      const request = createMockRequest(file)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.url).toBeDefined()
      expect(data.publicId).toBeDefined()
    })

    it('should reject invalid file types', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const request = createMockRequest(file)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid file type. Only JPG, PNG, and PDF files are allowed.')
    })

    it('should reject images larger than 5MB', async () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('')
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
      
      // Override size property
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 })
      
      const request = createMockRequest(file)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('File too large. Maximum size is 5MB.')
    })

    it('should reject PDFs larger than 10MB', async () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('')
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' })
      
      // Override size property
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 })
      
      const request = createMockRequest(file)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('File too large. Maximum size is 10MB.')
    })

    it('should accept images up to 5MB', async () => {
      mockCloudinaryUpload(true)
      
      const content = new Array(5 * 1024 * 1024).fill('a').join('')
      const file = new File([content], 'max-size.jpg', { type: 'image/jpeg' })
      
      // Override size property
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })
      
      const request = createMockRequest(file)
      
      const response = await POST(request)
      
      expect(response.status).toBe(200)
    })

    it('should accept PDFs up to 10MB', async () => {
      mockCloudinaryUpload(true)
      
      const content = new Array(10 * 1024 * 1024).fill('a').join('')
      const file = new File([content], 'max-size.pdf', { type: 'application/pdf' })
      
      // Override size property
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 })
      
      const request = createMockRequest(file)
      
      const response = await POST(request)
      
      expect(response.status).toBe(200)
    })
  })

  describe('Cloudinary Integration', () => {
    it('should upload images to tracts/images folder', async () => {
      mockCloudinaryUpload(true)
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const request = createMockRequest(file)
      
      await POST(request)
      
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'tracts/images',
          resource_type: 'image'
        }),
        expect.any(Function)
      )
    })

    it('should upload PDFs to tracts/documents folder', async () => {
      mockCloudinaryUpload(true)
      
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const request = createMockRequest(file)
      
      await POST(request)
      
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'tracts/documents',
          resource_type: 'raw'
        }),
        expect.any(Function)
      )
    })

    it('should return secure URL and public ID on success', async () => {
      mockCloudinaryUpload(true)
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const request = createMockRequest(file)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.url).toBe('https://res.cloudinary.com/test/image/upload/v1234567890/test.jpg')
      expect(data.publicId).toBe('test/test-file')
    })

    it('should return 500 when Cloudinary upload fails', async () => {
      mockCloudinaryUpload(false)
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const request = createMockRequest(file)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload file')
    })
  })
})
