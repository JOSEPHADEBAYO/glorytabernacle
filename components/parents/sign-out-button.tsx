'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'

/**
 * Header sign-out button. v4's `signOut` is a client-only API, so this
 * needs to be a client component.
 */
export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true)
        await signOut({ callbackUrl: '/parents/login' })
      }}
      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-60"
    >
      {isLoading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
