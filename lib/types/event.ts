/**
 * Shared TypeScript types for the Events Management System.
 *
 * Used across both client and server code to ensure type safety
 * for event-related operations.
 */

/**
 * User roles permitted to manage Events.
 */
export const EVENT_ADMIN_ROLES = ['SUPER_ADMIN', 'CONTENT_EDITOR'] as const
export type EventAdminRole = typeof EVENT_ADMIN_ROLES[number]

/**
 * Complete event record as stored in the database.
 */
export interface ChurchEventRecord {
  id: string
  title: string
  description: string
  date: Date
  time: string | null
  location: string | null
  imageSrc: string | null
  imageAlt: string | null
  registrationHref: string | null
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Input type for creating a new event.
 * `date` accepts an ISO string from the wire and is coerced to a Date by Zod.
 */
export interface CreateEventInput {
  title: string
  description: string
  date: string | Date
  time?: string
  location?: string
  imageSrc?: string
  imageAlt?: string
  registrationHref?: string
  published?: boolean
}

/**
 * Input type for updating an existing event.
 * All fields are optional — only provided fields will be updated.
 */
export interface UpdateEventInput {
  title?: string
  description?: string
  date?: string | Date
  time?: string
  location?: string
  imageSrc?: string
  imageAlt?: string
  registrationHref?: string
  published?: boolean
}
