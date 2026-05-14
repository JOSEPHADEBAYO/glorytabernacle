'use client'

import { useState } from 'react'
import Image from 'next/image'
import { signIn } from 'next-auth/react'

/**
 * "Continue with Google" button for the Youth portal.
 *
 * After Google auth completes, NextAuth redirects to /youth/callback
 * which sets the YOUTH role then redirects to /youth.
 */
export function YouthGoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true)
        await signIn('google', { callbackUrl: '/youth/callback' })
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
