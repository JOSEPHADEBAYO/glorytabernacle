/**
 * Shared TypeScript types for the Youth Ministry System
 */

export interface YouthCheckIn {
  id: string
  userId: string
  signedInAt: Date
  signedOutAt: Date | null
  createdAt: Date
}

export interface DailyScripture {
  id: string
  date: Date
  reference: string
  text: string
  videoUrl: string | null
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateDailyScriptureInput {
  date: string        // ISO date string
  reference: string
  text: string
  videoUrl?: string
  published: boolean
}

export interface UpdateDailyScriptureInput {
  date?: string
  reference?: string
  text?: string
  videoUrl?: string | null
  published?: boolean
}
