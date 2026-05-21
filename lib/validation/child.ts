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
 * Authorised collector — one named adult permitted to collect the child
 * (in addition to the primary guardian).
 */
const collectorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Collector name is required')
    .max(100, 'Collector name too long'),
  relationship: z
    .string()
    .trim()
    .min(1, 'Relationship is required (e.g. Father, Aunt)')
    .max(60, 'Relationship too long'),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal('')),
  photoUrl: z.string().url('Photo URL must be a valid URL').optional().or(z.literal('')),
  photoPublicId: z.string().trim().max(300).optional().or(z.literal('')),
  notes: optionalText(2000),
})

const collectorsArraySchema = z
  .array(collectorSchema)
  .max(5, 'You can list up to 5 authorised collectors per child.')
  .optional()

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
  photoPublicId: z.string().trim().max(300).optional().or(z.literal('')),
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
  authorisedCollectors: collectorsArraySchema,

  // UK GDPR consent — three mandatory, one optional.
  consentDataProcessing: z
    .boolean()
    .refine((v) => v === true, {
      message:
        "You must consent to processing your child's data for us to register them.",
    }),
  consentMedicalInfoSharing: z
    .boolean()
    .refine((v) => v === true, {
      message:
        'Medical info sharing consent is required so leaders can keep your child safe.',
    }),
  consentEmergencyTreatment: z
    .boolean()
    .refine((v) => v === true, {
      message:
        'Emergency treatment consent is required so we can act in a medical emergency.',
    }),
  consentPhotography: z.boolean().default(false),
  consentByName: z
    .string()
    .trim()
    .min(1, 'Please enter the name of the parent/guardian giving consent.')
    .max(100, 'Name too long'),
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
    photoPublicId: z.string().trim().max(300).optional().or(z.literal('')),
    primaryGuardianName: z.string().trim().min(1).max(100).optional(),
    primaryGuardianPhone: ukPhoneSchema.optional(),
    primaryGuardianEmail: optionalEmail,
    emergencyContactName: z.string().trim().min(1).max(100).optional(),
    emergencyContactPhone: ukPhoneSchema.optional(),
    emergencyContactRelation: z.string().trim().min(1).max(60).optional(),
    authorisedCollectors: collectorsArraySchema,
    consentDataProcessing: z.boolean().optional(),
    consentPhotography: z.boolean().optional(),
    consentMedicalInfoSharing: z.boolean().optional(),
    consentEmergencyTreatment: z.boolean().optional(),
    consentByName: z.string().trim().min(1).max(100).optional(),
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
 *
 * `code` is the 6-digit pickup code emailed to the guardian at sign-in.
 * `collectedByName` + `collectedByRelationship` snapshot who actually
 * collected the child. `collectedFromList=true` means the collector
 * matched a named entry (primary guardian or AuthorisedCollector);
 * `false` is an off-list override, in which case `collectionNotes` should
 * explain the reason.
 */
export const checkOutSingleSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'A 6-digit pickup code is required'),
  performance: z.string().trim().max(4000).optional(),
  collectedByName: z.string().trim().min(1).max(100).optional(),
  collectedByRelationship: z.string().trim().min(1).max(60).optional(),
  collectedFromList: z.boolean().optional(),
  collectionNotes: z.string().trim().max(2000).optional(),
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
