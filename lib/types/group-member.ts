/**
 * Shared TypeScript types for the GroupMember (new-member submission) system.
 *
 * Anyone visiting /groups/[slug] can fill the "Get Involved" form to apply
 * for membership of that ministry. The admin team reviews submissions in
 * the dashboard at /dashboard/members.
 */

export const GENDERS = ['MALE', 'FEMALE'] as const
export type Gender = typeof GENDERS[number]

export const MARITAL_STATUSES = [
  'SINGLE',
  'ENGAGED',
  'MARRIED',
  'SEPARATED',
  'DIVORCED',
  'WIDOWED',
] as const
export type MaritalStatus = typeof MARITAL_STATUSES[number]

/** Human-friendly labels for display in admin tables and forms. */
export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
}

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  SINGLE: 'Single',
  ENGAGED: 'Engaged',
  MARRIED: 'Married',
  SEPARATED: 'Separated',
  DIVORCED: 'Divorced',
  WIDOWED: 'Widowed',
}

/** Roles allowed to view/manage the members list. */
export const GROUP_MEMBER_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'CONTENT_EDITOR',
] as const
export type GroupMemberAdminRole = typeof GROUP_MEMBER_ADMIN_ROLES[number]

/**
 * Complete GroupMember record as stored in the database.
 */
export interface GroupMemberRecord {
  id: string
  groupId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  birthDay: number
  birthMonth: number
  gender: Gender
  maritalStatus: MaritalStatus
  address: string
  filledWithHolyGhost: boolean
  createdAt: Date
}

/**
 * Input shape expected by POST /api/groups/[id]/join.
 */
export interface JoinGroupInput {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  birthDay: number
  birthMonth: number
  gender: Gender
  maritalStatus: MaritalStatus
  address: string
  filledWithHolyGhost: boolean
}
