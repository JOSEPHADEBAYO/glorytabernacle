import { z } from 'zod'

const urlSchema = z.string().url('Must be a valid URL')
const optionalTrimmed = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional()

export const createHeroCarouselImageSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title too long'),
  imageUrl: urlSchema,
  imageAlt: z
    .string()
    .trim()
    .min(1, 'Image alt text is required')
    .max(200, 'Image alt text too long'),
  publicId: optionalTrimmed,
  filename: optionalTrimmed,
  format: optionalTrimmed,
  size: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  order: z.number().int().min(0).default(0),
  published: z.boolean().default(false),
})

export const updateHeroCarouselImageSchema = createHeroCarouselImageSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

export const heroCarouselQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
})
