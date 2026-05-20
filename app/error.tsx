'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main
      className="min-h-svh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--church-navy)' }}
    >
      <p
        className="text-sm font-semibold uppercase tracking-widest mb-4"
        style={{ color: 'var(--church-light-green)' }}
      >
        RCCG Glory Tabernacle, Barnstaple
      </p>
      <h2
        className="text-3xl font-bold mb-4"
        style={{ color: 'var(--church-light-green)' }}
      >
        Something went wrong
      </h2>
      <p className="max-w-md text-lg text-white/80 mb-10">
        An unexpected error occurred. Please try again — if the problem persists, contact us for help.
      </p>
      <button
        onClick={() => unstable_retry()}
        className="inline-block px-6 py-3 rounded-md font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
        style={{ background: 'var(--church-green)' }}
      >
        Try again
      </button>
    </main>
  )
}
