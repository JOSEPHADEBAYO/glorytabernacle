import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  INAUGURAL_THEME,
  INAUGURAL_SERVICE_TIME,
  INAUGURAL_SERVICE_VENUE,
} from '@/lib/types/inaugural-registration'

/**
 * Eye-catching CTA banner on the homepage pointing to the inaugural-service
 * registration page. The programme poster (Cloudinary) is the visual hero —
 * it already carries the event title, theme, date, and venue by design, so
 * the right-hand column just drives the action: short copy + Register CTA.
 *
 * Layout: 7/5 split (image / action) on md+, stacked on mobile.
 */
export function InauguralServiceCta() {
  return (
    <section
      aria-labelledby="inaugural-cta-heading"
      className="relative overflow-hidden bg-[#000666] px-[var(--section-padding-x)] py-16 md:py-20"
    >
      {/* Soft glowing accents so the navy doesn't feel flat. */}
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

      <div className="relative mx-auto grid max-w-[var(--container-max)] grid-cols-1 items-center gap-8 md:grid-cols-[7fr_5fr] md:gap-12">
        {/* Left: programme poster, no overlay. Clicking it lands on
            /inaugural-service/register so the artwork itself is a CTA. */}
        <Link
          href="/inaugural-service/register"
          aria-label="Register for the Inaugural Service"
          className="block overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.4)] transition-transform hover:scale-[1.01]"
        >
          <Image
            src="https://res.cloudinary.com/deckwmsth/image/upload/v1782403597/Inaugural_Service_Thumbnail_okeluk.png"
            alt={`Inaugural Service — ${INAUGURAL_THEME.title} (${INAUGURAL_THEME.scripture}), Sunday 19 July 2026 at ${INAUGURAL_SERVICE_TIME}, ${INAUGURAL_SERVICE_VENUE.name}`}
            width={1600}
            height={600}
            className="h-auto w-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 58vw, 760px"
          />
        </Link>

        {/* Right: compact action column. Skips event title/theme/date —
            they're in the poster — and focuses on the ask. */}
        <div className="text-white">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[rgba(163,246,156,1)]">
            Mark your calendar
          </p>
          <h2
            id="inaugural-cta-heading"
            className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl"
          >
            Save your seat
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 md:text-base">
            Register in under a minute and we&apos;ll have a personal printed badge waiting for you at the door of our inaugural service.
          </p>
          <div className="mt-7 flex flex-col items-start gap-2">
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
      </div>
    </section>
  )
}
