/**
 * Shared TypeScript types for the Image Gallery System
 *
 * These types are used across both client and server code to ensure
 * type safety for gallery-photo operations.
 */

/**
 * User roles permitted to manage Gallery photos.
 * Used by the API routes for authorization checks.
 */
export const GALLERY_ADMIN_ROLES = ['SUPER_ADMIN', 'CONTENT_EDITOR'] as const
export type GalleryAdminRole = typeof GALLERY_ADMIN_ROLES[number]

/**
 * Complete gallery-photo record as stored in the database.
 * Includes all fields returned from API queries.
 */
export interface GalleryPhoto {
  id: string
  title: string
  description: string
  imageUrl: string
  imageAlt: string
  dateTaken: Date
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Input type for creating a new gallery photo.
 * dateTaken accepts an ISO string from the wire and is coerced to a Date by Zod.
 */
export interface CreateGalleryPhotoInput {
  title: string
  description: string
  imageUrl: string
  imageAlt: string
  dateTaken: string | Date
  published?: boolean
}

/**
 * Input type for updating an existing gallery photo.
 * All fields are optional — only provided fields will be updated.
 */
export interface UpdateGalleryPhotoInput {
  title?: string
  description?: string
  imageUrl?: string
  imageAlt?: string
  dateTaken?: string | Date
  published?: boolean
}
