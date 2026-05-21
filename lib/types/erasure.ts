/**
 * Shared types + role rules for the right-to-erasure (UK GDPR Article 17)
 * request queue.
 *
 * Flow: a parent/guardian submits a public request → it lands in the queue as
 * PENDING → a Children Leader / Super Admin reviews it and either runs the
 * "erase all data" action (→ COMPLETED) or dismisses it (→ DISMISSED, e.g.
 * we hold no data, or the request was withdrawn / can't be verified).
 */

/**
 * Roles permitted to view / handle erasure requests. Same access set as the
 * rest of the children's-ministry admin tooling.
 */
export const ERASURE_ADMIN_ROLES = ['SUPER_ADMIN', 'CHILDREN_LEADER'] as const
export type ErasureAdminRole = (typeof ERASURE_ADMIN_ROLES)[number]

export function canHandleErasure(role: string | undefined): boolean {
  return ERASURE_ADMIN_ROLES.includes(role as ErasureAdminRole)
}

export const ERASURE_STATUSES = ['PENDING', 'COMPLETED', 'DISMISSED'] as const
export type ErasureStatus = (typeof ERASURE_STATUSES)[number]

export const ERASURE_STATUS_LABELS: Record<ErasureStatus, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  DISMISSED: 'Dismissed',
}
