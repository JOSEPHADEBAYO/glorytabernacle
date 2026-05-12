/**
 * Shared TypeScript types for the Sermons Management System.
 */

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
