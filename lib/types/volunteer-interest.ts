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
  address: string
  areaStrengths: VolunteerAreaStrength[]
  pastExperience: string
  contributionStatement: string
  bornAgain: boolean
  filledWithHolyGhost: boolean
  createdAt: Date
}
