/**
 * Zod validation schemas for the Children Ministry system.
 *
 * Staff-managed model (CHILDREN_LEADER + SUPER_ADMIN). Each child captures
 * a primary guardian (day-to-day contact) and a separate emergency contact.
 */

import { z } from 'zod'
import { GENDERS } from '@/lib/types/group-member'

/**
 * UK phone number — same rules as the join-group form.
 */
const ukPhoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .max(30, 'Phone number too long')
  .refine(
    (v) => /^(?:\+44\d{10}|0\d{10})$/.test(v.replace(/[\s\-()]/g, '')),
    {
      message:
        'Must be a valid UK phone number (e.g. 07123 456789 or +44 7123 456789)',
    }
  )

/**
 * Date-of-birth validation: coerces to Date, rejects future dates and
 * dates more than 18 years ago (children's ministry is for minors).
 */
const dobSchema = z.coerce
  .date({ message: 'A valid date of birth is required' })
  .refine((d) => d.getTime() <= Date.now(), {
    message: 'Date of birth cannot be in the future',
  })
  .refine(
    (d) => {
      const eighteenYearsMs = 18 * 365 * 24 * 60 * 60 * 1000
      return Date.now() - d.getTime() <= eighteenYearsMs
    },
    { message: 'Children must be under 18' }
  )

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''))

const optionalEmail = z
  .string()
  .trim()
  .email('Must be a valid email address')
  .max(254, 'Email too long')
  .optional()
  .or(z.literal(''))

/**
 * Schema for POST /api/admin/children — the Children Leader registers a child.
 */
export const createChildSchema = z.object({
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
  dateOfBirth: dobSchema,
  gender: z.enum(GENDERS, { message: 'Please select a gender' }),
  allergies: optionalText(2000),
  medicalNotes: optionalText(2000),
  specialNeeds: optionalText(2000),
  photoUrl: z.string().url('Photo URL must be a valid URL').optional().or(z.literal('')),
  primaryGuardianName: z
    .string()
    .trim()
    .min(1, 'Primary guardian name is required')
    .max(100, 'Primary guardian name too long'),
  primaryGuardianPhone: ukPhoneSchema,
  primaryGuardianEmail: optionalEmail,
  emergencyContactName: z
    .string()
    .trim()
    .min(1, 'Emergency contact name is required')
    .max(100, 'Emergency contact name too long'),
  emergencyContactPhone: ukPhoneSchema,
  emergencyContactRelation: z
    .string()
    .trim()
    .min(1, 'Emergency contact relationship is required')
    .max(60, 'Relationship too long'),
})

/**
 * Schema for PUT /api/admin/children/[id]. All fields optional, at least one required.
 */
export const updateChildSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    dateOfBirth: dobSchema.optional(),
    gender: z.enum(GENDERS).optional(),
    allergies: optionalText(2000),
    medicalNotes: optionalText(2000),
    specialNeeds: optionalText(2000),
    photoUrl: z.string().url().optional().or(z.literal('')),
    primaryGuardianName: z.string().trim().min(1).max(100).optional(),
    primaryGuardianPhone: ukPhoneSchema.optional(),
    primaryGuardianEmail: optionalEmail,
    emergencyContactName: z.string().trim().min(1).max(100).optional(),
    emergencyContactPhone: ukPhoneSchema.optional(),
    emergencyContactRelation: z.string().trim().min(1).max(60).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

/**
 * Schema for POST /api/admin/children/[id]/check-in — single-child action.
 */
export const checkInSingleSchema = z.object({}).strict()

/**
 * Schema for POST /api/admin/children/[id]/check-out — single check-in close.
 */
export const checkOutSingleSchema = z.object({
  checkInId: z.string().min(1, 'checkInId is required').optional(),
})

/**
 * Query params for the admin-side list endpoints.
 */
export const adminChildrenQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(200).optional(),
})

export const adminCheckInsQuerySchema = z.object({
  /** When true, return only currently signed-in (not yet signed-out) records. */
  active: z.enum(['true', 'false']).optional(),
})
