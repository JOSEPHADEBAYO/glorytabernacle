/**
 * Zod validation schemas for the GroupMember (join group) system.
 */

import { z } from 'zod'
import { GENDERS, MARITAL_STATUSES } from '@/lib/types/group-member'

/**
 * UK phone number validation.
 *
 * Accepts (after stripping spaces, dashes, and parentheses):
 *   - +44 followed by 10 digits          e.g. +447478137599
 *   - 0 followed by 10 digits            e.g. 07478137599
 *
 * The visible form input may include any combination of spaces, dashes
 * or parentheses; we normalise before testing.
 */
const ukPhoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .max(30, 'Phone number too long')
  .refine(
    (value) => {
      const normalized = value.replace(/[\s\-()]/g, '')
      // +44 followed by exactly 10 digits OR a leading 0 followed by 10 digits
      return /^(?:\+44\d{10}|0\d{10})$/.test(normalized)
    },
    {
      message:
        'Must be a valid UK phone number (e.g. 07123 456789 or +44 7123 456789)',
    }
  )

/** Day of birth: 1-31 inclusive. */
const birthDaySchema = z.coerce
  .number({ message: 'Day of birth is required' })
  .int('Day of birth must be a whole number')
  .min(1, 'Day must be 1-31')
  .max(31, 'Day must be 1-31')

/** Month of birth: 1-12 inclusive. */
const birthMonthSchema = z.coerce
  .number({ message: 'Month of birth is required' })
  .int('Month of birth must be a whole number')
  .min(1, 'Month must be 1-12')
  .max(12, 'Month must be 1-12')

/**
 * Schema for the public "Get Involved" form on /groups/[slug].
 */
export const joinGroupSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(100, 'First name too long'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(100, 'Last name too long'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('A valid email is required')
    .max(254, 'Email too long'),
  phoneNumber: ukPhoneSchema,
  birthDay: birthDaySchema,
  birthMonth: birthMonthSchema,
  gender: z.enum(GENDERS, { message: 'Please select a gender' }),
  maritalStatus: z.enum(MARITAL_STATUSES, {
    message: 'Please select a marital status',
  }),
  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .max(500, 'Address too long'),
  filledWithHolyGhost: z.coerce.boolean(),
})

/**
 * Query parameters for GET /api/group-members.
 */
export const groupMembersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  groupId: z.string().min(1).optional(),
  search: z.string().max(200).optional(),
})
