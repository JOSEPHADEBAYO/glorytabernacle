/**
 * Zod validation schemas for the Books Management System
 * 
 * These schemas validate API request payloads and query parameters
 * to ensure data integrity before database operations.
 */

import { z } from 'zod'
import { BOOK_CATEGORIES } from '@/lib/types/book'

/**
 * URL validation schema
 * Ensures strings are properly formatted URLs
 */
const urlSchema = z.string().url('Must be a valid URL')

/**
 * Schema for creating a new book
 * 
 * Validates:
 * - title: required, max 200 characters
 * - author: required, max 100 characters
 * - category: must be one of the predefined categories
 * - description: required, max 2000 characters
 * - coverImage: required, must be valid URL
 * - purchaseUrl: optional, must be valid URL if provided (or empty string)
 * - published: boolean, defaults to false
 */
export const createBookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long'),
  author: z.string().trim().min(1, 'Author is required').max(100, 'Author name too long'),
  category: z.enum(BOOK_CATEGORIES, { message: 'Invalid category' }),
  description: z.string().trim().min(1, 'Description is required').max(2000, 'Description too long'),
  coverImage: urlSchema,
  purchaseUrl: urlSchema.optional().or(z.literal('')),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  featuredOrder: z.coerce.number().int().min(0).default(0),
})

/**
 * Schema for updating an existing book
 * 
 * All fields are optional, but at least one field must be provided.
 * Applies the same validation rules as creation for any provided fields.
 */
export const updateBookSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  author: z.string().trim().min(1).max(100).optional(),
  category: z.enum(BOOK_CATEGORIES).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  coverImage: urlSchema.optional(),
  purchaseUrl: urlSchema.optional().or(z.literal('')),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  featuredOrder: z.coerce.number().int().min(0).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
})

/**
 * Schema for validating query parameters on GET /api/books
 * 
 * Supports filtering by:
 * - published: "true" or "false" string
 * - category: one of the predefined categories
 */
export const bookQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
  category: z.enum(BOOK_CATEGORIES).optional()
})
