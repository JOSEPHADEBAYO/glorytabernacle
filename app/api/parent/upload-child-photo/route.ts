import { NextRequest, NextResponse } from 'next/server'
import { cloudinary, signedChildImageUrl } from '@/lib/cloudinary'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
// Accept the formats mobile cameras / galleries produce, including iPhone
// HEIC. Cloudinary normalises these on upload.
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])
const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif)$/i

/**
 * POST /api/parent/upload-child-photo
 *
 * Publicly accessible image upload for the /parent/register page. Mirrors
 * the auth-gated /api/upload endpoint but is restricted to image-only
 * uploads (JPG / PNG, up to 5 MB) and a fixed Cloudinary folder.
 *
 * Returns { url, publicId } on success.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Accept by MIME type, or by extension when the browser reports an
    // empty type (common for iOS HEIC photos).
    const typeOk =
      ALLOWED.has(file.type) ||
      (file.type === '' && IMAGE_EXT.test(file.name))
    if (!typeOk) {
      return NextResponse.json(
        { error: 'Please upload a photo (JPG, PNG, WEBP, or HEIC).' },
        { status: 400 }
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Photo must be 5 MB or smaller.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Child photos are access-controlled: uploaded as `authenticated` and
    // delivered only via a signed URL. The bare secure_url would 401, so we
    // return a signed URL for the preview plus the publicId to persist.
    const result = await new Promise<unknown>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'children/photos',
          resource_type: 'image',
          type: 'authenticated',
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

    const upload = result as {
      secure_url: string
      public_id: string
      width?: number
      height?: number
    }

    return NextResponse.json({
      url: signedChildImageUrl(upload.public_id) ?? upload.secure_url,
      publicId: upload.public_id,
      authenticated: true,
      width: upload.width,
      height: upload.height,
    })
  } catch (err) {
    console.error('Parent child-photo upload error:', err)
    return NextResponse.json(
      { error: 'Failed to upload photo. Please try again.' },
      { status: 500 }
    )
  }
}
