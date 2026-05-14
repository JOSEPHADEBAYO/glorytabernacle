/**
 * Shared TypeScript types for the Program Interest signup system.
 *
 * Captures general "stay in the loop" signups from the live-stream
 * section's "Get Notified" modal. Admins email subscribers from the
 * dashboard.
 */

export const PROGRAM_INTEREST_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'CONTENT_EDITOR',
] as const
export type ProgramInterestAdminRole = typeof PROGRAM_INTEREST_ADMIN_ROLES[number]

export interface ProgramInterestRecord {
  id: string
  name: string
  email: string
  createdAt: Date
}

export interface SubmitProgramInterestInput {
  name: string
  email: string
}

export interface SendProgramEmailInput {
  subject: string
  body: string
  /** When omitted or empty, the email is sent to every subscriber. */
  recipientIds?: string[]
}
