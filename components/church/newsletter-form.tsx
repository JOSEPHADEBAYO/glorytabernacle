'use client'

export function NewsletterForm() {
  return (
    <form
      className="flex flex-col sm:flex-row gap-3"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="Your email address"
        className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[var(--church-green)] transition-colors"
      />
      <button
        type="submit"
        className="px-6 py-3 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: 'var(--church-green)' }}
      >
        Subscribe
      </button>
    </form>
  )
}
