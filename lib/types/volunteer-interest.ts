import type { Gender } from '@/lib/types/group-member'

export const VOLUNTEER_INTEREST_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'CONTENT_EDITOR',
] as const

export type VolunteerInterestAdminRole =
  (typeof VOLUNTEER_INTEREST_ADMIN_ROLES)[number]

export interface VolunteerAreaStrength {
  id: string
  title: string
}

export interface VolunteerInterest {
  id: string
  name: string
  email: string
  phoneNumber: string
  /**
   * Nullable for rows created before the 2026-05-29 migration. Required on
   * every new submission (enforced by the Zod schema), so going forward all
   * rows carry a value.
   */
  gender: Gender | null
  address: string
  areaStrengths: VolunteerAreaStrength[]
  pastExperience: string
  contributionStatement: string
  bornAgain: boolean
  filledWithHolyGhost: boolean
  createdAt: Date
}
