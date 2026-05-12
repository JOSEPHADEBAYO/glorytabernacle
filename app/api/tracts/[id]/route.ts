import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { updateTractSchema } from '@/lib/validation/tract'

/**
 * GET /api/tracts/[id]
 * Retrieves a single tract by ID
 * 
 * Requires authentication via session token
 * Returns 200 with complete tract record if found
 * Returns 404 if tract not found
 * Returns 401 if session token missing or invalid
 * 
 * Requirements: 2.2, 7.1, 14.3
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 2. Extract tract ID from route params
    const { id } = await params

    // 3. Query database for tract by ID using Prisma findUnique
    const tract = await prisma.tract.findUnique({
      where: {
        id: id
      }
    })

    // 4. Return 404 if tract not found
    if (!tract) {
      return NextResponse.json(
        { error: 'Tract not found' },
        { status: 404 }
      )
    }

    // 5. Return 200 with complete tract record if found
    return NextResponse.json(tract, { status: 200 })

  } catch (error) {
    // 6. Handle database errors with 500 status
    console.error('Error fetching tract:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tractId: (await params).id,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/tracts/[id]
 * Updates an existing tract
 * 
 * Requires authentication via session token
 * Returns 200 with updated tract record if successful
 * Returns 404 if tract not found
 * Returns 401 if session token missing or invalid
 * Returns 400 if validation fails
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8, 3.9, 7.1, 14.4
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Extract tract ID from route params early for error logging
  const { id } = await params

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

    // 2. Parse request body and validate with updateTractSchema
    const body = await request.json()
    const validation = updateTractSchema.safeParse(body)

    // 3. Return 400 with validation errors if schema validation fails
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

    // 4. Check if tract exists using Prisma findUnique
    const existingTract = await prisma.tract.findUnique({
      where: { id }
    })

    // 5. Return 404 if tract not found
    if (!existingTract) {
      return NextResponse.json(
        { error: 'Tract not found' },
        { status: 404 }
      )
    }

    // 6. Update tract with Prisma update, only modifying specified fields
    // Prisma automatically preserves createdAt and createdBy (not in update data)
    const updatedTract = await prisma.tract.update({
      where: { id },
      data: validation.data
    })

    // 7. Return 200 with updated tract record
    return NextResponse.json(updatedTract, { status: 200 })

  } catch (error) {
    // 8. Handle database errors with 500 status
    console.error('Error updating tract:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tractId: id,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tracts/[id]
 * Deletes a tract permanently
 * 
 * Requires authentication via session token
 * Returns 200 with success message if deleted
 * Returns 404 if tract not found
 * Returns 401 if session token missing or invalid
 * 
 * Requirements: 4.1, 4.2, 4.3, 7.1, 14.5
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Extract tract ID from route params early for error logging
  const { id } = await params

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

    // 2. Check if tract exists using Prisma findUnique
    const existingTract = await prisma.tract.findUnique({
      where: { id }
    })

    // 3. Return 404 if tract not found
    if (!existingTract) {
      return NextResponse.json(
        { error: 'Tract not found' },
        { status: 404 }
      )
    }

    // 4. Delete tract using Prisma delete
    await prisma.tract.delete({
      where: { id }
    })

    // 5. Return 200 with success message
    return NextResponse.json(
      { message: 'Tract deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    // 6. Handle database errors with 500 status
    console.error('Error deleting tract:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tractId: id,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
