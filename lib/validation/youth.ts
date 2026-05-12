/**
 * Zod validation schemas for the Youth Ministry System
 */

import { z } from 'zod'

const youtubeUrlSchema = z.string().refine((url) => {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/,
    /^https?:\/\/youtu\.be\/[\w-]{11}/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]{11}/,
  ]
  return patterns.some((p) => p.test(url))
}, { message: 'Invalid YouTube URL format' })

export const createDailyScriptureSchema = z.object({
  date: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  reference: z.string().trim().min(1, 'Scripture reference is required').max(100, 'Reference too long'),
  text: z.string().trim().min(10, 'Scripture text must be at least 10 characters').max(2000, 'Text too long'),
  videoUrl: youtubeUrlSchema.optional().or(z.literal('')),
  published: z.boolean().default(false),
})

export const updateDailyScriptureSchema = z.object({
  date: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
  reference: z.string().trim().min(1).max(100).optional(),
  text: z.string().trim().min(10).max(2000).optional(),
  videoUrl: youtubeUrlSchema.nullable().optional(),
  published: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
})

export const scriptureQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})
