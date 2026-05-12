export const MEMBERSHIP_APPLICATION_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'CONTENT_EDITOR',
] as const

export type MembershipApplicationAdminRole =
  (typeof MEMBERSHIP_APPLICATION_ADMIN_ROLES)[number]

export const MEMBERSHIP_CLASS_LABELS = [
  'Foundation Class',
  'Maturity Class',
  'School of Ministry',
] as const
