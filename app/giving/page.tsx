import Link from 'next/link'

export default function GivingPage() {
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
        className="text-5xl font-bold mb-6"
        style={{ color: 'var(--church-light-green)' }}
      >
        Give
      </h1>
      <p className="max-w-md text-lg text-white/80 mb-10">
        Online giving is coming soon. Thank you for your generous heart and support of the vision.
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
