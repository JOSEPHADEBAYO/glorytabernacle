/**
 * Shared types + role rules for the safeguarding concern log.
 *
 * Access model (set with the church 16 May 2026):
 *   - RAISE a concern  → any CHILDREN_LEADER or SUPER_ADMIN
 *   - VIEW / MANAGE    → SUPER_ADMIN, or any user flagged
 *                        isDesignatedSafeguardingLead (DSL)
 */

/** Roles permitted to raise (create) a safeguarding concern. */
export const CONCERN_RAISE_ROLES = ['SUPER_ADMIN', 'CHILDREN_LEADER'] as const
export type ConcernRaiseRole = (typeof CONCERN_RAISE_ROLES)[number]

export function canRaiseConcern(role: string | undefined): boolean {
  return CONCERN_RAISE_ROLES.includes(role as ConcernRaiseRole)
}

/**
 * Whether a user may view / manage the concern log. SUPER_ADMIN always can;
 * otherwise the user must be flagged as a Designated Safeguarding Lead.
 */
export function canManageConcerns(
  role: string | undefined,
  isDsl: boolean | undefined
): boolean {
  return role === 'SUPER_ADMIN' || isDsl === true
}

export const CONCERN_TYPES = [
  'DISCLOSURE',
  'PHYSICAL',
  'EMOTIONAL',
  'SEXUAL',
  'NEGLECT',
  'BEHAVIOURAL',
  'ONLINE',
  'ALLEGATION_AGAINST_ADULT',
  'OTHER',
] as const
export type ConcernType = (typeof CONCERN_TYPES)[number]

export const CONCERN_TYPE_LABELS: Record<ConcernType, string> = {
  DISCLOSURE: 'Disclosure by a child',
  PHYSICAL: 'Physical (injury / abuse)',
  EMOTIONAL: 'Emotional',
  SEXUAL: 'Sexual',
  NEGLECT: 'Neglect',
  BEHAVIOURAL: 'Behavioural change',
  ONLINE: 'Online safety',
  ALLEGATION_AGAINST_ADULT: 'Allegation against an adult',
  OTHER: 'Other',
}

export const CONCERN_STATUSES = ['OPEN', 'MONITORING', 'CLOSED'] as const
export type ConcernStatus = (typeof CONCERN_STATUSES)[number]

export const CONCERN_STATUS_LABELS: Record<ConcernStatus, string> = {
  OPEN: 'Open',
  MONITORING: 'Monitoring',
  CLOSED: 'Closed',
}
