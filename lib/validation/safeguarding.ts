/**
 * Zod validation for the safeguarding concern log.
 */

import { z } from 'zod'
import { CONCERN_TYPES, CONCERN_STATUSES } from '@/lib/types/safeguarding'

/** Schema for POST /api/admin/safeguarding-concerns (raise). */
export const createConcernSchema = z.object({
  // Optional link to a registered child. When omitted, the concern is
  // standalone (about an adult / visitor / general observation).
  childId: z.string().min(1).optional().or(z.literal('')),
  // Name shown on the record. Required for standalone concerns; for a
  // linked child the server can snapshot it from the child if omitted.
  childName: z.string().trim().max(120).optional().or(z.literal('')),
  concernType: z.enum(CONCERN_TYPES, { message: 'Choose a concern type' }),
  description: z
    .string()
    .trim()
    .min(1, 'Please describe what happened')
    .max(8000, 'Description is too long'),
  actionTaken: z.string().trim().max(8000).optional().or(z.literal('')),
  whoNotified: z.string().trim().max(2000).optional().or(z.literal('')),
  referredToMash: z.boolean().optional(),
  occurredAt: z.coerce
    .date({ message: 'A valid date/time is required' })
    .refine((d) => d.getTime() <= Date.now() + 60_000, {
      message: 'The date/time cannot be in the future',
    }),
})

/** Schema for PATCH /api/admin/safeguarding-concerns/[id] (DSL manage). */
export const updateConcernSchema = z
  .object({
    status: z.enum(CONCERN_STATUSES).optional(),
    referredToMash: z.boolean().optional(),
    resolution: z.string().trim().max(8000).optional().or(z.literal('')),
    whoNotified: z.string().trim().max(2000).optional().or(z.literal('')),
    actionTaken: z.string().trim().max(8000).optional().or(z.literal('')),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'At least one field must be provided',
  })

/** Query params for the list endpoint. */
export const concernsQuerySchema = z.object({
  status: z.enum(CONCERN_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})
