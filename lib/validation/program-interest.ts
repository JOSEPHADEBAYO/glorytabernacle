/**
 * Zod validation schemas for the Program Interest system.
 */

import { z } from 'zod'

/**
 * Public submit form schema.
 */
export const submitProgramInterestSchema = z.object({
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

/**
 * Admin list query schema.
 */
export const programInterestListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(200).optional(),
})

/**
 * Admin broadcast email schema.
 *
 * Recipient targeting: when `recipientIds` is omitted or empty, the email
 * is sent to every subscriber. Otherwise only the specified rows are
 * targeted.
 */
const optionalUrl = z
  .string()
  .url('CTA URL must be a valid link')
  .optional()
  .or(z.literal(''))

export const sendProgramEmailSchema = z
  .object({
    subject: z
      .string()
      .trim()
      .min(1, 'Subject is required')
      .max(200, 'Subject too long'),
    body: z
      .string()
      .trim()
      .min(1, 'Email body is required')
      .max(20000, 'Email body too long'),
    /** Optional call-to-action button label rendered above the sign-off. */
    ctaLabel: z.string().trim().max(60).optional().or(z.literal('')),
    /** Optional CTA destination — required when ctaLabel is set. */
    ctaHref: optionalUrl,
    recipientIds: z.array(z.string().min(1)).max(1000).optional(),
  })
  .refine(
    (data) => {
      // Both CTA fields must be set together (or neither).
      const hasLabel = Boolean(data.ctaLabel && data.ctaLabel.trim())
      const hasHref = Boolean(data.ctaHref && data.ctaHref.trim())
      return hasLabel === hasHref
    },
    {
      message: 'CTA label and URL must be filled in together',
      path: ['ctaHref'],
    }
  )
