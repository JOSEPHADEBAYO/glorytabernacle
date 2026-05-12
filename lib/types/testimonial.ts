/**
 * Shared TypeScript types for the Testimonials system.
 *
 * Short member quotes shown on the homepage TestimonialsSection.
 */

export const TESTIMONIAL_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'CONTENT_EDITOR',
] as const
export type TestimonialAdminRole = typeof TESTIMONIAL_ADMIN_ROLES[number]

/**
 * Complete Testimonial record as stored in the database.
 */
export interface TestimonialRecord {
  id: string
  quote: string
  name: string
  memberSince: number
  order: number
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Input for creating a new testimonial.
 */
export interface CreateTestimonialInput {
  quote: string
  name: string
  memberSince: number
  order?: number
  published?: boolean
}

/**
 * Input for updating an existing testimonial.
 * All fields optional; at least one must be provided.
 */
export interface UpdateTestimonialInput {
  quote?: string
  name?: string
  memberSince?: number
  order?: number
  published?: boolean
}
