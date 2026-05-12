# Implementation Plan: Sermons Management System

## Overview

This implementation plan breaks down the Sermons Management System into discrete, actionable coding tasks. The system enables church administrators to manage sermon recordings through a secure dashboard with full CRUD operations, thumbnail image uploads, YouTube URL validation, and displays published sermons on the public website with a featured sermon section. The implementation follows the same architectural patterns as the Books and Tracts Management Systems.

**Key Implementation Areas**:
- Database schema with Sermon model and indexes
- YouTube URL validation utility
- REST API: 5 endpoints with Zod validation and session authentication
- Dashboard: SermonsManager component with grid/table views, modals, search, series filter
- Public page: SSR with featured sermon section and sermon grid
- Testing: Unit tests and 24 property-based tests

## Tasks

- [ ] 1. Set up database schema and shared types
  - [ ] 1.1 Add Sermon model to Prisma schema
    - Add the Sermon model to `prisma/schema.prisma` with all required fields: id (cuid), title, series (optional), speaker, date (DateTime), duration (String), description (Text), thumbnail (String), videoUrl (String), published (Boolean default false), createdBy, createdAt, updatedAt
    - Add indexes for `published`, `series`, and `date` fields
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 1.2 Create and apply database migration
    - Run `npx prisma migrate dev --name add_sermon_model` to create migration
    - Run `npx prisma generate` to update Prisma client
    - Verify migration creates table with correct schema and indexes
    - _Requirements: 9.4, 9.8_

  - [ ] 1.3 Create shared TypeScript types
    - Create `lib/types/sermon.ts` with Sermon interface, CreateSermonInput interface, and UpdateSermonInput interface
    - Export all types for use across the application
    - _Requirements: 25.1, 25.2_

  - [ ] 1.4 Create validation schemas with YouTube validator
    - Create `lib/validation/sermon.ts` with Zod schemas
    - Implement `youtubeUrlSchema` that accepts youtube.com/watch?v=, youtu.be/, and youtube.com/embed/ URL formats and rejects all others
    - Implement `createSermonSchema` with all field validations: title (1-200), series optional (1-100), speaker (1-100), date (valid date), duration (non-empty string), description (10-2000), thumbnail (valid URL), videoUrl (YouTube URL), published (boolean default false)
    - Implement `updateSermonSchema` with all fields optional and at-least-one-field refinement
    - Implement `sermonQuerySchema` for published, series, and search query params
    - Export `youtubeUrlSchema` as reusable validator
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 17.1-17.9, 25.3, 25.4, 25.7, 25.8_

- [ ] 2. Implement POST /api/sermons endpoint
  - [ ] 2.1 Create POST route handler for sermon creation
    - Create `app/api/sermons/route.ts` with POST handler
    - Extract and validate session token using `getSessionToken()` from `lib/auth/session.ts`
    - Return 401 if session token missing or invalid
    - Parse request body and validate with `createSermonSchema`
    - Return 400 with validation errors if schema validation fails
    - Create sermon record in database using Prisma with `createdBy` field from session
    - Convert date string to DateTime before storing
    - Return 201 with complete sermon record on success
    - Handle database errors with 500 status and generic error message
    - Log errors server-side without exposing sensitive data
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.12, 1.13, 1.14, 1.15, 7.1, 7.2, 12.1, 12.8, 13.1, 13.6_

  - [ ] 2.2 Write property tests for sermon creation
    - **Property 1: Input Validation Completeness** — generate arbitrary payloads with missing/invalid fields, verify all rejected
    - **Property 2: Validation Error Responses** — verify 400 with descriptive errors for all invalid inputs
    - **Property 3: Sermon Creation Round-Trip** — create sermon, retrieve it, verify all fields preserved
    - **Property 4: Optional Series Field Handling** — verify series optional, published defaults to false
    - **Property 18: YouTube URL Validation** — verify all three YouTube formats accepted, non-YouTube URLs rejected
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.12, 1.13, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 2.3 Write unit tests for POST /api/sermons
    - Test successful sermon creation with all required fields returns 201
    - Test missing required fields returns 400
    - Test invalid YouTube URL returns 400 with "Invalid YouTube URL format"
    - Test invalid date returns 400
    - Test missing session token returns 401
    - Test optional series field (with and without)
    - Test published defaults to false when not provided
    - _Requirements: 1.1, 1.2, 1.3, 1.13, 5.6, 7.1_

- [ ] 3. Implement GET /api/sermons endpoint
  - [ ] 3.1 Create GET route handler for listing sermons
    - Add GET handler to `app/api/sermons/route.ts`
    - Extract and validate session token
    - Parse query parameters using `sermonQuerySchema` (published, series, search)
    - Build Prisma query with where clause based on filters
    - Apply case-insensitive title search when `search` param provided
    - Order results by `date` descending (newest first)
    - Return 200 with `{ sermons: Sermon[] }`
    - Handle empty results with empty array (not 404)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 13.2, 13.10_

  - [ ] 3.2 Write property tests for sermon listing
    - **Property 5: Ordering by Date Consistency** — verify results ordered by date descending
    - **Property 6: Series Filtering Accuracy** — verify series filter returns only matching sermons
    - **Property 7: Title Search Accuracy** — verify case-insensitive title search
    - **Property 21: Query Parameter Filtering** — verify combined filters use AND logic
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [ ] 3.3 Write unit tests for GET /api/sermons
    - Test returns all sermons ordered by date descending
    - Test published filter returns only matching sermons
    - Test series filter returns only matching sermons
    - Test search filter returns case-insensitive title matches
    - Test combined filters work correctly (AND logic)
    - Test empty results return empty array with 200
    - Test missing session token returns 401
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 7.1_

- [ ] 4. Implement GET /api/sermons/[id] endpoint
  - [ ] 4.1 Create GET route handler for single sermon retrieval
    - Create `app/api/sermons/[id]/route.ts` with GET handler
    - Extract and validate session token
    - Extract sermon ID from URL params
    - Query database for sermon by ID using Prisma `findUnique`
    - Return 200 with complete sermon record if found
    - Return 404 with "Sermon not found" if not found
    - _Requirements: 2.2, 7.1, 12.3, 13.3_

  - [ ] 4.2 Write property test for not found consistency
    - **Property 14: Not Found Error Consistency** — verify GET, PUT, DELETE on non-existent IDs all return 404
    - _Requirements: 3.3, 3.6, 4.2, 4.4, 12.3_

  - [ ] 4.3 Write unit tests for GET /api/sermons/[id]
    - Test returns sermon with 200 for valid existing ID
    - Test returns 404 for non-existent ID
    - Test returns 401 without session token
    - Test returns all sermon fields in response
    - _Requirements: 2.2, 7.1, 12.3_

- [ ] 5. Checkpoint — Verify API foundation
  - Test POST creates sermons, GET lists them with correct ordering
  - Test filtering by published, series, and search works
  - Test GET /[id] retrieves individual sermons
  - Ensure all tests pass before continuing

- [ ] 6. Implement PUT /api/sermons/[id] endpoint
  - [ ] 6.1 Create PUT route handler for sermon updates
    - Add PUT handler to `app/api/sermons/[id]/route.ts`
    - Extract and validate session token
    - Parse request body and validate with `updateSermonSchema`
    - Return 400 with validation errors if schema validation fails
    - Check if sermon exists using Prisma `findUnique`; return 404 if not found
    - Update sermon with Prisma `update`, preserving `createdAt` and `createdBy`
    - Convert date string to DateTime if date field provided
    - Return 200 with updated sermon record
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8, 3.9, 7.1, 13.4_

  - [ ] 6.2 Write property tests for sermon updates
    - **Property 11: Update Field Preservation** — verify only specified fields modified, createdAt/createdBy never change
    - **Property 12: Update Response Accuracy** — verify 200 with complete updated record
    - _Requirements: 3.1, 3.2, 3.5, 3.8, 3.9_

  - [ ] 6.3 Write unit tests for PUT /api/sermons/[id]
    - Test successful update of all fields returns 200
    - Test partial update only modifies specified fields
    - Test invalid YouTube URL returns 400
    - Test returns 404 for non-existent ID
    - Test returns 401 without session token
    - Test createdAt and createdBy never change
    - Test updatedAt automatically updates
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9_

- [ ] 7. Implement DELETE /api/sermons/[id] endpoint
  - [ ] 7.1 Create DELETE route handler for sermon deletion
    - Add DELETE handler to `app/api/sermons/[id]/route.ts`
    - Extract and validate session token
    - Check if sermon exists; return 404 if not found
    - Delete sermon using Prisma `delete`
    - Return 200 with `{ message: "Sermon deleted successfully" }`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 13.5_

  - [ ] 7.2 Write property tests for deletion and authentication
    - **Property 13: Deletion Completeness** — verify deleted sermon returns 404 and absent from list
    - **Property 16: Authentication Enforcement** — verify all mutating endpoints return 401 without token
    - **Property 17: Token Security** — verify tokens never exposed in responses or logs
    - **Property 20: Error Format Consistency** — verify all errors are JSON with "error" field and correct status codes
    - _Requirements: 4.1, 4.3, 4.6, 7.1, 7.2, 7.4, 7.7, 12.7, 12.8_

  - [ ] 7.3 Write unit tests for DELETE /api/sermons/[id]
    - Test successful deletion returns 200 with success message
    - Test returns 404 for non-existent ID
    - Test returns 401 without session token
    - Test deleted sermon no longer retrievable (subsequent GET returns 404)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.1_

- [ ] 8. Checkpoint — Verify complete API layer
  - Test all 5 CRUD endpoints work end-to-end
  - Test authentication enforcement on all endpoints
  - Test all error cases return correct status codes and JSON format
  - Ensure all tests pass before continuing

- [ ] 9. Create AddSermonModal component
  - [ ] 9.1 Implement modal for creating new sermons
    - Create `AddSermonModal` component in `components/dashboard/sermons-manager.tsx`
    - Build form with fields: title (text), series (text input, optional), speaker (text), date (date picker), duration (text with placeholder "e.g. 48 min, 1h 15min"), description (textarea), published (checkbox)
    - Integrate `FileUploadField` component for thumbnail (JPG/PNG, max 5MB)
    - Add YouTube URL input with inline validation feedback showing accepted formats
    - Implement form validation with inline error messages per field
    - Disable submit button when validation errors exist
    - Submit form data to POST /api/sermons endpoint
    - Show loading spinner during submission
    - Display success toast and close modal on success
    - Display error toast on failure
    - _Requirements: 1.2, 5.7, 5.8, 6.4, 10.1, 17.10, 17.11, 19.1, 19.2_

  - [ ] 9.2 Write unit tests for AddSermonModal
    - Test form renders all required fields
    - Test YouTube URL field shows inline validation feedback
    - Test thumbnail upload integrates with FileUploadField
    - Test form validation prevents submission with missing required fields
    - Test successful sermon creation flow
    - Test error handling for API failures
    - Test modal closes on cancel and on successful creation
    - _Requirements: 1.2, 5.7, 5.8, 10.1, 17.10, 17.11_

- [ ] 10. Create EditSermonModal component
  - [ ] 10.1 Implement modal for editing existing sermons
    - Create `EditSermonModal` component in `components/dashboard/sermons-manager.tsx`
    - Pre-populate all form fields with existing sermon data
    - Allow updating all fields including thumbnail replacement
    - Submit changes to PUT /api/sermons/[id] endpoint
    - Show loading spinner during submission
    - Display success toast and close modal on success
    - Display error toast on failure
    - _Requirements: 3.2, 6.5, 10.8, 19.3, 19.6_

  - [ ] 10.2 Write unit tests for EditSermonModal
    - Test form pre-populates with existing sermon data
    - Test partial updates (changing only some fields)
    - Test thumbnail replacement flow
    - Test successful sermon update flow
    - Test error handling for API failures
    - _Requirements: 3.2, 3.7, 6.5_

- [ ] 11. Implement SermonsManager core functionality
  - [ ] 11.1 Create SermonsManager component with state management
    - Create `components/dashboard/sermons-manager.tsx` with main component
    - Accept `initialSermons: Sermon[]` prop
    - Initialize all state: sermons list, modal states, loading states, filters, view mode, pagination
    - Implement `refetchSermons` function that calls GET /api/sermons and updates state
    - Derive unique series list from sermons: `[...new Set(sermons.map(s => s.series).filter(Boolean))]`
    - _Requirements: 2.7, 14.6, 20.1, 20.5, 20.6_

  - [ ] 11.2 Implement sermon creation flow
    - Add "Add Sermon" button to open AddSermonModal
    - On successful creation: refetch sermons, show success toast, close modal
    - On error: show error toast
    - _Requirements: 1.1, 19.2, 19.6, 20.1_

  - [ ] 11.3 Implement sermon editing flow
    - Add "Edit" button on each sermon card/row
    - Open EditSermonModal with selected sermon data
    - On successful update: refetch sermons, show success toast, close modal
    - On error: show error toast
    - _Requirements: 3.1, 19.3, 19.6, 20.2_

  - [ ] 11.4 Implement sermon deletion flow
    - Add "Delete" button on each sermon card/row
    - Show confirmation dialog before deletion
    - Submit DELETE request to API
    - On successful deletion: refetch sermons, show success toast
    - On error: show error toast
    - _Requirements: 4.1, 4.5, 4.7, 19.4, 19.6, 20.3_

  - [ ] 11.5 Implement published status toggle
    - Add toggle switch on each sermon card/row
    - Submit PUT request updating only the `published` field
    - Show loading indicator on the specific sermon being toggled
    - On success: refetch sermons
    - On error: show error toast, revert toggle
    - _Requirements: 6.5, 19.4, 20.4_

- [ ] 12. Implement SermonsManager search and filter features
  - [ ] 12.1 Add search by title functionality
    - Add search input field with clear button
    - Filter sermons client-side where title contains query (case-insensitive)
    - Reset pagination when search changes
    - Display count of filtered results
    - _Requirements: 15.1, 15.2, 15.6, 15.7_

  - [ ] 12.2 Add series filter functionality
    - Add series dropdown populated dynamically from existing sermon series values
    - Include "All Series" option as default
    - Filter sermons client-side by selected series
    - Reset pagination when filter changes
    - _Requirements: 15.3, 15.4, 15.8, 15.9, 21.2_

  - [ ] 12.3 Implement combined filtering and result count
    - Apply both search and series filters together (AND logic)
    - Display count of filtered results
    - Provide "Clear Filters" button to reset both filters
    - _Requirements: 15.5, 15.6, 15.7_

- [ ] 13. Implement SermonsManager view modes
  - [ ] 13.1 Create grid view layout
    - Implement SermonCard component for grid display
    - Display thumbnail (Next.js Image), title, series badge (if present), speaker, date, duration
    - Show "Draft" badge for unpublished sermons
    - Add action buttons: Edit, Delete, Watch (links to YouTube), Publish toggle
    - Implement infinite scroll: load 12 sermons initially, load 12 more on scroll to bottom
    - _Requirements: 2.7, 2.8, 6.6, 14.2, 14.4_

  - [ ] 13.2 Create table view layout
    - Implement table with columns: Thumbnail, Title, Series, Speaker, Date, Duration, Published, Actions
    - Display 10 sermons per page with Previous/Next pagination controls
    - Show "Draft" badge in Published column for unpublished sermons
    - Add action buttons in Actions column
    - Wrap table in horizontally scrollable container for mobile
    - _Requirements: 2.7, 2.8, 6.6, 14.3, 14.5_

  - [ ] 13.3 Implement view mode toggle
    - Add toggle control (grid/table icons) to switch between views
    - Preserve selected view mode in component state
    - Apply smooth transition when switching views
    - _Requirements: 14.1, 14.6, 14.7_

  - [ ] 13.4 Write property tests for UI rendering
    - **Property 8: Complete Field Rendering** — verify all core fields displayed in both views
    - **Property 9: Draft Status Indication** — verify "Draft" badge only on unpublished sermons
    - **Property 10: Sermon Count Accuracy** — verify displayed count equals number of sermons
    - **Property 15: Published Status Filtering** — verify public page shows only published, dashboard shows all
    - _Requirements: 2.7, 2.8, 2.9, 6.6, 8.1_

- [ ] 14. Checkpoint — Verify dashboard functionality
  - Test all CRUD operations work: add, edit, delete, publish toggle
  - Test search and series filter work correctly
  - Test grid and table view modes
  - Test loading states and toast notifications
  - Ensure all tests pass before continuing

- [ ] 15. Update public sermons page with SSR and featured sermon
  - [ ] 15.1 Modify app/sermons/page.tsx to use server-side data fetching
    - Import Prisma client
    - Fetch published sermons ordered by `date` descending: `prisma.sermon.findMany({ where: { published: true }, orderBy: { date: 'desc' } })`
    - Identify featured sermon as `sermons[0]` (most recent by date)
    - Handle database errors gracefully with try-catch
    - Pass data to client components
    - Display empty state if no published sermons exist
    - _Requirements: 8.1, 8.3, 8.9, 8.10, 23.6_

  - [ ] 15.2 Create FeaturedSermon component
    - Display featured sermon in a visually distinct hero section above the grid
    - Show larger thumbnail image using Next.js Image component
    - Display title, series badge (if present), speaker, date, duration
    - Display full description text
    - Include prominent "Watch Latest Message" CTA button linking to YouTube URL (target="_blank")
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_

  - [ ] 15.3 Create SermonGrid component
    - Create `app/sermons/sermon-grid.tsx` as client component
    - Accept `sermons: Sermon[]` prop
    - Display responsive grid: 1 col mobile, 2 col tablet, 3 col desktop
    - Each card shows: thumbnail (Next.js Image), title, series badge, speaker, date, duration
    - "Watch" button per card linking to YouTube URL (target="_blank")
    - Client-side search by title (case-insensitive)
    - Client-side filter by series (dropdown populated from sermon data)
    - _Requirements: 8.2, 8.4, 8.5, 8.6, 8.7, 8.8, 18.1, 18.2, 18.3_

  - [ ] 15.4 Write property tests for public page
    - **Property 19: Featured Sermon Selection** — verify featured sermon is always the most recent by date
    - _Requirements: 23.1, 23.6_

  - [ ] 15.5 Write unit tests for public sermons page
    - Test page fetches only published sermons
    - Test sermons ordered by date descending
    - Test featured sermon is the most recent
    - Test empty state displays appropriate message
    - Test SermonGrid renders all sermon fields
    - Test "Watch" button links to correct YouTube URL
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 23.1, 23.6_

- [ ] 16. Implement image optimization and error handling
  - [ ] 16.1 Configure Next.js Image component for sermon thumbnails
    - Use Next.js Image component in SermonCard, FeaturedSermon, and SermonGrid
    - Set `sizes` attribute: `"(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"`
    - Enable lazy loading for grid images
    - Configure Cloudinary domain in `next.config.ts` if not already present
    - _Requirements: 11.1, 11.2, 11.5, 11.6_

  - [ ] 16.2 Add image loading error handling
    - Implement `onError` handler showing placeholder image on load failure
    - Add loading spinner during thumbnail upload in modals
    - _Requirements: 11.3, 11.4_

  - [ ] 16.3 Write property tests for thumbnail upload
    - **Property 22: Thumbnail File Type Validation** — verify only JPG/PNG accepted
    - **Property 23: Thumbnail File Size Validation** — verify files over 5MB rejected
    - **Property 24: Cloudinary URL Storage** — verify successful upload stores Cloudinary URL in thumbnail field
    - _Requirements: 10.2, 10.3, 10.5, 10.6, 10.9, 10.10_

- [ ] 17. Integrate SermonsManager into dashboard
  - [ ] 17.1 Create dashboard sermons page
    - Create `app/(dashboard)/dashboard/content/sermons/page.tsx`
    - Fetch all sermons from database server-side (no published filter)
    - Pass sermons to SermonsManager component
    - Authentication handled by existing middleware
    - _Requirements: 2.1, 7.5_

  - [ ] 17.2 Add Sermons menu item to dashboard sidebar
    - Update `components/dashboard/sidebar.tsx` to include Sermons navigation link
    - Add appropriate icon for Sermons menu item
    - Ensure navigation routes correctly to `/dashboard/content/sermons`
    - _Requirements: 7.5_

- [ ] 18. Implement responsive design and accessibility
  - [ ] 18.1 Ensure responsive layouts
    - Test SermonsManager on mobile, tablet, and desktop
    - Test SermonGrid on mobile (1 col), tablet (2 col), desktop (3 col)
    - Ensure modals are full-screen on mobile
    - Ensure table view has horizontal scroll on mobile
    - Stack search and filter controls vertically on mobile
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

  - [ ] 18.2 Implement accessibility features
    - Add proper ARIA labels to all interactive elements
    - Ensure keyboard navigation works (tab order, focus indicators)
    - Add meaningful alt text to all thumbnail images
    - Ensure form labels are properly associated with inputs
    - Announce loading states and errors to screen readers via live regions
    - _Requirements: Not explicitly stated but required for production quality_

- [ ] 19. Add loading states and user feedback
  - [ ] 19.1 Implement comprehensive loading states
    - Loading spinner during thumbnail upload
    - Loading spinner during sermon creation, update, deletion
    - Loading indicator on specific sermon being toggled (published)
    - Disable action buttons during in-flight operations to prevent duplicates
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [ ] 19.2 Implement toast notifications
    - Success toast after sermon creation, update, deletion, publish toggle
    - Error toast for all operation failures with descriptive message from API
    - _Requirements: 19.6, 19.7_

- [ ] 20. Final checkpoint — End-to-end verification
  - Test complete flow: login → dashboard → create sermon with thumbnail → publish → view on public page
  - Test featured sermon updates when a newer sermon is published
  - Test complete edit flow: changes reflected on public page
  - Test unpublish: sermon removed from public page
  - Test delete: sermon removed from dashboard and public page
  - Test YouTube URL validation in both add and edit modals
  - Test series filter populates dynamically from existing sermons
  - Test authentication: unauthenticated users cannot access API endpoints
  - Run all unit tests and property-based tests
  - Ensure all tests pass

- [ ] 21. Integration and final wiring
  - [ ] 21.1 Verify complete system integration
    - Test complete CRUD flow works correctly
    - Test thumbnail upload works end-to-end with Cloudinary
    - Test YouTube links open correctly in new tab
    - Test search and filter on both dashboard and public page
    - Test responsive design on multiple screen sizes
    - Verify all error handling works correctly
    - _Requirements: All requirements_

  - [ ] 21.2 Security verification
    - Verify authentication enforced on all protected endpoints
    - Verify session tokens not exposed in responses or logs
    - Verify thumbnail upload validation working (type and size)
    - Verify YouTube URL validation rejects non-YouTube URLs
    - Verify input validation working for all fields
    - _Requirements: 7.1, 7.2, 7.4, 7.7, 10.2, 10.3, 17.1-17.9_

  - [ ] 21.3 Performance verification
    - Verify database indexes created and used for published, series, date queries
    - Verify Next.js Image optimization working for thumbnails
    - Verify lazy loading working in sermon grid
    - Verify Cloudinary CDN delivery working
    - _Requirements: 9.3, 11.1, 11.2, 11.5, 11.6_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and error conditions
- Checkpoints ensure incremental validation at key milestones
- All code uses TypeScript throughout, following Next.js 16 App Router conventions
- Thumbnail uploads use the existing `/api/upload` endpoint (same as Tracts system)
- Videos are hosted on YouTube — no video upload needed
- Series field is optional and the dropdown is dynamically populated from existing sermon data
- Duration is stored as a free-text string with no format enforcement
- The system follows the same architectural patterns as Books and Tracts Management Systems

## Testing Strategy

### Property-Based Tests (24 properties)
- Run with fast-check library (minimum 100 iterations per property)
- Tag format: `Feature: sermons-management-system, Property {number}: {property_text}`
- Properties cover: validation, YouTube URL validation, CRUD operations, filtering, ordering, authentication, featured sermon selection, thumbnail upload, UI rendering

### Unit Tests
- API route handlers with specific payloads
- Validation schema edge cases (especially YouTube URL patterns)
- Error handling scenarios
- Component rendering with specific data
- Modal dialogs and confirmation prompts
- Loading states and toast notifications

### Integration Tests
- Complete CRUD flows
- Thumbnail upload integration
- Dashboard navigation and authentication protection
- Public page SSR data fetching
- Featured sermon selection logic
