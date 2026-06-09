import type { Gender } from '@/lib/types/group-member'

export const INAUGURAL_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'CONTENT_EDITOR',
] as const
export type InauguralAdminRole = (typeof INAUGURAL_ADMIN_ROLES)[number]

/** The inaugural service date — single source of truth used by the form,
 *  the email template, the dashboard, and the programme page. */
export const INAUGURAL_SERVICE_DATE = new Date('2026-07-19T10:00:00Z')

/** Public-facing service theme. Referenced from the registration form hero,
 *  the confirmation email header, the programme placeholder page, the
 *  homepage CTA, and the printed badge so every touchpoint reads as one
 *  designed campaign. */
export const INAUGURAL_THEME = {
  title: 'Glory Ahead',
  scripture: 'Haggai 2:9',
} as const

/** Service start time displayed alongside the date everywhere — kept here
 *  rather than parsed off the date so the format stays consistent. */
export const INAUGURAL_SERVICE_TIME = '1:00pm'

/** Venue details displayed on the registration page hero, confirmation
 *  email, programme page, and homepage CTA. Single source of truth so the
 *  address (and the parking note) only needs editing in one place. */
export const INAUGURAL_SERVICE_VENUE = {
  name: 'North Devon College',
  address: 'Old Sticklepath Hill, Barnstaple, EX31 2BQ',
  // Free-text parking note. Tweak this when the parking plan is finalised
  // (overflow lot, marshals, etc.) and every touchpoint picks it up.
  parkingNotes: 'Free on-site parking available. Our volunteers will direct you on arrival.',
  // Google Maps deep link so the email and CTA can offer a "Get directions"
  // button. Update if the parking entrance differs from the venue postcode.
  directionsUrl:
    'https://maps.google.com/?q=North+Devon+College+Old+Sticklepath+Hill+Barnstaple+EX31+2BQ',
} as const

/** Multi-select options for the "Bringing children?" registration question.
 *  Kept short and unambiguous so checkbox labels read cleanly on mobile and
 *  the dashboard chips stay scannable. */
export const CHILDREN_AGE_GROUPS = [
  'Under 2',
  '2-5',
  '6-11',
  '12-17',
] as const
export type ChildrenAgeGroup = (typeof CHILDREN_AGE_GROUPS)[number]

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
  photographyConsent: boolean
  bringingChildren: boolean
  numberOfChildren: number | null
  childrenAgeGroups: ChildrenAgeGroup[] | null
  childrenSpecialNeeds: string | null
  createdAt: Date
}
