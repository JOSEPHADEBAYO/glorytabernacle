import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createBookSchema, bookQuerySchema } from '@/lib/validation/book'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'

/**
 * POST /api/books
 * Creates a new book record
 * 
 * Requires authentication via session token
 * Validates request body against createBookSchema
 * Returns 201 with created book on success
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
    const validation = createBookSchema.safeParse(body)
    
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

    // 3. Create book record in database
    const bookData = validation.data
    
    // Handle empty string or undefined purchaseUrl (convert to null for database)
    const purchaseUrl = bookData.purchaseUrl === '' || bookData.purchaseUrl === undefined 
      ? null 
      : bookData.purchaseUrl

    const book = await prisma.book.create({
      data: {
        title: bookData.title,
        author: bookData.author,
        category: bookData.category,
        description: bookData.description,
        coverImage: bookData.coverImage,
        purchaseUrl: purchaseUrl,
        published: bookData.published,
        featured: bookData.featured,
        featuredOrder: bookData.featuredOrder,
        createdBy: user.id
      }
    })

    // 4. Return success response with complete book record
    return NextResponse.json(book, { status: 201 })

  } catch (error) {
    // 5. Handle unexpected errors - log server-side, return generic message
    console.error('Error creating book:', {
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
 * GET /api/books
 * Lists all books with optional filtering
 * 
 * Requires authentication via session token (dashboard access)
 * Supports query parameters:
 * - published: "true" | "false" (optional)
 * - category: BookCategory (optional)
 * 
 * Returns 200 with array of books wrapped in { books: [] } object
 * Returns empty array (not 404) when no books match filters
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

    const validation = bookQuerySchema.safeParse(queryParams)
    
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
    const books = await prisma.book.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 5. Return 200 status with array of books wrapped in { books: [] } object
    // Handle empty results with empty array (not 404)
    return NextResponse.json({ books }, { status: 200 })

  } catch (error) {
    // 6. Handle database errors with 500 status
    console.error('Error fetching books:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
