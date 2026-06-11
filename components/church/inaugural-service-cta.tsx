import Link from 'next/link'
import { Calendar, Sparkles, ArrowRight, MapPin } from 'lucide-react'
import {
  INAUGURAL_THEME,
  INAUGURAL_SERVICE_TIME,
  INAUGURAL_SERVICE_VENUE,
} from '@/lib/types/inaugural-registration'

/**
 * Eye-catching CTA banner on the homepage pointing to the inaugural-service
 * registration page. Designed to feel distinct from the other homepage
 * sections — deep navy gradient, light-green eyebrow, ample white-space — so
 * it reads as a "special event" rather than just another card.
 */
export function InauguralServiceCta() {
  return (
    <section
      aria-labelledby="inaugural-cta-heading"
      className="relative overflow-hidden bg-[#000666] px-[var(--section-padding-x)] py-16 md:py-20"
    >
      {/* Soft glowing accent in the corner so the navy doesn't feel flat. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(163,246,156,0.5) 0%, rgba(0,6,102,0) 70%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(0,6,102,0) 70%)' }}
      />

      <div className="relative mx-auto grid max-w-[var(--container-max)] grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto] md:gap-12">
        <div className="text-white">
          {/* <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[rgba(163,246,156,1)] backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Glory Ahead
          </div> */}

          <h2
            id="inaugural-cta-heading"
            className="mt-5 text-3xl uppercase font-extrabold leading-tight md:text-5xl"
          >
            Inaugural Service
          </h2>

          <p className="mt-3 font-serif text-lg italic text-white/90 md:text-xl">
            Theme: <span className="font-bold not-italic uppercase tracking-wider ">{INAUGURAL_THEME.title}</span> · {INAUGURAL_THEME.scripture}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-white/80 md:text-base">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Sunday, 19 July 2026 · {INAUGURAL_SERVICE_TIME}
            </span>
            <span className="inline-flex items-center gap-2 text-white/70">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {INAUGURAL_SERVICE_VENUE.name}, {INAUGURAL_SERVICE_VENUE.address}
            </span>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
            Save your seat for the inaugural service of RCCG Glory Tabernacle, Barnstaple. Register in a minute and we&apos;ll have a personal printed badge waiting for you at the door.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <Link
            href="/inaugural-service/register"
            className="group inline-flex items-center gap-2 rounded-lg bg-[#1b6d24] px-7 py-4 text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_12px_32px_-12px_rgba(27,109,36,0.8)] transition-all hover:gap-3 hover:bg-[#155a1d] hover:shadow-[0_16px_40px_-12px_rgba(27,109,36,0.9)]"
          >
            Register Now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/40">
            Takes under a minute
          </p>
        </div>
      </div>
    </section>
  )
}
