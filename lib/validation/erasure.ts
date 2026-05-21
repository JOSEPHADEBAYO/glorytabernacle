/**
 * Zod validation for the right-to-erasure (UK GDPR Article 17) request flow.
 *
 * A parent/guardian submits a public request asking us to erase their
 * child's data. The Children Leader / Super Admin reviews the queue and runs
 * the "erase all data" action. No auth on the public submission — anyone can
 * ask — but the request only describes what to erase; nothing is deleted
 * until staff act on it.
 */

import { z } from 'zod'
import { ERASURE_STATUSES } from '@/lib/types/erasure'

/** Schema for POST /api/parent/erasure-request (public submission). */
export const createErasureRequestSchema = z.object({
  childName: z
    .string()
    .trim()
    .min(1, "Please enter the child's full name")
    .max(120, 'Name is too long'),
  guardianName: z
    .string()
    .trim()
    .min(1, 'Please enter your full name')
    .max(120, 'Name is too long'),
  guardianEmail: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),
  message: z
    .string()
    .trim()
    .max(4000, 'Message is too long')
    .optional()
    .or(z.literal('')),
  // Honesty checkbox — the requester confirms they're the parent/guardian.
  // We can't verify identity on a public form, so this is recorded as the
  // basis on which staff act; staff still verify before erasing.
  confirmGuardian: z.boolean().refine((v) => v === true, {
    message:
      'Please confirm you are the parent or legal guardian of this child.',
  }),
})

/** Schema for PATCH /api/admin/erasure-requests/[id] (staff handling). */
export const updateErasureRequestSchema = z
  .object({
    status: z.enum(ERASURE_STATUSES).optional(),
    // When completing via the "erase child & complete" action, the admin
    // links the matched child so we know which record was wiped.
    childId: z.string().min(1).optional().or(z.literal('')),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'At least one field must be provided',
  })

/** Query params for the admin list endpoint. */
export const erasureRequestsQuerySchema = z.object({
  status: z.enum(ERASURE_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})
