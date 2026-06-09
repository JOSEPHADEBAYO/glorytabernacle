import { z } from 'zod'
import { GENDERS } from '@/lib/types/group-member'
import { CHILDREN_AGE_GROUPS } from '@/lib/types/inaugural-registration'

const requiredText = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long`)

/**
 * Public POST body for /api/inaugural-service/register. The `homeChurch`
 * field is conditional on `fromOutsideBarnstaple` — required when true,
 * disallowed when false. Enforced by the .refine() at the bottom so the
 * client and server agree on the rule.
 */
export const createInauguralRegistrationSchema = z
  .object({
    firstName: requiredText('First name', 80),
    lastName: requiredText('Last name', 80),
    email: z
      .string()
      .trim()
      .email('Email address must be valid')
      .max(200),
    gender: z.enum(GENDERS, { message: 'Please select a gender' }),
    address: requiredText('Address', 500),
    isRccgMember: z.boolean(),
    fromOutsideBarnstaple: z.boolean(),
    homeChurch: z
      .string()
      .trim()
      .max(200, 'Home church name is too long')
      .optional(),
    // Explicit photo opt-in. The form forces a yes/no choice so we always
    // get an explicit answer rather than an absent field defaulting to
    // false silently.
    photographyConsent: z.boolean(),
    // Children-attending block. Server treats numberOfChildren / age
    // groups / special needs as optional at the field level, then the
    // .refine() below enforces the conditional pairing when
    // bringingChildren is true.
    bringingChildren: z.boolean(),
    numberOfChildren: z
      .number()
      .int()
      .min(1, 'Please enter at least 1 child.')
      .max(20, 'Please contact us directly for groups of more than 20 children.')
      .optional(),
    childrenAgeGroups: z
      .array(z.enum(CHILDREN_AGE_GROUPS))
      .max(CHILDREN_AGE_GROUPS.length)
      .optional(),
    childrenSpecialNeeds: z
      .string()
      .trim()
      .max(1000, 'Special needs note is too long.')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.fromOutsideBarnstaple) {
        return Boolean(data.homeChurch && data.homeChurch.length > 0)
      }
      return true
    },
    {
      path: ['homeChurch'],
      message: "Please tell us which church you'll be travelling from.",
    }
  )
  .refine(
    (data) => {
      if (data.bringingChildren) {
        return typeof data.numberOfChildren === 'number' && data.numberOfChildren >= 1
      }
      return true
    },
    {
      path: ['numberOfChildren'],
      message: 'Please tell us how many children you are bringing.',
    }
  )
  .refine(
    (data) => {
      if (data.bringingChildren) {
        return Array.isArray(data.childrenAgeGroups) && data.childrenAgeGroups.length >= 1
      }
      return true
    },
    {
      path: ['childrenAgeGroups'],
      message: 'Please tick at least one age group.',
    }
  )

export const inauguralRegistrationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  /** Free-text search — matches email, first name, last name, or badge ID. */
  search: z.string().trim().max(200).optional(),
})
