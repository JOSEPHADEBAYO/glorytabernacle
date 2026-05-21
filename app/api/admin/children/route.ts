import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import {
  adminChildrenQuerySchema,
  createChildSchema,
} from '@/lib/validation/child'
import {
  CHILDREN_ADMIN_ROLES,
  type ChildrenAdminRole,
} from '@/lib/types/child'
import { resolvePhotoUrl } from '@/lib/cloudinary'

function isAdmin(role: string | undefined): role is ChildrenAdminRole {
  return CHILDREN_ADMIN_ROLES.includes(role as ChildrenAdminRole)
}

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

/**
 * GET /api/admin/children
 *
 * Paginated list of every registered child with the current open check-in
 * (if any). Restricted to CHILDREN_LEADER + SUPER_ADMIN.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const validation = adminChildrenQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    })

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      )
    }

    const page = validation.data.page ?? 1
    const pageSize = Math.min(
      validation.data.pageSize ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    )

    // Status filter: ?status=pending returns parent submissions awaiting
    // approval; otherwise the list returns only approved (active) children.
    const statusParam = request.nextUrl.searchParams.get('status')
    const approvedFilter =
      statusParam === 'pending'
        ? { approved: false }
        : statusParam === 'all'
          ? {}
          : { approved: true }

    // search across firstName, lastName, primaryGuardianName
    const search = validation.data.search?.trim()
    const where = {
      ...approvedFilter,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { primaryGuardianName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [total, children] = await Promise.all([
      prisma.child.count({ where }),
      prisma.child.findMany({
        where,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          checkIns: {
            where: { signedOutAt: null },
            orderBy: { signedInAt: 'desc' },
            take: 1,
          },
          authorisedCollectors: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ])

    // Re-sign child + collector photos so the client receives deliverable
    // (signed) URLs for authenticated assets.
    const signedChildren = children.map((c) => ({
      ...c,
      photoUrl: resolvePhotoUrl(c),
      authorisedCollectors: c.authorisedCollectors.map((col) => ({
        ...col,
        photoUrl: resolvePhotoUrl(col),
      })),
    }))

    return NextResponse.json(
      {
        children: signedChildren,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error listing children (admin):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/children
 *
 * Registers a new child. Body validated against createChildSchema.
 * Restricted to CHILDREN_LEADER + SUPER_ADMIN.
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validation = createChildSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Normalise empty strings to null for optional text columns. Collectors
    // are created as part of the same transaction via Prisma's nested
    // create — empty trimmed strings become null where the column allows.
    const child = await prisma.child.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth as Date),
        gender: data.gender,
        allergies: data.allergies?.trim() || null,
        medicalNotes: data.medicalNotes?.trim() || null,
        specialNeeds: data.specialNeeds?.trim() || null,
        // Prefer the authenticated public_id; only keep a raw photoUrl when
        // there's no publicId (legacy / external image).
        photoPublicId: data.photoPublicId?.trim() || null,
        photoUrl: data.photoPublicId?.trim() ? null : data.photoUrl?.trim() || null,
        primaryGuardianName: data.primaryGuardianName,
        primaryGuardianPhone: data.primaryGuardianPhone,
        primaryGuardianEmail: data.primaryGuardianEmail?.trim() || null,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        // GDPR consent — the schema guarantees the mandatory ones are true.
        consentDataProcessing: data.consentDataProcessing,
        consentMedicalInfoSharing: data.consentMedicalInfoSharing,
        consentEmergencyTreatment: data.consentEmergencyTreatment,
        consentPhotography: data.consentPhotography ?? false,
        consentByName: data.consentByName,
        consentCapturedAt: new Date(),
        authorisedCollectors:
          data.authorisedCollectors && data.authorisedCollectors.length > 0
            ? {
                create: data.authorisedCollectors.map((c) => ({
                  name: c.name,
                  relationship: c.relationship,
                  phone: c.phone?.trim() || null,
                  photoPublicId: c.photoPublicId?.trim() || null,
                  photoUrl: c.photoPublicId?.trim() ? null : c.photoUrl?.trim() || null,
                  notes: c.notes?.trim() || null,
                })),
              }
            : undefined,
      },
      include: { authorisedCollectors: true },
    })

    return NextResponse.json({ child }, { status: 201 })
  } catch (error) {
    console.error('Error creating child (admin):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
