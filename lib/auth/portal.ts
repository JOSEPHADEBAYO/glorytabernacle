/**
 * Portal detection utilities.
 *
 * We store the originating portal ('youth' | 'parent') in a short-lived
 * cookie so that NextAuth callbacks and sign-out redirects can route the
 * user back to the correct portal login page.
 */

export type Portal = 'youth' | 'parent'

export const PORTAL_COOKIE = 'auth_portal'

export function getPortalLoginUrl(portal: Portal): string {
  return portal === 'youth' ? '/youth/login' : '/parents/login'
}

export function getPortalHomeUrl(portal: Portal): string {
  return portal === 'youth' ? '/youth' : '/parents'
}
