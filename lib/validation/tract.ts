/**
 * Zod validation schemas for the Tracts Management System
 * 
 * These schemas validate API request payloads and query parameters
 * to ensure data integrity before database operations.
 */

import { z } from 'zod'
import { TRACT_CATEGORIES } from '@/lib/types/tract'

/**
 * URL validation schema
 * Ensures strings are properly formatted URLs
 */
const urlSchema = z.string().url('Must be a valid URL')

/**
 * Schema for creating a new tract
 * 
 * Validates:
 * - title: required, 1-200 characters
 * - category: must be one of the predefined tract categories
 * - description: required, 10-1000 characters
 * - coverImage: required, must be valid URL
 * - documentUrl: required, must be valid URL
 * - published: boolean, defaults to false
 */
export const createTractSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long'),
  category: z.enum(TRACT_CATEGORIES, { message: 'Invalid category' }),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  coverImage: urlSchema,
  documentUrl: urlSchema,
  published: z.boolean().default(false)
})

/**
 * Schema for updating an existing tract
 * 
 * All fields are optional, but at least one field must be provided.
 * Applies the same validation rules as creation for any provided fields.
 */
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

/**
 * Schema for validating query parameters on GET /api/tracts
 * 
 * Supports filtering by:
 * - published: "true" or "false" string
 * - category: one of the predefined tract categories
 */
export const tractQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
  category: z.enum(TRACT_CATEGORIES).optional()
})
