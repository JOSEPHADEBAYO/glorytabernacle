import { z } from 'zod'

export const membershipClassSchema = z.enum([
  'Foundation Class',
  'Maturity Class',
  'School of Ministry',
])

const requiredText = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`)

export const createMembershipApplicationSchema = z.object({
  membershipClass: membershipClassSchema,
  firstName: requiredText('First name', 100),
  lastName: requiredText('Last name', 100),
  email: z.string().trim().email('Email address must be valid').max(200),
  phoneNumber: requiredText('Phone number', 50),
  gender: z.enum(['MALE', 'FEMALE']),
  maritalStatus: z.enum([
    'SINGLE',
    'ENGAGED',
    'MARRIED',
    'SEPARATED',
    'DIVORCED',
    'WIDOWED',
  ]),
  streetAddress: requiredText('Street address', 300),
  city: requiredText('City', 100),
  stateProvince: requiredText('State / province', 100),
  country: requiredText('Country', 100),
  rccgMember: z.boolean(),
  saved: z.boolean(),
  expectations: z
    .string()
    .trim()
    .max(3000, 'Expectations / prayer points is too long')
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
})

export const membershipApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(200).optional(),
  membershipClass: membershipClassSchema.optional(),
})
