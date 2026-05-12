# Design Document: Books Management System

## Overview

The Books Management System is a full-stack feature that enables church administrators to manage a curated library of Christian books through a secure dashboard interface while displaying published books to public website visitors. The system implements RESTful API endpoints using Next.js 16 App Router route handlers, integrates with an existing PostgreSQL database via Prisma ORM, and leverages the existing session-based authentication system.

### Key Design Goals

1. **Separation of Concerns**: Clear boundaries between API layer, data access layer, UI components, and authentication
2. **Type Safety**: Comprehensive TypeScript types shared between client and server
3. **Security**: Authentication enforcement at both middleware and API levels
4. **Performance**: Optimized image loading, efficient database queries with indexes, server-side rendering for public pages
5. **User Experience**: Intuitive dashboard interface, responsive public display, clear error messaging
6. **Maintainability**: Consistent patterns following Next.js 16 conventions, reusable validation logic

### Technology Stack

- **Framework**: Next.js 16.2.4 (App Router)
- **Database**: PostgreSQL with Prisma ORM 7.8.0
- **Authentication**: Session-based with HTTP-only cookies
- **UI**: React 19.2.4, Tailwind CSS 4
- **Image Optimization**: Next.js Image component
- **Validation**: Zod for runtime type validation
- **Testing**: Vitest with fast-check for property-based testing

## Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Public Books Page]
        B[Dashboard Books Manager]
    end
    
    subgraph "Next.js Middleware"
        C[Authentication Middleware]
    end
    
    subgraph "API Layer"
        D[POST /api/books]
        E[GET /api/books]
        F[GET /api/books/id]
        G[PUT /api/books/id]
        H[DELETE /api/books/id]
    end
    
    subgraph "Business Logic"
        I[Validation Layer]
        J[Book Service]
    end
    
    subgraph "Data Layer"
        K[Prisma Client]
        L[(PostgreSQL)]
    end
    
    A -->|SSR Fetch| E
    B -->|API Calls| D
    B -->|API Calls| E
    B -->|API Calls| G
    B -->|API Calls| H
    
    C -->|Protects| B
    C -->|Validates Session| D
    C -->|Validates Session| G
    C -->|Validates Session| H
    
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I
    
    I --> J
    J --> K
    K --> L
```

### Request Flow

#### Authenticated Request (Dashboard)
1. User interacts with BooksManager component
2. Client sends API request with session cookie
3. Next.js middleware validates session token
4. Route handler extracts session from cookies
5. Validation layer validates request payload
6. Book service executes business logic
7. Prisma client performs database operation
8. Response flows back through layers

#### Public Request (Website)
1. User visits /books page
2. Server component fetches published books
3. Direct Prisma query (no API call needed)
4. Server-side rendering with optimized images
5. HTML sent to client

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Middleware
    participant API
    participant Session
    participant DB
    
    Client->>Middleware: Request with cookie
    Middleware->>Middleware: Check session_token
    alt No token
        Middleware->>Client: Redirect to /login
    else Has token
        Middleware->>API: Forward request
        API->>Session: Validate token
        alt Invalid token
            API->>Client: 401 Unauthorized
        else Valid token
            API->>DB: Execute operation
            DB->>API: Result
            API->>Client: Success response
        end
    end
```

## Components and Interfaces

### API Route Handlers

#### POST /api/books/route.ts

Creates a new book record.

**Request Body**:
```typescript
{
  title: string
  author: string
  category: BookCategory
  description: string
  coverImage: string (URL)
  purchaseUrl?: string (URL)
  published: boolean
}
```

**Response** (201 Created):
```typescript
{
  id: string
  title: string
  author: string
  category: string
  description: string
  coverImage: string
  purchaseUrl: string | null
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

**Error Responses**:
- 400: Validation error (missing fields, invalid URLs, invalid category)
- 401: Unauthorized (missing or invalid session)
- 500: Internal server error

#### GET /api/books/route.ts

Lists all books with optional filtering.

**Query Parameters**:
- `published`: "true" | "false" (optional)
- `category`: BookCategory (optional)

**Response** (200 OK):
```typescript
{
  books: Book[]
}
```

#### GET /api/books/[id]/route.ts

Retrieves a single book by ID.

**Response** (200 OK):
```typescript
{
  id: string
  title: string
  author: string
  category: string
  description: string
  coverImage: string
  purchaseUrl: string | null
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

**Error Responses**:
- 404: Book not found
- 401: Unauthorized
- 500: Internal server error

#### PUT /api/books/[id]/route.ts

Updates an existing book.

**Request Body** (all fields optional):
```typescript
{
  title?: string
  author?: string
  category?: BookCategory
  description?: string
  coverImage?: string (URL)
  purchaseUrl?: string (URL)
  published?: boolean
}
```

**Response** (200 OK):
```typescript
{
  id: string
  title: string
  author: string
  category: string
  description: string
  coverImage: string
  purchaseUrl: string | null
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

**Error Responses**:
- 400: Validation error
- 404: Book not found
- 401: Unauthorized
- 500: Internal server error

#### DELETE /api/books/[id]/route.ts

Deletes a book permanently.

**Response** (200 OK):
```typescript
{
  message: "Book deleted successfully"
}
```

**Error Responses**:
- 404: Book not found
- 401: Unauthorized
- 500: Internal server error

### Shared Types

**lib/types/book.ts**:
```typescript
export const BOOK_CATEGORIES = [
  'Spiritual Growth',
  'Prayer & Intercession',
  'Faith & Doctrine',
  'Christian Living',
  'Leadership',
  'Family & Relationships',
  'Devotional',
  'Theology',
  'Biography',
  'Other',
] as const

export type BookCategory = typeof BOOK_CATEGORIES[number]

export interface Book {
  id: string
  title: string
  author: string
  category: BookCategory
  description: string
  coverImage: string
  purchaseUrl: string | null
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateBookInput {
  title: string
  author: string
  category: BookCategory
  description: string
  coverImage: string
  purchaseUrl?: string
  published: boolean
}

export interface UpdateBookInput {
  title?: string
  author?: string
  category?: BookCategory
  description?: string
  coverImage?: string
  purchaseUrl?: string
  published?: boolean
}
```

### Validation Schemas

**lib/validation/book.ts**:
```typescript
import { z } from 'zod'
import { BOOK_CATEGORIES } from '@/lib/types/book'

const urlSchema = z.string().url('Must be a valid URL')

export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  author: z.string().min(1, 'Author is required').max(100, 'Author name too long'),
  category: z.enum(BOOK_CATEGORIES, {
    errorMap: () => ({ message: 'Invalid category' })
  }),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  coverImage: urlSchema,
  purchaseUrl: urlSchema.optional().or(z.literal('')),
  published: z.boolean().default(false)
})

export const updateBookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  author: z.string().min(1).max(100).optional(),
  category: z.enum(BOOK_CATEGORIES).optional(),
  description: z.string().min(1).max(2000).optional(),
  coverImage: urlSchema.optional(),
  purchaseUrl: urlSchema.optional().or(z.literal('')),
  published: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
})

export const bookQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
  category: z.enum(BOOK_CATEGORIES).optional()
})
```

### Authentication Helper

**lib/auth/session.ts**:
```typescript
import { cookies } from 'next/headers'

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('session_token')?.value ?? null
}

export async function validateSession(): Promise<boolean> {
  const token = await getSessionToken()
  return token !== null
}

// For future enhancement: validate against database
export async function getSessionUser(token: string): Promise<{ id: string; email: string } | null> {
  // Currently using simple token validation
  // Future: query Session table to get userId, then User table
  if (!token) return null
  
  // Placeholder - return hardcoded super admin for now
  return {
    id: 'super-admin',
    email: 'adeolusegun1000@gmail.com'
  }
}
```

### Component Updates

#### BooksManager Component Enhancement

The existing `components/dashboard/books-manager.tsx` needs updates:

1. **Add Edit Functionality**: Currently only supports add and delete
2. **Add Publish Toggle**: Quick toggle for published status
3. **Add Category Filter**: Filter books by category in dashboard
4. **Add Search**: Search by title or author
5. **Improve Error Handling**: Display API errors in toast notifications
6. **Add Loading States**: Better UX during API operations

**New Component Structure**:
```typescript
interface BooksManagerProps {
  initialBooks: Book[]
}

// Main component with state management
export function BooksManager({ initialBooks }: BooksManagerProps)

// Sub-components
function BookCard({ book, onEdit, onDelete, onTogglePublish })
function AddBookModal({ onClose, onSuccess })
function EditBookModal({ book, onClose, onSuccess })
function BookFilters({ onFilterChange })
function SearchBar({ onSearch })
```

#### Public Book Library Component

Update `app/books/book-library.tsx` to fetch from database:

**Current**: Uses hardcoded BOOKS array
**New**: Receives books as props from server component

```typescript
interface BookLibraryProps {
  books: Book[]
}

export function BookLibrary({ books }: BookLibraryProps)
```

**app/books/page.tsx** (Server Component):
```typescript
import { prisma } from '@/lib/prisma'
import { BookLibrary } from './book-library'

export default async function BooksPage() {
  const books = await prisma.book.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' }
  })
  
  return (
    <>
      <TopNavBar />
      {/* Hero section */}
      <BookLibrary books={books} />
      {/* Newsletter section */}
      <Footer />
    </>
  )
}
```

## Data Models

### Prisma Schema (Existing)

The Book model already exists in `prisma/schema.prisma`:

```prisma
model Book {
  id           String   @id @default(cuid())
  title        String
  author       String
  category     String
  description  String   @db.Text
  coverImage   String
  purchaseUrl  String?
  published    Boolean  @default(false)
  createdBy    String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([published])
  @@index([category])
}
```

### Database Indexes

Existing indexes optimize common queries:
- `@@index([published])`: Fast filtering for public display
- `@@index([category])`: Efficient category-based filtering

### Migration Strategy

The schema already exists, so no migration is needed. However, if the database hasn't been initialized:

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Or for development
npx prisma migrate dev
```

## Error Handling

### Error Response Format

All API errors follow a consistent JSON structure:

```typescript
{
  error: string // Human-readable error message
  details?: string[] // Optional array of specific validation errors
}
```

### Error Handling Patterns

#### API Route Handler Pattern

```typescript
export async function POST(request: Request) {
  try {
    // 1. Authentication check
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validation = createBookSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    // 3. Execute business logic
    const book = await prisma.book.create({
      data: {
        ...validation.data,
        createdBy: 'super-admin' // From session
      }
    })

    // 4. Return success response
    return NextResponse.json(book, { status: 201 })

  } catch (error) {
    // 5. Handle unexpected errors
    console.error('Error creating book:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### Client-Side Error Handling

```typescript
async function handleCreateBook(data: CreateBookInput) {
  try {
    const response = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create book')
    }

    const book = await response.json()
    return book
  } catch (error) {
    // Display error to user via toast or modal
    console.error('Create book error:', error)
    throw error
  }
}
```

### Error Categories

1. **Validation Errors (400)**:
   - Missing required fields
   - Invalid data types
   - Invalid URLs
   - Invalid category
   - Field length violations

2. **Authentication Errors (401)**:
   - Missing session token
   - Invalid session token
   - Expired session

3. **Not Found Errors (404)**:
   - Book ID doesn't exist

4. **Server Errors (500)**:
   - Database connection failures
   - Unexpected exceptions
   - Prisma errors

### Logging Strategy

```typescript
// Server-side only - never log sensitive data
console.error('Error creating book:', {
  error: error.message,
  userId: session.userId,
  timestamp: new Date().toISOString()
  // Never log: passwords, tokens, full request bodies
})
```

## Testing Strategy

### Testing Approach

The Books Management System requires a dual testing approach:

1. **Unit Tests**: Validate specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Verify universal properties across all inputs

### Unit Testing

**Focus Areas**:
- API route handlers with specific payloads
- Validation schema edge cases
- Error handling scenarios
- Component rendering with specific data
- Integration between components and API

**Example Unit Tests**:

```typescript
// __tests__/api/books/create.test.ts
describe('POST /api/books', () => {
  it('creates a book with valid data', async () => {
    const response = await POST(mockRequest({
      title: 'Test Book',
      author: 'Test Author',
      category: 'Spiritual Growth',
      description: 'Test description',
      coverImage: 'https://example.com/image.jpg',
      published: false
    }))
    
    expect(response.status).toBe(201)
    const book = await response.json()
    expect(book.title).toBe('Test Book')
  })

  it('returns 400 for missing title', async () => {
    const response = await POST(mockRequest({
      author: 'Test Author',
      // title missing
    }))
    
    expect(response.status).toBe(400)
    const error = await response.json()
    expect(error.error).toBe('Validation failed')
  })

  it('returns 401 without session token', async () => {
    const response = await POST(mockRequestWithoutAuth({
      title: 'Test Book',
      // ... valid data
    }))
    
    expect(response.status).toBe(401)
  })
})
```

### Property-Based Testing

This feature is **suitable for property-based testing** because:
- It involves data transformation (validation, serialization)
- It has clear input/output behavior
- Universal properties hold across all valid inputs
- The input space is large (strings, URLs, categories)

**Testing Library**: fast-check (already installed)

**Configuration**:
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: books-management-system, Property {number}: {property_text}`


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

**Redundant Properties Eliminated**:
- Requirements 1.5 and 5.1 both test category validation → Combined into Property 1
- Requirements 1.6, 10.1, and 10.2 all test coverImage URL validation → Combined into Property 1
- Requirements 1.7 and 1.6 both test URL validation → Combined into Property 1
- Requirements 2.1 and 8.3 both test ordering by creation date → Combined into Property 5
- Requirements 2.3 and 5.5 both test category filtering → Combined into Property 6
- Requirements 2.6 and 8.2 both test UI rendering of all fields → Combined into Property 7
- Requirements 2.7 and 6.6 both test draft badge display → Combined into Property 8
- Requirements 3.6, 4.2, 4.4, and 11.3 all test 404 for non-existent IDs → Combined into Property 13
- Requirements 6.2, 6.3, 6.8, and 8.1 all test published filtering → Combined into Property 14
- Requirements 7.1, 7.2, and 11.4 all test 401 for missing auth → Combined into Property 15
- Requirements 1.9, 3.7, and 11.1 all test 400 validation errors → Combined into Property 2

**Properties Consolidated**:
- Create, update, and delete validation share common patterns → Grouped by operation type
- UI rendering properties consolidated where they test the same behavior
- Error handling properties unified across endpoints

### Property 1: Input Validation Completeness

*For any* book creation or update request, the API SHALL validate all required fields (title, author, category, description, coverImage) are present, category is one of the ten predefined values, and all URL fields (coverImage, purchaseUrl) are properly formatted URLs.

**Validates: Requirements 1.2, 1.5, 1.6, 1.7, 3.4, 5.1, 10.1, 10.2**

### Property 2: Validation Error Responses

*For any* invalid book creation or update request (missing required fields, invalid URLs, invalid category, invalid data types), the API SHALL return HTTP status 400 with a descriptive error message listing all validation failures.

**Validates: Requirements 1.9, 3.7, 11.1, 11.2, 11.9**

### Property 3: Book Creation Round-Trip

*For any* valid book creation payload, creating a book and then retrieving it SHALL return a record with all input fields preserved, plus automatically generated id, createdAt, updatedAt, and createdBy fields.

**Validates: Requirements 1.1, 1.8, 1.10, 1.11, 2.2**

### Property 4: Optional Field Handling

*For any* book creation request, the purchaseUrl field SHALL be optional, and the published field SHALL default to false when not provided, while both SHALL be stored correctly when provided.

**Validates: Requirements 1.3, 1.4, 6.1**

### Property 5: Ordering Consistency

*For any* set of books with different creation timestamps, querying the books list SHALL return them ordered by createdAt descending (newest first).

**Validates: Requirements 2.1, 8.3**

### Property 6: Category Filtering Accuracy

*For any* book category and any set of books with various categories, filtering by that category SHALL return only books matching that exact category.

**Validates: Requirements 2.4, 5.5**

### Property 7: Complete Field Rendering

*For any* book record, rendering it in either the dashboard or public library SHALL display all core fields: cover image, title, author, category, and description.

**Validates: Requirements 2.6, 5.4, 8.2, 8.4**

### Property 8: Draft Status Indication

*For any* book where published equals false, the dashboard SHALL display a "Draft" badge, and for any book where published equals true, no draft badge SHALL appear.

**Validates: Requirements 2.7, 6.6**

### Property 9: Book Count Accuracy

*For any* set of books, the dashboard SHALL display a count that exactly equals the number of books in the set.

**Validates: Requirements 2.8**

### Property 10: Update Field Preservation

*For any* book update request, only the fields specified in the update payload SHALL be modified, while all other fields (except updatedAt) SHALL remain unchanged, and createdAt and createdBy SHALL never change.

**Validates: Requirements 3.1, 3.2, 3.8, 3.9**

### Property 11: Update Response Accuracy

*For any* valid book update, the API SHALL return HTTP status 200 with the complete updated book record reflecting all changes.

**Validates: Requirements 3.5**

### Property 12: Deletion Completeness

*For any* existing book, successfully deleting it SHALL remove it from the database such that subsequent queries for that book return 404, and it SHALL not appear in any list results.

**Validates: Requirements 4.1, 4.3, 4.6**

### Property 13: Not Found Error Consistency

*For any* non-existent book ID, attempting to retrieve, update, or delete that book SHALL return HTTP status 404 with an error message.

**Validates: Requirements 3.3, 3.6, 4.2, 4.4, 11.3**

### Property 14: Published Status Filtering

*For any* set of books with mixed published values, querying the public library SHALL return only books where published equals true, while querying the dashboard SHALL return all books regardless of published status.

**Validates: Requirements 6.2, 6.3, 6.8, 8.1**

### Property 15: Authentication Enforcement

*For any* API request to create, update, or delete books without a valid session token, the API SHALL return HTTP status 401 with an "Unauthorized" error message.

**Validates: Requirements 7.1, 7.2, 7.4, 11.4**

### Property 16: Token Security

*For any* API response or server log, authentication tokens SHALL NOT be exposed in response bodies or log messages.

**Validates: Requirements 7.7, 11.7**

### Property 17: Purchase Link Behavior

*For any* book with a purchaseUrl, the "Get Book" button SHALL link to that URL, and for any book without a purchaseUrl, the button SHALL be disabled or display a placeholder.

**Validates: Requirements 8.5, 8.6**

### Property 18: Pagination Functionality

*For any* large set of books (more than the initial display count), the public library SHALL display pagination or "Load More" controls that correctly load additional books when activated.

**Validates: Requirements 8.7**

### Property 19: Error Format Consistency

*For any* API error response, the response SHALL be valid JSON with an "error" field containing a descriptive message, and SHALL use appropriate HTTP status codes (400 for validation, 401 for auth, 404 for not found, 500 for server errors).

**Validates: Requirements 11.8**

### Property 20: Content-Type Header Consistency

*For any* API request and response, the Content-Type header SHALL be "application/json" for JSON payloads.

**Validates: Requirements 12.7, 12.8**

### Property 21: Query Parameter Filtering

*For any* combination of published and category query parameters on GET /api/books, the API SHALL return only books matching all specified filters.

**Validates: Requirements 2.3, 2.4, 12.10**


## Image Optimization Strategy

### Next.js Image Component

All book cover images will use the Next.js `Image` component for automatic optimization:

```typescript
import Image from 'next/image'

<Image
  src={book.coverImage}
  alt={book.title}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 33vw"
/>
```

### Optimization Features

1. **Automatic Format Selection**: Next.js serves WebP/AVIF when supported
2. **Responsive Images**: `sizes` attribute ensures appropriate image size for viewport
3. **Lazy Loading**: Images load as they enter viewport
4. **Blur Placeholder**: Optional blur-up effect during load
5. **External URL Support**: Works with external image hosts

### Image Loading Error Handling

```typescript
<Image
  src={book.coverImage}
  alt={book.title}
  fill
  className="object-cover"
  onError={(e) => {
    e.currentTarget.src = '/placeholder-book.png'
  }}
/>
```

### Future Enhancement: Cloudinary Integration

The current implementation uses external URLs. Future versions may add:
- Direct image upload to Cloudinary
- Automatic image transformation
- CDN delivery
- Image moderation

## Implementation Plan

### Phase 1: API Layer (Priority: High)

1. Create validation schemas (`lib/validation/book.ts`)
2. Create shared types (`lib/types/book.ts`)
3. Create authentication helper (`lib/auth/session.ts`)
4. Implement POST /api/books/route.ts
5. Implement GET /api/books/route.ts
6. Implement GET /api/books/[id]/route.ts
7. Implement PUT /api/books/[id]/route.ts
8. Implement DELETE /api/books/[id]/route.ts

### Phase 2: Dashboard Components (Priority: High)

1. Update BooksManager with edit functionality
2. Add EditBookModal component
3. Add publish toggle feature
4. Add category filter
5. Add search functionality
6. Improve error handling with toast notifications
7. Add loading states

### Phase 3: Public Display (Priority: Medium)

1. Update app/books/page.tsx to fetch from database
2. Update BookLibrary component to accept props
3. Implement server-side rendering
4. Add error handling for empty states
5. Test image optimization

### Phase 4: Testing (Priority: High)

1. Write unit tests for validation schemas
2. Write unit tests for API route handlers
3. Write property-based tests for all 21 properties
4. Write component tests for BooksManager
5. Write component tests for BookLibrary
6. Write integration tests for full CRUD flow

### Phase 5: Documentation (Priority: Low)

1. Add API documentation
2. Add component documentation
3. Update README with setup instructions
4. Document environment variables

## Security Considerations

### Authentication

1. **Session Validation**: All mutating operations require valid session token
2. **HTTP-Only Cookies**: Session tokens stored in HTTP-only cookies prevent XSS
3. **Middleware Protection**: Dashboard routes protected at middleware level
4. **API-Level Checks**: Additional validation in each route handler

### Input Validation

1. **Schema Validation**: Zod schemas validate all inputs before database operations
2. **URL Validation**: Strict URL format validation prevents injection
3. **Length Limits**: Maximum lengths prevent buffer overflow attacks
4. **Type Safety**: TypeScript ensures type correctness

### Data Exposure

1. **No Token Leakage**: Tokens never included in responses or logs
2. **Error Message Sanitization**: Generic error messages for production
3. **Sensitive Data Filtering**: No exposure of internal database details

### SQL Injection Prevention

1. **Prisma ORM**: Parameterized queries prevent SQL injection
2. **No Raw SQL**: All queries use Prisma's type-safe API

## Performance Considerations

### Database Optimization

1. **Indexes**: `published` and `category` fields indexed for fast filtering
2. **Query Optimization**: Use `select` to fetch only needed fields
3. **Connection Pooling**: Prisma handles connection pooling automatically

### Caching Strategy

1. **Server-Side Rendering**: Public pages pre-rendered at build time when possible
2. **Revalidation**: Use Next.js revalidation for updated content
3. **Client-Side Caching**: React Query or SWR for dashboard data (future enhancement)

### Image Optimization

1. **Next.js Image**: Automatic optimization and lazy loading
2. **Responsive Images**: Appropriate sizes for different viewports
3. **CDN Delivery**: External images served from their CDN

### API Response Size

1. **Pagination**: Limit results to prevent large payloads
2. **Field Selection**: Return only necessary fields
3. **Compression**: Next.js handles gzip/brotli compression

## Monitoring and Logging

### Error Logging

```typescript
console.error('Book creation failed:', {
  error: error.message,
  userId: session.userId,
  timestamp: new Date().toISOString()
  // Never log: tokens, passwords, full request bodies
})
```

### Metrics to Track

1. **API Response Times**: Monitor endpoint performance
2. **Error Rates**: Track 4xx and 5xx responses
3. **Database Query Performance**: Monitor slow queries
4. **Image Load Times**: Track image optimization effectiveness

### Future Enhancements

1. **Structured Logging**: Use logging library (Winston, Pino)
2. **Error Tracking**: Integrate Sentry or similar
3. **Performance Monitoring**: Add APM tool
4. **Analytics**: Track user interactions

## Deployment Considerations

### Environment Variables

Required environment variables:
```
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
```

### Database Migration

```bash
# Production deployment
npx prisma migrate deploy

# Verify migration
npx prisma db pull
```

### Build Process

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build Next.js application
npm run build

# Start production server
npm start
```

### Health Checks

Implement health check endpoint:
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ status: 'healthy' })
  } catch (error) {
    return Response.json({ status: 'unhealthy' }, { status: 503 })
  }
}
```

## Accessibility Considerations

### Semantic HTML

1. **Proper Heading Hierarchy**: h1, h2, h3 in correct order
2. **Form Labels**: All inputs have associated labels
3. **Button Text**: Descriptive button text, not just icons
4. **Alt Text**: Meaningful alt text for all images

### Keyboard Navigation

1. **Tab Order**: Logical tab order through forms and controls
2. **Focus Indicators**: Visible focus states for all interactive elements
3. **Keyboard Shortcuts**: Standard shortcuts work (Enter to submit, Esc to close)

### Screen Reader Support

1. **ARIA Labels**: Where semantic HTML insufficient
2. **Live Regions**: Announce dynamic content changes
3. **Error Announcements**: Validation errors announced to screen readers

### Color Contrast

1. **WCAG AA Compliance**: Minimum 4.5:1 contrast ratio for text
2. **Focus Indicators**: High contrast focus outlines
3. **Error States**: Not relying solely on color

## Future Enhancements

### Short Term

1. **Bulk Operations**: Select and delete/publish multiple books
2. **Image Upload**: Direct upload to Cloudinary
3. **Rich Text Editor**: Enhanced description editing
4. **Book Preview**: Preview before publishing
5. **Audit Log**: Track who changed what and when

### Medium Term

1. **Advanced Search**: Full-text search across title, author, description
2. **Tags**: Additional categorization beyond predefined categories
3. **Related Books**: Suggest related books based on category
4. **Reading Lists**: Curated collections of books
5. **Book Reviews**: Allow users to leave reviews

### Long Term

1. **Multi-Language Support**: Internationalization
2. **Book Recommendations**: AI-powered recommendations
3. **Reading Progress**: Track reading progress for users
4. **Social Features**: Share books, reading lists
5. **Analytics Dashboard**: Track popular books, categories

## Conclusion

This design provides a comprehensive, secure, and performant Books Management System that integrates seamlessly with the existing church website infrastructure. The architecture follows Next.js 16 best practices, leverages existing authentication patterns, and provides a solid foundation for future enhancements.

The dual testing approach (unit tests + property-based tests) ensures correctness across all inputs while maintaining practical test coverage. The 21 correctness properties provide formal specifications that can be verified through automated testing.

The implementation plan prioritizes core functionality (API and dashboard) while leaving room for future enhancements like advanced search, bulk operations, and social features.
