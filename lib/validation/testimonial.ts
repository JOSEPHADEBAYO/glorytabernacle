/**
 * Zod validation schemas for the Testimonials system.
 */

import { z } from 'zod'

const MIN_MEMBER_SINCE_YEAR = 1900

/**
 * memberSince must be a 4-digit year between 1900 and (current year + 1).
 * Allowing currentYear+1 covers cases where someone joins very late
 * December and the admin adds the testimonial right after the new year, or
 * vice-versa with timezone edge cases.
 */
const memberSinceSchema = z.coerce
  .number({ message: 'Member since year is required' })
  .int('Year must be a whole number')
  .min(MIN_MEMBER_SINCE_YEAR, `Year must be ${MIN_MEMBER_SINCE_YEAR} or later`)
  .refine((y) => y <= new Date().getFullYear() + 1, {
    message: 'Year cannot be more than one year in the future',
  })

export const createTestimonialSchema = z.object({
  quote: z
    .string()
    .trim()
    .min(1, 'Quote is required')
    .max(2000, 'Quote too long'),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),
  memberSince: memberSinceSchema,
  order: z.coerce.number().int().optional(),
  published: z.boolean().default(false),
})

export const updateTestimonialSchema = z
  .object({
    quote: z.string().trim().min(1).max(2000).optional(),
    name: z.string().trim().min(1).max(100).optional(),
    memberSince: memberSinceSchema.optional(),
    order: z.coerce.number().int().optional(),
    published: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

export const testimonialQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
})
