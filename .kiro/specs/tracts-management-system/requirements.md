# Requirements Document: Tracts Management System

## Introduction

The Tracts Management System enables church administrators to manage a curated library of religious tracts (pamphlets/documents) through a secure dashboard interface. The system provides complete CRUD (Create, Read, Update, Delete) operations for tract records, supports draft/published workflows, and integrates with the public-facing church website to display published tracts to visitors. Tracts are categorized into predefined Christian literature categories and include metadata such as title, category, description, cover images (thumbnails), and PDF document URLs. The system supports file uploads for both cover images and PDF documents via Cloudinary integration.

## Glossary

- **Tract_Manager**: The dashboard component that provides the administrative interface for managing tracts
- **Tract_API**: The REST API endpoints that handle CRUD operations for tract records
- **Database**: The PostgreSQL database managed through Prisma ORM
- **Session_Token**: The HTTP-only cookie used to authenticate dashboard users
- **Public_Tracts_Page**: The public-facing page that displays published tracts to website visitors
- **Cover_Image**: A Cloudinary URL pointing to the tract's cover image/thumbnail
- **Document_URL**: A Cloudinary URL pointing to the tract's PDF document
- **Published_Status**: A boolean flag indicating whether a tract is visible on the public website (true) or saved as a draft (false)
- **Tract_Category**: One of nine predefined Christian literature categories
- **Authenticated_User**: A user with a valid session token who has access to the dashboard
- **Upload_Endpoint**: The existing /api/upload endpoint that handles file uploads to Cloudinary
- **PDF_Document**: A PDF file containing the tract content (max 10MB)
- **Cover_Image_File**: An image file (JPG, PNG) for the tract thumbnail (max 5MB)

## Requirements

### Requirement 1: Create Tracts

**User Story:** As a church administrator, I want to create new tract records through the dashboard, so that I can add religious pamphlets to the library.

#### Acceptance Criteria

1. WHEN an Authenticated_User submits a valid tract creation request, THE Tract_API SHALL create a new tract record in the Database
2. THE Tract_API SHALL require title, category, description, coverImage, and documentUrl fields for tract creation
3. THE Tract_API SHALL set the published status based on the user's selection (default: false)
4. THE Tract_API SHALL validate that category is one of the nine predefined Tract_Categories
5. THE Tract_API SHALL validate that coverImage is a valid URL format
6. THE Tract_API SHALL validate that documentUrl is a valid URL format
7. WHEN a tract is successfully created, THE Tract_API SHALL return the complete tract record with HTTP status 201
8. IF validation fails, THE Tract_API SHALL return a descriptive error message with HTTP status 400
9. THE Tract_API SHALL record the createdBy field with the authenticated user's identifier
10. THE Tract_API SHALL automatically set createdAt and updatedAt timestamps

### Requirement 2: Read Tracts

**User Story:** As a church administrator, I want to view all tracts in the dashboard, so that I can manage the library effectively.

#### Acceptance Criteria

1. WHEN an Authenticated_User requests the tracts list, THE Tract_API SHALL return all tract records ordered by creation date (newest first)
2. THE Tract_API SHALL include all tract fields in the response (id, title, category, description, coverImage, documentUrl, published, createdAt, updatedAt)
3. THE Tract_API SHALL support filtering by published status
4. THE Tract_API SHALL support filtering by category
5. WHEN a tract record does not exist, THE Tract_API SHALL return an empty array with HTTP status 200
6. THE Tract_Manager SHALL display tracts in a grid layout with cover images, titles, categories, and descriptions
7. THE Tract_Manager SHALL visually indicate draft tracts with a "Draft" badge
8. THE Tract_Manager SHALL display a count of total tracts in the library

### Requirement 3: Update Tracts

**User Story:** As a church administrator, I want to edit existing tract records, so that I can correct information or update tract details.

#### Acceptance Criteria

1. WHEN an Authenticated_User submits a valid tract update request, THE Tract_API SHALL update the specified tract record in the Database
2. THE Tract_API SHALL allow updating title, category, description, coverImage, documentUrl, and published fields
3. THE Tract_API SHALL validate that the tract ID exists before attempting update
4. THE Tract_API SHALL apply the same validation rules as tract creation for updated fields
5. WHEN a tract is successfully updated, THE Tract_API SHALL return the updated tract record with HTTP status 200
6. IF the tract ID does not exist, THE Tract_API SHALL return an error message with HTTP status 404
7. IF validation fails, THE Tract_API SHALL return a descriptive error message with HTTP status 400
8. THE Tract_API SHALL automatically update the updatedAt timestamp
9. THE Tract_API SHALL preserve the original createdAt and createdBy values

### Requirement 4: Delete Tracts

**User Story:** As a church administrator, I want to delete tract records, so that I can remove outdated or incorrect tracts from the library.

#### Acceptance Criteria

1. WHEN an Authenticated_User submits a tract deletion request, THE Tract_API SHALL permanently remove the specified tract record from the Database
2. THE Tract_API SHALL validate that the tract ID exists before attempting deletion
3. WHEN a tract is successfully deleted, THE Tract_API SHALL return HTTP status 200 with a success message
4. IF the tract ID does not exist, THE Tract_API SHALL return an error message with HTTP status 404
5. THE Tract_Manager SHALL prompt for confirmation before deleting a tract
6. WHEN a tract is deleted, THE Tract_Manager SHALL remove it from the displayed list without requiring a page refresh
7. THE Tract_Manager SHALL display an error message if deletion fails

### Requirement 5: Tract Categories

**User Story:** As a church administrator, I want to categorize tracts using predefined Christian literature categories, so that visitors can browse tracts by topic.

#### Acceptance Criteria

1. THE Tract_API SHALL enforce that category must be one of exactly nine predefined values
2. THE predefined Tract_Categories SHALL be: "Theology", "Evangelism", "Discipleship", "Prayer & Intercession", "Christian Living", "Salvation", "Faith & Doctrine", "End Times", "Other"
3. THE Tract_Manager SHALL display categories as a dropdown selection during tract creation and editing
4. THE Tract_Manager SHALL display the category label on each tract card
5. THE Public_Tracts_Page SHALL support filtering tracts by category
6. THE Database SHALL index the category field for efficient filtering queries

### Requirement 6: Published Status Management

**User Story:** As a church administrator, I want to save tracts as drafts or publish them immediately, so that I can prepare content before making it visible to the public.

#### Acceptance Criteria

1. THE Tract_API SHALL support a published boolean field with default value false
2. WHEN published is false, THE tract SHALL NOT appear in the Public_Tracts_Page
3. WHEN published is true, THE tract SHALL appear in the Public_Tracts_Page
4. THE Tract_Manager SHALL provide a checkbox to set published status during tract creation
5. THE Tract_Manager SHALL allow toggling published status when editing a tract
6. THE Tract_Manager SHALL visually distinguish draft tracts from published tracts with a "Draft" badge
7. THE Database SHALL index the published field for efficient filtering queries
8. THE Public_Tracts_Page SHALL query only tracts where published equals true

### Requirement 7: Authentication and Authorization

**User Story:** As a church administrator, I want tract management restricted to authenticated dashboard users, so that unauthorized users cannot modify the library.

#### Acceptance Criteria

1. THE Tract_API SHALL verify the presence of a valid Session_Token before processing any request
2. IF Session_Token is missing or invalid, THE Tract_API SHALL return HTTP status 401 with an error message
3. THE Tract_API SHALL extract the Session_Token from HTTP-only cookies
4. THE Tract_API SHALL apply authentication checks to all CRUD endpoints (POST, GET, PUT, DELETE)
5. THE middleware SHALL redirect unauthenticated users attempting to access the dashboard to the login page
6. THE Public_Tracts_Page SHALL be accessible without authentication
7. THE Tract_API SHALL NOT expose authentication tokens in response bodies or logs

### Requirement 8: Public Tract Display

**User Story:** As a website visitor, I want to browse published tracts on the public website, so that I can discover and read religious pamphlets.

#### Acceptance Criteria

1. THE Public_Tracts_Page SHALL display all tracts where published equals true
2. THE Public_Tracts_Page SHALL display tracts in a grid layout with cover images, titles, categories, and descriptions
3. THE Public_Tracts_Page SHALL order tracts by creation date (newest first)
4. THE Public_Tracts_Page SHALL display a "View PDF" or "Download" button for each tract
5. WHEN a visitor clicks the "View PDF" button, THE system SHALL open the PDF document in a new browser tab
6. THE Public_Tracts_Page SHALL support filtering tracts by category
7. THE Public_Tracts_Page SHALL support searching tracts by title
8. THE Public_Tracts_Page SHALL be accessible without authentication
9. THE Public_Tracts_Page SHALL fetch tract data from the Tract_API or directly from the Database using server-side rendering

### Requirement 9: Database Migration and Setup

**User Story:** As a developer, I want to initialize the database schema and establish the connection, so that the Tracts Management System can persist data.

#### Acceptance Criteria

1. THE Database SHALL use a new Prisma schema definition for the Tract model
2. THE Tract model SHALL include fields: id (String, cuid), title (String), category (String), description (Text), coverImage (String), documentUrl (String), published (Boolean, default false), createdBy (String), createdAt (DateTime), updatedAt (DateTime)
3. THE Database SHALL create indexes on published and category fields
4. THE system SHALL provide a migration command to apply the schema to the PostgreSQL database
5. THE Prisma client SHALL be configured to connect using the DATABASE_URL environment variable
6. THE system SHALL use the existing Prisma client singleton pattern from lib/prisma.ts
7. WHEN the database connection fails, THE system SHALL log a descriptive error message
8. THE migration process SHALL be idempotent (safe to run multiple times)

### Requirement 10: Cover Image Upload

**User Story:** As a church administrator, I want to upload cover images for tracts, so that tracts display visually in the library.

#### Acceptance Criteria

1. THE Tract_Manager SHALL provide a file upload interface for cover images
2. THE Tract_Manager SHALL accept image files in JPG and PNG formats
3. THE Tract_Manager SHALL validate that cover image files do not exceed 5MB
4. WHEN a cover image file is selected, THE Tract_Manager SHALL upload it to the Upload_Endpoint
5. WHEN the upload succeeds, THE Upload_Endpoint SHALL return a Cloudinary URL
6. THE Tract_Manager SHALL store the Cloudinary URL in the coverImage field
7. THE Tract_Manager SHALL display a preview of the uploaded cover image
8. THE Tract_Manager SHALL allow removing and replacing the cover image before saving
9. IF the file type is invalid, THE Tract_Manager SHALL display an error message
10. IF the file size exceeds 5MB, THE Tract_Manager SHALL display an error message

### Requirement 11: PDF Document Upload

**User Story:** As a church administrator, I want to upload PDF documents for tracts, so that visitors can read or download the tract content.

#### Acceptance Criteria

1. THE Tract_Manager SHALL provide a file upload interface for PDF documents
2. THE Tract_Manager SHALL accept files in PDF format only
3. THE Tract_Manager SHALL validate that PDF files do not exceed 10MB
4. WHEN a PDF file is selected, THE Tract_Manager SHALL upload it to the Upload_Endpoint
5. WHEN the upload succeeds, THE Upload_Endpoint SHALL return a Cloudinary URL
6. THE Tract_Manager SHALL store the Cloudinary URL in the documentUrl field
7. THE Tract_Manager SHALL display the filename of the uploaded PDF document
8. THE Tract_Manager SHALL allow removing and replacing the PDF document before saving
9. IF the file type is invalid, THE Tract_Manager SHALL display an error message
10. IF the file size exceeds 10MB, THE Tract_Manager SHALL display an error message

### Requirement 12: Image Handling and Optimization

**User Story:** As a church administrator, I want tract cover images to load quickly and display properly, so that the library provides a good user experience.

#### Acceptance Criteria

1. THE Tract_Manager SHALL display cover images using Next.js Image component with proper optimization
2. THE Public_Tracts_Page SHALL display cover images using Next.js Image component with proper optimization
3. THE system SHALL handle image loading errors gracefully with a placeholder or fallback image
4. THE Tract_Manager SHALL provide visual feedback during image upload (loading spinner)
5. THE Public_Tracts_Page SHALL use lazy loading for cover images
6. THE system SHALL serve images in optimized formats (WebP, AVIF) when supported by the browser

### Requirement 13: API Error Handling

**User Story:** As a developer, I want comprehensive error handling in the API, so that clients receive clear feedback when operations fail.

#### Acceptance Criteria

1. WHEN a request is missing required fields, THE Tract_API SHALL return HTTP status 400 with a message listing the missing fields
2. WHEN a request contains invalid data types, THE Tract_API SHALL return HTTP status 400 with a descriptive validation error
3. WHEN a requested tract ID does not exist, THE Tract_API SHALL return HTTP status 404 with message "Tract not found"
4. WHEN authentication fails, THE Tract_API SHALL return HTTP status 401 with message "Unauthorized"
5. WHEN a database operation fails, THE Tract_API SHALL return HTTP status 500 with message "Internal server error"
6. THE Tract_API SHALL log detailed error information server-side for debugging
7. THE Tract_API SHALL NOT expose sensitive information (database details, stack traces) in error responses
8. THE Tract_API SHALL return errors in consistent JSON format with "error" field
9. WHEN multiple validation errors occur, THE Tract_API SHALL return all errors in a single response

### Requirement 14: API Route Structure

**User Story:** As a developer, I want RESTful API routes following Next.js conventions, so that the API is predictable and maintainable.

#### Acceptance Criteria

1. THE Tract_API SHALL implement a POST endpoint at /api/tracts for creating tracts
2. THE Tract_API SHALL implement a GET endpoint at /api/tracts for listing all tracts
3. THE Tract_API SHALL implement a GET endpoint at /api/tracts/[id] for retrieving a single tract
4. THE Tract_API SHALL implement a PUT endpoint at /api/tracts/[id] for updating a tract
5. THE Tract_API SHALL implement a DELETE endpoint at /api/tracts/[id] for deleting a tract
6. THE Tract_API SHALL use Next.js App Router route handlers (route.ts files)
7. THE Tract_API SHALL accept and return JSON payloads
8. THE Tract_API SHALL set appropriate Content-Type headers (application/json)
9. THE Tract_API SHALL follow RESTful conventions for HTTP methods and status codes
10. THE Tract_API SHALL support query parameters for filtering (published, category) on the GET /api/tracts endpoint

### Requirement 15: Dashboard View Modes

**User Story:** As a church administrator, I want to switch between grid and table views in the dashboard, so that I can view tracts in my preferred format.

#### Acceptance Criteria

1. THE Tract_Manager SHALL provide a view toggle control with grid and table options
2. THE Tract_Manager SHALL display tracts in a grid layout when grid view is selected
3. THE Tract_Manager SHALL display tracts in a table layout when table view is selected
4. THE grid view SHALL display 12 tracts initially with infinite scroll loading 12 more at a time
5. THE table view SHALL display 10 tracts per page with pagination controls
6. THE Tract_Manager SHALL preserve the selected view mode during the session
7. THE Tract_Manager SHALL apply smooth animations when switching between views

### Requirement 16: Search and Filter Functionality

**User Story:** As a church administrator, I want to search and filter tracts in the dashboard, so that I can quickly find specific tracts.

#### Acceptance Criteria

1. THE Tract_Manager SHALL provide a search input field for searching by title
2. WHEN a search query is entered, THE Tract_Manager SHALL filter tracts where the title contains the query (case-insensitive)
3. THE Tract_Manager SHALL provide a category dropdown filter
4. WHEN a category is selected, THE Tract_Manager SHALL display only tracts in that category
5. THE Tract_Manager SHALL support combining search and category filters (AND logic)
6. THE Tract_Manager SHALL display a count of filtered results
7. THE Tract_Manager SHALL provide clear filter buttons to reset search and category filters
8. THE Tract_Manager SHALL reset pagination when filters change

### Requirement 17: Upload Endpoint Integration

**User Story:** As a developer, I want to use the existing upload endpoint for file uploads, so that the system maintains consistency with other features.

#### Acceptance Criteria

1. THE Tract_Manager SHALL use the existing /api/upload endpoint for both cover image and PDF uploads
2. THE Upload_Endpoint SHALL accept multipart/form-data requests with a file field
3. THE Upload_Endpoint SHALL upload files to Cloudinary and return the Cloudinary URL
4. THE Upload_Endpoint SHALL validate file types and sizes before uploading
5. THE Upload_Endpoint SHALL return HTTP status 200 with the file URL on success
6. THE Upload_Endpoint SHALL return HTTP status 400 with an error message on validation failure
7. THE Upload_Endpoint SHALL return HTTP status 500 with an error message on upload failure

### Requirement 18: Validation Rules

**User Story:** As a developer, I want comprehensive validation rules for tract data, so that the system maintains data integrity.

#### Acceptance Criteria

1. THE Tract_API SHALL validate that title is between 1 and 200 characters
2. THE Tract_API SHALL validate that category is one of the nine predefined Tract_Categories
3. THE Tract_API SHALL validate that description is between 10 and 1000 characters
4. THE Tract_API SHALL validate that coverImage is a valid URL format
5. THE Tract_API SHALL validate that documentUrl is a valid URL format
6. THE Tract_API SHALL validate that published is a boolean value
7. THE Tract_Manager SHALL display inline validation errors for each field
8. THE Tract_Manager SHALL prevent form submission when validation errors exist

### Requirement 19: Responsive Design

**User Story:** As a website visitor, I want the tracts page to work well on mobile devices, so that I can browse tracts on any device.

#### Acceptance Criteria

1. THE Public_Tracts_Page SHALL display tracts in a single column on mobile devices (< 768px width)
2. THE Public_Tracts_Page SHALL display tracts in two columns on tablet devices (768px - 1024px width)
3. THE Public_Tracts_Page SHALL display tracts in three or more columns on desktop devices (> 1024px width)
4. THE Tract_Manager SHALL adapt the layout for mobile, tablet, and desktop screens
5. THE Tract_Manager SHALL display the table view in a horizontally scrollable container on mobile devices
6. THE filter and search controls SHALL stack vertically on mobile devices

### Requirement 20: Loading States and Feedback

**User Story:** As a church administrator, I want visual feedback during operations, so that I know the system is processing my requests.

#### Acceptance Criteria

1. THE Tract_Manager SHALL display a loading spinner during file uploads
2. THE Tract_Manager SHALL display a loading spinner during tract creation
3. THE Tract_Manager SHALL display a loading spinner during tract updates
4. THE Tract_Manager SHALL display a loading spinner during tract deletion
5. THE Tract_Manager SHALL disable action buttons during operations to prevent duplicate requests
6. THE Tract_Manager SHALL display success toast notifications after successful operations
7. THE Tract_Manager SHALL display error toast notifications after failed operations
8. THE Public_Tracts_Page SHALL display a loading state while fetching tracts

### Requirement 21: Data Refetching

**User Story:** As a church administrator, I want the tract list to update immediately after changes, so that I always see the current state.

#### Acceptance Criteria

1. WHEN a tract is created, THE Tract_Manager SHALL refetch the complete tract list from the server
2. WHEN a tract is updated, THE Tract_Manager SHALL refetch the complete tract list from the server
3. WHEN a tract is deleted, THE Tract_Manager SHALL refetch the complete tract list from the server
4. WHEN the published status is toggled, THE Tract_Manager SHALL refetch the complete tract list from the server
5. THE Tract_Manager SHALL use cache-busting techniques to ensure fresh data
6. THE Tract_Manager SHALL trigger a Next.js router refresh after mutations
