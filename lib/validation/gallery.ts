/**
 * Zod validation schemas for the Image Gallery System
 *
 * These schemas validate API request payloads and query parameters
 * to ensure data integrity before database operations.
 */

import { z } from 'zod'

/**
 * URL validation schema — must be a non-empty, valid URL.
 */
const urlSchema = z.string().url('Must be a valid URL')

/**
 * dateTaken accepts either a Date or an ISO date string and coerces to Date.
 * Rejects invalid dates explicitly so the error message is helpful.
 */
const dateTakenSchema = z.coerce
  .date({ message: 'dateTaken must be a valid date' })

/**
 * Schema for creating a new gallery photo.
 *
 * Validates:
 * - title: required, max 200 characters
 * - description: required, max 2000 characters
 * - imageUrl: required, must be valid URL (Cloudinary secure_url)
 * - imageAlt: required, max 200 characters
 * - dateTaken: required, valid date
 * - published: boolean, defaults to false
 */
export const createGallerySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(2000, 'Description too long'),
  imageUrl: urlSchema,
  imageAlt: z
    .string()
    .trim()
    .min(1, 'Image alt text is required')
    .max(200, 'Image alt text too long'),
  dateTaken: dateTakenSchema,
  published: z.boolean().default(false),
})

/**
 * Schema for updating an existing gallery photo.
 *
 * All fields are optional, but at least one field must be provided.
 * Applies the same validation rules as creation for any provided fields.
 */
export const updateGallerySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    imageUrl: urlSchema.optional(),
    imageAlt: z.string().trim().min(1).max(200).optional(),
    dateTaken: dateTakenSchema.optional(),
    published: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

/**
 * Schema for validating query parameters on GET /api/gallery
 *
 * Supports filtering by:
 * - published: "true" or "false" string
 */
export const galleryQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
})
