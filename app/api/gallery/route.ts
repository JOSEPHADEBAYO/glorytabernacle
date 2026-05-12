import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createGallerySchema, galleryQuerySchema } from '@/lib/validation/gallery'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { GALLERY_ADMIN_ROLES, type GalleryAdminRole } from '@/lib/types/gallery'

/**
 * Helper: returns true if the role is allowed to manage gallery photos
 * (SUPER_ADMIN or CONTENT_EDITOR).
 */
function isGalleryAdmin(role: string | undefined): role is GalleryAdminRole {
  return GALLERY_ADMIN_ROLES.includes(role as GalleryAdminRole)
}

/**
 * POST /api/gallery
 * Creates a new gallery-photo record.
 *
 * Requires authentication via session token AND a SUPER_ADMIN or
 * CONTENT_EDITOR role.
 * Validates request body against createGallerySchema.
 * Returns 201 with created photo on success.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Authorization check — only admins can create gallery photos
    if (!isGalleryAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validation = createGallerySchema.safeParse(body)

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

    // 4. Create gallery record
    const photoData = validation.data

    const photo = await prisma.gallery.create({
      data: {
        title: photoData.title,
        description: photoData.description,
        imageUrl: photoData.imageUrl,
        imageAlt: photoData.imageAlt,
        dateTaken: photoData.dateTaken,
        published: photoData.published,
        createdBy: user.id,
      },
    })

    // 5. Return success response with complete record
    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error('Error creating gallery photo:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/gallery
 * Lists all gallery photos with optional filtering.
 *
 * Requires authentication (dashboard consumer). The public homepage
 * fetches directly via Prisma server-side and does not use this endpoint.
 *
 * Supports query parameters:
 * - published: "true" | "false" (optional)
 *
 * Returns 200 with array of photos wrapped in { photos: [] }.
 * Returns empty array (not 404) when no photos match filters.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      published: searchParams.get('published') ?? undefined,
    }

    const validation = galleryQuerySchema.safeParse(queryParams)

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

    // 3. Build Prisma where clause
    const whereClause: { published?: boolean } = {}

    if (validation.data.published !== undefined) {
      whereClause.published = validation.data.published === 'true'
    }

    // 4. Query database — newest by dateTaken first, then by createdAt to break ties
    const photos = await prisma.gallery.findMany({
      where: whereClause,
      orderBy: [{ dateTaken: 'desc' }, { createdAt: 'desc' }],
    })

    // 5. Return wrapped response
    return NextResponse.json({ photos }, { status: 200 })
  } catch (error) {
    console.error('Error fetching gallery photos:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
