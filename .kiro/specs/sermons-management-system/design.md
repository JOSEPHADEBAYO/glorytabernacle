# Design Document: Sermons Management System

## Overview

The Sermons Management System is a full-stack feature that enables church administrators to manage a comprehensive library of sermon recordings through a secure dashboard interface while displaying published sermons to public website visitors. The system implements RESTful API endpoints using Next.js 16 App Router route handlers, integrates with an existing PostgreSQL database via Prisma ORM, leverages the existing session-based authentication system, and supports thumbnail image uploads via Cloudinary integration. Videos are hosted externally on YouTube.

### Key Design Goals

1. **Separation of Concerns**: Clear boundaries between API layer, data access layer, UI components, authentication, and file upload handling
2. **Type Safety**: Comprehensive TypeScript types shared between client and server
3. **Security**: Authentication enforcement at both middleware and API levels, secure file upload handling
4. **Performance**: Optimized image loading, efficient database queries with indexes, server-side rendering for public pages, CDN delivery for thumbnails
5. **User Experience**: Intuitive dashboard interface with thumbnail upload, featured sermon section, responsive public display, clear error messaging
6. **Maintainability**: Consistent patterns following Next.js 16 conventions, reusable validation logic, following Books/Tracts Management System architecture
7. **YouTube Integration**: Robust URL validation supporting multiple YouTube URL formats

### Technology Stack

- **Framework**: Next.js 16.2.4 (App Router)
- **Database**: PostgreSQL with Prisma ORM 7.8.0
- **Authentication**: Session-based with HTTP-only cookies
- **File Storage**: Cloudinary (via existing /api/upload endpoint — thumbnails only)
- **Video Hosting**: YouTube (external links, no upload)
- **UI**: React 19.2.4, Tailwind CSS 4
- **Image Optimization**: Next.js Image component
- **Validation**: Zod for runtime type validation
- **Testing**: Vitest with fast-check for property-based testing

### Relationship to Tracts Management System

The Sermons Management System follows the same architectural patterns as the Tracts and Books Management Systems:
- Identical API structure (POST, GET, GET/:id, PUT/:id, DELETE/:id)
- Same authentication flow using session tokens
- Similar dashboard component structure (grid/table views, CRUD operations)
- Consistent validation patterns using Zod
- Same database patterns with Prisma ORM
- Parallel public display pages with server-side rendering

**Key Differences from Tracts**:
- Single file upload (thumbnail image only — no PDF)
- YouTube URL validation instead of PDF document URL
- Optional `series` field for grouping sermons
- Explicit `date` field (DateTime) separate from `createdAt`
- `duration` stored as free-text string (e.g., "48 min", "1h 15min")
- Featured sermon section on public page (most recent published sermon)
- Series dropdown dynamically populated from existing sermon data

## Architecture

### System Architecture

```
Client Layer
  ├── Public Sermons Page (SSR)
  └── Dashboard Sermons Manager

Next.js Middleware
  └── Authentication Middleware

API Layer
  ├── POST   /api/sermons
  ├── GET    /api/sermons
  ├── GET    /api/sermons/[id]
  ├── PUT    /api/sermons/[id]
  ├── DELETE /api/sermons/[id]
  └── POST   /api/upload (existing)

Business Logic
  ├── Validation Layer (Zod)
  └── Sermon Service (Prisma)

Data Layer
  └── PostgreSQL via Prisma

External Services
  ├── Cloudinary CDN (thumbnails)
  └── YouTube (video hosting)
```

### Request Flow

#### Authenticated Request with Thumbnail Upload (Dashboard)
1. User selects thumbnail image in SermonsManager component
2. Client uploads file to /api/upload endpoint
3. Upload endpoint validates file (type: JPG/PNG, size: max 5MB)
4. Upload endpoint sends file to Cloudinary
5. Cloudinary returns secure URL
6. Client stores URL in form state and displays preview
7. User fills in remaining fields (title, speaker, date, duration, description, videoUrl, series, published)
8. User submits sermon creation form
9. Client sends API request with session cookie
10. Next.js middleware validates session token
11. Route handler validates payload with createSermonSchema
12. Prisma creates sermon record in database
13. Response flows back to client

#### Public Request (Website)
1. User visits /sermons page
2. Server component fetches published sermons directly via Prisma
3. Most recent published sermon identified for featured section
4. Server-side rendering with optimized thumbnail images
5. HTML sent to client with YouTube links for video playback

### Authentication Flow

Same pattern as Books/Tracts systems — session token in HTTP-only cookie validated at middleware and API levels.

## Components and Interfaces

### API Route Handlers

#### POST /api/sermons/route.ts

Creates a new sermon record.

**Request Body**:
```typescript
{
  title: string           // 1-200 chars
  series?: string         // optional, 1-100 chars
  speaker: string         // 1-100 chars
  date: string            // ISO date string
  duration: string        // free-text, e.g. "48 min"
  description: string     // 10-2000 chars
  thumbnail: string       // Cloudinary URL
  videoUrl: string        // YouTube URL
  published: boolean      // default false
}
```

**Response** (201 Created): Complete sermon record

**Error Responses**:
- 400: Validation error (missing fields, invalid YouTube URL, invalid date)
- 401: Unauthorized
- 500: Internal server error

#### GET /api/sermons/route.ts

Lists all sermons with optional filtering.

**Query Parameters**:
- `published`: "true" | "false" (optional)
- `series`: string (optional)
- `search`: string (optional, title search)

**Response** (200 OK):
```typescript
{ sermons: Sermon[] }
```

#### GET /api/sermons/[id]/route.ts

Retrieves a single sermon by ID.

**Response** (200 OK): Complete sermon record
**Error Responses**: 404 not found, 401 unauthorized

#### PUT /api/sermons/[id]/route.ts

Updates an existing sermon (all fields optional).

**Response** (200 OK): Updated sermon record
**Error Responses**: 400 validation, 404 not found, 401 unauthorized

#### DELETE /api/sermons/[id]/route.ts

Deletes a sermon permanently.

**Response** (200 OK): `{ message: "Sermon deleted successfully" }`
**Error Responses**: 404 not found, 401 unauthorized

### Shared Types

**lib/types/sermon.ts**:
```typescript
export interface Sermon {
  id: string
  title: string
  series: string | null
  speaker: string
  date: Date
  duration: string
  description: string
  thumbnail: string       // Cloudinary URL
  videoUrl: string        // YouTube URL
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateSermonInput {
  title: string
  series?: string
  speaker: string
  date: string            // ISO string from form
  duration: string
  description: string
  thumbnail: string
  videoUrl: string
  published: boolean
}

export interface UpdateSermonInput {
  title?: string
  series?: string | null
  speaker?: string
  date?: string
  duration?: string
  description?: string
  thumbnail?: string
  videoUrl?: string
  published?: boolean
}
```

### Validation Schemas

**lib/validation/sermon.ts**:
```typescript
import { z } from 'zod'

// YouTube URL validator — supports watch, youtu.be, and embed formats
export const youtubeUrlSchema = z.string().refine((url) => {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/,
    /^https?:\/\/youtu\.be\/[\w-]{11}/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]{11}/,
  ]
  return patterns.some((p) => p.test(url))
}, { message: 'Invalid YouTube URL format' })

export const createSermonSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long'),
  series: z.string().trim().min(1).max(100).optional(),
  speaker: z.string().trim().min(1, 'Speaker is required').max(100, 'Speaker name too long'),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  duration: z.string().trim().min(1, 'Duration is required'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  thumbnail: z.string().url('Thumbnail must be a valid URL'),
  videoUrl: youtubeUrlSchema,
  published: z.boolean().default(false),
})

export const updateSermonSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  series: z.string().trim().min(1).max(100).nullable().optional(),
  speaker: z.string().trim().min(1).max(100).optional(),
  date: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
  duration: z.string().trim().min(1).optional(),
  description: z.string().trim().min(10).max(2000).optional(),
  thumbnail: z.string().url().optional(),
  videoUrl: youtubeUrlSchema.optional(),
  published: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
})

export const sermonQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
  series: z.string().optional(),
  search: z.string().optional(),
})
```

### Component Architecture

#### SermonsManager Component (New)

Location: `components/dashboard/sermons-manager.tsx`

**Key Features**:
1. Grid/Table view toggle
2. Full CRUD operations
3. Thumbnail upload (JPG/PNG, max 5MB) via FileUploadField
4. YouTube URL input with inline validation feedback
5. Series text input (free-text, populates dropdown from existing series)
6. Duration free-text input with placeholder examples
7. Search by title
8. Filter by series (dynamic dropdown from existing data)
9. Published toggle per sermon
10. Draft badge on unpublished sermons
11. Loading states and toast notifications
12. Confirmation dialog before delete
13. Infinite scroll in grid view (12 at a time)
14. Pagination in table view (10 per page)

**State**:
```typescript
const [sermons, setSermons] = useState(initialSermons)
const [isAddModalOpen, setIsAddModalOpen] = useState(false)
const [isEditModalOpen, setIsEditModalOpen] = useState(false)
const [editingSermon, setEditingSermon] = useState<Sermon | null>(null)
const [isLoading, setIsLoading] = useState(false)
const [togglingSermonId, setTogglingSermonId] = useState<string | null>(null)
const [deletingSermonId, setDeletingSermonId] = useState<string | null>(null)
const [selectedSeries, setSelectedSeries] = useState<string>('All Series')
const [searchQuery, setSearchQuery] = useState<string>('')
const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
const [currentPage, setCurrentPage] = useState(1)
const [gridDisplayCount, setGridDisplayCount] = useState(12)
const [thumbnailUrl, setThumbnailUrl] = useState<string>('')
```

**Series Dropdown**: Derived from existing sermons — `[...new Set(sermons.map(s => s.series).filter(Boolean))]`

#### Public Sermons Page (Update Existing)

Location: `app/sermons/page.tsx`

**Structure**:
```typescript
export default async function SermonsPage() {
  const sermons = await prisma.sermon.findMany({
    where: { published: true },
    orderBy: { date: 'desc' }
  })

  const featuredSermon = sermons[0] ?? null  // most recent by date

  return (
    <>
      <TopNavBar />
      {/* Featured sermon hero section */}
      {featuredSermon && <FeaturedSermon sermon={featuredSermon} />}
      {/* Sermon grid with search + series filter */}
      <SermonGrid sermons={sermons} />
      <Footer />
    </>
  )
}
```

**FeaturedSermon** displays: large thumbnail, title, series badge, speaker, date, duration, full description, "Watch Latest Message" CTA button linking to YouTube.

**SermonGrid** displays: responsive grid (1/2/3 cols), thumbnail, title, series badge, speaker, date, duration, "Watch" button per card, client-side search by title, client-side filter by series.

## Data Models

### Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
model Sermon {
  id          String   @id @default(cuid())
  title       String
  series      String?
  speaker     String
  date        DateTime
  duration    String
  description String   @db.Text
  thumbnail   String   // Cloudinary URL
  videoUrl    String   // YouTube URL
  published   Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([published])
  @@index([series])
  @@index([date])
}
```

### Database Indexes

- `@@index([published])`: Fast filtering for public display
- `@@index([series])`: Efficient series-based filtering
- `@@index([date])`: Efficient ordering by sermon date

### Migration

```bash
npx prisma migrate dev --name add_sermon_model
npx prisma generate
```

## Error Handling

### Error Response Format

```typescript
{
  error: string
  details?: string[]
}
```

### Error Categories

1. **Validation Errors (400)**: Missing required fields, invalid YouTube URL, invalid date, field length violations
2. **Authentication Errors (401)**: Missing or invalid session token
3. **Not Found Errors (404)**: Sermon ID doesn't exist
4. **Server Errors (500)**: Database failures, unexpected exceptions

### YouTube URL Error

When an invalid YouTube URL is provided, the API returns:
```json
{ "error": "Invalid YouTube URL format" }
```

The dashboard form shows inline validation feedback before submission.

## Testing Strategy

### Property-Based Testing

This feature is suitable for PBT because:
- Clear input/output contracts on all API endpoints
- Universal properties hold across all valid inputs
- Large input space (strings, URLs, dates, booleans)
- Core logic testable as pure functions (validation, filtering, ordering)

**Library**: fast-check (already installed)
**Minimum iterations**: 100 per property
**Tag format**: `Feature: sermons-management-system, Property {number}: {property_text}`

## Correctness Properties

### Property 1: Input Validation Completeness

*For any* sermon creation or update request, the API SHALL validate all required fields (title, speaker, date, duration, description, thumbnail, videoUrl) are present and that videoUrl matches a valid YouTube URL pattern.

**Validates: Requirements 1.2, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 5.1, 5.2, 5.3, 17.1-17.9**

### Property 2: Validation Error Responses

*For any* invalid sermon creation or update request, the API SHALL return HTTP status 400 with a descriptive error message listing all validation failures.

**Validates: Requirements 1.13, 3.7, 12.1, 12.2, 12.9**

### Property 3: Sermon Creation Round-Trip

*For any* valid sermon creation payload, creating a sermon and then retrieving it SHALL return a record with all input fields preserved, plus auto-generated id, createdAt, updatedAt, and createdBy fields.

**Validates: Requirements 1.1, 1.12, 1.14, 1.15, 2.2**

### Property 4: Optional Series Field Handling

*For any* sermon creation request, the series field SHALL be optional, and the published field SHALL default to false when not provided.

**Validates: Requirements 1.3, 1.4, 6.1, 21.8**

### Property 5: Ordering by Date Consistency

*For any* set of published sermons with different dates, querying the sermons list SHALL return them ordered by sermon date descending (newest first).

**Validates: Requirements 2.1, 8.3**

### Property 6: Series Filtering Accuracy

*For any* series value and any set of sermons with various series, filtering by that series SHALL return only sermons matching that exact series.

**Validates: Requirements 2.4, 15.4**

### Property 7: Title Search Accuracy

*For any* search query string and any set of sermons, searching by title SHALL return only sermons whose title contains the query string (case-insensitive).

**Validates: Requirements 2.5, 15.2, 8.8**

### Property 8: Complete Field Rendering

*For any* sermon record, rendering it in either the dashboard or public page SHALL display all core fields: thumbnail, title, series (if present), speaker, date, duration.

**Validates: Requirements 2.7, 8.2**

### Property 9: Draft Status Indication

*For any* sermon where published equals false, the dashboard SHALL display a "Draft" badge, and for any sermon where published equals true, no draft badge SHALL appear.

**Validates: Requirements 2.8, 6.6**

### Property 10: Sermon Count Accuracy

*For any* set of sermons, the dashboard SHALL display a count that exactly equals the number of sermons in the set.

**Validates: Requirements 2.9**

### Property 11: Update Field Preservation

*For any* sermon update request, only the fields specified in the update payload SHALL be modified, while all other fields (except updatedAt) SHALL remain unchanged, and createdAt and createdBy SHALL never change.

**Validates: Requirements 3.1, 3.2, 3.8, 3.9**

### Property 12: Update Response Accuracy

*For any* valid sermon update, the API SHALL return HTTP status 200 with the complete updated sermon record reflecting all changes.

**Validates: Requirements 3.5**

### Property 13: Deletion Completeness

*For any* existing sermon, successfully deleting it SHALL remove it from the database such that subsequent queries for that sermon return 404, and it SHALL not appear in any list results.

**Validates: Requirements 4.1, 4.3, 4.6**

### Property 14: Not Found Error Consistency

*For any* non-existent sermon ID, attempting to retrieve, update, or delete that sermon SHALL return HTTP status 404 with an error message.

**Validates: Requirements 3.3, 3.6, 4.2, 4.4, 12.3**

### Property 15: Published Status Filtering

*For any* set of sermons with mixed published values, querying the public sermons page SHALL return only sermons where published equals true, while querying the dashboard SHALL return all sermons regardless of published status.

**Validates: Requirements 6.2, 6.3, 6.8, 8.1**

### Property 16: Authentication Enforcement

*For any* API request to create, update, or delete sermons without a valid session token, the API SHALL return HTTP status 401 with an "Unauthorized" error message.

**Validates: Requirements 7.1, 7.2, 7.4**

### Property 17: Token Security

*For any* API response or server log, authentication tokens SHALL NOT be exposed in response bodies or log messages.

**Validates: Requirements 7.7**

### Property 18: YouTube URL Validation

*For any* videoUrl value, the validator SHALL accept only URLs matching youtube.com/watch?v=, youtu.be/, or youtube.com/embed/ patterns with valid 11-character video IDs, and reject all others.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 19: Featured Sermon Selection

*For any* set of published sermons, the featured sermon displayed on the public page SHALL be the sermon with the most recent date value.

**Validates: Requirements 23.1, 23.6**

### Property 20: Error Format Consistency

*For any* API error response, the response SHALL be valid JSON with an "error" field and appropriate HTTP status codes (400, 401, 404, 500).

**Validates: Requirements 12.7, 12.8**

### Property 21: Query Parameter Filtering

*For any* combination of published, series, and search query parameters on GET /api/sermons, the API SHALL return only sermons matching all specified filters (AND logic).

**Validates: Requirements 2.3, 2.4, 2.5, 13.10**

### Property 22: Thumbnail File Type Validation

*For any* file upload attempt for a thumbnail, the system SHALL accept only JPG and PNG formats and reject all other file types.

**Validates: Requirements 10.2, 10.9**

### Property 23: Thumbnail File Size Validation

*For any* file upload attempt for a thumbnail, the system SHALL accept only files under 5MB and reject larger files.

**Validates: Requirements 10.3, 10.10**

### Property 24: Cloudinary URL Storage

*For any* successful thumbnail upload, the upload endpoint SHALL return a Cloudinary secure URL, and that URL SHALL be stored in the thumbnail field of the sermon record.

**Validates: Requirements 10.5, 10.6**

## Image Optimization Strategy

All sermon thumbnails use the Next.js `Image` component:

```typescript
<Image
  src={sermon.thumbnail}
  alt={sermon.title}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  onError={(e) => { e.currentTarget.src = '/placeholder-sermon.png' }}
/>
```

## Implementation Plan

### Phase 1: Database and Types
1. Add Sermon model to Prisma schema with indexes
2. Run migration and generate Prisma client
3. Create `lib/types/sermon.ts`
4. Create `lib/validation/sermon.ts` with YouTube validator

### Phase 2: API Layer
1. Implement POST `/api/sermons/route.ts`
2. Implement GET `/api/sermons/route.ts` with filtering
3. Implement GET `/api/sermons/[id]/route.ts`
4. Implement PUT `/api/sermons/[id]/route.ts`
5. Implement DELETE `/api/sermons/[id]/route.ts`

### Phase 3: Dashboard Components
1. Create SermonsManager component
2. Create AddSermonModal with thumbnail upload and YouTube URL field
3. Create EditSermonModal pre-populated with existing data
4. Add search, series filter, view toggle, pagination/infinite scroll
5. Add loading states, toast notifications, confirmation dialogs

### Phase 4: Public Display
1. Update `app/sermons/page.tsx` to fetch from database (SSR)
2. Create FeaturedSermon component
3. Create SermonGrid component with search and series filter
4. Implement image optimization and error handling

### Phase 5: Dashboard Integration
1. Create `app/(dashboard)/dashboard/content/sermons/page.tsx`
2. Add Sermons link to dashboard sidebar

### Phase 6: Testing
1. Property-based tests for all 24 properties
2. Unit tests for API endpoints, validation, and components
3. Integration tests for complete CRUD flows

## Security Considerations

- Session validation on all mutating endpoints
- HTTP-only cookies prevent XSS token theft
- Zod schema validation before any database operation
- YouTube URL regex prevents arbitrary URL injection
- File type and size validation before Cloudinary upload
- No token exposure in responses or logs
- Prisma ORM prevents SQL injection

## Responsive Design

- Mobile (< 768px): single column sermon grid, stacked filters
- Tablet (768–1024px): two column grid
- Desktop (> 1024px): three column grid
- Dashboard table view: horizontal scroll on mobile
- Modals: full-screen on mobile, centered on desktop
