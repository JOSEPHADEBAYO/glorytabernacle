/**
 * Zod validation schemas for the Events Management System.
 *
 * Validates API request payloads and query parameters
 * to ensure data integrity before database operations.
 */

import { z } from 'zod'

/**
 * URL validation schema — must be a valid URL.
 * The `.or(z.literal(''))` allowance lets the client send empty strings
 * for optional URL fields without raising a validation error.
 */
const urlSchema = z.string().url('Must be a valid URL')

/**
 * date accepts either a Date or an ISO date/datetime string and coerces to Date.
 */
const dateSchema = z.coerce.date({ message: 'Date must be a valid date' })

/**
 * Schema for creating a new event.
 *
 * Required: title, description, date.
 * Optional: time, location, imageSrc, imageAlt, registrationHref, published.
 */
export const createEventSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(2000, 'Description too long'),
  date: dateSchema,
  time: z.string().trim().max(50).optional().or(z.literal('')),
  location: z.string().trim().max(200).optional().or(z.literal('')),
  imageSrc: urlSchema.optional().or(z.literal('')),
  imageAlt: z.string().trim().max(200).optional().or(z.literal('')),
  registrationHref: urlSchema.optional().or(z.literal('')),
  published: z.boolean().default(false),
})

/**
 * Schema for updating an existing event.
 *
 * All fields are optional, but at least one field must be provided.
 */
export const updateEventSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    date: dateSchema.optional(),
    time: z.string().trim().max(50).optional().or(z.literal('')),
    location: z.string().trim().max(200).optional().or(z.literal('')),
    imageSrc: urlSchema.optional().or(z.literal('')),
    imageAlt: z.string().trim().max(200).optional().or(z.literal('')),
    registrationHref: urlSchema.optional().or(z.literal('')),
    published: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

/**
 * Schema for validating query parameters on GET /api/events.
 *
 * Supports filtering by:
 * - published: "true" or "false"
 * - upcoming: "true" or "false" (when "true", only events with date >= now)
 */
export const eventQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
  upcoming: z.enum(['true', 'false']).optional(),
})
