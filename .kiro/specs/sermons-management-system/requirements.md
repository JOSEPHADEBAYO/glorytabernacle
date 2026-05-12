# Requirements Document: Sermons Management System

## Introduction

The Sermons Management System enables church administrators to manage a comprehensive library of sermon recordings through a secure dashboard interface. The system provides complete CRUD (Create, Read, Update, Delete) operations for sermon records, supports draft/published workflows, and integrates with the public-facing church website to display published sermons to visitors. Each sermon includes rich metadata such as title, series, speaker, date, duration, description, thumbnail images, and YouTube video URLs. The system integrates with Cloudinary for thumbnail storage and YouTube for video hosting.

## Glossary

- **Sermon_Manager**: The dashboard component that provides the administrative interface for managing sermons
- **Sermon_API**: The REST API endpoints that handle CRUD operations for sermon records
- **Database**: The PostgreSQL database managed through Prisma ORM
- **Session_Token**: The HTTP-only cookie used to authenticate dashboard users
- **Public_Sermons_Page**: The public-facing page that displays published sermons to website visitors
- **Thumbnail_Image**: A Cloudinary URL pointing to the sermon's thumbnail/cover image
- **Video_URL**: A YouTube URL pointing to the sermon video recording
- **Published_Status**: A boolean flag indicating whether a sermon is visible on the public website (true) or saved as a draft (false)
- **Sermon_Series**: An optional grouping identifier for related sermons (e.g., "Kingdom Living", "Grace & Truth")
- **Authenticated_User**: A user with a valid session token who has access to the dashboard
- **Upload_Endpoint**: The existing /api/upload endpoint that handles file uploads to Cloudinary
- **Thumbnail_File**: An image file (JPG, PNG) for the sermon thumbnail (max 5MB)
- **Duration_String**: A human-readable duration format (e.g., "48 min", "1h 15min")
- **YouTube_Validator**: A validation function that verifies YouTube URL format

## Requirements

### Requirement 1: Create Sermons

**User Story:** As a church administrator, I want to create new sermon records through the dashboard, so that I can add sermon recordings to the library.

#### Acceptance Criteria

1. WHEN an Authenticated_User submits a valid sermon creation request, THE Sermon_API SHALL create a new sermon record in the Database
2. THE Sermon_API SHALL require title, speaker, date, duration, description, thumbnail, and videoUrl fields for sermon creation
3. THE Sermon_API SHALL accept optional series field for sermon creation
4. THE Sermon_API SHALL set the published status based on the user's selection (default: false)
5. THE Sermon_API SHALL validate that title is between 1 and 200 characters
6. THE Sermon_API SHALL validate that speaker is between 1 and 100 characters
7. THE Sermon_API SHALL validate that series (when provided) is between 1 and 100 characters
8. THE Sermon_API SHALL validate that description is between 10 and 2000 characters
9. THE Sermon_API SHALL validate that date is a valid date value
10. THE Sermon_API SHALL validate that thumbnail is a valid URL format
11. THE Sermon_API SHALL validate that videoUrl is a valid YouTube URL format
12. WHEN a sermon is successfully created, THE Sermon_API SHALL return the complete sermon record with HTTP status 201
13. IF validation fails, THE Sermon_API SHALL return a descriptive error message with HTTP status 400
14. THE Sermon_API SHALL record the createdBy field with the authenticated user's identifier
15. THE Sermon_API SHALL automatically set createdAt and updatedAt timestamps

### Requirement 2: Read Sermons

**User Story:** As a church administrator, I want to view all sermons in the dashboard, so that I can manage the library effectively.

#### Acceptance Criteria

1. WHEN an Authenticated_User requests the sermons list, THE Sermon_API SHALL return all sermon records ordered by sermon date (newest first)
2. THE Sermon_API SHALL include all sermon fields in the response (id, title, series, speaker, date, duration, description, thumbnail, videoUrl, published, createdAt, updatedAt)
3. THE Sermon_API SHALL support filtering by published status
4. THE Sermon_API SHALL support filtering by series
5. THE Sermon_API SHALL support searching by title (case-insensitive partial match)
6. WHEN no sermon records exist, THE Sermon_API SHALL return an empty array with HTTP status 200
7. THE Sermon_Manager SHALL display sermons in both grid and table view layouts
8. THE Sermon_Manager SHALL visually indicate draft sermons with a "Draft" badge
9. THE Sermon_Manager SHALL display a count of total sermons in the library

### Requirement 3: Update Sermons

**User Story:** As a church administrator, I want to edit existing sermon records, so that I can correct information or update sermon details.

#### Acceptance Criteria

1. WHEN an Authenticated_User submits a valid sermon update request, THE Sermon_API SHALL update the specified sermon record in the Database
2. THE Sermon_API SHALL allow updating title, series, speaker, date, duration, description, thumbnail, videoUrl, and published fields
3. THE Sermon_API SHALL validate that the sermon ID exists before attempting update
4. THE Sermon_API SHALL apply the same validation rules as sermon creation for updated fields
5. WHEN a sermon is successfully updated, THE Sermon_API SHALL return the updated sermon record with HTTP status 200
6. IF the sermon ID does not exist, THE Sermon_API SHALL return an error message with HTTP status 404
7. IF validation fails, THE Sermon_API SHALL return a descriptive error message with HTTP status 400
8. THE Sermon_API SHALL automatically update the updatedAt timestamp
9. THE Sermon_API SHALL preserve the original createdAt and createdBy values

### Requirement 4: Delete Sermons

**User Story:** As a church administrator, I want to delete sermon records, so that I can remove outdated or incorrect sermons from the library.

#### Acceptance Criteria

1. WHEN an Authenticated_User submits a sermon deletion request, THE Sermon_API SHALL permanently remove the specified sermon record from the Database
2. THE Sermon_API SHALL validate that the sermon ID exists before attempting deletion
3. WHEN a sermon is successfully deleted, THE Sermon_API SHALL return HTTP status 200 with a success message
4. IF the sermon ID does not exist, THE Sermon_API SHALL return an error message with HTTP status 404
5. THE Sermon_Manager SHALL prompt for confirmation before deleting a sermon
6. WHEN a sermon is deleted, THE Sermon_Manager SHALL remove it from the displayed list without requiring a page refresh
7. THE Sermon_Manager SHALL display an error message if deletion fails

### Requirement 5: YouTube URL Validation

**User Story:** As a church administrator, I want the system to validate YouTube URLs, so that only valid video links are stored.

#### Acceptance Criteria

1. THE YouTube_Validator SHALL accept URLs in the format https://www.youtube.com/watch?v=VIDEO_ID
2. THE YouTube_Validator SHALL accept URLs in the format https://youtu.be/VIDEO_ID
3. THE YouTube_Validator SHALL accept URLs in the format https://www.youtube.com/embed/VIDEO_ID
4. THE YouTube_Validator SHALL reject URLs that do not match YouTube domain patterns
5. THE YouTube_Validator SHALL reject URLs with invalid or missing video IDs
6. WHEN an invalid YouTube URL is provided, THE Sermon_API SHALL return HTTP status 400 with message "Invalid YouTube URL format"
7. THE Sermon_Manager SHALL display inline validation feedback for YouTube URL field
8. THE Sermon_Manager SHALL provide example text showing valid YouTube URL formats

### Requirement 6: Published Status Management

**User Story:** As a church administrator, I want to save sermons as drafts or publish them immediately, so that I can prepare content before making it visible to the public.

#### Acceptance Criteria

1. THE Sermon_API SHALL support a published boolean field with default value false
2. WHEN published is false, THE sermon SHALL NOT appear in the Public_Sermons_Page
3. WHEN published is true, THE sermon SHALL appear in the Public_Sermons_Page
4. THE Sermon_Manager SHALL provide a checkbox to set published status during sermon creation
5. THE Sermon_Manager SHALL allow toggling published status when editing a sermon
6. THE Sermon_Manager SHALL visually distinguish draft sermons from published sermons with a "Draft" badge
7. THE Database SHALL index the published field for efficient filtering queries
8. THE Public_Sermons_Page SHALL query only sermons where published equals true

### Requirement 7: Authentication and Authorization

**User Story:** As a church administrator, I want sermon management restricted to authenticated dashboard users, so that unauthorized users cannot modify the library.

#### Acceptance Criteria

1. THE Sermon_API SHALL verify the presence of a valid Session_Token before processing any request
2. IF Session_Token is missing or invalid, THE Sermon_API SHALL return HTTP status 401 with an error message
3. THE Sermon_API SHALL extract the Session_Token from HTTP-only cookies
4. THE Sermon_API SHALL apply authentication checks to all CRUD endpoints (POST, GET, PUT, DELETE)
5. THE middleware SHALL redirect unauthenticated users attempting to access the dashboard to the login page
6. THE Public_Sermons_Page SHALL be accessible without authentication
7. THE Sermon_API SHALL NOT expose authentication tokens in response bodies or logs

### Requirement 8: Public Sermon Display

**User Story:** As a website visitor, I want to browse published sermons on the public website, so that I can watch sermon recordings.

#### Acceptance Criteria

1. THE Public_Sermons_Page SHALL display all sermons where published equals true
2. THE Public_Sermons_Page SHALL display sermons in a grid layout with thumbnails, titles, series, speakers, dates, and durations
3. THE Public_Sermons_Page SHALL order sermons by sermon date (newest first)
4. THE Public_Sermons_Page SHALL display a featured sermon section highlighting the most recent sermon
5. THE Public_Sermons_Page SHALL display a "Watch" or "Play" button for each sermon
6. WHEN a visitor clicks the "Watch" button, THE system SHALL navigate to the YouTube video URL
7. THE Public_Sermons_Page SHALL support filtering sermons by series
8. THE Public_Sermons_Page SHALL support searching sermons by title
9. THE Public_Sermons_Page SHALL be accessible without authentication
10. THE Public_Sermons_Page SHALL fetch sermon data using server-side rendering

### Requirement 9: Database Migration and Setup

**User Story:** As a developer, I want to initialize the database schema and establish the connection, so that the Sermons Management System can persist data.

#### Acceptance Criteria

1. THE Database SHALL use a new Prisma schema definition for the Sermon model
2. THE Sermon model SHALL include fields: id (String, cuid), title (String), series (String, optional), speaker (String), date (DateTime), duration (String), description (Text), thumbnail (String), videoUrl (String), published (Boolean, default false), createdBy (String), createdAt (DateTime), updatedAt (DateTime)
3. THE Database SHALL create indexes on published, series, and date fields
4. THE system SHALL provide a migration command to apply the schema to the PostgreSQL database
5. THE Prisma client SHALL be configured to connect using the DATABASE_URL environment variable
6. THE system SHALL use the existing Prisma client singleton pattern from lib/prisma.ts
7. WHEN the database connection fails, THE system SHALL log a descriptive error message
8. THE migration process SHALL be idempotent (safe to run multiple times)

### Requirement 10: Thumbnail Upload

**User Story:** As a church administrator, I want to upload thumbnail images for sermons, so that sermons display visually in the library.

#### Acceptance Criteria

1. THE Sermon_Manager SHALL provide a file upload interface for thumbnail images
2. THE Sermon_Manager SHALL accept image files in JPG and PNG formats
3. THE Sermon_Manager SHALL validate that thumbnail files do not exceed 5MB
4. WHEN a thumbnail file is selected, THE Sermon_Manager SHALL upload it to the Upload_Endpoint
5. WHEN the upload succeeds, THE Upload_Endpoint SHALL return a Cloudinary URL
6. THE Sermon_Manager SHALL store the Cloudinary URL in the thumbnail field
7. THE Sermon_Manager SHALL display a preview of the uploaded thumbnail image
8. THE Sermon_Manager SHALL allow removing and replacing the thumbnail before saving
9. IF the file type is invalid, THE Sermon_Manager SHALL display an error message
10. IF the file size exceeds 5MB, THE Sermon_Manager SHALL display an error message

### Requirement 11: Image Handling and Optimization

**User Story:** As a church administrator, I want sermon thumbnails to load quickly and display properly, so that the library provides a good user experience.

#### Acceptance Criteria

1. THE Sermon_Manager SHALL display thumbnails using Next.js Image component with proper optimization
2. THE Public_Sermons_Page SHALL display thumbnails using Next.js Image component with proper optimization
3. THE system SHALL handle image loading errors gracefully with a placeholder or fallback image
4. THE Sermon_Manager SHALL provide visual feedback during image upload (loading spinner)
5. THE Public_Sermons_Page SHALL use lazy loading for thumbnail images
6. THE system SHALL serve images in optimized formats (WebP, AVIF) when supported by the browser

### Requirement 12: API Error Handling

**User Story:** As a developer, I want comprehensive error handling in the API, so that clients receive clear feedback when operations fail.

#### Acceptance Criteria

1. WHEN a request is missing required fields, THE Sermon_API SHALL return HTTP status 400 with a message listing the missing fields
2. WHEN a request contains invalid data types, THE Sermon_API SHALL return HTTP status 400 with a descriptive validation error
3. WHEN a requested sermon ID does not exist, THE Sermon_API SHALL return HTTP status 404 with message "Sermon not found"
4. WHEN authentication fails, THE Sermon_API SHALL return HTTP status 401 with message "Unauthorized"
5. WHEN a database operation fails, THE Sermon_API SHALL return HTTP status 500 with message "Internal server error"
6. THE Sermon_API SHALL log detailed error information server-side for debugging
7. THE Sermon_API SHALL NOT expose sensitive information (database details, stack traces) in error responses
8. THE Sermon_API SHALL return errors in consistent JSON format with "error" field
9. WHEN multiple validation errors occur, THE Sermon_API SHALL return all errors in a single response

### Requirement 13: API Route Structure

**User Story:** As a developer, I want RESTful API routes following Next.js conventions, so that the API is predictable and maintainable.

#### Acceptance Criteria

1. THE Sermon_API SHALL implement a POST endpoint at /api/sermons for creating sermons
2. THE Sermon_API SHALL implement a GET endpoint at /api/sermons for listing all sermons
3. THE Sermon_API SHALL implement a GET endpoint at /api/sermons/[id] for retrieving a single sermon
4. THE Sermon_API SHALL implement a PUT endpoint at /api/sermons/[id] for updating a sermon
5. THE Sermon_API SHALL implement a DELETE endpoint at /api/sermons/[id] for deleting a sermon
6. THE Sermon_API SHALL use Next.js App Router route handlers (route.ts files)
7. THE Sermon_API SHALL accept and return JSON payloads
8. THE Sermon_API SHALL set appropriate Content-Type headers (application/json)
9. THE Sermon_API SHALL follow RESTful conventions for HTTP methods and status codes
10. THE Sermon_API SHALL support query parameters for filtering (published, series, search) on the GET /api/sermons endpoint

### Requirement 14: Dashboard View Modes

**User Story:** As a church administrator, I want to switch between grid and table views in the dashboard, so that I can view sermons in my preferred format.

#### Acceptance Criteria

1. THE Sermon_Manager SHALL provide a view toggle control with grid and table options
2. THE Sermon_Manager SHALL display sermons in a grid layout when grid view is selected
3. THE Sermon_Manager SHALL display sermons in a table layout when table view is selected
4. THE grid view SHALL display 12 sermons initially with infinite scroll loading 12 more at a time
5. THE table view SHALL display 10 sermons per page with pagination controls
6. THE Sermon_Manager SHALL preserve the selected view mode during the session
7. THE Sermon_Manager SHALL apply smooth animations when switching between views

### Requirement 15: Search and Filter Functionality

**User Story:** As a church administrator, I want to search and filter sermons in the dashboard, so that I can quickly find specific sermons.

#### Acceptance Criteria

1. THE Sermon_Manager SHALL provide a search input field for searching by title
2. WHEN a search query is entered, THE Sermon_Manager SHALL filter sermons where the title contains the query (case-insensitive)
3. THE Sermon_Manager SHALL provide a series dropdown filter
4. WHEN a series is selected, THE Sermon_Manager SHALL display only sermons in that series
5. THE Sermon_Manager SHALL support combining search and series filters (AND logic)
6. THE Sermon_Manager SHALL display a count of filtered results
7. THE Sermon_Manager SHALL provide clear filter buttons to reset search and series filters
8. THE Sermon_Manager SHALL reset pagination when filters change
9. THE series dropdown SHALL dynamically populate with unique series values from existing sermons

### Requirement 16: Upload Endpoint Integration

**User Story:** As a developer, I want to use the existing upload endpoint for file uploads, so that the system maintains consistency with other features.

#### Acceptance Criteria

1. THE Sermon_Manager SHALL use the existing /api/upload endpoint for thumbnail uploads
2. THE Upload_Endpoint SHALL accept multipart/form-data requests with a file field
3. THE Upload_Endpoint SHALL upload files to Cloudinary and return the Cloudinary URL
4. THE Upload_Endpoint SHALL validate file types and sizes before uploading
5. THE Upload_Endpoint SHALL return HTTP status 200 with the file URL on success
6. THE Upload_Endpoint SHALL return HTTP status 400 with an error message on validation failure
7. THE Upload_Endpoint SHALL return HTTP status 500 with an error message on upload failure

### Requirement 17: Validation Rules

**User Story:** As a developer, I want comprehensive validation rules for sermon data, so that the system maintains data integrity.

#### Acceptance Criteria

1. THE Sermon_API SHALL validate that title is between 1 and 200 characters
2. THE Sermon_API SHALL validate that series (when provided) is between 1 and 100 characters
3. THE Sermon_API SHALL validate that speaker is between 1 and 100 characters
4. THE Sermon_API SHALL validate that description is between 10 and 2000 characters
5. THE Sermon_API SHALL validate that date is a valid date value not in the future
6. THE Sermon_API SHALL validate that duration is a non-empty string
7. THE Sermon_API SHALL validate that thumbnail is a valid URL format
8. THE Sermon_API SHALL validate that videoUrl is a valid YouTube URL format
9. THE Sermon_API SHALL validate that published is a boolean value
10. THE Sermon_Manager SHALL display inline validation errors for each field
11. THE Sermon_Manager SHALL prevent form submission when validation errors exist

### Requirement 18: Responsive Design

**User Story:** As a website visitor, I want the sermons page to work well on mobile devices, so that I can browse sermons on any device.

#### Acceptance Criteria

1. THE Public_Sermons_Page SHALL display sermons in a single column on mobile devices (< 768px width)
2. THE Public_Sermons_Page SHALL display sermons in two columns on tablet devices (768px - 1024px width)
3. THE Public_Sermons_Page SHALL display sermons in three or more columns on desktop devices (> 1024px width)
4. THE Sermon_Manager SHALL adapt the layout for mobile, tablet, and desktop screens
5. THE Sermon_Manager SHALL display the table view in a horizontally scrollable container on mobile devices
6. THE filter and search controls SHALL stack vertically on mobile devices

### Requirement 19: Loading States and Feedback

**User Story:** As a church administrator, I want visual feedback during operations, so that I know the system is processing my requests.

#### Acceptance Criteria

1. THE Sermon_Manager SHALL display a loading spinner during file uploads
2. THE Sermon_Manager SHALL display a loading spinner during sermon creation
3. THE Sermon_Manager SHALL display a loading spinner during sermon updates
4. THE Sermon_Manager SHALL display a loading spinner during sermon deletion
5. THE Sermon_Manager SHALL disable action buttons during operations to prevent duplicate requests
6. THE Sermon_Manager SHALL display success toast notifications after successful operations
7. THE Sermon_Manager SHALL display error toast notifications after failed operations
8. THE Public_Sermons_Page SHALL display a loading state while fetching sermons

### Requirement 20: Data Refetching

**User Story:** As a church administrator, I want the sermon list to update immediately after changes, so that I always see the current state.

#### Acceptance Criteria

1. WHEN a sermon is created, THE Sermon_Manager SHALL refetch the complete sermon list from the server
2. WHEN a sermon is updated, THE Sermon_Manager SHALL refetch the complete sermon list from the server
3. WHEN a sermon is deleted, THE Sermon_Manager SHALL refetch the complete sermon list from the server
4. WHEN the published status is toggled, THE Sermon_Manager SHALL refetch the complete sermon list from the server
5. THE Sermon_Manager SHALL use cache-busting techniques to ensure fresh data
6. THE Sermon_Manager SHALL trigger a Next.js router refresh after mutations

### Requirement 21: Series Management

**User Story:** As a church administrator, I want to organize sermons into series, so that visitors can follow themed sermon collections.

#### Acceptance Criteria

1. THE Sermon_API SHALL support an optional series field for grouping related sermons
2. THE Sermon_Manager SHALL provide a text input or dropdown for selecting/entering series names
3. THE Sermon_Manager SHALL display series information on sermon cards in grid view
4. THE Sermon_Manager SHALL display series as a column in table view
5. THE Public_Sermons_Page SHALL group or filter sermons by series
6. THE Public_Sermons_Page SHALL display series badges on sermon cards
7. THE Database SHALL index the series field for efficient filtering queries
8. WHEN series is not provided, THE system SHALL treat it as null (not required)

### Requirement 22: Duration Format Handling

**User Story:** As a church administrator, I want to enter sermon durations in a human-readable format, so that visitors can quickly see sermon length.

#### Acceptance Criteria

1. THE Sermon_Manager SHALL accept duration as a free-text string field
2. THE Sermon_Manager SHALL provide placeholder text showing example formats (e.g., "48 min", "1h 15min")
3. THE Sermon_API SHALL store duration as a string without format validation
4. THE Sermon_Manager SHALL display duration exactly as entered
5. THE Public_Sermons_Page SHALL display duration exactly as stored
6. THE system SHALL document recommended duration formats in the UI

### Requirement 23: Featured Sermon Display

**User Story:** As a website visitor, I want to see the latest sermon prominently featured, so that I can quickly access the most recent content.

#### Acceptance Criteria

1. THE Public_Sermons_Page SHALL display the most recent published sermon in a featured section
2. THE featured sermon section SHALL be visually distinct from the sermon grid
3. THE featured sermon SHALL display a larger thumbnail image
4. THE featured sermon SHALL display the full description text
5. THE featured sermon SHALL include a prominent "Watch Latest Message" call-to-action button
6. THE featured sermon SHALL be determined by the most recent sermon date where published equals true
7. THE featured sermon SHALL also appear in the regular sermon grid below

### Requirement 24: Pagination and Infinite Scroll

**User Story:** As a website visitor, I want to browse through many sermons efficiently, so that I can find older content without performance issues.

#### Acceptance Criteria

1. THE Public_Sermons_Page SHALL implement pagination for sermon listings
2. THE Public_Sermons_Page SHALL display 12 sermons per page initially
3. THE Public_Sermons_Page SHALL provide pagination controls (Previous, Next, page numbers)
4. THE Sermon_Manager grid view SHALL implement infinite scroll loading 12 sermons at a time
5. THE Sermon_Manager table view SHALL implement traditional pagination with 10 sermons per page
6. WHEN scrolling to the bottom in grid view, THE Sermon_Manager SHALL automatically load the next batch
7. THE system SHALL display a loading indicator while fetching additional sermons

### Requirement 25: Type Definitions and Validation Library

**User Story:** As a developer, I want type-safe sermon data structures and validation functions, so that the codebase is maintainable and type-safe.

#### Acceptance Criteria

1. THE system SHALL define a Sermon TypeScript interface in lib/types/sermon.ts
2. THE Sermon interface SHALL include all sermon fields with correct types
3. THE system SHALL define validation schemas using Zod in lib/validation/sermon.ts
4. THE validation schemas SHALL enforce all validation rules defined in Requirement 17
5. THE Sermon_API SHALL use the validation schemas to validate request payloads
6. THE Sermon_Manager SHALL use the TypeScript types for type safety
7. THE validation library SHALL export reusable validation functions for YouTube URLs
8. THE validation library SHALL export reusable validation functions for sermon creation and updates
