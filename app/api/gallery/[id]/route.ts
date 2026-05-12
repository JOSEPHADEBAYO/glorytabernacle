import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { updateGallerySchema } from '@/lib/validation/gallery'
import { GALLERY_ADMIN_ROLES, type GalleryAdminRole } from '@/lib/types/gallery'

function isGalleryAdmin(role: string | undefined): role is GalleryAdminRole {
  return GALLERY_ADMIN_ROLES.includes(role as GalleryAdminRole)
}

/**
 * GET /api/gallery/[id]
 * Retrieves a single gallery photo by ID.
 *
 * Requires authentication via session token.
 * Returns 200 with complete record if found.
 * Returns 404 if photo not found.
 * Returns 401 if session token missing or invalid.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Extract id (Next 16 async params)
    const { id } = await params

    // 3. Fetch
    const photo = await prisma.gallery.findUnique({
      where: { id },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Gallery photo not found' }, { status: 404 })
    }

    return NextResponse.json(photo, { status: 200 })
  } catch (error) {
    console.error('Error fetching gallery photo:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      photoId: (await params).id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/gallery/[id]
 * Updates an existing gallery photo.
 *
 * Requires authentication AND a SUPER_ADMIN or CONTENT_EDITOR role.
 * Returns 200 with updated record if successful.
 * Returns 404 if photo not found.
 * Returns 401/403 for auth failures.
 * Returns 400 if validation fails.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // 1. Auth
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isGalleryAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Validate body
    const body = await request.json()
    const validation = updateGallerySchema.safeParse(body)

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errorMessages,
        },
        { status: 400 }
      )
    }

    // 3. Confirm record exists
    const existing = await prisma.gallery.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Gallery photo not found' }, { status: 404 })
    }

    // 4. Update only the provided fields
    const updated = await prisma.gallery.update({
      where: { id },
      data: validation.data,
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Error updating gallery photo:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      photoId: id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/gallery/[id]
 * Deletes a gallery photo permanently.
 *
 * Requires authentication AND a SUPER_ADMIN or CONTENT_EDITOR role.
 * Returns 200 with success message if deleted.
 * Returns 404 if photo not found.
 * Returns 401/403 for auth failures.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // 1. Auth
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isGalleryAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Confirm record exists
    const existing = await prisma.gallery.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Gallery photo not found' }, { status: 404 })
    }

    // 3. Delete
    await prisma.gallery.delete({ where: { id } })

    return NextResponse.json(
      { message: 'Gallery photo deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting gallery photo:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      photoId: id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
