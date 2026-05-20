import { NextRequest, NextResponse } from 'next/server'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  cloudinary,
  isProtectedFolder,
  signedChildImageUrl,
} from '@/lib/cloudinary'

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

    // Validate file type and size. We accept the formats mobile cameras /
    // galleries actually produce (including iPhone HEIC). When the browser
    // reports an empty MIME type — common for iOS HEIC — we fall back to
    // the filename extension. Cloudinary normalises HEIC/WEBP on upload.
    const validImageTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ]
    const validPdfTypes = ['application/pdf']
    const imageExtensions = /\.(jpe?g|png|webp|heic|heif)$/i
    const isImage =
      validImageTypes.includes(file.type) ||
      (file.type === '' && imageExtensions.test(file.name))
    const isPdf =
      validPdfTypes.includes(file.type) || /\.pdf$/i.test(file.name)

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: 'Invalid file type. Only image (JPG, PNG, WEBP, HEIC) and PDF files are allowed.' },
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

    // Children's-ministry photos are access-controlled: upload them as
    // `authenticated` so they require a signed delivery URL. Everything
    // else stays a normal public `upload`.
    const protectedAsset = isProtectedFolder(targetFolder) && isImage
    const deliveryType = protectedAsset ? 'authenticated' : 'upload'

    // We upload PDFs as `image` resource_type (Cloudinary's recommended
    // setting for PDFs — preserves the file extension in the delivery URL,
    // supports per-page rendering, and matches what you get when uploading
    // a PDF straight from the Cloudinary dashboard).
    //
    // `use_filename` + `unique_filename` preserve the original filename
    // (e.g. "Walking-in-Faith.pdf") while still appending a short random
    // suffix so collisions can't overwrite previous uploads.
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: targetFolder,
          resource_type: 'image',
          type: deliveryType,
          use_filename: true,
          unique_filename: true,
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

    // For protected assets the bare secure_url 401s — return a *signed* URL
    // for the immediate preview, and the publicId so the caller can persist
    // it (and re-sign on every future read).
    const url = protectedAsset
      ? signedChildImageUrl(uploadResult.public_id) ?? uploadResult.secure_url
      : uploadResult.secure_url

    return NextResponse.json({
      url,
      publicId: uploadResult.public_id,
      authenticated: protectedAsset,
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
