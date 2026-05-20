/**
 * Shared TypeScript types for the Children Ministry system.
 *
 * As of the 15 May 2026 cut-over, children check-in is staff-managed —
 * CHILDREN_LEADER (plus SUPER_ADMIN as a fallback) registers, edits, and
 * signs each child in / out from /dashboard/children. The legacy
 * parent-self-service OAuth flow has been retired.
 */

import type { Gender } from '@/lib/types/group-member'

export type { Gender }

/** Roles allowed to view / manage admin-side children data. */
export const CHILDREN_ADMIN_ROLES = ['SUPER_ADMIN', 'CHILDREN_LEADER'] as const
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
  primaryGuardianName: string
  primaryGuardianPhone: string
  primaryGuardianEmail: string | null
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
  consentDataProcessing: boolean
  consentPhotography: boolean
  consentMedicalInfoSharing: boolean
  consentEmergencyTreatment: boolean
  consentCapturedAt: Date | null
  consentByName: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * A named adult permitted to collect a specific child (in addition to the
 * primary guardian, who is implicitly authorised via the Child record).
 */
export interface AuthorisedCollectorInput {
  name: string
  relationship: string
  phone?: string
  photoUrl?: string
  notes?: string
}

/** Input shape for POST /api/admin/children. */
export interface CreateChildInput {
  firstName: string
  lastName: string
  dateOfBirth: string | Date
  gender: Gender
  allergies?: string
  medicalNotes?: string
  specialNeeds?: string
  photoUrl?: string
  primaryGuardianName: string
  primaryGuardianPhone: string
  primaryGuardianEmail?: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
  authorisedCollectors?: AuthorisedCollectorInput[]
  consentDataProcessing: boolean
  consentPhotography: boolean
  consentMedicalInfoSharing: boolean
  consentEmergencyTreatment: boolean
  consentByName?: string
}

/** Input shape for PUT /api/admin/children/[id]. */
export interface UpdateChildInput {
  firstName?: string
  lastName?: string
  dateOfBirth?: string | Date
  gender?: Gender
  allergies?: string
  medicalNotes?: string
  specialNeeds?: string
  photoUrl?: string
  primaryGuardianName?: string
  primaryGuardianPhone?: string
  primaryGuardianEmail?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  authorisedCollectors?: AuthorisedCollectorInput[]
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
