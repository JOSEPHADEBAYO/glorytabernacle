import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      className="min-h-svh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--church-navy)' }}
    >
      <p
        className="text-sm font-semibold uppercase tracking-widest mb-4"
        style={{ color: 'var(--church-light-green)' }}
      >
        RCCG Glory Tabernacle
      </p>
      <h1
        className="text-8xl font-extrabold mb-4"
        style={{ color: 'var(--church-green)' }}
      >
        404
      </h1>
      <h2
        className="text-3xl font-bold mb-4"
        style={{ color: 'var(--church-light-green)' }}
      >
        Page Not Found
      </h2>
      <p className="max-w-md text-lg text-white/80 mb-10">
        We couldn&apos;t find the page you were looking for. It may have moved or no longer exists.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 rounded-md font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: 'var(--church-green)' }}
      >
        Back to Home
      </Link>
    </main>
  )
}
