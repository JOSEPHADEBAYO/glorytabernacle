'use client'

import { useState } from 'react'
import { User, X } from 'lucide-react'

interface Testimonial {
  quote: string
  name: string
  memberSince: string | number
}

interface TestimonialsSectionProps {
  heading?: string
  subtext?: string
  testimonials?: Testimonial[]
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'I came to Glory Tabernacle broken and unsure of my future. Through the Daughters of Zion ministry, I found my purpose and the strength to lead my family.',
    name: 'Sarah Johnson',
    memberSince: 2023,
  },
  {
    quote:
      "The Men of Valour has been a sanctuary for my soul. I've found a brotherhood that prays, supports, and grows together in Christ.",
    name: 'Micheal Adeyemi',
    memberSince: 2025,
  },
]

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div
      className="relative flex flex-col gap-4 rounded-2xl p-6"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span
        className="absolute right-7 top-5 select-none text-7xl font-black leading-none opacity-15"
        style={{ color: 'var(--church-light-green)', fontFamily: 'Georgia, serif' }}
        aria-hidden="true"
      >
        &ldquo;
      </span>

      <p className="relative z-10 text-base leading-8 text-white/85">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      <div
        className="h-px w-12"
        style={{ backgroundColor: 'var(--church-light-green)', opacity: 0.6 }}
        aria-hidden="true"
      />

      <div className="flex items-center gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
          }}
          aria-hidden="true"
        >
          <User className="h-5 w-5 text-white/70" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col gap-0.5">
          <span
            className="text-sm font-bold tracking-wide"
            style={{ color: 'var(--church-light-green)' }}
          >
            {testimonial.name}
          </span>
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.15em] text-white/40">
            Member Since {testimonial.memberSince}
          </span>
        </div>
      </div>
    </div>
  )
}

export function TestimonialsSection({
  heading = 'Testimonials',
  subtext = 'Real stories from our community.',
  testimonials = DEFAULT_TESTIMONIALS,
}: TestimonialsSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <section
      aria-label="Testimonials"
      className="relative w-full overflow-hidden py-12 px-[var(--section-padding-x)]"
      style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        aria-hidden="true"
        style={{
          width: '60%',
          height: '50%',
          background:
            'radial-gradient(ellipse at center top, rgba(163,246,156,0.08) 0%, transparent 70%)',
        }}
      />

      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-64 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, white 0px, white 1px, transparent 1px, transparent 14px)',
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-max)]">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div
            className="h-1 w-10 rounded-full"
            style={{ backgroundColor: 'var(--church-light-green)' }}
            aria-hidden="true"
          />
          <h2 className="text-3xl font-extrabold uppercase tracking-[0.18em] text-white md:text-4xl">
            {heading}
          </h2>
          <p className="text-sm text-white/50 tracking-wide">{subtext}</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} testimonial={t} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--church-green)' }}
          >
            Add Your Testimony
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <TestimonyFormModal
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {}}
        />
      )}
    </section>
  )
}

function TestimonyFormModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [quote, setQuote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/testimonials/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), quote: quote.trim() }),
      })

      if (res.ok) {
        setSubmitted(true)
        onSuccess()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200" style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}>
          <h2 className="text-lg font-bold text-white">Share Your Testimony</h2>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted && (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(27, 109, 36, 0.1)' }}>
              <svg className="w-7 h-7" style={{ color: 'rgb(27, 109, 36)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-900">Thank you!</p>
            <p className="text-sm text-gray-500">
              Your testimony has been submitted for review. It will appear on the website once approved.
            </p>
            <button
              type="button"
          onClick={() => { setSubmitted(false); onClose() }}
          className="mt-4 rounded-lg px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
            >
              Close
            </button>
          </div>
        )}

        {!submitted && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="test-name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <input
                id="test-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Johnson"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="test-quote" className="block text-sm font-medium text-gray-700 mb-1">
                Your Testimony *
              </label>
              <textarea
                id="test-quote"
                required
                rows={5}
                minLength={10}
                maxLength={2000}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Share what God has done in your life through Glory Tabernacle…"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-900"
              />
              <p className="mt-1 text-xs text-gray-400 text-right">{quote.length}/2000</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'rgba(27, 34, 119, 1)' }}
              >
                {isSubmitting ? 'Submitting…' : 'Submit Testimony'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
