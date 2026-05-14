'use client'

import { signOut } from 'next-auth/react'

/**
 * Sign-out button for the Youth portal.
 * Always redirects back to /youth/login after signing out.
 */
export function YouthSignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/youth/login' })}
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
    >
      Sign out
    </button>
  )
}
