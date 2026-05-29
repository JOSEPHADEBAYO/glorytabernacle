import { z } from 'zod'
import { GENDERS } from '@/lib/types/group-member'

const requiredText = (label: string, max = 500) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`)

export const createVolunteerInterestSchema = z.object({
  name: requiredText('Name', 160),
  email: z.string().trim().email('Email address must be valid').max(200),
  phoneNumber: requiredText('Phone number', 60),
  gender: z.enum(GENDERS, { message: 'Please select a gender' }),
  address: requiredText('Address', 500),
  areaStrengthIds: z
    .array(z.string().trim().min(1))
    .min(1, 'Select at least one area of strength')
    .max(2, 'Select a maximum of two areas of strength'),
  pastExperience: requiredText('Past experience', 3000),
  contributionStatement: requiredText(
    'How you think you can serve in this area',
    3000
  ),
  bornAgain: z.boolean(),
  filledWithHolyGhost: z.boolean(),
})

export const volunteerInterestQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(200).optional(),
})
