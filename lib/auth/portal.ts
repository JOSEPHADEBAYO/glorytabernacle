/**
 * Portal detection utilities.
 *
 * The parent-self-service flow was retired on 15 May 2026, so only the
 * 'youth' portal remains. This file is kept for backwards compatibility
 * with any imports that haven't been updated yet.
 */

export type Portal = 'youth'

export const PORTAL_COOKIE = 'auth_portal'

export function getPortalLoginUrl(_portal: Portal = 'youth'): string {
  return '/youth/login'
}

export function getPortalHomeUrl(_portal: Portal = 'youth'): string {
  return '/youth'
}
