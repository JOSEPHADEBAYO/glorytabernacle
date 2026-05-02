import { User } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Single testimonial card
// ---------------------------------------------------------------------------

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
      {/* Large decorative quote mark */}
      <span
        className="absolute right-7 top-5 select-none text-7xl font-black leading-none opacity-15"
        style={{ color: 'var(--church-light-green)', fontFamily: 'Georgia, serif' }}
        aria-hidden="true"
      >
        &ldquo;
      </span>

      {/* Quote text */}
      <p className="relative z-10 text-base leading-8 text-white/85">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Divider */}
      <div
        className="h-px w-12"
        style={{ backgroundColor: 'var(--church-light-green)', opacity: 0.6 }}
        aria-hidden="true"
      />

      {/* Attribution */}
      <div className="flex items-center gap-4">
        {/* Avatar circle */}
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

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function TestimonialsSection({
  heading = 'Testimonials',
  subtext = 'Real stories from our community.',
  testimonials = DEFAULT_TESTIMONIALS,
}: TestimonialsSectionProps) {
  return (
    <section
      aria-label="Testimonials"
      className="relative w-full overflow-hidden py-14 px-[var(--section-padding-x)]"
      style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
    >
      {/* Radial glow — top centre */}
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

      {/* Diagonal stripe texture — right edge */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-64 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, white 0px, white 1px, transparent 1px, transparent 14px)',
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-max)]">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          {/* Accent line */}
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
      </div>
    </section>
  )
}
