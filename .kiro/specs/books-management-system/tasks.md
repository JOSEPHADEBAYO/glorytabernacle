# Implementation Plan: Books Management System

## Overview

This implementation plan converts the Books Management System design into actionable coding tasks. The system provides CRUD operations for managing Christian books through a secure dashboard interface, with public display of published books. The implementation uses Next.js 16 App Router, TypeScript, Prisma ORM, and Zod validation.

**Key Implementation Areas**:
- API Layer: 5 RESTful endpoints with validation and authentication
- Dashboard Components: Enhanced BooksManager with edit, search, and filter capabilities
- Public Display: Server-rendered book library fetching from database
- Testing: Unit tests and 21 property-based tests for correctness verification

## Tasks

- [x] 1. Set up shared types and validation schemas
  - Create `lib/types/book.ts` with TypeScript interfaces and type definitions
  - Export BOOK_CATEGORIES constant array with all 10 predefined categories
  - Define Book, CreateBookInput, and UpdateBookInput interfaces
  - Create `lib/validation/book.ts` with Zod validation schemas
  - Implement createBookSchema with all field validations (title max 200, author max 100, description max 2000, URL validation)
  - Implement updateBookSchema with optional fields and at least one field requirement
  - Implement bookQuerySchema for query parameter validation
  - _Requirements: 1.2, 1.5, 1.6, 1.7, 3.4, 5.1, 5.2, 10.1, 10.2_

- [x] 1.1 Write property test for input validation completeness
  - **Property 1: Input Validation Completeness**
  - **Validates: Requirements 1.2, 1.5, 1.6, 1.7, 3.4, 5.1, 10.1, 10.2**
  - Generate arbitrary book creation/update payloads with missing fields, invalid categories, and malformed URLs
  - Verify validation schemas reject all invalid inputs
  - _Requirements: 1.2, 1.5, 1.6, 1.7, 3.4, 5.1, 10.1, 10.2_

- [x] 1.2 Write property test for validation error responses
  - **Property 2: Validation Error Responses**
  - **Validates: Requirements 1.9, 3.7, 11.1, 11.2, 11.9**
  - Generate arbitrary invalid payloads (missing fields, invalid URLs, invalid categories)
  - Verify API returns 400 status with descriptive error messages listing all failures
  - _Requirements: 1.9, 3.7, 11.1, 11.2, 11.9_

- [x] 2. Create authentication helper utilities
  - Create `lib/auth/session.ts` with session management functions
  - Implement getSessionToken() to extract session_token from HTTP-only cookies
  - Implement validateSession() to check token presence
  - Implement getSessionUser() to retrieve user info from token (placeholder returning super-admin for now)
  - Add proper TypeScript types for session data
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2.1 Write unit tests for authentication helpers
  - Test getSessionToken() with valid and missing cookies
  - Test validateSession() returns correct boolean values
  - Test getSessionUser() returns expected user object
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 3. Implement POST /api/books endpoint
  - Create `app/api/books/route.ts` with POST handler
  - Extract and validate session token using getSessionToken()
  - Return 401 if session token missing or invalid
  - Parse request body and validate with createBookSchema
  - Return 400 with validation errors if schema validation fails
  - Create book record in database using Prisma with createdBy field from session
  - Return 201 status with complete book record on success
  - Handle database errors with 500 status and generic error message
  - Log errors server-side without exposing sensitive data
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 7.1, 7.2, 11.1, 11.8, 12.1, 12.7_

- [x] 3.1 Write unit tests for POST /api/books
  - Test successful book creation with valid data returns 201
  - Test missing required fields returns 400
  - Test invalid URL formats return 400
  - Test invalid category returns 400
  - Test missing session token returns 401
  - Test optional purchaseUrl field handling
  - Test published field defaults to false
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.9, 7.1, 11.1_

- [x] 3.2 Write property test for book creation round-trip
  - **Property 3: Book Creation Round-Trip**
  - **Validates: Requirements 1.1, 1.8, 1.10, 1.11, 2.2**
  - Generate arbitrary valid book creation payloads
  - Create book via API, then retrieve it
  - Verify all input fields preserved and auto-generated fields present (id, createdAt, updatedAt, createdBy)
  - _Requirements: 1.1, 1.8, 1.10, 1.11, 2.2_

- [x] 3.3 Write property test for optional field handling
  - **Property 4: Optional Field Handling**
  - **Validates: Requirements 1.3, 1.4, 6.1**
  - Generate book payloads with and without purchaseUrl
  - Generate book payloads with and without published field
  - Verify purchaseUrl stored correctly when provided, null when omitted
  - Verify published defaults to false when not provided
  - _Requirements: 1.3, 1.4, 6.1_

- [x] 4. Implement GET /api/books endpoint
  - Add GET handler to `app/api/books/route.ts`
  - Extract and validate session token (authentication required for dashboard access)
  - Parse query parameters (published, category) and validate with bookQuerySchema
  - Build Prisma query with where clause based on filters
  - Query database ordered by createdAt descending
  - Return 200 status with array of books wrapped in { books: [] } object
  - Handle empty results with empty array (not 404)
  - Handle database errors with 500 status
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 11.8, 12.2, 12.10_

- [x] 4.1 Write unit tests for GET /api/books
  - Test returns all books ordered by createdAt descending
  - Test published filter returns only matching books
  - Test category filter returns only matching books
  - Test combined filters work correctly
  - Test empty results return empty array with 200 status
  - Test missing session token returns 401
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 7.1_

- [x] 4.2 Write property test for ordering consistency
  - **Property 5: Ordering Consistency**
  - **Validates: Requirements 2.1, 8.3**
  - Generate arbitrary sets of books with different creation timestamps
  - Query books list via API
  - Verify results ordered by createdAt descending (newest first)
  - _Requirements: 2.1, 8.3_

- [x] 4.3 Write property test for category filtering accuracy
  - **Property 6: Category Filtering Accuracy**
  - **Validates: Requirements 2.4, 5.5**
  - Generate arbitrary book sets with various categories
  - For each category, query with category filter
  - Verify only books matching exact category returned
  - _Requirements: 2.4, 5.5_

- [x] 4.4 Write property test for query parameter filtering
  - **Property 21: Query Parameter Filtering**
  - **Validates: Requirements 2.3, 2.4, 12.10**
  - Generate arbitrary combinations of published and category query parameters
  - Query API with various filter combinations
  - Verify results match all specified filters
  - _Requirements: 2.3, 2.4, 12.10_

- [x] 5. Checkpoint - Verify list and create endpoints
  - Test POST /api/books creates books successfully
  - Test GET /api/books retrieves created books
  - Test filtering by published and category works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement GET /api/books/[id] endpoint
  - Create `app/api/books/[id]/route.ts` with GET handler
  - Extract and validate session token
  - Return 401 if session token missing
  - Extract book ID from route params
  - Query database for book by ID using Prisma findUnique
  - Return 404 if book not found
  - Return 200 with complete book record if found
  - Handle database errors with 500 status
  - _Requirements: 3.3, 3.6, 7.1, 7.2, 11.3, 11.8, 12.3_

- [x] 6.1 Write unit tests for GET /api/books/[id]
  - Test returns book with 200 for valid existing ID
  - Test returns 404 for non-existent ID
  - Test returns 401 without session token
  - Test returns all book fields in response
  - _Requirements: 3.3, 3.6, 7.1, 11.3_

- [x] 7. Implement PUT /api/books/[id] endpoint
  - Add PUT handler to `app/api/books/[id]/route.ts`
  - Extract and validate session token
  - Return 401 if session token missing
  - Extract book ID from route params
  - Parse request body and validate with updateBookSchema
  - Return 400 with validation errors if schema validation fails
  - Check if book exists using Prisma findUnique
  - Return 404 if book not found
  - Update book with Prisma update, only modifying specified fields
  - Return 200 with updated book record
  - Handle database errors with 500 status
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 7.1, 7.2, 11.3, 11.8, 12.4_

- [x] 7.1 Write unit tests for PUT /api/books/[id]
  - Test successful update returns 200 with updated book
  - Test partial update only modifies specified fields
  - Test returns 404 for non-existent ID
  - Test returns 400 for invalid data
  - Test returns 401 without session token
  - Test createdAt and createdBy never change
  - Test updatedAt automatically updates
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 7.1_

- [x] 7.2 Write property test for update field preservation
  - **Property 10: Update Field Preservation**
  - **Validates: Requirements 3.1, 3.2, 3.8, 3.9**
  - Generate arbitrary book records and partial update payloads
  - Update book via API with subset of fields
  - Verify only specified fields modified, others unchanged
  - Verify createdAt and createdBy never change, updatedAt does change
  - _Requirements: 3.1, 3.2, 3.8, 3.9_

- [x] 7.3 Write property test for update response accuracy
  - **Property 11: Update Response Accuracy**
  - **Validates: Requirements 3.5**
  - Generate arbitrary valid update payloads
  - Update book via API
  - Verify response has 200 status and contains complete updated book record
  - _Requirements: 3.5_

- [x] 7.4 Write property test for not found error consistency
  - **Property 13: Not Found Error Consistency**
  - **Validates: Requirements 3.3, 3.6, 4.2, 4.4, 11.3**
  - Generate arbitrary non-existent book IDs
  - Attempt GET, PUT, DELETE operations on non-existent IDs
  - Verify all return 404 status with error message
  - _Requirements: 3.3, 3.6, 4.2, 4.4, 11.3_

- [x] 8. Implement DELETE /api/books/[id] endpoint
  - Add DELETE handler to `app/api/books/[id]/route.ts`
  - Extract and validate session token
  - Return 401 if session token missing
  - Extract book ID from route params
  - Check if book exists using Prisma findUnique
  - Return 404 if book not found
  - Delete book using Prisma delete
  - Return 200 with success message { message: "Book deleted successfully" }
  - Handle database errors with 500 status
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 7.2, 11.3, 11.8, 12.5_

- [x] 8.1 Write unit tests for DELETE /api/books/[id]
  - Test successful deletion returns 200 with success message
  - Test returns 404 for non-existent ID
  - Test returns 401 without session token
  - Test deleted book no longer retrievable (subsequent GET returns 404)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.1_

- [x] 8.2 Write property test for deletion completeness
  - **Property 12: Deletion Completeness**
  - **Validates: Requirements 4.1, 4.3, 4.6**
  - Generate arbitrary book records and create them
  - Delete books via API
  - Verify subsequent queries return 404
  - Verify deleted books don't appear in list results
  - _Requirements: 4.1, 4.3, 4.6_

- [x] 8.3 Write property test for authentication enforcement
  - **Property 15: Authentication Enforcement**
  - **Validates: Requirements 7.1, 7.2, 7.4, 11.4**
  - Generate arbitrary valid payloads for create, update, delete operations
  - Make API requests without session token
  - Verify all return 401 status with "Unauthorized" error message
  - _Requirements: 7.1, 7.2, 7.4, 11.4_

- [x] 8.4 Write property test for token security
  - **Property 16: Token Security**
  - **Validates: Requirements 7.7, 11.7**
  - Make arbitrary API requests (success and error cases)
  - Verify authentication tokens never exposed in response bodies
  - Verify tokens not logged in error messages
  - _Requirements: 7.7, 11.7_

- [x] 8.5 Write property test for error format consistency
  - **Property 19: Error Format Consistency**
  - **Validates: Requirements 11.8**
  - Generate arbitrary invalid requests (validation errors, auth errors, not found)
  - Verify all error responses are valid JSON with "error" field
  - Verify appropriate HTTP status codes (400, 401, 404, 500)
  - _Requirements: 11.8_

- [x] 8.6 Write property test for content-type header consistency
  - **Property 20: Content-Type Header Consistency**
  - **Validates: Requirements 12.7, 12.8**
  - Make arbitrary API requests with JSON payloads
  - Verify Content-Type header is "application/json" for requests and responses
  - _Requirements: 12.7, 12.8_

- [x] 9. Checkpoint - Verify all API endpoints complete
  - Test all CRUD operations work end-to-end
  - Test authentication enforcement on all endpoints
  - Test error handling for all edge cases
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update BooksManager component with edit functionality
  - Open `components/dashboard/books-manager.tsx`
  - Add state for edit modal (isEditModalOpen, editingBook)
  - Create EditBookModal component similar to AddBookModal
  - Add "Edit" button to each book card
  - Implement handleEditBook function to open modal with book data
  - In EditBookModal, pre-populate form with existing book data
  - Implement PUT request to /api/books/[id] on form submit
  - Update local state and refresh on successful edit
  - Display error messages via toast or inline error
  - _Requirements: 3.1, 3.2, 3.5, 3.7_

- [x] 10.1 Write unit tests for edit functionality
  - Test edit modal opens with correct book data
  - Test edit form submission calls PUT endpoint
  - Test successful edit updates book in list
  - Test error handling displays error message
  - _Requirements: 3.1, 3.5, 3.7_

- [x] 11. Add publish toggle to BooksManager
  - Add handleTogglePublish function to BooksManager
  - Implement PUT request to /api/books/[id] with only published field
  - Add toggle button or switch to each book card
  - Update local state optimistically
  - Revert on error and display error message
  - Show loading state during toggle operation
  - _Requirements: 6.5, 6.6_

- [x] 11.1 Write unit tests for publish toggle
  - Test toggle calls PUT endpoint with published field
  - Test successful toggle updates book status
  - Test error handling reverts state
  - _Requirements: 6.5, 6.6_

- [x] 12. Add category filter to BooksManager
  - Add state for selected category filter
  - Create CategoryFilter component with dropdown or button group
  - Display all 10 categories plus "All Categories" option
  - Filter books array based on selected category
  - Update displayed count to reflect filtered results
  - Persist filter selection in component state
  - _Requirements: 2.4, 5.3, 5.4, 5.5_

- [x] 12.1 Write unit tests for category filter
  - Test filter displays all categories
  - Test selecting category filters book list
  - Test "All Categories" shows all books
  - Test book count updates with filter
  - _Requirements: 2.4, 5.3, 5.5_

- [x] 13. Add search functionality to BooksManager
  - Add state for search query
  - Create SearchBar component with input field
  - Implement search filtering by title and author (case-insensitive)
  - Combine search with category filter (both apply)
  - Update displayed count to reflect search results
  - Add clear search button
  - Debounce search input for performance (optional enhancement)
  - _Requirements: 2.6_

- [x] 13.1 Write unit tests for search functionality
  - Test search filters by title
  - Test search filters by author
  - Test search is case-insensitive
  - Test search combines with category filter
  - Test clear search resets results
  - _Requirements: 2.6_

- [x] 14. Improve error handling in BooksManager
  - Add toast notification system or use existing toast provider
  - Display success toasts for create, update, delete, publish operations
  - Display error toasts with descriptive messages from API responses
  - Add loading states to all buttons during API operations
  - Disable buttons during loading to prevent duplicate requests
  - Handle network errors gracefully with user-friendly messages
  - _Requirements: 3.7, 4.7, 11.1, 11.8_

- [x] 14.1 Write unit tests for error handling
  - Test error messages display for failed operations
  - Test loading states prevent duplicate requests
  - Test network errors show user-friendly messages
  - _Requirements: 3.7, 4.7, 11.8_

- [x] 14.2 Write property test for complete field rendering
  - **Property 7: Complete Field Rendering**
  - **Validates: Requirements 2.6, 5.4, 8.2, 8.4**
  - Generate arbitrary book records
  - Render books in dashboard and public library
  - Verify all core fields displayed: cover image, title, author, category, description
  - _Requirements: 2.6, 5.4, 8.2, 8.4_

- [x] 14.3 Write property test for draft status indication
  - **Property 8: Draft Status Indication**
  - **Validates: Requirements 2.7, 6.6**
  - Generate arbitrary books with published true and false
  - Render books in dashboard
  - Verify "Draft" badge appears only when published equals false
  - _Requirements: 2.7, 6.6_

- [x] 14.4 Write property test for book count accuracy
  - **Property 9: Book Count Accuracy**
  - **Validates: Requirements 2.8**
  - Generate arbitrary sets of books
  - Render BooksManager with book sets
  - Verify displayed count exactly equals number of books
  - _Requirements: 2.8_

- [x] 15. Checkpoint - Verify dashboard functionality complete
  - Test all dashboard features work: add, edit, delete, publish toggle, filter, search
  - Test error handling and loading states
  - Test UI displays all book information correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Update public books page to fetch from database
  - Open `app/books/page.tsx`
  - Verify it's a server component (no 'use client' directive)
  - Add Prisma query to fetch published books: `prisma.book.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' } })`
  - Pass books as props to BookLibrary component
  - Handle empty results with appropriate message
  - Add error boundary for database errors
  - _Requirements: 6.2, 6.3, 6.8, 8.1, 8.3, 8.9_

- [x] 16.1 Write unit tests for public books page
  - Test page fetches only published books
  - Test books ordered by createdAt descending
  - Test empty state displays appropriate message
  - _Requirements: 6.2, 6.3, 8.1, 8.3_

- [x] 17. Update BookLibrary component to accept props
  - Open `app/books/book-library.tsx`
  - Update component to accept books prop instead of using hardcoded BOOKS array
  - Remove or comment out hardcoded BOOKS array
  - Update TypeScript interface to match Book type from database
  - Ensure all book fields render correctly (title, author, category, description, coverImage, purchaseUrl)
  - Handle empty books array with appropriate message
  - _Requirements: 8.2, 8.4, 8.5, 8.6_

- [x] 17.1 Write unit tests for BookLibrary component
  - Test component renders books from props
  - Test displays all book fields correctly
  - Test handles empty books array
  - Test "Get Book" button links to purchaseUrl when present
  - Test "Get Book" button disabled when purchaseUrl absent
  - _Requirements: 8.2, 8.4, 8.5, 8.6_

- [x] 17.2 Write property test for published status filtering
  - **Property 14: Published Status Filtering**
  - **Validates: Requirements 6.2, 6.3, 6.8, 8.1**
  - Generate arbitrary book sets with mixed published values
  - Query public library page
  - Verify only books with published equals true returned
  - Query dashboard
  - Verify all books returned regardless of published status
  - _Requirements: 6.2, 6.3, 6.8, 8.1_

- [x] 17.3 Write property test for purchase link behavior
  - **Property 17: Purchase Link Behavior**
  - **Validates: Requirements 8.5, 8.6**
  - Generate arbitrary books with and without purchaseUrl
  - Render books in public library
  - Verify "Get Book" button links to purchaseUrl when present
  - Verify button disabled or shows placeholder when purchaseUrl absent
  - _Requirements: 8.5, 8.6_

- [x] 18. Optimize images in BookLibrary component
  - Ensure Next.js Image component used for all book covers
  - Add proper sizes attribute for responsive images: `sizes="(max-width: 768px) 100vw, 33vw"`
  - Add fill prop with object-cover for consistent aspect ratios
  - Implement onError handler to show placeholder image on load failure
  - Add loading="lazy" for images below fold
  - Test image optimization with external URLs
  - _Requirements: 10.3, 10.4, 10.5, 10.6_

- [x] 18.1 Write unit tests for image optimization
  - Test Next.js Image component used for covers
  - Test error handler shows placeholder on failure
  - Test images have proper alt text
  - _Requirements: 10.3, 10.4, 10.6_

- [x] 19. Add pagination or load more to public library
  - Decide on pagination strategy (numbered pages vs "Load More" button)
  - If using "Load More": implement client-side state to track displayed count
  - If using pagination: add page query parameter and calculate offset
  - Update Prisma query to use take and skip for pagination
  - Display pagination controls at bottom of book grid
  - Update URL with page parameter for shareable links (optional)
  - _Requirements: 8.7_

- [x] 19.1 Write unit tests for pagination
  - Test pagination controls display for large book sets
  - Test "Load More" or page navigation loads additional books
  - Test pagination doesn't break with small book sets
  - _Requirements: 8.7_

- [x] 19.2 Write property test for pagination functionality
  - **Property 18: Pagination Functionality**
  - **Validates: Requirements 8.7**
  - Generate large sets of books (more than initial display count)
  - Render public library
  - Verify pagination controls display
  - Verify activating controls loads additional books correctly
  - _Requirements: 8.7_

- [x] 20. Final checkpoint - End-to-end testing
  - Test complete flow: create book in dashboard, verify appears in public library when published
  - Test complete flow: edit book, verify changes reflected in public library
  - Test complete flow: unpublish book, verify removed from public library
  - Test complete flow: delete book, verify removed from dashboard and public library
  - Test authentication: verify unauthenticated users cannot access API endpoints
  - Test error handling: verify all error cases display appropriate messages
  - Run all unit tests and property-based tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Documentation and cleanup
  - Add JSDoc comments to all API route handlers
  - Add JSDoc comments to validation schemas and types
  - Document environment variables in README or .env.example
  - Add API documentation comments describing endpoints, parameters, responses
  - Remove any console.log statements used for debugging
  - Ensure all TypeScript types are properly defined (no 'any' types)
  - Verify all imports use correct paths
  - Run linter and fix any issues

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- All code uses TypeScript for type safety
- Authentication is enforced at both middleware and API levels
- Images use Next.js Image component for automatic optimization
- The design includes 21 correctness properties, all covered by property-based tests

## Testing Strategy

**Property-Based Tests**: 21 properties covering input validation, CRUD operations, authentication, filtering, rendering, and error handling. Each property test uses fast-check to generate arbitrary inputs and verify universal behaviors.

**Unit Tests**: Specific test cases for API endpoints, components, and utilities covering success paths, error conditions, and edge cases.

**Integration Tests**: End-to-end flows testing complete user journeys from dashboard to public display.

## Implementation Priority

1. **API Layer (High)**: Tasks 1-9 establish the backend foundation
2. **Dashboard Components (High)**: Tasks 10-15 enable content management
3. **Public Display (Medium)**: Tasks 16-19 enable public book browsing
4. **Testing (High)**: Property-based and unit tests throughout ensure correctness
5. **Documentation (Low)**: Task 21 improves maintainability
