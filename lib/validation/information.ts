import { z } from 'zod'
import { INFORMATION_CATEGORIES } from '@/lib/types/information'

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))

export const createInformationSchema = z.object({
  title: z.string().trim().min(3, 'Title is required').max(160, 'Title too long'),
  description: z
    .string()
    .trim()
    .min(10, 'Description is required')
    .max(3000, 'Description too long'),
  linkUrl: z.string().trim().url('Enter a valid link'),
  category: z.enum(INFORMATION_CATEGORIES),
  submittedBy: optionalTrimmedString,
  submitterEmail: optionalTrimmedString.pipe(z.string().email().optional()),
  published: z.boolean().optional(),
})

export const updateInformationSchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().min(10).max(3000).optional(),
    linkUrl: z.string().trim().url().optional(),
    category: z.enum(INFORMATION_CATEGORIES).optional(),
    submittedBy: optionalTrimmedString,
    submitterEmail: optionalTrimmedString.pipe(z.string().email().optional()),
    published: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export const informationQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
  category: z.enum(INFORMATION_CATEGORIES).optional(),
})
