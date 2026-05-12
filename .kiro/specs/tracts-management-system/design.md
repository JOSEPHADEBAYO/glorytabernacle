# Design Document: Tracts Management System

## Overview

The Tracts Management System is a full-stack feature that enables church administrators to manage a curated library of religious tracts (pamphlets/documents) through a secure dashboard interface while displaying published tracts to public website visitors. The system implements RESTful API endpoints using Next.js 16 App Router route handlers, integrates with an existing PostgreSQL database via Prisma ORM, leverages the existing session-based authentication system, and supports file uploads for both cover images and PDF documents via Cloudinary integration.

### Key Design Goals

1. **Separation of Concerns**: Clear boundaries between API layer, data access layer, UI components, authentication, and file upload handling
2. **Type Safety**: Comprehensive TypeScript types shared between client and server
3. **Security**: Authentication enforcement at both middleware and API levels, secure file upload handling
4. **Performance**: Optimized image loading, efficient database queries with indexes, server-side rendering for public pages, CDN delivery for uploaded files
5. **User Experience**: Intuitive dashboard interface with file upload, responsive public display, clear error messaging, loading states
6. **Maintainability**: Consistent patterns following Next.js 16 conventions, reusable validation logic, following Books Management System architecture
7. **File Management**: Seamless integration with existing Cloudinary upload endpoint for both images and PDFs

### Technology Stack

- **Framework**: Next.js 16.2.4 (App Router)
- **Database**: PostgreSQL with Prisma ORM 7.8.0
- **Authentication**: Session-based with HTTP-only cookies
- **File Storage**: Cloudinary (via existing /api/upload endpoint)
- **UI**: React 19.2.4, Tailwind CSS 4
- **Image Optimization**: Next.js Image component
- **Validation**: Zod for runtime type validation
- **Testing**: Vitest with fast-check for property-based testing

### Relationship to Books Management System

The Tracts Management System follows the same architectural patterns as the Books Management System:
- Identical API structure (POST, GET, GET/:id, PUT/:id, DELETE/:id)
- Same authentication flow using session tokens
- Similar dashboard component structure (grid/table views, CRUD operations)
- Consistent validation patterns using Zod
- Same database patterns with Prisma ORM
- Parallel public display pages with server-side rendering

**Key Differences**:
- Tracts have `documentUrl` (PDF) instead of `purchaseUrl` (external link)
- Tracts use 9 predefined categories specific to Christian literature
- Tracts require two file uploads: cover image AND PDF document
- Tract descriptions are limited to 1000 characters (vs 2000 for books)

## Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Public Tracts Page]
        B[Dashboard Tracts Manager]
    end
    
    subgraph "Next.js Middleware"
        C[Authentication Middleware]
    end
    
    subgraph "API Layer"
        D[POST /api/tracts]
        E[GET /api/tracts]
        F[GET /api/tracts/id]
        G[PUT /api/tracts/id]
        H[DELETE /api/tracts/id]
        I[POST /api/upload]
    end
    
    subgraph "Business Logic"
        J[Validation Layer]
        K[Tract Service]
    end
    
    subgraph "Data Layer"
        L[Prisma Client]
        M[(PostgreSQL)]
    end
    
    subgraph "External Services"
        N[Cloudinary CDN]
    end
    
    A -->|SSR Fetch| E
    B -->|Upload Files| I
    B -->|API Calls| D
    B -->|API Calls| E
    B -->|API Calls| G
    B -->|API Calls| H
    
    C -->|Protects| B
    C -->|Validates Session| D
    C -->|Validates Session| G
    C -->|Validates Session| H
    C -->|Validates Session| I
    
    D --> J
    E --> J
    F --> J
    G --> J
    H --> J
    
    I --> N
    N -->|Returns URL| I
    
    J --> K
    K --> L
    L --> M
```

### Request Flow

#### Authenticated Request with File Upload (Dashboard)
1. User selects cover image file in TractsManager component
2. Client uploads file to /api/upload endpoint
3. Upload endpoint validates file (type, size)
4. Upload endpoint sends file to Cloudinary
5. Cloudinary returns secure URL
6. Client stores URL in form state
7. User selects PDF document file
8. Client uploads PDF to /api/upload endpoint
9. Upload endpoint validates PDF (type, size)
10. Upload endpoint sends PDF to Cloudinary
11. Cloudinary returns secure URL for PDF
12. Client stores PDF URL in form state
13. User submits tract creation form with both URLs
14. Client sends API request with session cookie
15. Next.js middleware validates session token
16. Route handler extracts session from cookies
17. Validation layer validates request payload (including URLs)
18. Tract service executes business logic
19. Prisma client performs database operation
20. Response flows back through layers

#### Authenticated CRUD Request (Dashboard)
1. User interacts with TractsManager component
2. Client sends API request with session cookie
3. Next.js middleware validates session token
4. Route handler extracts session from cookies
5. Validation layer validates request payload
6. Tract service executes business logic
7. Prisma client performs database operation
8. Response flows back through layers

#### Public Request (Website)
1. User visits /tracts page
2. Server component fetches published tracts
3. Direct Prisma query (no API call needed)
4. Server-side rendering with optimized images
5. HTML sent to client with Cloudinary URLs for images and PDFs

### File Upload Flow

```mermaid
sequenceDiagram
    participant User
    participant TractsManager
    participant UploadAPI
    participant Cloudinary
    participant TractsAPI
    participant DB
    
    User->>TractsManager: Select cover image
    TractsManager->>UploadAPI: POST /api/upload (image)
    UploadAPI->>UploadAPI: Validate file type (JPG/PNG)
    UploadAPI->>UploadAPI: Validate file size (<5MB)
    UploadAPI->>Cloudinary: Upload image
    Cloudinary->>UploadAPI: Return secure URL
    UploadAPI->>TractsManager: Return image URL
    TractsManager->>TractsManager: Store URL in state
    TractsManager->>TractsManager: Display preview
    
    User->>TractsManager: Select PDF document
    TractsManager->>UploadAPI: POST /api/upload (PDF)
    UploadAPI->>UploadAPI: Validate file type (PDF)
    UploadAPI->>UploadAPI: Validate file size (<10MB)
    UploadAPI->>Cloudinary: Upload PDF
    Cloudinary->>UploadAPI: Return secure URL
    UploadAPI->>TractsManager: Return PDF URL
    TractsManager->>TractsManager: Store URL in state
    TractsManager->>TractsManager: Display filename
    
    User->>TractsManager: Submit form
    TractsManager->>TractsAPI: POST /api/tracts (with URLs)
    TractsAPI->>DB: Create tract record
    DB->>TractsAPI: Return tract
    TractsAPI->>TractsManager: Return success
```

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

#### POST /api/tracts/route.ts

Creates a new tract record.

**Request Body**:
```typescript
{
  title: string
  category: TractCategory
  description: string
  coverImage: string (URL)
  documentUrl: string (URL)
  published: boolean
}
```

**Response** (201 Created):
```typescript
{
  id: string
  title: string
  category: string
  description: string
  coverImage: string
  documentUrl: string
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

#### GET /api/tracts/route.ts

Lists all tracts with optional filtering.

**Query Parameters**:
- `published`: "true" | "false" (optional)
- `category`: TractCategory (optional)

**Response** (200 OK):
```typescript
{
  tracts: Tract[]
}
```

#### GET /api/tracts/[id]/route.ts

Retrieves a single tract by ID.

**Response** (200 OK):
```typescript
{
  id: string
  title: string
  category: string
  description: string
  coverImage: string
  documentUrl: string
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

**Error Responses**:
- 404: Tract not found
- 401: Unauthorized
- 500: Internal server error

#### PUT /api/tracts/[id]/route.ts

Updates an existing tract.

**Request Body** (all fields optional):
```typescript
{
  title?: string
  category?: TractCategory
  description?: string
  coverImage?: string (URL)
  documentUrl?: string (URL)
  published?: boolean
}
```

**Response** (200 OK):
```typescript
{
  id: string
  title: string
  category: string
  description: string
  coverImage: string
  documentUrl: string
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

**Error Responses**:
- 400: Validation error
- 404: Tract not found
- 401: Unauthorized
- 500: Internal server error

#### DELETE /api/tracts/[id]/route.ts

Deletes a tract permanently.

**Response** (200 OK):
```typescript
{
  message: "Tract deleted successfully"
}
```

**Error Responses**:
- 404: Tract not found
- 401: Unauthorized
- 500: Internal server error

#### POST /api/upload/route.ts (Existing)

Uploads files to Cloudinary. Used for both cover images and PDF documents.

**Request**: multipart/form-data with `file` field

**Response** (200 OK):
```typescript
{
  url: string // Cloudinary secure URL
  publicId: string // Cloudinary public ID
}
```

**Error Responses**:
- 400: Invalid file type or size
- 401: Unauthorized
- 500: Upload failed

**File Type Validation**:
- Images: JPG, PNG (max 5MB)
- PDFs: PDF only (max 10MB)

### Shared Types

**lib/types/tract.ts**:
```typescript
export const TRACT_CATEGORIES = [
  'Theology',
  'Evangelism',
  'Discipleship',
  'Prayer & Intercession',
  'Christian Living',
  'Salvation',
  'Faith & Doctrine',
  'End Times',
  'Other',
] as const

export type TractCategory = typeof TRACT_CATEGORIES[number]

export interface Tract {
  id: string
  title: string
  category: TractCategory
  description: string
  coverImage: string
  documentUrl: string
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateTractInput {
  title: string
  category: TractCategory
  description: string
  coverImage: string
  documentUrl: string
  published: boolean
}

export interface UpdateTractInput {
  title?: string
  category?: TractCategory
  description?: string
  coverImage?: string
  documentUrl?: string
  published?: boolean
}
```

### Validation Schemas

**lib/validation/tract.ts**:
```typescript
import { z } from 'zod'
import { TRACT_CATEGORIES } from '@/lib/types/tract'

const urlSchema = z.string().url('Must be a valid URL')

export const createTractSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long'),
  category: z.enum(TRACT_CATEGORIES, {
    errorMap: () => ({ message: 'Invalid category' })
  }),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  coverImage: urlSchema,
  documentUrl: urlSchema,
  published: z.boolean().default(false)
})

export const updateTractSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  category: z.enum(TRACT_CATEGORIES).optional(),
  description: z.string().trim().min(10).max(1000).optional(),
  coverImage: urlSchema.optional(),
  documentUrl: urlSchema.optional(),
  published: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
})

export const tractQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
  category: z.enum(TRACT_CATEGORIES).optional()
})
```

### Authentication Helper

Uses existing `lib/auth/session.ts`:
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

export async function getSessionUser(token: string): Promise<{ id: string; email: string } | null> {
  if (!token) return null
  
  // Placeholder - return hardcoded super admin for now
  return {
    id: 'super-admin',
    email: 'adeolusegun1000@gmail.com'
  }
}
```

### Component Architecture

#### TractsManager Component (New)

Location: `components/dashboard/tracts-manager.tsx`

**Purpose**: Dashboard component for managing tracts with full CRUD operations and file upload.

**Component Structure**:
```typescript
interface TractsManagerProps {
  initialTracts: Tract[]
}

// Main component with state management
export function TractsManager({ initialTracts }: TractsManagerProps)

// Sub-components
function TractCard({ tract, onEdit, onDelete, onTogglePublish })
function AddTractModal({ onClose, onSuccess })
function EditTractModal({ tract, onClose, onSuccess })
function TractFilters({ onFilterChange })
function SearchBar({ onSearch })
function FileUploadField({ label, accept, maxSize, onUpload, currentUrl })
```

**Key Features**:
1. **Grid/Table View Toggle**: Switch between grid and table layouts
2. **CRUD Operations**: Create, read, update, delete tracts
3. **File Upload**: Upload cover images (JPG/PNG, max 5MB) and PDFs (max 10MB)
4. **Search**: Filter by title
5. **Category Filter**: Filter by tract category
6. **Published Toggle**: Quick toggle for published status
7. **Draft Badge**: Visual indicator for unpublished tracts
8. **Loading States**: Spinners during operations
9. **Error Handling**: Toast notifications for errors
10. **Confirmation Dialogs**: Confirm before delete
11. **Pagination**: Table view with 10 items per page
12. **Infinite Scroll**: Grid view loads 12 items at a time

**State Management**:
```typescript
const [tracts, setTracts] = useState(initialTracts)
const [isAddModalOpen, setIsAddModalOpen] = useState(false)
const [isEditModalOpen, setIsEditModalOpen] = useState(false)
const [editingTract, setEditingTract] = useState<Tract | null>(null)
const [isLoading, setIsLoading] = useState(false)
const [togglingTractId, setTogglingTractId] = useState<string | null>(null)
const [deletingTractId, setDeletingTractId] = useState<string | null>(null)
const [selectedCategory, setSelectedCategory] = useState<string>('All Categories')
const [searchQuery, setSearchQuery] = useState<string>('')
const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
const [currentPage, setCurrentPage] = useState(1)
const [gridDisplayCount, setGridDisplayCount] = useState(12)

// File upload state
const [uploadingCoverImage, setUploadingCoverImage] = useState(false)
const [uploadingDocument, setUploadingDocument] = useState(false)
const [coverImageUrl, setCoverImageUrl] = useState<string>('')
const [documentUrl, setDocumentUrl] = useState<string>('')
```

**File Upload Handler**:
```typescript
async function handleFileUpload(
  file: File,
  fileType: 'image' | 'pdf'
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Upload failed')
  }
  
  const data = await response.json()
  return data.url
}
```

#### TractGrid Component (Update Existing)

Location: `app/tracts/tract-grid.tsx`

**Current State**: Displays hardcoded tract data
**New State**: Receives tracts as props from server component

```typescript
interface TractGridProps {
  tracts: Tract[]
}

export function TractGrid({ tracts }: TractGridProps)
```

**Features**:
1. Responsive grid layout (1/2/3 columns)
2. Cover image display with Next.js Image optimization
3. Category badge
4. Title and description
5. "View PDF" button linking to documentUrl
6. Search by title
7. Filter by category

#### Public Tracts Page (Update Existing)

Location: `app/tracts/page.tsx`

**Current State**: Server component with hardcoded data
**New State**: Fetches published tracts from database

```typescript
import { prisma } from '@/lib/prisma'
import { TractGrid } from './tract-grid'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'

export default async function TractsPage() {
  // Fetch published tracts from database
  let tracts = []
  let error = null

  try {
    tracts = await prisma.tract.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' }
    })
  } catch (err) {
    console.error('Error fetching tracts:', err)
    error = 'Failed to load tracts. Please try again later.'
  }

  return (
    <>
      <TopNavBar />
      {/* Hero section */}
      <section className="tract-hero">
        {/* Hero content */}
      </section>
      
      {/* Tracts grid section */}
      <section className="tracts-section">
        {error ? (
          <div className="error-message">{error}</div>
        ) : tracts.length === 0 ? (
          <div className="empty-state">No tracts available</div>
        ) : (
          <TractGrid tracts={tracts} />
        )}
      </section>
      
      {/* Newsletter section */}
      <Footer />
    </>
  )
}
```

## Data Models

### Prisma Schema

Add the Tract model to `prisma/schema.prisma`:

```prisma
model Tract {
  id          String   @id @default(cuid())
  title       String
  category    String
  description String   @db.Text
  coverImage  String   // Cloudinary URL
  documentUrl String   // Cloudinary URL for PDF
  published   Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([published])
  @@index([category])
}
```

### Database Indexes

Indexes optimize common queries:
- `@@index([published])`: Fast filtering for public display (published=true)
- `@@index([category])`: Efficient category-based filtering

### Migration Strategy

```bash
# Create migration
npx prisma migrate dev --name add_tract_model

# Generate Prisma client
npx prisma generate

# Apply migration to production
npx prisma migrate deploy
```

### Migration File

The migration will create:
```sql
CREATE TABLE "Tract" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tract_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Tract_published_idx" ON "Tract"("published");
CREATE INDEX "Tract_category_idx" ON "Tract"("category");
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
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    // 3. Execute business logic
    const tract = await prisma.tract.create({
      data: {
        ...validation.data,
        createdBy: user.id
      }
    })

    // 4. Return success response
    return NextResponse.json(tract, { status: 201 })

  } catch (error) {
    // 5. Handle unexpected errors
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
```

#### File Upload Error Handling

```typescript
async function handleFileUpload(file: File, fileType: 'image' | 'pdf') {
  try {
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png']
    const validPdfTypes = ['application/pdf']
    const validTypes = fileType === 'image' ? validImageTypes : validPdfTypes
    
    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Expected ${fileType === 'image' ? 'JPG or PNG' : 'PDF'}`)
    }
    
    // Validate file size
    const maxSize = fileType === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024 // 5MB or 10MB
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${fileType === 'image' ? '5MB' : '10MB'}`)
    }
    
    // Upload to Cloudinary
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }
    
    const data = await response.json()
    return data.url
    
  } catch (error) {
    console.error('File upload error:', error)
    toast({
      title: 'Upload failed',
      description: error instanceof Error ? error.message : 'Unknown error',
      variant: 'destructive'
    })
    throw error
  }
}
```

#### Client-Side Error Handling

```typescript
async function handleCreateTract(data: CreateTractInput) {
  try {
    setIsLoading(true)
    
    const response = await fetch('/api/tracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create tract')
    }

    const tract = await response.json()
    
    toast({
      title: 'Tract created successfully',
      description: 'The tract has been added to the library.'
    })
    
    await refetchTracts()
    return tract
    
  } catch (error) {
    console.error('Create tract error:', error)
    toast({
      title: 'Failed to create tract',
      description: error instanceof Error ? error.message : 'Unknown error',
      variant: 'destructive'
    })
    throw error
  } finally {
    setIsLoading(false)
  }
}
```

### Error Categories

1. **Validation Errors (400)**:
   - Missing required fields (title, category, description, coverImage, documentUrl)
   - Invalid data types
   - Invalid URLs (coverImage, documentUrl)
   - Invalid category (not in predefined list)
   - Field length violations (title >200, description >1000)
   - File type validation (not JPG/PNG for images, not PDF for documents)
   - File size validation (>5MB for images, >10MB for PDFs)

2. **Authentication Errors (401)**:
   - Missing session token
   - Invalid session token
   - Expired session

3. **Not Found Errors (404)**:
   - Tract ID doesn't exist

4. **Server Errors (500)**:
   - Database connection failures
   - Cloudinary upload failures
   - Unexpected exceptions
   - Prisma errors

### Logging Strategy

```typescript
// Server-side only - never log sensitive data
console.error('Error creating tract:', {
  error: error.message,
  userId: session.userId,
  timestamp: new Date().toISOString()
  // Never log: passwords, tokens, full request bodies, file contents
})
```

## Testing Strategy

### Testing Approach

The Tracts Management System requires a dual testing approach:

1. **Unit Tests**: Validate specific examples, edge cases, error conditions, and UI behavior
2. **Property-Based Tests**: Verify universal properties across all inputs

### Property-Based Testing Applicability

This feature **IS suitable for property-based testing** because:
- It involves data transformation (validation, serialization, CRUD operations)
- It has clear input/output behavior (API endpoints with defined contracts)
- Universal properties hold across all valid inputs
- The input space is large (strings, URLs, categories, boolean values)
- Core logic is testable as pure functions (validation, filtering, ordering)

**Testing Library**: fast-check (already installed)

**Configuration**:
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: tracts-management-system, Property {number}: {property_text}`

### Unit Testing

**Focus Areas**:
- API route handlers with specific payloads
- Validation schema edge cases
- Error handling scenarios
- Component rendering with specific data
- File upload UI interactions
- Integration between components and API
- Modal dialogs and confirmation prompts
- Loading states and toast notifications

**Example Unit Tests**:

```typescript
// __tests__/api/tracts/create.test.ts
describe('POST /api/tracts', () => {
  it('creates a tract with valid data', async () => {
    const response = await POST(mockRequest({
      title: 'Test Tract',
      category: 'Evangelism',
      description: 'Test description for tract',
      coverImage: 'https://example.com/image.jpg',
      documentUrl: 'https://example.com/document.pdf',
      published: false
    }))
    
    expect(response.status).toBe(201)
    const tract = await response.json()
    expect(tract.title).toBe('Test Tract')
    expect(tract.category).toBe('Evangelism')
  })

  it('returns 400 for missing title', async () => {
    const response = await POST(mockRequest({
      category: 'Evangelism',
      // title missing
    }))
    
    expect(response.status).toBe(400)
    const error = await response.json()
    expect(error.error).toBe('Validation failed')
  })

  it('returns 401 without session token', async () => {
    const response = await POST(mockRequestWithoutAuth({
      title: 'Test Tract',
      // ... valid data
    }))
    
    expect(response.status).toBe(401)
  })
})

// __tests__/components/tracts-manager.test.tsx
describe('TractsManager', () => {
  it('displays confirmation dialog before delete', async () => {
    const { getByText, getByRole } = render(
      <TractsManager initialTracts={mockTracts} />
    )
    
    const deleteButton = getByText('Delete')
    fireEvent.click(deleteButton)
    
    expect(getByRole('dialog')).toBeInTheDocument()
    expect(getByText('Are you sure?')).toBeInTheDocument()
  })

  it('shows loading spinner during file upload', async () => {
    const { getByLabelText, getByTestId } = render(
      <AddTractModal onClose={jest.fn()} onSuccess={jest.fn()} />
    )
    
    const fileInput = getByLabelText('Cover Image')
    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    expect(getByTestId('upload-spinner')).toBeInTheDocument()
  })
})
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria through the prework process, I identified the following redundancies and consolidated properties:

**Redundant Properties Eliminated**:
- Requirements 1.5, 1.6, 5.1 all test URL and category validation → Combined into Property 1
- Requirements 1.7, 1.9, 1.10 all test creation response completeness → Combined into Property 3
- Requirements 2.1, 8.3 both test ordering by creation date → Combined into Property 5
- Requirements 2.3, 2.4, 5.5, 6.8, 8.6 all test filtering (published/category) → Combined into Properties 6 and 14
- Requirements 2.6, 5.4, 8.2, 8.4 all test field rendering → Combined into Property 7
- Requirements 2.7, 6.6 both test draft badge display → Combined into Property 8
- Requirements 3.3, 3.6, 4.2, 4.4 all test 404 for non-existent IDs → Combined into Property 13
- Requirements 6.2, 6.3, 6.8, 8.1 all test published status filtering → Combined into Property 14
- Requirements 7.1, 7.2, 7.4 all test authentication enforcement → Combined into Property 15
- Requirements 1.8, 3.7 both test validation error responses → Combined into Property 2

**Properties Consolidated**:
- Create, update, and delete validation share common patterns → Grouped by operation type
- UI rendering properties consolidated where they test the same behavior
- Error handling properties unified across endpoints
- File upload validation consolidated by file type

### Property 1: Input Validation Completeness

*For any* tract creation or update request, the API SHALL validate all required fields (title, category, description, coverImage, documentUrl) are present, category is one of the nine predefined values, and all URL fields (coverImage, documentUrl) are properly formatted URLs.

**Validates: Requirements 1.2, 1.4, 1.5, 1.6, 3.4, 5.1, 18.1, 18.2, 18.3, 18.4, 18.5**

### Property 2: Validation Error Responses

*For any* invalid tract creation or update request (missing required fields, invalid URLs, invalid category, invalid data types, field length violations), the API SHALL return HTTP status 400 with a descriptive error message listing all validation failures.

**Validates: Requirements 1.8, 3.7, 13.1, 13.2, 13.8, 13.9, 18.7**

### Property 3: Tract Creation Round-Trip

*For any* valid tract creation payload, creating a tract and then retrieving it SHALL return a record with all input fields preserved, plus automatically generated id, createdAt, updatedAt, and createdBy fields.

**Validates: Requirements 1.1, 1.7, 1.9, 1.10, 2.2**

### Property 4: Published Field Default Handling

*For any* tract creation request, the published field SHALL default to false when not provided, and SHALL be stored correctly when explicitly provided as true or false.

**Validates: Requirements 1.3, 6.1**

### Property 5: Ordering Consistency

*For any* set of tracts with different creation timestamps, querying the tracts list SHALL return them ordered by createdAt descending (newest first).

**Validates: Requirements 2.1, 8.3**

### Property 6: Category Filtering Accuracy

*For any* tract category and any set of tracts with various categories, filtering by that category SHALL return only tracts matching that exact category.

**Validates: Requirements 2.4, 5.5, 8.6**

### Property 7: Complete Field Rendering

*For any* tract record, rendering it in either the dashboard or public page SHALL display all core fields: cover image, title, category, description, and PDF document link.

**Validates: Requirements 2.6, 5.4, 8.2, 8.4**

### Property 8: Draft Status Indication

*For any* tract where published equals false, the dashboard SHALL display a "Draft" badge, and for any tract where published equals true, no draft badge SHALL appear.

**Validates: Requirements 2.7, 6.6**

### Property 9: Tract Count Accuracy

*For any* set of tracts, the dashboard SHALL display a count that exactly equals the number of tracts in the set.

**Validates: Requirements 2.8**

### Property 10: Update Field Preservation

*For any* tract update request, only the fields specified in the update payload SHALL be modified, while all other fields (except updatedAt) SHALL remain unchanged, and createdAt and createdBy SHALL never change.

**Validates: Requirements 3.1, 3.2, 3.8, 3.9**

### Property 11: Update Response Accuracy

*For any* valid tract update, the API SHALL return HTTP status 200 with the complete updated tract record reflecting all changes.

**Validates: Requirements 3.5**

### Property 12: Deletion Completeness

*For any* existing tract, successfully deleting it SHALL remove it from the database such that subsequent queries for that tract return 404, and it SHALL not appear in any list results.

**Validates: Requirements 4.1, 4.3, 4.6**

### Property 13: Not Found Error Consistency

*For any* non-existent tract ID, attempting to retrieve, update, or delete that tract SHALL return HTTP status 404 with an error message.

**Validates: Requirements 3.3, 3.6, 4.2, 4.4**

### Property 14: Published Status Filtering

*For any* set of tracts with mixed published values, querying the public tracts page SHALL return only tracts where published equals true, while querying the dashboard SHALL return all tracts regardless of published status.

**Validates: Requirements 2.3, 6.2, 6.3, 6.8, 8.1**

### Property 15: Authentication Enforcement

*For any* API request to create, update, delete tracts, or upload files without a valid session token, the API SHALL return HTTP status 401 with an "Unauthorized" error message.

**Validates: Requirements 7.1, 7.2, 7.4**

### Property 16: Token Security

*For any* API response or server log, authentication tokens SHALL NOT be exposed in response bodies or log messages.

**Validates: Requirements 7.7**

### Property 17: PDF Document Link Rendering

*For any* tract with a documentUrl, the public page SHALL display a "View PDF" or "Download" button that links to that URL with target="_blank" to open in a new tab.

**Validates: Requirements 8.4, 8.5**

### Property 18: Title Search Accuracy

*For any* search query string and any set of tracts with various titles, searching by title SHALL return only tracts whose title contains the query string (case-insensitive).

**Validates: Requirements 8.7, 16.2**

### Property 19: Error Format Consistency

*For any* API error response, the response SHALL be valid JSON with an "error" field containing a descriptive message, and SHALL use appropriate HTTP status codes (400 for validation, 401 for auth, 404 for not found, 500 for server errors).

**Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.8**

### Property 20: Content-Type Header Consistency

*For any* API request and response, the Content-Type header SHALL be "application/json" for JSON payloads.

**Validates: Requirements 14.7, 14.8**

### Property 21: Query Parameter Filtering

*For any* combination of published and category query parameters on GET /api/tracts, the API SHALL return only tracts matching all specified filters (AND logic).

**Validates: Requirements 2.3, 2.4, 14.10, 16.5**

### Property 22: Cover Image File Type Validation

*For any* file upload attempt for a cover image, the system SHALL accept only JPG and PNG formats and reject all other file types with a descriptive error message.

**Validates: Requirements 10.2, 10.9**

### Property 23: Cover Image File Size Validation

*For any* file upload attempt for a cover image, the system SHALL accept only files under 5MB and reject larger files with a descriptive error message.

**Validates: Requirements 10.3, 10.10**

### Property 24: PDF Document File Type Validation

*For any* file upload attempt for a PDF document, the system SHALL accept only PDF format and reject all other file types with a descriptive error message.

**Validates: Requirements 11.2, 11.9**

### Property 25: PDF Document File Size Validation

*For any* file upload attempt for a PDF document, the system SHALL accept only files under 10MB and reject larger files with a descriptive error message.

**Validates: Requirements 11.3, 11.10**

### Property 26: Cloudinary URL Storage

*For any* successful file upload (cover image or PDF), the upload endpoint SHALL return a Cloudinary secure URL, and that URL SHALL be stored in the appropriate field (coverImage or documentUrl) in the tract record.

**Validates: Requirements 10.5, 10.6, 11.5, 11.6**

## File Upload Integration

### Upload Endpoint Enhancement

The existing `/api/upload` endpoint needs enhancement to support both images and PDFs with different validation rules:

**Current Implementation**: Supports image uploads only
**Required Enhancement**: Support both images (JPG/PNG, max 5MB) and PDFs (max 10MB)

**Enhanced Upload Handler**:
```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { getSessionToken } from '@/lib/auth/session'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type and size
    const validImageTypes = ['image/jpeg', 'image/png']
    const validPdfTypes = ['application/pdf']
    const isImage = validImageTypes.includes(file.type)
    const isPdf = validPdfTypes.includes(file.type)

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and PDF files are allowed.' },
        { status: 400 }
      )
    }

    // Check file size limits
    const maxImageSize = 5 * 1024 * 1024 // 5MB
    const maxPdfSize = 10 * 1024 * 1024 // 10MB
    const maxSize = isImage ? maxImageSize : maxPdfSize

    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: `File too large. Maximum size is ${isImage ? '5MB' : '10MB'}.` 
        },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: isPdf ? 'tracts/documents' : 'tracts/images',
          resource_type: isPdf ? 'raw' : 'image',
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      uploadStream.end(buffer)
    })

    const uploadResult = result as { secure_url: string; public_id: string }

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
```

### File Upload UI Components

**FileUploadField Component**:
```typescript
interface FileUploadFieldProps {
  label: string
  accept: string // e.g., "image/jpeg,image/png" or "application/pdf"
  maxSize: number // in bytes
  currentUrl?: string
  onUpload: (url: string) => void
  onRemove: () => void
}

export function FileUploadField({
  label,
  accept,
  maxSize,
  currentUrl,
  onUpload,
  onRemove
}: FileUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024)
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }

    // Validate file type
    const acceptedTypes = accept.split(',')
    if (!acceptedTypes.includes(file.type)) {
      setError('Invalid file type.')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      onUpload(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="file-upload-field">
      <label>{label}</label>
      
      {currentUrl ? (
        <div className="file-preview">
          {accept.includes('image') ? (
            <Image src={currentUrl} alt="Preview" width={200} height={200} />
          ) : (
            <div className="pdf-preview">
              <FileIcon />
              <span>{currentUrl.split('/').pop()}</span>
            </div>
          )}
          <button onClick={onRemove} type="button">Remove</button>
        </div>
      ) : (
        <div className="file-input-wrapper">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {isUploading && <Spinner />}
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  )
}
```

## Image Optimization Strategy

### Next.js Image Component

All tract cover images will use the Next.js `Image` component for automatic optimization:

```typescript
import Image from 'next/image'

<Image
  src={tract.coverImage}
  alt={tract.title}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

### Optimization Features

1. **Automatic Format Selection**: Next.js serves WebP/AVIF when supported
2. **Responsive Images**: `sizes` attribute ensures appropriate image size for viewport
3. **Lazy Loading**: Images load as they enter viewport
4. **Blur Placeholder**: Optional blur-up effect during load
5. **External URL Support**: Works with Cloudinary URLs

### Image Loading Error Handling

```typescript
<Image
  src={tract.coverImage}
  alt={tract.title}
  fill
  className="object-cover"
  onError={(e) => {
    e.currentTarget.src = '/placeholder-tract.png'
  }}
/>
```

### Cloudinary Integration Benefits

1. **CDN Delivery**: Fast global content delivery
2. **Automatic Optimization**: Cloudinary optimizes images automatically
3. **Transformation Support**: Can apply transformations via URL parameters
4. **Secure Storage**: Files stored securely with access control
5. **Backup and Redundancy**: Built-in backup and redundancy

## Implementation Plan

### Phase 1: Database and Types (Priority: High)

1. Add Tract model to Prisma schema
2. Create and run database migration
3. Generate Prisma client
4. Create shared types (`lib/types/tract.ts`)
5. Create validation schemas (`lib/validation/tract.ts`)

### Phase 2: API Layer (Priority: High)

1. Enhance `/api/upload` endpoint to support PDFs
2. Implement POST `/api/tracts/route.ts`
3. Implement GET `/api/tracts/route.ts`
4. Implement GET `/api/tracts/[id]/route.ts`
5. Implement PUT `/api/tracts/[id]/route.ts`
6. Implement DELETE `/api/tracts/[id]/route.ts`

### Phase 3: Dashboard Components (Priority: High)

1. Create TractsManager component (`components/dashboard/tracts-manager.tsx`)
2. Create FileUploadField component
3. Create AddTractModal component
4. Create EditTractModal component
5. Add search and filter functionality
6. Add publish toggle feature
7. Add loading states and error handling
8. Add confirmation dialogs

### Phase 4: Public Display (Priority: Medium)

1. Update `app/tracts/page.tsx` to fetch from database
2. Update TractGrid component to accept props
3. Implement server-side rendering
4. Add search by title functionality
5. Add category filter
6. Add error handling for empty states
7. Test image optimization

### Phase 5: Testing (Priority: High)

1. Write unit tests for validation schemas
2. Write unit tests for API route handlers
3. Write property-based tests for all 26 properties
4. Write component tests for TractsManager
5. Write component tests for TractGrid
6. Write integration tests for file upload flow
7. Write integration tests for full CRUD flow

### Phase 6: Dashboard Integration (Priority: Medium)

1. Add Tracts menu item to dashboard sidebar
2. Create dashboard tracts page (`app/(dashboard)/dashboard/content/tracts/page.tsx`)
3. Integrate TractsManager component
4. Test dashboard navigation
5. Verify authentication protection

### Phase 7: Documentation (Priority: Low)

1. Add API documentation
2. Add component documentation
3. Update README with setup instructions
4. Document file upload process
5. Document environment variables

## Security Considerations

### Authentication

1. **Session Validation**: All mutating operations require valid session token
2. **HTTP-Only Cookies**: Session tokens stored in HTTP-only cookies prevent XSS
3. **Middleware Protection**: Dashboard routes protected at middleware level
4. **API-Level Checks**: Additional validation in each route handler
5. **Upload Protection**: File upload endpoint requires authentication

### Input Validation

1. **Schema Validation**: Zod schemas validate all inputs before database operations
2. **URL Validation**: Strict URL format validation prevents injection
3. **Length Limits**: Maximum lengths prevent buffer overflow attacks
4. **Type Safety**: TypeScript ensures type correctness
5. **File Type Validation**: Strict file type checking (JPG/PNG for images, PDF for documents)
6. **File Size Validation**: Maximum file sizes enforced (5MB for images, 10MB for PDFs)

### Data Exposure

1. **No Token Leakage**: Tokens never included in responses or logs
2. **Error Message Sanitization**: Generic error messages for production
3. **Sensitive Data Filtering**: No exposure of internal database details
4. **File URL Security**: Cloudinary URLs are secure and can be configured with access control

### SQL Injection Prevention

1. **Prisma ORM**: Parameterized queries prevent SQL injection
2. **No Raw SQL**: All queries use Prisma's type-safe API

### File Upload Security

1. **File Type Validation**: Only allowed file types accepted
2. **File Size Limits**: Prevent large file uploads that could cause DoS
3. **Virus Scanning**: Consider adding virus scanning for uploaded files (future enhancement)
4. **Content-Type Verification**: Verify actual file content matches declared type
5. **Cloudinary Security**: Leverage Cloudinary's built-in security features

## Performance Considerations

### Database Optimization

1. **Indexes**: `published` and `category` fields indexed for fast filtering
2. **Query Optimization**: Use `select` to fetch only needed fields
3. **Connection Pooling**: Prisma handles connection pooling automatically
4. **Efficient Queries**: Avoid N+1 queries, use proper joins

### Caching Strategy

1. **Server-Side Rendering**: Public pages pre-rendered at build time when possible
2. **Revalidation**: Use Next.js revalidation for updated content
3. **Client-Side Caching**: React Query or SWR for dashboard data (future enhancement)
4. **CDN Caching**: Cloudinary provides CDN caching for files

### Image and PDF Optimization

1. **Next.js Image**: Automatic optimization and lazy loading for images
2. **Responsive Images**: Appropriate sizes for different viewports
3. **CDN Delivery**: Files served from Cloudinary CDN
4. **Lazy Loading**: Images load as they enter viewport
5. **PDF Streaming**: PDFs opened in new tab for browser-native viewing

### API Response Size

1. **Pagination**: Limit results to prevent large payloads (future enhancement)
2. **Field Selection**: Return only necessary fields
3. **Compression**: Next.js handles gzip/brotli compression

### File Upload Performance

1. **Client-Side Validation**: Validate file type and size before upload
2. **Progress Indicators**: Show upload progress to users
3. **Chunked Uploads**: Consider chunked uploads for large files (future enhancement)
4. **Parallel Uploads**: Allow uploading cover image and PDF in parallel

## Monitoring and Logging

### Error Logging

```typescript
console.error('Tract creation failed:', {
  error: error.message,
  userId: session.userId,
  timestamp: new Date().toISOString()
  // Never log: tokens, passwords, full request bodies, file contents
})
```

### Metrics to Track

1. **API Response Times**: Monitor endpoint performance
2. **Error Rates**: Track 4xx and 5xx errors
3. **Database Query Performance**: Monitor slow queries
4. **Image Load Times**: Track image optimization effectiveness
5. **File Upload Success Rate**: Monitor upload failures
6. **File Upload Duration**: Track upload performance
7. **Storage Usage**: Monitor Cloudinary storage consumption

### Future Enhancements

1. **Structured Logging**: Use logging library (Winston, Pino)
2. **Error Tracking**: Integrate Sentry or similar
3. **Performance Monitoring**: Add APM tool
4. **Analytics**: Track user interactions
5. **Upload Analytics**: Track file types, sizes, success rates

## Deployment Considerations

### Environment Variables

Required environment variables:
```
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
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

### Cloudinary Configuration

1. **Storage Limits**: Monitor storage usage and set alerts
2. **Transformation Limits**: Monitor transformation usage
3. **Access Control**: Configure folder permissions
4. **Backup Strategy**: Ensure Cloudinary backups are enabled
5. **CDN Configuration**: Optimize CDN settings for performance

## Accessibility Considerations

### Semantic HTML

1. **Proper Heading Hierarchy**: h1, h2, h3 in correct order
2. **Form Labels**: All inputs have associated labels
3. **Button Text**: Descriptive button text, not just icons
4. **Alt Text**: Meaningful alt text for all images
5. **File Input Labels**: Clear labels for file upload fields

### Keyboard Navigation

1. **Tab Order**: Logical tab order through forms and controls
2. **Focus Indicators**: Visible focus states for all interactive elements
3. **Keyboard Shortcuts**: Standard shortcuts work (Enter to submit, Esc to close)
4. **File Upload**: Keyboard accessible file selection

### Screen Reader Support

1. **ARIA Labels**: Where semantic HTML insufficient
2. **Live Regions**: Announce dynamic content changes (upload progress, errors)
3. **Error Announcements**: Validation errors announced to screen readers
4. **Upload Status**: Announce upload progress and completion

### Color Contrast

1. **WCAG AA Compliance**: Minimum 4.5:1 contrast ratio for text
2. **Focus Indicators**: High contrast focus outlines
3. **Error States**: Not relying solely on color
4. **Draft Badges**: Sufficient contrast for visibility

## Responsive Design

### Breakpoints

1. **Mobile**: < 768px (single column)
2. **Tablet**: 768px - 1024px (two columns)
3. **Desktop**: > 1024px (three or more columns)

### Layout Adaptations

1. **Grid Layout**: Responsive grid for tract cards
2. **Table View**: Horizontal scroll on mobile
3. **Modals**: Full-screen on mobile, centered on desktop
4. **File Upload**: Touch-friendly on mobile
5. **Search and Filters**: Stack vertically on mobile

## Future Enhancements

### Short Term

1. **Bulk Operations**: Select and delete/publish multiple tracts
2. **Drag and Drop Upload**: Drag and drop file upload interface
3. **Rich Text Editor**: Enhanced description editing with formatting
4. **Tract Preview**: Preview tract before publishing
5. **Audit Log**: Track who changed what and when
6. **Download Statistics**: Track PDF download counts

### Medium Term

1. **Advanced Search**: Full-text search across title and description
2. **Tags**: Additional categorization beyond predefined categories
3. **Related Tracts**: Suggest related tracts based on category
4. **Tract Collections**: Curated collections of tracts
5. **Tract Series**: Group related tracts into series
6. **PDF Thumbnails**: Generate thumbnails from PDF first page
7. **Multi-Language Support**: Tracts in multiple languages

### Long Term

1. **Internationalization**: Full i18n support
2. **Tract Recommendations**: AI-powered recommendations
3. **Reading Progress**: Track reading progress for users
4. **Social Features**: Share tracts, collections
5. **Analytics Dashboard**: Track popular tracts, categories, downloads
6. **Version Control**: Track tract revisions
7. **Collaborative Editing**: Multiple editors can work on tracts
8. **Print-Ready PDFs**: Generate print-ready versions

## Conclusion

This design provides a comprehensive, secure, and performant Tracts Management System that integrates seamlessly with the existing church website infrastructure. The architecture follows Next.js 16 best practices, leverages existing authentication patterns, integrates with Cloudinary for file storage, and provides a solid foundation for future enhancements.

The dual testing approach (unit tests + property-based tests) ensures correctness across all inputs while maintaining practical test coverage. The 26 correctness properties provide formal specifications that can be verified through automated testing.

The implementation plan prioritizes core functionality (database, API, and dashboard) while leaving room for future enhancements like advanced search, bulk operations, and analytics. The file upload integration with Cloudinary provides a robust, scalable solution for managing both cover images and PDF documents.

Key architectural decisions:
- **Consistency with Books System**: Follows proven patterns from Books Management System
- **File Upload Strategy**: Leverages existing Cloudinary integration with enhanced validation
- **Dual File Types**: Supports both images (cover) and PDFs (documents) with appropriate validation
- **Security First**: Authentication, validation, and secure file handling at every layer
- **Performance Optimized**: Indexes, CDN delivery, image optimization, lazy loading
- **User Experience**: Loading states, error handling, confirmation dialogs, file previews
- **Maintainability**: Type safety, consistent patterns, comprehensive testing
