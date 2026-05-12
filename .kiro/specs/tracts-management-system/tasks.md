# Implementation Plan: Tracts Management System

## Overview

This implementation plan breaks down the Tracts Management System into discrete, actionable coding tasks. The system enables church administrators to manage religious tracts through a secure dashboard with full CRUD operations, file uploads for cover images and PDF documents, and displays published tracts on the public website. The implementation follows the 7-phase plan from the design document, with each task building incrementally on previous work.

## Tasks

- [x] 1. Set up database schema and shared types
  - [x] 1.1 Add Tract model to Prisma schema
    - Add the Tract model to `prisma/schema.prisma` with all required fields (id, title, category, description, coverImage, documentUrl, published, createdBy, createdAt, updatedAt)
    - Add indexes for `published` and `category` fields for query optimization
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 1.2 Create and apply database migration
    - Run `npx prisma migrate dev --name add_tract_model` to create migration
    - Run `npx prisma generate` to update Prisma client
    - Verify migration creates table with correct schema and indexes
    - _Requirements: 9.4, 9.8_
  
  - [x] 1.3 Create shared TypeScript types
    - Create `lib/types/tract.ts` with TRACT_CATEGORIES constant, TractCategory type, Tract interface, CreateTractInput interface, and UpdateTractInput interface
    - Export all types for use across the application
    - _Requirements: 1.2, 5.2, 18.2_
  
  - [x] 1.4 Create validation schemas
    - Create `lib/validation/tract.ts` with Zod schemas for createTractSchema, updateTractSchema, and tractQuerySchema
    - Implement validation rules: title (1-200 chars), category (enum), description (10-1000 chars), URLs (valid format), published (boolean)
    - _Requirements: 1.4, 1.5, 1.6, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

- [x] 2. Enhance upload endpoint for PDF support
  - [x] 2.1 Update /api/upload endpoint to support both images and PDFs
    - Modify `app/api/upload/route.ts` to accept both image types (JPG, PNG) and PDF files
    - Implement file type validation: images (image/jpeg, image/png) and PDFs (application/pdf)
    - Implement file size validation: images max 5MB, PDFs max 10MB
    - Configure Cloudinary upload with appropriate folder structure (tracts/images, tracts/documents) and resource_type
    - Return secure URL and public ID on successful upload
    - _Requirements: 10.2, 10.3, 11.2, 11.3, 17.1, 17.2, 17.3, 17.4_
  
  - [x] 2.2 Write property tests for file upload validation
    - **Property 22: Cover Image File Type Validation**
    - **Property 23: Cover Image File Size Validation**
    - **Property 24: PDF Document File Type Validation**
    - **Property 25: PDF Document File Size Validation**
    - **Validates: Requirements 10.2, 10.3, 10.9, 10.10, 11.2, 11.3, 11.9, 11.10**

- [x] 3. Implement POST /api/tracts endpoint
  - [x] 3.1 Create POST route handler for tract creation
    - Create `app/api/tracts/route.ts` with POST handler
    - Extract and validate session token using getSessionToken()
    - Parse request body and validate with createTractSchema
    - Create tract record in database with Prisma, including createdBy field from session
    - Return 201 with complete tract record on success
    - Return 400 for validation errors, 401 for auth errors, 500 for server errors
    - _Requirements: 1.1, 1.2, 1.3, 1.7, 1.9, 1.10, 7.1, 7.3, 14.1, 14.6_
  
  - [x] 3.2 Write property tests for tract creation
    - **Property 1: Input Validation Completeness**
    - **Property 2: Validation Error Responses**
    - **Property 3: Tract Creation Round-Trip**
    - **Property 4: Published Field Default Handling**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 6.1**
  
  - [x] 3.3 Write unit tests for POST /api/tracts
    - Test successful tract creation with valid data
    - Test validation errors for missing required fields
    - Test validation errors for invalid URLs
    - Test validation errors for invalid category
    - Test 401 response without session token
    - _Requirements: 1.1, 1.2, 1.8, 7.2_

- [x] 4. Implement GET /api/tracts endpoint
  - [x] 4.1 Create GET route handler for listing tracts
    - Add GET handler to `app/api/tracts/route.ts`
    - Extract and validate session token
    - Parse query parameters (published, category) using tractQuerySchema
    - Build Prisma query with filters and orderBy createdAt desc
    - Return 200 with array of tracts
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 14.2, 14.10_
  
  - [x] 4.2 Write property tests for tract listing
    - **Property 5: Ordering Consistency**
    - **Property 6: Category Filtering Accuracy**
    - **Property 14: Published Status Filtering**
    - **Property 21: Query Parameter Filtering**
    - **Validates: Requirements 2.1, 2.3, 2.4, 6.2, 6.3, 6.8, 8.1, 14.10, 16.5**
  
  - [x] 4.3 Write unit tests for GET /api/tracts
    - Test listing all tracts with correct ordering
    - Test filtering by published status
    - Test filtering by category
    - Test combining multiple filters
    - Test empty result set
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [x] 5. Checkpoint - Verify API foundation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement GET /api/tracts/[id] endpoint
  - [x] 6.1 Create GET route handler for single tract retrieval
    - Create `app/api/tracts/[id]/route.ts` with GET handler
    - Extract and validate session token
    - Extract tract ID from URL params
    - Query database for tract by ID
    - Return 200 with tract record if found
    - Return 404 if tract not found
    - _Requirements: 2.2, 7.1, 14.3_
  
  - [x] 6.2 Write property tests for tract retrieval
    - **Property 13: Not Found Error Consistency**
    - **Validates: Requirements 3.3, 3.6, 4.2, 4.4**
  
  - [x] 6.3 Write unit tests for GET /api/tracts/[id]
    - Test successful retrieval of existing tract
    - Test 404 response for non-existent ID
    - Test 401 response without session token
    - _Requirements: 2.2, 7.2_

- [x] 7. Implement PUT /api/tracts/[id] endpoint
  - [x] 7.1 Create PUT route handler for tract updates
    - Add PUT handler to `app/api/tracts/[id]/route.ts`
    - Extract and validate session token
    - Parse request body and validate with updateTractSchema
    - Check if tract exists before updating
    - Update tract record with Prisma, preserving createdAt and createdBy
    - Return 200 with updated tract record
    - Return 404 if tract not found, 400 for validation errors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8, 3.9, 7.1, 14.4_
  
  - [x] 7.2 Write property tests for tract updates
    - **Property 10: Update Field Preservation**
    - **Property 11: Update Response Accuracy**
    - **Validates: Requirements 3.1, 3.2, 3.5, 3.8, 3.9**
  
  - [x] 7.3 Write unit tests for PUT /api/tracts/[id]
    - Test successful update of all fields
    - Test partial update (only some fields)
    - Test validation errors for invalid data
    - Test 404 response for non-existent ID
    - Test preservation of createdAt and createdBy
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7, 3.8, 3.9_

- [x] 8. Implement DELETE /api/tracts/[id] endpoint
  - [x] 8.1 Create DELETE route handler for tract deletion
    - Add DELETE handler to `app/api/tracts/[id]/route.ts`
    - Extract and validate session token
    - Check if tract exists before deleting
    - Delete tract record from database
    - Return 200 with success message
    - Return 404 if tract not found
    - _Requirements: 4.1, 4.2, 4.3, 7.1, 14.5_
  
  - [x] 8.2 Write property tests for tract deletion
    - **Property 12: Deletion Completeness**
    - **Validates: Requirements 4.1, 4.3, 4.6**
  
  - [x] 8.3 Write unit tests for DELETE /api/tracts/[id]
    - Test successful deletion of existing tract
    - Test 404 response for non-existent ID
    - Test 401 response without session token
    - Verify tract no longer appears in list after deletion
    - _Requirements: 4.1, 4.2, 4.4, 4.6_

- [x] 9. Checkpoint - Verify complete API layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Create FileUploadField component
  - [x] 10.1 Implement reusable file upload component
    - Create `components/dashboard/file-upload-field.tsx`
    - Accept props: label, accept (file types), maxSize, currentUrl, onUpload, onRemove
    - Implement file selection with validation (type and size)
    - Upload file to /api/upload endpoint with loading state
    - Display preview for images or filename for PDFs
    - Show error messages for validation failures
    - Provide remove button to clear uploaded file
    - _Requirements: 10.1, 10.4, 10.7, 10.8, 11.1, 11.4, 11.7, 11.8, 20.1_
  
  - [x] 10.2 Write unit tests for FileUploadField
    - Test file type validation (accept only specified types)
    - Test file size validation (reject files exceeding maxSize)
    - Test upload success flow with loading state
    - Test upload error handling
    - Test preview display for images
    - Test filename display for PDFs
    - Test remove functionality
    - _Requirements: 10.2, 10.3, 10.9, 10.10, 11.2, 11.3, 11.9, 11.10_

- [x] 11. Create AddTractModal component
  - [x] 11.1 Implement modal for creating new tracts
    - Create AddTractModal component in `components/dashboard/tracts-manager.tsx`
    - Build form with fields: title, category (dropdown), description (textarea), published (checkbox)
    - Integrate two FileUploadField components (cover image and PDF document)
    - Implement form validation with inline error messages
    - Submit form data to POST /api/tracts endpoint
    - Show loading spinner during submission
    - Display success toast and close modal on success
    - Display error toast on failure
    - _Requirements: 1.2, 5.3, 6.4, 10.1, 11.1, 18.7, 20.2, 20.6_
  
  - [x] 11.2 Write unit tests for AddTractModal
    - Test form rendering with all fields
    - Test form validation (required fields, length limits)
    - Test successful tract creation flow
    - Test error handling for API failures
    - Test modal close on cancel
    - Test modal close on successful creation
    - _Requirements: 1.2, 1.8, 6.4, 18.7_

- [x] 12. Create EditTractModal component
  - [x] 12.1 Implement modal for editing existing tracts
    - Create EditTractModal component in `components/dashboard/tracts-manager.tsx`
    - Pre-populate form with existing tract data
    - Allow updating all fields including cover image and PDF document
    - Submit changes to PUT /api/tracts/[id] endpoint
    - Show loading spinner during submission
    - Display success toast and close modal on success
    - Display error toast on failure
    - _Requirements: 3.2, 6.5, 10.8, 11.8, 20.3, 20.6_
  
  - [x] 12.2 Write unit tests for EditTractModal
    - Test form pre-population with tract data
    - Test partial updates (changing only some fields)
    - Test successful tract update flow
    - Test error handling for API failures
    - Test modal close on cancel
    - _Requirements: 3.2, 3.7, 6.5_

- [x] 13. Implement TractsManager core functionality
  - [x] 13.1 Create TractsManager component with state management
    - Create `components/dashboard/tracts-manager.tsx` with main component
    - Initialize state: tracts list, loading states, modal states, filters, view mode
    - Implement refetch function to reload tracts from API
    - Set up initial tracts from props
    - _Requirements: 2.6, 15.6, 21.1, 21.2, 21.3, 21.4_
  
  - [x] 13.2 Implement tract creation flow
    - Add "Add Tract" button to open AddTractModal
    - Handle successful creation: refetch tracts, show toast, close modal
    - Handle creation errors: show error toast
    - _Requirements: 1.1, 20.2, 20.6, 21.1_
  
  - [x] 13.3 Implement tract editing flow
    - Add "Edit" button on each tract card
    - Open EditTractModal with selected tract data
    - Handle successful update: refetch tracts, show toast, close modal
    - Handle update errors: show error toast
    - _Requirements: 3.1, 20.3, 20.6, 21.2_
  
  - [x] 13.4 Implement tract deletion flow
    - Add "Delete" button on each tract card
    - Show confirmation dialog before deletion
    - Submit DELETE request to API
    - Handle successful deletion: refetch tracts, show toast
    - Handle deletion errors: show error toast
    - _Requirements: 4.1, 4.5, 4.7, 20.4, 20.6, 21.3_
  
  - [x] 13.5 Implement published status toggle
    - Add toggle switch on each tract card
    - Submit PUT request to update only published field
    - Show loading indicator on the specific tract being toggled
    - Handle success: refetch tracts
    - Handle errors: show error toast, revert toggle
    - _Requirements: 6.5, 20.4, 21.4_

- [x] 14. Implement TractsManager search and filter features
  - [x] 14.1 Add search by title functionality
    - Create SearchBar component with input field
    - Filter tracts client-side where title contains query (case-insensitive)
    - Update displayed tracts when search query changes
    - Reset pagination when search changes
    - _Requirements: 16.1, 16.2, 16.8_
  
  - [x] 14.2 Add category filter functionality
    - Create TractFilters component with category dropdown
    - Include "All Categories" option plus all nine tract categories
    - Filter tracts client-side by selected category
    - Update displayed tracts when category changes
    - Reset pagination when filter changes
    - _Requirements: 5.3, 16.3, 16.4, 16.8_
  
  - [x] 14.3 Implement combined filtering and result count
    - Apply both search and category filters together (AND logic)
    - Display count of filtered results
    - Provide "Clear Filters" button to reset both filters
    - _Requirements: 16.5, 16.6, 16.7_

- [x] 15. Implement TractsManager view modes
  - [x] 15.1 Create grid view layout
    - Implement TractCard component for grid display
    - Display cover image, title, category badge, description excerpt
    - Show "Draft" badge for unpublished tracts
    - Add action buttons: Edit, Delete, View PDF, Publish toggle
    - Implement infinite scroll: load 12 tracts initially, load 12 more on scroll
    - _Requirements: 2.6, 2.7, 5.4, 6.6, 15.4_
  
  - [x] 15.2 Create table view layout
    - Implement table with columns: Cover, Title, Category, Published, Actions
    - Display 10 tracts per page with pagination controls
    - Show "Draft" badge in Published column for unpublished tracts
    - Add action buttons in Actions column
    - _Requirements: 2.6, 2.7, 6.6, 15.5_
  
  - [x] 15.3 Implement view mode toggle
    - Add toggle control to switch between grid and table views
    - Preserve selected view mode in component state
    - Apply smooth transition animations when switching views
    - Adapt layout for mobile devices (horizontal scroll for table)
    - _Requirements: 15.1, 15.2, 15.3, 15.6, 15.7, 19.5_
  
  - [x] 15.4 Write property tests for UI rendering
    - **Property 7: Complete Field Rendering**
    - **Property 8: Draft Status Indication**
    - **Property 9: Tract Count Accuracy**
    - **Validates: Requirements 2.6, 2.7, 2.8, 5.4, 6.6, 8.2, 8.4**

- [x] 16. Checkpoint - Verify dashboard functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Update public tracts page to fetch from database
  - [x] 17.1 Modify app/tracts/page.tsx to use server-side data fetching
    - Import Prisma client
    - Fetch published tracts from database using Prisma (where published = true, orderBy createdAt desc)
    - Handle database errors gracefully with try-catch
    - Pass tracts data to TractGrid component
    - Display error message if fetch fails
    - Display empty state if no published tracts exist
    - _Requirements: 8.1, 8.3, 8.8, 8.9_
  
  - [x] 17.2 Write property tests for public page filtering
    - **Property 14: Published Status Filtering** (public page portion)
    - **Validates: Requirements 6.2, 6.3, 8.1**

- [x] 18. Update TractGrid component to accept dynamic data
  - [x] 18.1 Modify TractGrid to receive tracts as props
    - Update `app/tracts/tract-grid.tsx` to accept tracts prop
    - Remove hardcoded tract data
    - Render tracts in responsive grid layout (1/2/3 columns)
    - Display cover image using Next.js Image component with optimization
    - Display category badge, title, and description
    - Add "View PDF" button linking to documentUrl with target="_blank"
    - _Requirements: 8.2, 8.4, 8.5, 12.2, 19.1, 19.2, 19.3_
  
  - [x] 18.2 Add search functionality to TractGrid
    - Add search input field above grid
    - Filter tracts client-side by title (case-insensitive)
    - Update displayed tracts when search query changes
    - _Requirements: 8.7, 16.2_
  
  - [x] 18.3 Add category filter to TractGrid
    - Add category dropdown filter above grid
    - Filter tracts client-side by selected category
    - Update displayed tracts when category changes
    - _Requirements: 8.6, 16.4_
  
  - [x] 18.4 Write property tests for public display
    - **Property 17: PDF Document Link Rendering**
    - **Property 18: Title Search Accuracy**
    - **Validates: Requirements 8.4, 8.5, 8.7, 16.2**
  
  - [x] 18.5 Write unit tests for TractGrid
    - Test rendering with empty tracts array
    - Test rendering with multiple tracts
    - Test responsive grid layout
    - Test search filtering
    - Test category filtering
    - Test "View PDF" button functionality
    - _Requirements: 8.2, 8.4, 8.6, 8.7_

- [x] 19. Implement image optimization and error handling
  - [x] 19.1 Configure Next.js Image component for tract cover images
    - Use Next.js Image component in TractCard and TractGrid
    - Set appropriate sizes attribute for responsive images
    - Enable lazy loading for performance
    - Configure Cloudinary domain in next.config.ts if needed
    - _Requirements: 12.1, 12.2, 12.5_
  
  - [x] 19.2 Add image loading error handling
    - Implement onError handler for Image components
    - Display placeholder image on load failure
    - Add visual feedback during image upload
    - _Requirements: 12.3, 12.4_
  
  - [x] 19.3 Write property tests for Cloudinary integration
    - **Property 26: Cloudinary URL Storage**
    - **Validates: Requirements 10.5, 10.6, 11.5, 11.6**

- [x] 20. Implement authentication and error handling properties
  - [x] 20.1 Write property tests for authentication
    - **Property 15: Authentication Enforcement**
    - **Property 16: Token Security**
    - **Validates: Requirements 7.1, 7.2, 7.4, 7.7**
  
  - [x] 20.2 Write property tests for error handling
    - **Property 19: Error Format Consistency**
    - **Property 20: Content-Type Header Consistency**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.8, 14.7, 14.8**

- [x] 21. Integrate TractsManager into dashboard
  - [x] 21.1 Create dashboard tracts page
    - Create `app/(dashboard)/dashboard/content/tracts/page.tsx`
    - Fetch all tracts from database (server-side)
    - Pass tracts to TractsManager component
    - Handle authentication via middleware
    - _Requirements: 2.1, 7.5_
  
  - [x] 21.2 Add Tracts menu item to dashboard sidebar
    - Update `components/dashboard/sidebar.tsx` to include Tracts link
    - Add appropriate icon for Tracts menu item
    - Ensure navigation works correctly
    - _Requirements: 7.5_
  
  - [x] 21.3 Write integration tests for dashboard flow
    - Test navigation to tracts page
    - Test authentication protection (redirect to login if not authenticated)
    - Test complete CRUD flow: create, read, update, delete
    - Test file upload integration
    - _Requirements: 7.5, 10.4, 11.4_

- [x] 22. Implement responsive design and accessibility
  - [x] 22.1 Ensure responsive layouts for all components
    - Test TractsManager on mobile, tablet, and desktop
    - Test TractGrid on mobile, tablet, and desktop
    - Ensure modals are full-screen on mobile
    - Ensure table view has horizontal scroll on mobile
    - Stack filters vertically on mobile
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_
  
  - [x] 22.2 Implement accessibility features
    - Add proper ARIA labels to all interactive elements
    - Ensure keyboard navigation works (tab order, focus indicators)
    - Add alt text to all images
    - Ensure form labels are properly associated
    - Test with screen reader (announce errors, loading states)
    - Verify color contrast meets WCAG AA standards
    - _Requirements: Not explicitly in requirements but essential for production_

- [x] 23. Add loading states and user feedback
  - [x] 23.1 Implement comprehensive loading states
    - Add loading spinner during file uploads
    - Add loading spinner during tract creation
    - Add loading spinner during tract updates
    - Add loading spinner during tract deletion
    - Add loading spinner for published toggle
    - Disable action buttons during operations
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_
  
  - [x] 23.2 Implement toast notifications
    - Add success toast after tract creation
    - Add success toast after tract update
    - Add success toast after tract deletion
    - Add error toast for all operation failures
    - Ensure toasts are accessible (screen reader announcements)
    - _Requirements: 20.6, 20.7_
  
  - [x] 23.3 Add loading state for public page
    - Display loading indicator while fetching tracts
    - Show skeleton loaders for tract cards
    - _Requirements: 20.8_

- [x] 24. Final checkpoint - End-to-end verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 25. Integration and final wiring
  - [x] 25.1 Verify complete system integration
    - Test complete flow: login → dashboard → create tract with files → view on public page
    - Test all CRUD operations work correctly
    - Test file uploads work for both images and PDFs
    - Test search and filter functionality on both dashboard and public page
    - Test responsive design on multiple devices
    - Verify all error handling works correctly
    - _Requirements: All requirements_
  
  - [x] 25.2 Performance optimization verification
    - Verify database indexes are created and used
    - Verify Next.js Image optimization is working
    - Verify lazy loading is working
    - Check Cloudinary CDN delivery is working
    - Test page load times
    - _Requirements: 9.3, 12.1, 12.2, 12.5_
  
  - [x] 25.3 Security verification
    - Verify authentication is enforced on all protected endpoints
    - Verify session tokens are not exposed in responses or logs
    - Verify file upload validation is working
    - Verify input validation is working for all fields
    - Test with invalid/malicious inputs
    - _Requirements: 7.1, 7.2, 7.4, 7.7, 18.1-18.6_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation uses TypeScript throughout, following Next.js 16 App Router conventions
- File uploads integrate with existing Cloudinary infrastructure via /api/upload endpoint
- The system follows the same architectural patterns as the Books Management System
- All API endpoints use session-based authentication with HTTP-only cookies
- Database operations use Prisma ORM with PostgreSQL
- UI components use React 19, Tailwind CSS, and Next.js Image optimization

## Testing Strategy

### Property-Based Tests (26 properties)
- Run with fast-check library (minimum 100 iterations per property)
- Each test references its design document property number
- Tag format: `Feature: tracts-management-system, Property {number}: {property_text}`
- Properties cover: validation, CRUD operations, filtering, authentication, file uploads, UI rendering

### Unit Tests
- API route handlers with specific payloads
- Validation schema edge cases
- Error handling scenarios
- Component rendering with specific data
- File upload UI interactions
- Modal dialogs and confirmation prompts

### Integration Tests
- Complete CRUD flows
- File upload integration
- Dashboard navigation
- Authentication protection
- Public page data fetching
