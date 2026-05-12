import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { updateBookSchema } from '@/lib/validation/book'

/**
 * GET /api/books/[id]
 * Retrieves a single book by ID
 * 
 * Requires authentication via session token
 * Returns 200 with complete book record if found
 * Returns 404 if book not found
 * Returns 401 if session token missing or invalid
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

    // 2. Extract book ID from route params
    const { id } = await params

    // 3. Query database for book by ID using Prisma findUnique
    const book = await prisma.book.findUnique({
      where: {
        id: id
      }
    })

    // 4. Return 404 if book not found
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // 5. Return 200 with complete book record if found
    return NextResponse.json(book, { status: 200 })

  } catch (error) {
    // 6. Handle database errors with 500 status
    console.error('Error fetching book:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bookId: (await params).id,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/books/[id]
 * Updates an existing book
 * 
 * Requires authentication via session token
 * Returns 200 with updated book record if successful
 * Returns 404 if book not found
 * Returns 401 if session token missing or invalid
 * Returns 400 if validation fails
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Extract book ID from route params early for error logging
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

    // 2. Parse request body and validate with updateBookSchema
    const body = await request.json()
    const validation = updateBookSchema.safeParse(body)

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

    // 4. Check if book exists using Prisma findUnique
    const existingBook = await prisma.book.findUnique({
      where: { id }
    })

    // 5. Return 404 if book not found
    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // 6. Update book with Prisma update, only modifying specified fields
    const updatedBook = await prisma.book.update({
      where: { id },
      data: validation.data
    })

    // 7. Return 200 with updated book record
    return NextResponse.json(updatedBook, { status: 200 })

  } catch (error) {
    // 8. Handle database errors with 500 status
    console.error('Error updating book:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bookId: id,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/books/[id]
 * Deletes a book permanently
 * 
 * Requires authentication via session token
 * Returns 200 with success message if deleted
 * Returns 404 if book not found
 * Returns 401 if session token missing or invalid
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Extract book ID from route params early for error logging
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

    // 2. Extract book ID from route params (already done above)
    // 3. Check if book exists using Prisma findUnique
    const existingBook = await prisma.book.findUnique({
      where: { id }
    })

    // 4. Return 404 if book not found
    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // 5. Delete book using Prisma delete
    await prisma.book.delete({
      where: { id }
    })

    // 6. Return 200 with success message
    return NextResponse.json(
      { message: 'Book deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    // 7. Handle database errors with 500 status
    console.error('Error deleting book:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bookId: id,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
