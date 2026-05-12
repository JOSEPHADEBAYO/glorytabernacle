/**
 * Zod validation schemas for the Sermons Management System.
 */

import { z } from 'zod'

const urlSchema = z.string().trim().url('Must be a valid URL')

export const youtubeUrlSchema = urlSchema.refine(
  (value) => {
    try {
      const url = new URL(value)
      const host = url.hostname.replace(/^www\./, '')

      if (host === 'youtube.com' || host === 'm.youtube.com') {
        return (
          (url.pathname === '/watch' && Boolean(url.searchParams.get('v'))) ||
          url.pathname.startsWith('/embed/')
        )
      }

      return host === 'youtu.be' && url.pathname.length > 1
    } catch {
      return false
    }
  },
  { message: 'Invalid YouTube URL format' }
)

const optionalSeriesSchema = z
  .string()
  .trim()
  .min(1, 'Series cannot be empty')
  .max(100, 'Series too long')
  .optional()
  .or(z.literal(''))
  .nullable()

export const createSermonSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long'),
  series: optionalSeriesSchema,
  speaker: z.string().trim().min(1, 'Speaker is required').max(100, 'Speaker name too long'),
  date: z.coerce.date({ message: 'Invalid date' }),
  duration: z.string().trim().min(1, 'Duration is required').max(50, 'Duration too long'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description too long'),
  thumbnail: urlSchema,
  videoUrl: youtubeUrlSchema,
  published: z.boolean().default(false),
})

export const updateSermonSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    series: optionalSeriesSchema,
    speaker: z.string().trim().min(1).max(100).optional(),
    date: z.coerce.date({ message: 'Invalid date' }).optional(),
    duration: z.string().trim().min(1).max(50).optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    thumbnail: urlSchema.optional(),
    videoUrl: youtubeUrlSchema.optional(),
    published: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

export const sermonQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
  series: z.string().trim().max(100).optional(),
  search: z.string().trim().max(200).optional(),
})

export function normalizeSeries(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
