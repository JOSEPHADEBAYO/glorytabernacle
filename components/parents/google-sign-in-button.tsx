'use client'

import { useState } from 'react'
import Image from 'next/image'
import { signIn } from 'next-auth/react'

/**
 * "Continue with Google" button used on /parents/login.
 *
 * v4's `signIn` is a client-only API, so this component must be a client
 * component. After successful auth, the user is redirected to /parents.
 */
export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true)
        await signIn('google', { callbackUrl: '/parents' })
      }}
      className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
    >
      <Image
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt=""
        width={18}
        height={18}
        unoptimized
        aria-hidden="true"
      />
      <span>{isLoading ? 'Signing in…' : 'Continue with Google'}</span>
    </button>
  )
}
