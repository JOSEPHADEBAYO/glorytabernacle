/**
 * Helpers for protected youth-side routes and server components.
 * Mirrors lib/auth/parent-session.ts but checks for YOUTH role.
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/parent-auth'

export interface YouthUser {
  id: string
  email: string
  name: string
  image: string | null
}

/**
 * Returns the currently signed-in youth user, or null if not signed in
 * or not a YOUTH role.
 */
export async function getYouthUser(): Promise<YouthUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  if (session.user.role !== 'YOUTH') return null
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name: session.user.name ?? '',
    image: session.user.image ?? null,
  }
}

/**
 * Server-component guard: redirects to /youth/login when not signed in.
 */
export async function requireYouth(redirectTo = '/youth/login'): Promise<YouthUser> {
  const youth = await getYouthUser()
  if (!youth) redirect(redirectTo)
  return youth
}
