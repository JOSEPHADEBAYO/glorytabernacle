/**
 * Shared TypeScript types for the Sermons system.
 *
 * Mirrors the Sermon Prisma model. The homepage SermonsSection card
 * shape happens to match this almost exactly — see app/page.tsx for the
 * tiny adapter.
 */

export const SERMON_ADMIN_ROLES = ['SUPER_ADMIN', 'CONTENT_EDITOR'] as const
export type SermonAdminRole = typeof SERMON_ADMIN_ROLES[number]

export interface Sermon {
  id: string
  title: string
  series: string | null
  speaker: string
  date: Date
  duration: string
  description: string
  thumbnail: string
  videoUrl: string
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateSermonInput {
  title: string
  series?: string | null
  speaker: string
  date: string | Date
  duration: string
  description: string
  thumbnail: string
  videoUrl: string
  published?: boolean
}

export interface UpdateSermonInput {
  title?: string
  series?: string | null
  speaker?: string
  date?: string | Date
  duration?: string
  description?: string
  thumbnail?: string
  videoUrl?: string
  published?: boolean
}
