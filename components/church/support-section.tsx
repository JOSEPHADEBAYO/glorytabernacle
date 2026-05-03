import Link from 'next/link'
import { Lock } from 'lucide-react'

interface SupportSectionProps {
  heading: string
  body: string
  primaryCta: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
}

export function SupportSection({
  heading,
  body,
  primaryCta,
}: SupportSectionProps) {
  return (
    <section className="w-full px-[var(--section-padding-x)] py-12 bg-white">
      <div
        className="relative overflow-hidden rounded-2xl w-full max-w-[var(--container-max)] mx-auto"
        style={{
          background: 'linear-gradient(to right, rgba(0, 6, 102, 1), rgba(26, 35, 126, 1))',
        }}
      >
        {/* Diagonal accent shape */}
        <div
          className="absolute top-0 right-0 w-1/2 h-full"
          style={{
            background: 'rgba(26, 35, 126, 0.6)',
            clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 px-8 md:px-14 py-12 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">

            {/* Left */}
            <div className="flex flex-col gap-4 max-w-xl">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                {heading}
              </h2>
              <p className="text-sm md:text-base text-white/70 leading-relaxed">
                {body}
              </p>
            </div>

            {/* Right */}
            <div className="flex flex-col items-start md:items-center gap-3 flex-none">
              <Link
                href={primaryCta.href}
                className="inline-flex items-center justify-center px-10 py-4 rounded-lg font-bold text-white text-base transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ backgroundColor: 'var(--church-green)' }}
              >
                {primaryCta.label}
              </Link>
              <div className="flex items-center gap-1.5">
                <Lock className="size-3 text-white/50" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                  Secure Encryption
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
