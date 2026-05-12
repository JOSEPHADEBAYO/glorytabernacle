/**
 * Shared TypeScript types for the Tracts Management System
 * 
 * These types are used across both client and server code to ensure
 * type safety for tract-related operations.
 */

/**
 * Predefined tract categories for Christian literature
 * These are the only valid values for the category field
 */
export const TRACT_CATEGORIES = [
  'Theology',
  'Evangelism',
  'Discipleship',
  'Prayer & Intercession',
  'Christian Living',
  'Salvation',
  'Faith & Doctrine',
  'End Times',
  'Other',
] as const

/**
 * Type representing a valid tract category
 * Derived from the TRACT_CATEGORIES constant
 */
export type TractCategory = typeof TRACT_CATEGORIES[number]

/**
 * Complete tract record as stored in the database
 * Includes all fields returned from API queries
 */
export interface Tract {
  id: string
  title: string
  category: TractCategory
  description: string
  coverImage: string
  documentUrl: string
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Input type for creating a new tract
 * All fields are required
 */
export interface CreateTractInput {
  title: string
  category: TractCategory
  description: string
  coverImage: string
  documentUrl: string
  published: boolean
}

/**
 * Input type for updating an existing tract
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateTractInput {
  title?: string
  category?: TractCategory
  description?: string
  coverImage?: string
  documentUrl?: string
  published?: boolean
}
