/**
 * Shared TypeScript types for the Groups (ministries / units) management system.
 *
 * Every group follows the same "departmental board" template with optional
 * rich-content sections. Each ministry fills in its own unique values.
 */

/**
 * User roles permitted to manage Groups.
 */
export const GROUP_ADMIN_ROLES = ['SUPER_ADMIN', 'CONTENT_EDITOR'] as const
export type GroupAdminRole = typeof GROUP_ADMIN_ROLES[number]

/**
 * One programme or sub-unit entry in the Programmes & Sub-Units list.
 *
 * @example
 *   { title: "MOUNT UP — Daily 00:00–00:30 (All members, pray in Holy Ghost)", schedule: "Daily 00:00–00:30" }
 *   { title: "Weekly Corporate Prayer Meeting" }
 */
export interface GroupProgramme {
  title: string
  /** Optional schedule string shown alongside the programme title. */
  schedule?: string
}

/**
 * Optional highlighted callout used for special roles like "SOUL PIPELINE ROLE".
 */
export interface GroupSpecialRole {
  title: string
  body: string
}

/**
 * Complete Group record.
 *
 * Note: Prisma stores the JSON columns (responsibilities, programmes,
 * specialRole) as `JsonValue`. Consumers should narrow these to the typed
 * shapes here before use.
 */
export interface GroupRecord {
  id: string
  slug: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  ctaLabel: string | null
  ctaHref: string | null
  order: number
  published: boolean

  // Departmental-board fields
  scripture: string | null
  headTitle: string | null
  responsibilities: string[] | null
  programmes: GroupProgramme[] | null
  specialRole: GroupSpecialRole | null
  furnishStatement: string | null
  transformStatement: string | null
  influenceStatement: string | null

  createdBy: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Input for creating a new group via POST /api/groups.
 */
export interface CreateGroupInput {
  slug: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  ctaLabel?: string
  ctaHref?: string
  order?: number
  published?: boolean

  scripture?: string
  headTitle?: string
  responsibilities?: string[]
  programmes?: GroupProgramme[]
  specialRole?: GroupSpecialRole | null
  furnishStatement?: string
  transformStatement?: string
  influenceStatement?: string
}

/**
 * Input for updating an existing group via PUT /api/groups/[id].
 * All fields are optional — only provided fields are updated.
 */
export interface UpdateGroupInput {
  slug?: string
  title?: string
  description?: string
  imageSrc?: string
  imageAlt?: string
  ctaLabel?: string
  ctaHref?: string
  order?: number
  published?: boolean

  scripture?: string
  headTitle?: string
  responsibilities?: string[]
  programmes?: GroupProgramme[]
  specialRole?: GroupSpecialRole | null
  furnishStatement?: string
  transformStatement?: string
  influenceStatement?: string
}

/**
 * Lowercase a title and slugify into a URL-safe identifier.
 *
 * Behavior:
 * - Lowercase
 * - Strip everything that isn't a letter, number, or whitespace
 * - Collapse runs of whitespace into single hyphens
 * - Trim leading/trailing hyphens
 *
 * @example
 *   sluggify("Prayer & Intercession") -> "prayer-intercession"
 *   sluggify("King's Club (Men's)")  -> "kings-club-mens"
 */
export function sluggify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
}
