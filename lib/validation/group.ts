/**
 * Zod validation schemas for the Groups management system.
 *
 * Validates API request payloads to ensure data integrity before
 * database operations.
 */

import { z } from 'zod'

/**
 * Slugs must be lowercase alphanumeric with hyphen separators.
 * No leading or trailing hyphens, no consecutive hyphens.
 *
 * @example  "prayer-intercession"  ✓
 * @example  "Prayer-Intercession"  ✗ (uppercase)
 * @example  "-prayer"              ✗ (leading hyphen)
 * @example  "prayer--intercession" ✗ (double hyphen)
 */
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(100, 'Slug too long')
  .regex(
    slugRegex,
    'Slug must be lowercase letters, numbers, and hyphens only (e.g. "prayer-intercession")'
  )

const urlSchema = z.string().url('Must be a valid URL')

/**
 * One programme entry in the Programmes & Sub-Units list.
 */
const programmeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Programme title is required')
    .max(300, 'Programme title too long'),
  schedule: z.string().trim().max(200).optional().or(z.literal('')),
})

/**
 * Optional highlighted callout (e.g., "SOUL PIPELINE ROLE").
 * Both title and body must be present together.
 */
const specialRoleSchema = z.object({
  title: z.string().trim().min(1, 'Callout title is required').max(200),
  body: z.string().trim().min(1, 'Callout body is required').max(2000),
})

const responsibilitiesSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'Responsibility cannot be empty')
      .max(500, 'Responsibility too long')
  )
  .max(50, 'Too many responsibilities')

const programmesSchema = z
  .array(programmeSchema)
  .max(50, 'Too many programmes')

/**
 * Schema for creating a new group.
 *
 * Required: slug, title, description, imageSrc, imageAlt.
 * Everything else is optional, including all the departmental-board fields.
 */
export const createGroupSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long'),
  tag: z.string().trim().max(100).optional().or(z.literal('')),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(2000, 'Description too long'),
  imageSrc: urlSchema,
  imageAlt: z
    .string()
    .trim()
    .min(1, 'Image alt text is required')
    .max(200, 'Image alt text too long'),
  ctaLabel: z.string().trim().max(50).optional().or(z.literal('')),
  ctaHref: urlSchema.optional().or(z.literal('')),
  order: z.number().int().optional(),
  published: z.boolean().default(false),

  // Departmental-board fields
  scripture: z.string().trim().max(2000).optional().or(z.literal('')),
  headTitle: z.string().trim().max(200).optional().or(z.literal('')),
  responsibilities: responsibilitiesSchema.optional(),
  programmes: programmesSchema.optional(),
  specialRole: specialRoleSchema.nullable().optional(),
  furnishStatement: z.string().trim().max(2000).optional().or(z.literal('')),
  transformStatement: z.string().trim().max(2000).optional().or(z.literal('')),
  influenceStatement: z.string().trim().max(2000).optional().or(z.literal('')),
})

/**
 * Schema for updating an existing group.
 * All fields optional; at least one must be provided.
 */
export const updateGroupSchema = z
  .object({
    slug: slugSchema.optional(),
    title: z.string().trim().min(1).max(200).optional(),
    tag: z.string().trim().max(100).optional().or(z.literal('')),
    description: z.string().trim().min(1).max(2000).optional(),
    imageSrc: urlSchema.optional(),
    imageAlt: z.string().trim().min(1).max(200).optional(),
    ctaLabel: z.string().trim().max(50).optional().or(z.literal('')),
    ctaHref: urlSchema.optional().or(z.literal('')),
    order: z.number().int().optional(),
    published: z.boolean().optional(),

    scripture: z.string().trim().max(2000).optional().or(z.literal('')),
    headTitle: z.string().trim().max(200).optional().or(z.literal('')),
    responsibilities: responsibilitiesSchema.optional(),
    programmes: programmesSchema.optional(),
    specialRole: specialRoleSchema.nullable().optional(),
    furnishStatement: z.string().trim().max(2000).optional().or(z.literal('')),
    transformStatement: z.string().trim().max(2000).optional().or(z.literal('')),
    influenceStatement: z.string().trim().max(2000).optional().or(z.literal('')),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

/**
 * Query parameters for GET /api/groups.
 */
export const groupQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
})
