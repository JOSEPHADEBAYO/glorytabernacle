import type { Gender } from '@/lib/types/group-member'

export const INAUGURAL_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'CONTENT_EDITOR',
] as const
export type InauguralAdminRole = (typeof INAUGURAL_ADMIN_ROLES)[number]

/** The inaugural service date — single source of truth used by the form,
 *  the email template, the dashboard, and the programme page. */
export const INAUGURAL_SERVICE_DATE = new Date('2026-07-19T10:00:00Z')

/** Year embedded in the human-readable ID. Update if the badge series ever
 *  rolls over to a new year. */
export const INAUGURAL_ID_YEAR = 2026

/** Prefix used in the human-readable badge ID. */
export const INAUGURAL_ID_PREFIX = 'GT'

/**
 * Format an auto-incrementing serialNumber from the database into the public
 * badge ID, e.g. 1 → "GT-2026-0001", 2843 → "GT-2026-2843".
 */
export function formatRegistrationId(serialNumber: number): string {
  return `${INAUGURAL_ID_PREFIX}-${INAUGURAL_ID_YEAR}-${String(serialNumber).padStart(4, '0')}`
}

/**
 * Parse a human-readable badge ID back into the serialNumber for DB lookups.
 * Returns null if the input doesn't match the expected pattern.
 * Lenient on case + whitespace so check-in staff can type roughly.
 */
export function parseRegistrationId(input: string): number | null {
  const cleaned = input.trim().toUpperCase()
  const match = cleaned.match(/^GT-(\d{4})-(\d{1,6})$/)
  if (!match) return null
  const serial = Number(match[2])
  return Number.isFinite(serial) && serial > 0 ? serial : null
}

/** Full registration record as it lives in the database. */
export interface InauguralRegistration {
  id: string
  serialNumber: number
  firstName: string
  lastName: string
  email: string
  gender: Gender
  address: string
  isRccgMember: boolean
  fromOutsideBarnstaple: boolean
  homeChurch: string | null
  createdAt: Date
}
