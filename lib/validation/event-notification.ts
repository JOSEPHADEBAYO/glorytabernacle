/**
 * Zod validation schemas for the Event Notification subscription system.
 */

import { z } from 'zod'

/**
 * Schema for the "Get Notified" subscription form.
 *
 * - name: trimmed, 1-100 characters
 * - email: valid email format, trimmed and lowercased before storage
 */
export const subscribeNotificationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('A valid email is required')
    .max(254, 'Email too long'),
})
