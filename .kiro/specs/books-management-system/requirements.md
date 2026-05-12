# Requirements Document: Books Management System

## Introduction

The Books Management System enables church administrators to manage a curated library of Christian books through a secure dashboard interface. The system provides complete CRUD (Create, Read, Update, Delete) operations for book records, supports draft/published workflows, and integrates with the public-facing church website to display published books to visitors. Books are categorized into predefined Christian literature categories and include metadata such as title, author, description, cover images, and purchase links.

## Glossary

- **Book_Manager**: The dashboard component that provides the administrative interface for managing books
- **Book_API**: The REST API endpoints that handle CRUD operations for book records
- **Database**: The PostgreSQL database managed through Prisma ORM
- **Session_Token**: The HTTP-only cookie used to authenticate dashboard users
- **Public_Library**: The public-facing page that displays published books to website visitors
- **Cover_Image**: A URL pointing to the book's cover image (currently external URLs, future Cloudinary integration)
- **Purchase_URL**: An optional external link where visitors can purchase the book
- **Published_Status**: A boolean flag indicating whether a book is visible on the public website (true) or saved as a draft (false)
- **Book_Category**: One of ten predefined Christian literature categories
- **Authenticated_User**: A user with a valid session token who has access to the dashboard

## Requirements

### Requirement 1: Create Books

**User Story:** As a church administrator, I want to create new book records through the dashboard, so that I can add recommended Christian books to the library.

#### Acceptance Criteria

1. WHEN an Authenticated_User submits a valid book creation request, THE Book_API SHALL create a new book record in the Database
2. THE Book_API SHALL require title, author, category, description, and coverImage fields for book creation
3. THE Book_API SHALL accept optional purchaseUrl field for book creation
4. THE Book_API SHALL set the published status based on the user's selection (default: false)
5. THE Book_API SHALL validate that category is one of the ten predefined Book_Categories
6. THE Book_API SHALL validate that coverImage is a valid URL format
7. IF purchaseUrl is provided, THE Book_API SHALL validate that it is a valid URL format
8. WHEN a book is successfully created, THE Book_API SHALL return the complete book record with HTTP status 201
9. IF validation fails, THE Book_API SHALL return a descriptive error message with HTTP status 400
10. THE Book_API SHALL record the createdBy field with the authenticated user's identifier
11. THE Book_API SHALL automatically set createdAt and updatedAt timestamps

### Requirement 2: Read Books

**User Story:** As a church administrator, I want to view all books in the dashboard, so that I can manage the library effectively.

#### Acceptance Criteria

1. WHEN an Authenticated_User requests the books list, THE Book_API SHALL return all book records ordered by creation date (newest first)
2. THE Book_API SHALL include all book fields in the response (id, title, author, category, description, coverImage, purchaseUrl, published, createdAt, updatedAt)
3. THE Book_API SHALL support filtering by published status
4. THE Book_API SHALL support filtering by category
5. WHEN a book record does not exist, THE Book_API SHALL return an empty array with HTTP status 200
6. THE Book_Manager SHALL display books in a grid layout with cover images, titles, authors, categories, and descriptions
7. THE Book_Manager SHALL visually indicate draft books with a "Draft" badge
8. THE Book_Manager SHALL display a count of total books in the library

### Requirement 3: Update Books

**User Story:** As a church administrator, I want to edit existing book records, so that I can correct information or update book details.

#### Acceptance Criteria

1. WHEN an Authenticated_User submits a valid book update request, THE Book_API SHALL update the specified book record in the Database
2. THE Book_API SHALL allow updating title, author, category, description, coverImage, purchaseUrl, and published fields
3. THE Book_API SHALL validate that the book ID exists before attempting update
4. THE Book_API SHALL apply the same validation rules as book creation for updated fields
5. WHEN a book is successfully updated, THE Book_API SHALL return the updated book record with HTTP status 200
6. IF the book ID does not exist, THE Book_API SHALL return an error message with HTTP status 404
7. IF validation fails, THE Book_API SHALL return a descriptive error message with HTTP status 400
8. THE Book_API SHALL automatically update the updatedAt timestamp
9. THE Book_API SHALL preserve the original createdAt and createdBy values

### Requirement 4: Delete Books

**User Story:** As a church administrator, I want to delete book records, so that I can remove outdated or incorrect books from the library.

#### Acceptance Criteria

1. WHEN an Authenticated_User submits a book deletion request, THE Book_API SHALL permanently remove the specified book record from the Database
2. THE Book_API SHALL validate that the book ID exists before attempting deletion
3. WHEN a book is successfully deleted, THE Book_API SHALL return HTTP status 200 with a success message
4. IF the book ID does not exist, THE Book_API SHALL return an error message with HTTP status 404
5. THE Book_Manager SHALL prompt for confirmation before deleting a book
6. WHEN a book is deleted, THE Book_Manager SHALL remove it from the displayed list without requiring a page refresh
7. THE Book_Manager SHALL display an error message if deletion fails

### Requirement 5: Book Categories

**User Story:** As a church administrator, I want to categorize books using predefined Christian literature categories, so that visitors can browse books by topic.

#### Acceptance Criteria

1. THE Book_API SHALL enforce that category must be one of exactly ten predefined values
2. THE predefined Book_Categories SHALL be: "Spiritual Growth", "Prayer & Intercession", "Faith & Doctrine", "Christian Living", "Leadership", "Family & Relationships", "Devotional", "Theology", "Biography", "Other"
3. THE Book_Manager SHALL display categories as a dropdown selection during book creation and editing
4. THE Book_Manager SHALL display the category label on each book card
5. THE Public_Library SHALL support filtering books by category
6. THE Database SHALL index the category field for efficient filtering queries

### Requirement 6: Published Status Management

**User Story:** As a church administrator, I want to save books as drafts or publish them immediately, so that I can prepare content before making it visible to the public.

#### Acceptance Criteria

1. THE Book_API SHALL support a published boolean field with default value false
2. WHEN published is false, THE book SHALL NOT appear in the Public_Library
3. WHEN published is true, THE book SHALL appear in the Public_Library
4. THE Book_Manager SHALL provide a checkbox to set published status during book creation
5. THE Book_Manager SHALL allow toggling published status when editing a book
6. THE Book_Manager SHALL visually distinguish draft books from published books with a "Draft" badge
7. THE Database SHALL index the published field for efficient filtering queries
8. THE Public_Library SHALL query only books where published equals true

### Requirement 7: Authentication and Authorization

**User Story:** As a church administrator, I want book management restricted to authenticated dashboard users, so that unauthorized users cannot modify the library.

#### Acceptance Criteria

1. THE Book_API SHALL verify the presence of a valid Session_Token before processing any request
2. IF Session_Token is missing or invalid, THE Book_API SHALL return HTTP status 401 with an error message
3. THE Book_API SHALL extract the Session_Token from HTTP-only cookies
4. THE Book_API SHALL apply authentication checks to all CRUD endpoints (POST, GET, PUT, DELETE)
5. THE middleware SHALL redirect unauthenticated users attempting to access the dashboard to the login page
6. THE Public_Library SHALL be accessible without authentication
7. THE Book_API SHALL NOT expose authentication tokens in response bodies or logs

### Requirement 8: Public Book Display

**User Story:** As a website visitor, I want to browse published Christian books on the public website, so that I can discover and purchase recommended reading.

#### Acceptance Criteria

1. THE Public_Library SHALL display all books where published equals true
2. THE Public_Library SHALL display books in a grid layout with cover images, titles, authors, categories, and descriptions
3. THE Public_Library SHALL order books by creation date (newest first)
4. THE Public_Library SHALL display a "Get Book" button for each book
5. WHEN a book has a purchaseUrl, THE "Get Book" button SHALL link to the external purchase page
6. WHEN a book does not have a purchaseUrl, THE "Get Book" button SHALL be disabled or display a placeholder
7. THE Public_Library SHALL support pagination or "Load More" functionality for large book collections
8. THE Public_Library SHALL be accessible without authentication
9. THE Public_Library SHALL fetch book data from the Book_API or directly from the Database using server-side rendering

### Requirement 9: Database Migration and Setup

**User Story:** As a developer, I want to initialize the database schema and establish the connection, so that the Books Management System can persist data.

#### Acceptance Criteria

1. THE Database SHALL use the existing Prisma schema definition for the Book model
2. THE Book model SHALL include fields: id (String, cuid), title (String), author (String), category (String), description (Text), coverImage (String), purchaseUrl (String, optional), published (Boolean, default false), createdBy (String), createdAt (DateTime), updatedAt (DateTime)
3. THE Database SHALL create indexes on published and category fields
4. THE system SHALL provide a migration command to apply the schema to the PostgreSQL database
5. THE Prisma client SHALL be configured to connect using the DATABASE_URL environment variable
6. THE system SHALL use the existing Prisma client singleton pattern from lib/prisma.ts
7. WHEN the database connection fails, THE system SHALL log a descriptive error message
8. THE migration process SHALL be idempotent (safe to run multiple times)

### Requirement 10: Image Handling

**User Story:** As a church administrator, I want to provide book cover images via URLs, so that books display visually in the library.

#### Acceptance Criteria

1. THE Book_API SHALL accept coverImage as a string URL field
2. THE Book_API SHALL validate that coverImage is a properly formatted URL
3. THE Book_Manager SHALL display cover images using Next.js Image component with proper optimization
4. THE Public_Library SHALL display cover images using Next.js Image component with proper optimization
5. THE system SHALL support external image URLs (e.g., Amazon, publisher websites)
6. THE system SHALL handle image loading errors gracefully with a placeholder or fallback image
7. THE Book_Manager SHALL provide guidance text indicating that coverImage should be a URL
8. THE system SHALL document that future versions may support direct image uploads via Cloudinary

### Requirement 11: API Error Handling

**User Story:** As a developer, I want comprehensive error handling in the API, so that clients receive clear feedback when operations fail.

#### Acceptance Criteria

1. WHEN a request is missing required fields, THE Book_API SHALL return HTTP status 400 with a message listing the missing fields
2. WHEN a request contains invalid data types, THE Book_API SHALL return HTTP status 400 with a descriptive validation error
3. WHEN a requested book ID does not exist, THE Book_API SHALL return HTTP status 404 with message "Book not found"
4. WHEN authentication fails, THE Book_API SHALL return HTTP status 401 with message "Unauthorized"
5. WHEN a database operation fails, THE Book_API SHALL return HTTP status 500 with message "Internal server error"
6. THE Book_API SHALL log detailed error information server-side for debugging
7. THE Book_API SHALL NOT expose sensitive information (database details, stack traces) in error responses
8. THE Book_API SHALL return errors in consistent JSON format with "error" field
9. WHEN multiple validation errors occur, THE Book_API SHALL return all errors in a single response

### Requirement 12: API Route Structure

**User Story:** As a developer, I want RESTful API routes following Next.js conventions, so that the API is predictable and maintainable.

#### Acceptance Criteria

1. THE Book_API SHALL implement a POST endpoint at /api/books for creating books
2. THE Book_API SHALL implement a GET endpoint at /api/books for listing all books
3. THE Book_API SHALL implement a GET endpoint at /api/books/[id] for retrieving a single book
4. THE Book_API SHALL implement a PUT endpoint at /api/books/[id] for updating a book
5. THE Book_API SHALL implement a DELETE endpoint at /api/books/[id] for deleting a book
6. THE Book_API SHALL use Next.js App Router route handlers (route.ts files)
7. THE Book_API SHALL accept and return JSON payloads
8. THE Book_API SHALL set appropriate Content-Type headers (application/json)
9. THE Book_API SHALL follow RESTful conventions for HTTP methods and status codes
10. THE Book_API SHALL support query parameters for filtering (published, category) on the GET /api/books endpoint
