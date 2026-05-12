/**
 * Shared TypeScript types for the Children Ministry system.
 */

import type { Gender } from '@/lib/types/group-member'

export type { Gender }

/** Roles allowed to view/manage admin-side children data. */
export const CHILDREN_ADMIN_ROLES = ['SUPER_ADMIN', 'CONTENT_EDITOR'] as const
export type ChildrenAdminRole = typeof CHILDREN_ADMIN_ROLES[number]

/**
 * Complete Child record as stored in the database. Sensitive duty-of-care
 * fields are nullable text columns.
 */
export interface ChildRecord {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: Gender
  allergies: string | null
  medicalNotes: string | null
  specialNeeds: string | null
  photoUrl: string | null
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
  createdAt: Date
  updatedAt: Date
}

/** Input shape for POST /api/parents/me/children. */
export interface CreateChildInput {
  firstName: string
  lastName: string
  dateOfBirth: string | Date
  gender: Gender
  allergies?: string
  medicalNotes?: string
  specialNeeds?: string
  photoUrl?: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
}

/** Input shape for PUT /api/parents/me/children/[id]. */
export interface UpdateChildInput {
  firstName?: string
  lastName?: string
  dateOfBirth?: string | Date
  gender?: Gender
  allergies?: string
  medicalNotes?: string
  specialNeeds?: string
  photoUrl?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
}

/**
 * One check-in cycle. signedOutAt + signedOutById are null while the
 * child is still in the children's-ministry care.
 */
export interface CheckInRecord {
  id: string
  childId: string
  signedInAt: Date
  signedInById: string
  signedOutAt: Date | null
  signedOutById: string | null
}
