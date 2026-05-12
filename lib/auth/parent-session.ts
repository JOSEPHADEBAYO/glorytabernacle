/**
 * Helpers for protected parent-side routes and server components.
 *
 * Distinguishes "logged-in parent" (PARENT role) from any other authenticated
 * user. Admin auth is unrelated and uses a separate session-cookie flow.
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/parent-auth'

export interface ParentUser {
  id: string
  email: string
  name: string
  image: string | null
}

/**
 * Returns the currently signed-in parent user, or null if the visitor is
 * not signed in or is not a PARENT.
 */
export async function getParentUser(): Promise<ParentUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  if (session.user.role !== 'PARENT') return null
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name: session.user.name ?? '',
    image: session.user.image ?? null,
  }
}

/**
 * Server-component / route-handler guard: redirects to /parents/login when
 * the visitor is not signed in. Returns the parent user otherwise.
 */
export async function requireParent(redirectTo = '/parents/login'): Promise<ParentUser> {
  const parent = await getParentUser()
  if (!parent) {
    redirect(redirectTo)
  }
  return parent
}
