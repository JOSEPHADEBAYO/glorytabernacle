/**
 * Property-Based Test: Cloudinary URL Storage
 * 
 * Feature: tracts-management-system, Property 26: Cloudinary URL Storage
 * 
 * **Validates: Requirements 10.5, 10.6, 11.5, 11.6**
 * 
 * Property 26: Cloudinary URL Storage
 * For any successful file upload (cover image or PDF), the upload endpoint SHALL return
 * a Cloudinary secure URL, and that URL SHALL be stored in the appropriate field
 * (coverImage or documentUrl) in the tract record.
 */

import { describe, beforeEach, vi, expect } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { POST as uploadPOST } from '@/app/api/upload/route'
import { POST as tractPOST } from '@/app/api/tracts/route'
import { TRACT_CATEGORIES } from '@/lib/types/tract'
import { NextRequest } from 'next/server'
import * as sessionModule from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

// Mock dependencies
vi.mock('@/lib/auth/session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tract: {
      create: vi.fn()
    }
  }
}))
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn()
    }
  }
}))

describe('Property 26: Cloudinary URL Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default authentication mocks
    vi.mocked(sessionModule.getSessionToken).mockReturnValue('valid-token')
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com'
    })
  })

  const createUploadRequest = (file: File): NextRequest => {
    const formData = new FormData()
    formData.append('file', file)
    
    return {
      formData: async () => formData,
    } as NextRequest
  }

  const createTractRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest
  }

  // Arbitrary for generating Cloudinary URLs
  const cloudinaryUrlArbitrary = fc.tuple(
    fc.stringMatching(/^[a-z0-9]+$/), // cloud name
    fc.stringMatching(/^[a-z0-9]+$/), // version
    fc.stringMatching(/^[a-z0-9-]+$/), // public id
    fc.constantFrom('jpg', 'png', 'pdf')
  ).map(([cloudName, version, publicId, ext]) => 
    `https://res.cloudinary.com/${cloudName}/image/upload/v${version}/${publicId}.${ext}`
  )

  describe('Cover Image URL Storage', () => {
    it.prop([
      fc.constantFrom('image/jpeg', 'image/png'),
      fc.integer({ min: 1, max: 5 * 1024 * 1024 }),
      cloudinaryUrlArbitrary,
      fc.string({ minLength: 1, maxLength: 50 })
    ], { numRuns: 100 })(
      'should return Cloudinary secure URL for cover image upload and store it in coverImage field',
      async (mimeType, fileSize, cloudinaryUrl, fileName) => {
        // Setup Cloudinary mock to return a secure URL
        const mockPublicId = `tracts/images/${fileName}`
        vi.mocked(cloudinary.uploader.upload_stream).mockImplementation((options: any, callback: any) => {
          const stream = {
            end: (buffer: Buffer) => {
              callback(null, {
                secure_url: cloudinaryUrl,
                public_id: mockPublicId
              })
            }
          }
          return stream as any
        })

        // 1. Upload cover image file
        const content = new Array(Math.min(fileSize, 1000)).fill('a').join('')
        const file = new File([content], `${fileName}.jpg`, { type: mimeType })
        Object.defineProperty(file, 'size', { value: fileSize })
        
        const uploadRequest = createUploadRequest(file)
        const uploadResponse = await uploadPOST(uploadRequest)
        
        // Verify upload returns Cloudinary URL
        expect(uploadResponse.status).toBe(200)
        const uploadData = await uploadResponse.json()
        expect(uploadData.url).toBeDefined()
        expect(uploadData.url).toBe(cloudinaryUrl)
        expect(uploadData.publicId).toBe(mockPublicId)
        
        // Verify URL is a valid Cloudinary secure URL format
        expect(uploadData.url).toMatch(/^https:\/\/res\.cloudinary\.com\//)

        // 2. Create tract with the returned Cloudinary URL
        const tractPayload = {
          title: `Test Tract ${fileName}`,
          category: TRACT_CATEGORIES[0],
          description: 'Test description for tract with cover image',
          coverImage: uploadData.url, // Use the Cloudinary URL from upload
          documentUrl: 'https://example.com/document.pdf',
          published: false
        }

        const mockCreatedTract = {
          id: `tract-${Math.random().toString(36).substring(7)}`,
          ...tractPayload,
          createdBy: 'test-user-id',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

        const tractRequest = createTractRequest(tractPayload)
        const tractResponse = await tractPOST(tractRequest)
        
        // Verify tract creation stores the Cloudinary URL in coverImage field
        expect(tractResponse.status).toBe(201)
        const createdTract = await tractResponse.json()
        expect(createdTract.coverImage).toBe(cloudinaryUrl)
        expect(createdTract.coverImage).toBe(uploadData.url)

        // Verify the Prisma create was called with the Cloudinary URL
        expect(prisma.tract.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              coverImage: cloudinaryUrl
            })
          })
        )

        return true
      }
    )
  })

  describe('PDF Document URL Storage', () => {
    it.prop([
      fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
      cloudinaryUrlArbitrary,
      fc.string({ minLength: 1, maxLength: 50 })
    ], { numRuns: 100 })(
      'should return Cloudinary secure URL for PDF upload and store it in documentUrl field',
      async (fileSize, cloudinaryUrl, fileName) => {
        // Setup Cloudinary mock to return a secure URL
        const mockPublicId = `tracts/documents/${fileName}`
        vi.mocked(cloudinary.uploader.upload_stream).mockImplementation((options: any, callback: any) => {
          const stream = {
            end: (buffer: Buffer) => {
              callback(null, {
                secure_url: cloudinaryUrl,
                public_id: mockPublicId
              })
            }
          }
          return stream as any
        })

        // 1. Upload PDF document file
        const content = new Array(Math.min(fileSize, 1000)).fill('a').join('')
        const file = new File([content], `${fileName}.pdf`, { type: 'application/pdf' })
        Object.defineProperty(file, 'size', { value: fileSize })
        
        const uploadRequest = createUploadRequest(file)
        const uploadResponse = await uploadPOST(uploadRequest)
        
        // Verify upload returns Cloudinary URL
        expect(uploadResponse.status).toBe(200)
        const uploadData = await uploadResponse.json()
        expect(uploadData.url).toBeDefined()
        expect(uploadData.url).toBe(cloudinaryUrl)
        expect(uploadData.publicId).toBe(mockPublicId)
        
        // Verify URL is a valid Cloudinary secure URL format
        expect(uploadData.url).toMatch(/^https:\/\/res\.cloudinary\.com\//)

        // 2. Create tract with the returned Cloudinary URL
        const tractPayload = {
          title: `Test Tract ${fileName}`,
          category: TRACT_CATEGORIES[0],
          description: 'Test description for tract with PDF document',
          coverImage: 'https://example.com/cover.jpg',
          documentUrl: uploadData.url, // Use the Cloudinary URL from upload
          published: false
        }

        const mockCreatedTract = {
          id: `tract-${Math.random().toString(36).substring(7)}`,
          ...tractPayload,
          createdBy: 'test-user-id',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

        const tractRequest = createTractRequest(tractPayload)
        const tractResponse = await tractPOST(tractRequest)
        
        // Verify tract creation stores the Cloudinary URL in documentUrl field
        expect(tractResponse.status).toBe(201)
        const createdTract = await tractResponse.json()
        expect(createdTract.documentUrl).toBe(cloudinaryUrl)
        expect(createdTract.documentUrl).toBe(uploadData.url)

        // Verify the Prisma create was called with the Cloudinary URL
        expect(prisma.tract.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              documentUrl: cloudinaryUrl
            })
          })
        )

        return true
      }
    )
  })

  describe('Complete Upload-to-Storage Flow', () => {
    it.prop([
      fc.record({
        coverImageType: fc.constantFrom('image/jpeg', 'image/png'),
        coverImageSize: fc.integer({ min: 1, max: 5 * 1024 * 1024 }),
        coverImageUrl: cloudinaryUrlArbitrary,
        pdfSize: fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
        pdfUrl: cloudinaryUrlArbitrary,
        title: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim()).filter(s => s.length > 0),
        category: fc.constantFrom(...TRACT_CATEGORIES),
        description: fc.string({ minLength: 10, maxLength: 1000 }).map(s => s.trim()).filter(s => s.length >= 10),
        published: fc.boolean()
      })
    ], { numRuns: 100 })(
      'should store both cover image and PDF Cloudinary URLs in appropriate fields',
      async (testData) => {
        // Setup Cloudinary mock for cover image upload
        vi.mocked(cloudinary.uploader.upload_stream).mockImplementationOnce((options: any, callback: any) => {
          const stream = {
            end: (buffer: Buffer) => {
              callback(null, {
                secure_url: testData.coverImageUrl,
                public_id: 'tracts/images/cover'
              })
            }
          }
          return stream as any
        })

        // 1. Upload cover image
        const coverContent = new Array(Math.min(testData.coverImageSize, 1000)).fill('a').join('')
        const coverFile = new File([coverContent], 'cover.jpg', { type: testData.coverImageType })
        Object.defineProperty(coverFile, 'size', { value: testData.coverImageSize })
        
        const coverUploadRequest = createUploadRequest(coverFile)
        const coverUploadResponse = await uploadPOST(coverUploadRequest)
        const coverUploadData = await coverUploadResponse.json()

        expect(coverUploadResponse.status).toBe(200)
        expect(coverUploadData.url).toBe(testData.coverImageUrl)

        // Setup Cloudinary mock for PDF upload
        vi.mocked(cloudinary.uploader.upload_stream).mockImplementationOnce((options: any, callback: any) => {
          const stream = {
            end: (buffer: Buffer) => {
              callback(null, {
                secure_url: testData.pdfUrl,
                public_id: 'tracts/documents/document'
              })
            }
          }
          return stream as any
        })

        // 2. Upload PDF document
        const pdfContent = new Array(Math.min(testData.pdfSize, 1000)).fill('a').join('')
        const pdfFile = new File([pdfContent], 'document.pdf', { type: 'application/pdf' })
        Object.defineProperty(pdfFile, 'size', { value: testData.pdfSize })
        
        const pdfUploadRequest = createUploadRequest(pdfFile)
        const pdfUploadResponse = await uploadPOST(pdfUploadRequest)
        const pdfUploadData = await pdfUploadResponse.json()

        expect(pdfUploadResponse.status).toBe(200)
        expect(pdfUploadData.url).toBe(testData.pdfUrl)

        // 3. Create tract with both Cloudinary URLs
        const tractPayload = {
          title: testData.title,
          category: testData.category,
          description: testData.description,
          coverImage: coverUploadData.url,
          documentUrl: pdfUploadData.url,
          published: testData.published
        }

        const mockCreatedTract = {
          id: `tract-${Math.random().toString(36).substring(7)}`,
          ...tractPayload,
          createdBy: 'test-user-id',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

        const tractRequest = createTractRequest(tractPayload)
        const tractResponse = await tractPOST(tractRequest)
        
        // Verify tract stores both Cloudinary URLs correctly
        expect(tractResponse.status).toBe(201)
        const createdTract = await tractResponse.json()
        
        expect(createdTract.coverImage).toBe(testData.coverImageUrl)
        expect(createdTract.documentUrl).toBe(testData.pdfUrl)
        
        // Verify both URLs are valid Cloudinary secure URLs
        expect(createdTract.coverImage).toMatch(/^https:\/\/res\.cloudinary\.com\//)
        expect(createdTract.documentUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//)

        // Verify the Prisma create was called with both Cloudinary URLs
        expect(prisma.tract.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              coverImage: testData.coverImageUrl,
              documentUrl: testData.pdfUrl
            })
          })
        )

        return true
      }
    )
  })

  describe('URL Format Validation', () => {
    it.prop([
      cloudinaryUrlArbitrary
    ], { numRuns: 100 })(
      'should accept valid Cloudinary secure URLs in tract creation',
      async (cloudinaryUrl) => {
        const tractPayload = {
          title: 'Test Tract',
          category: TRACT_CATEGORIES[0],
          description: 'Test description with valid Cloudinary URLs',
          coverImage: cloudinaryUrl,
          documentUrl: cloudinaryUrl,
          published: false
        }

        const mockCreatedTract = {
          id: `tract-${Math.random().toString(36).substring(7)}`,
          ...tractPayload,
          createdBy: 'test-user-id',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        vi.mocked(prisma.tract.create).mockResolvedValue(mockCreatedTract as any)

        const tractRequest = createTractRequest(tractPayload)
        const tractResponse = await tractPOST(tractRequest)
        
        // Verify tract creation accepts Cloudinary URLs
        expect(tractResponse.status).toBe(201)
        const createdTract = await tractResponse.json()
        
        expect(createdTract.coverImage).toBe(cloudinaryUrl)
        expect(createdTract.documentUrl).toBe(cloudinaryUrl)

        return true
      }
    )
  })
})
