/**
 * Shared TypeScript types for the Books Management System
 * 
 * These types are used across both client and server code to ensure
 * type safety for book-related operations.
 */

/**
 * Predefined book categories for Christian literature
 * These are the only valid values for the category field
 */
export const BOOK_CATEGORIES = [
  'Spiritual Growth',
  'Prayer & Intercession',
  'Faith & Doctrine',
  'Christian Living',
  'Leadership',
  'Family & Relationships',
  'Devotional',
  'Theology',
  'Biography',
  'Other',
] as const

/**
 * Type representing a valid book category
 * Derived from the BOOK_CATEGORIES constant
 */
export type BookCategory = typeof BOOK_CATEGORIES[number]

/**
 * Complete book record as stored in the database
 * Includes all fields returned from API queries
 */
export interface Book {
  id: string
  title: string
  author: string
  category: BookCategory
  description: string
  coverImage: string
  purchaseUrl: string | null
  published: boolean
  /** Book-of-the-Month flag: appears on homepage BooksSection when true. */
  featured: boolean
  /** Sort position within the featured set (1 = big slot, 2-3 = small slots). */
  featuredOrder: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Input type for creating a new book
 * All fields required except purchaseUrl
 */
export interface CreateBookInput {
  title: string
  author: string
  category: BookCategory
  description: string
  coverImage: string
  purchaseUrl?: string
  published: boolean
  featured?: boolean
  featuredOrder?: number
}

/**
 * Input type for updating an existing book
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateBookInput {
  title?: string
  author?: string
  category?: BookCategory
  description?: string
  coverImage?: string
  purchaseUrl?: string
  published?: boolean
  featured?: boolean
  featuredOrder?: number
}
