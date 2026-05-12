export const INFORMATION_CATEGORIES = [
  'IMMIGRATION',
  'JOB',
  'OTHER',
] as const

export type InformationCategory = (typeof INFORMATION_CATEGORIES)[number]

export const INFORMATION_CATEGORY_LABELS: Record<InformationCategory, string> = {
  IMMIGRATION: 'Immigration',
  JOB: 'Jobs',
  OTHER: 'Other information',
}

export const INFORMATION_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'CONTENT_EDITOR',
] as const

export type InformationAdminRole = (typeof INFORMATION_ADMIN_ROLES)[number]

export interface InformationItem {
  id: string
  title: string
  description: string
  linkUrl: string
  category: InformationCategory
  submittedBy: string | null
  submitterEmail: string | null
  published: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}
