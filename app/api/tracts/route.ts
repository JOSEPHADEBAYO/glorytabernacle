import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createTractSchema, tractQuerySchema } from '@/lib/validation/tract'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'

/**
 * POST /api/tracts
 * Creates a new tract record
 * 
 * Requires authentication via session token
 * Validates request body against createTractSchema
 * Returns 201 with created tract on success
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check - extract and validate session token
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from session token
    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validation = createTractSchema.safeParse(body)
    
    if (!validation.success) {
      const errorMessages = validation.error.issues.map(e => e.message)
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errorMessages
        },
        { status: 400 }
      )
    }

    // 3. Create tract record in database
    const tractData = validation.data

    const tract = await prisma.tract.create({
      data: {
        title: tractData.title,
        category: tractData.category,
        description: tractData.description,
        coverImage: tractData.coverImage,
        documentUrl: tractData.documentUrl,
        published: tractData.published,
        createdBy: user.id
      }
    })

    // 4. Return success response with complete tract record
    return NextResponse.json(tract, { status: 201 })

  } catch (error) {
    // 5. Handle unexpected errors - log server-side, return generic message
    console.error('Error creating tract:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tracts
 * Lists all tracts with optional filtering
 * 
 * Requires authentication via session token (dashboard access)
 * Supports query parameters:
 * - published: "true" | "false" (optional)
 * - category: TractCategory (optional)
 * 
 * Returns 200 with array of tracts wrapped in { tracts: [] } object
 * Returns empty array (not 404) when no tracts match filters
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check - extract and validate session token
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from session token
    const user = await getSessionUser(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      published: searchParams.get('published') ?? undefined,
      category: searchParams.get('category') ?? undefined
    }

    const validation = tractQuerySchema.safeParse(queryParams)
    
    if (!validation.success) {
      const errorMessages = validation.error.issues.map(e => e.message)
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errorMessages
        },
        { status: 400 }
      )
    }

    // 3. Build Prisma query with where clause based on filters
    const whereClause: any = {}
    
    if (validation.data.published !== undefined) {
      whereClause.published = validation.data.published === 'true'
    }
    
    if (validation.data.category !== undefined) {
      whereClause.category = validation.data.category
    }

    // 4. Query database ordered by createdAt descending
    const tracts = await prisma.tract.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 5. Return 200 status with array of tracts wrapped in { tracts: [] } object
    // Handle empty results with empty array (not 404)
    return NextResponse.json({ tracts }, { status: 200 })

  } catch (error) {
    // 6. Handle database errors with 500 status
    console.error('Error fetching tracts:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
