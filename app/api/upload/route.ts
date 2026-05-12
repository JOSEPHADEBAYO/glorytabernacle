import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const sessionToken = await getSessionToken()
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from session token
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    // Optional caller-supplied folder override (e.g. 'gallery'); falls back to defaults.
    const folderOverrideRaw = formData.get('folder')
    const folderOverride =
      typeof folderOverrideRaw === 'string' && folderOverrideRaw.trim().length > 0
        ? folderOverrideRaw.trim()
        : null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type and size
    const validImageTypes = ['image/jpeg', 'image/png']
    const validPdfTypes = ['application/pdf']
    const isImage = validImageTypes.includes(file.type)
    const isPdf = validPdfTypes.includes(file.type)

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and PDF files are allowed.' },
        { status: 400 }
      )
    }

    // Check file size limits
    const maxImageSize = 5 * 1024 * 1024 // 5MB
    const maxPdfSize = 10 * 1024 * 1024 // 10MB
    const maxSize = isImage ? maxImageSize : maxPdfSize

    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: `File too large. Maximum size is ${isImage ? '5MB' : '10MB'}.` 
        },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const targetFolder =
      folderOverride ?? (isPdf ? 'tracts/documents' : 'tracts/images')

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: targetFolder,
          resource_type: isPdf ? 'raw' : 'image',
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      uploadStream.end(buffer)
    })

    const uploadResult = result as {
      secure_url: string
      public_id: string
      original_filename?: string
      format?: string
      bytes?: number
      width?: number
      height?: number
    }

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      filename: uploadResult.original_filename,
      format: uploadResult.format,
      size: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
