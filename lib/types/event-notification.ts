/**
 * Shared TypeScript types for the Event Notification subscription system.
 *
 * Visitors subscribe via the "Get Notified" modal on the homepage.
 * A scheduled cron job sends them a reminder email shortly before
 * the relevant event begins.
 */

/**
 * Complete notification record as stored in the database.
 */
export interface EventNotificationRecord {
  id: string
  eventId: string
  name: string
  email: string
  /** When the reminder email was sent. Null means not yet sent. */
  notifiedAt: Date | null
  createdAt: Date
}

/**
 * Input shape sent by the public "Get Notified" form.
 */
export interface SubscribeNotificationInput {
  name: string
  email: string
}
