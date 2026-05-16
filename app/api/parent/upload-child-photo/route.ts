import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary once at module load.
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED = new Set(['image/jpeg', 'image/png'])

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

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG and PNG photos are accepted.' },
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

    const result = await new Promise<unknown>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'children/photos', resource_type: 'image' },
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
      url: upload.secure_url,
      publicId: upload.public_id,
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
