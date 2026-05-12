import Image from 'next/image'
import Link from 'next/link'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { NewsletterForm } from '@/components/church/newsletter-form'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { prisma } from '@/lib/prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicEvent {
  id: string
  title: string
  description: string
  date: Date
  time: string | null
  location: string | null
  imageSrc: string | null
  imageAlt: string | null
  registrationHref: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FALLBACK_FEATURED_IMAGE =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&auto=format&fit=crop&q=80'

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Server-fetch upcoming published events ordered by date ascending.
 * Returns an empty array on DB error so the page can still render its hero
 * and newsletter section gracefully.
 */
async function loadUpcomingEvents(): Promise<PublicEvent[]> {
  try {
    return await prisma.event.findMany({
      where: {
        published: true,
        date: { gte: new Date() },
      },
      orderBy: { date: 'asc' },
    })
  } catch (err) {
    console.error('Error loading public events:', err)
    return []
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EventsPage() {
  const events = await loadUpcomingEvents()
  const featured = events[0] ?? null
  const sideEvent = events[1] ?? null
  const gridEvents = events.slice(2)

  return (
    <>
      <TopNavBar />

      {/* ── Hero ── */}
      <section
        className="relative w-full overflow-hidden flex items-center"
        style={{ minHeight: '42vh' }}
      >
        <Image
          src="https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1920&auto=format&fit=crop&q=80"
          alt="Church interior"
          fill
          className="object-cover object-center"
          loading="eager"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(0, 6, 102, 0.72)',
            backdropFilter: 'blur(1px)',
            WebkitBackdropFilter: 'blur(1px)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-[var(--container-max)] mx-auto px-6 md:px-16 py-16 md:py-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="block w-px h-5 bg-white/50" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              Calendar of Events
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4 max-w-xl">
            The Gathering.
          </h1>
          <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-md">
            Discover moments of worship, community, and celebration.
            <br />
            Find your place in our upcoming rhythms.
          </p>
        </div>
      </section>

      {/* ── Upcoming Gatherings ── */}
      <section className="bg-white py-12 px-6 md:px-16">
        <div className="max-w-[var(--container-max)] mx-auto">
          <h2
            className="text-2xl font-extrabold mb-8"
            style={{ color: 'rgba(27,34,119,1)' }}
          >
            Upcoming Gatherings
          </h2>

          {events.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">
                No upcoming events at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <>
              {/* Asymmetric featured row — adapts to how many events we have */}
              <div
                className={`grid grid-cols-1 gap-5 mb-10 ${
                  sideEvent
                    ? 'md:grid-cols-[2fr_2fr_1.5fr]'
                    : featured?.imageSrc
                    ? 'md:grid-cols-[2fr_2fr]'
                    : 'md:grid-cols-1'
                }`}
              >
                {/* Large image (only if featured exists) */}
                {featured && (
                  <div className="rounded-2xl overflow-hidden aspect-[4/5] md:aspect-auto relative">
                    <Image
                      src={featured.imageSrc ?? FALLBACK_FEATURED_IMAGE}
                      alt={featured.imageAlt ?? featured.title}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                )}

                {/* Featured event card */}
                {featured && (
                  <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <span
                      className="self-start px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white"
                      style={{ backgroundColor: 'var(--church-green)' }}
                    >
                      Featured Event
                    </span>
                    <h3
                      className="text-2xl font-extrabold leading-tight"
                      style={{ color: 'rgba(27,34,119,1)' }}
                    >
                      {featured.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {featured.description}
                    </p>
                    <div className="flex flex-col gap-2 text-xs text-gray-500 mt-auto">
                      <span className="flex items-center gap-2">
                        <Calendar
                          className="size-3.5 flex-none"
                          style={{ color: 'var(--church-green)' }}
                          aria-hidden="true"
                        />
                        {formatLongDate(featured.date)}
                      </span>
                      {featured.time && (
                        <span className="flex items-center gap-2">
                          <Clock
                            className="size-3.5 flex-none"
                            style={{ color: 'var(--church-green)' }}
                            aria-hidden="true"
                          />
                          {featured.time}
                        </span>
                      )}
                      {featured.location && (
                        <span className="flex items-center gap-2">
                          <MapPin
                            className="size-3.5 flex-none"
                            style={{ color: 'var(--church-green)' }}
                            aria-hidden="true"
                          />
                          {featured.location}
                        </span>
                      )}
                    </div>
                    {featured.registrationHref && (
                      <Link
                        href={featured.registrationHref}
                        className="mt-2 inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: 'rgba(27,34,119,1)' }}
                      >
                        Register
                      </Link>
                    )}
                  </div>
                )}

                {/* Side event card */}
                {sideEvent && (
                  <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <h3
                      className="text-base font-bold"
                      style={{ color: 'rgba(27,34,119,1)' }}
                    >
                      {sideEvent.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {sideEvent.description}
                    </p>
                    <div className="flex flex-col gap-1.5 mt-auto">
                      <span className="flex items-center gap-2 text-xs text-gray-500">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-none"
                          style={{ backgroundColor: 'var(--church-green)' }}
                          aria-hidden="true"
                        />
                        {formatLongDate(sideEvent.date)}
                      </span>
                      {sideEvent.time && (
                        <span className="flex items-center gap-2 text-xs text-gray-500">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-none"
                            style={{ backgroundColor: 'var(--church-green)' }}
                            aria-hidden="true"
                          />
                          {sideEvent.time}
                        </span>
                      )}
                      {sideEvent.location && (
                        <span className="flex items-center gap-2 text-xs text-gray-500">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-none"
                            style={{ backgroundColor: 'var(--church-green)' }}
                            aria-hidden="true"
                          />
                          Location: {sideEvent.location}
                        </span>
                      )}
                    </div>
                    {sideEvent.registrationHref && (
                      <Link
                        href={sideEvent.registrationHref}
                        className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold border-2 transition-colors hover:bg-gray-100"
                        style={{
                          borderColor: 'rgba(27,34,119,1)',
                          color: 'rgba(27,34,119,1)',
                        }}
                      >
                        Register
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* 3-column grid of remaining events */}
              {gridEvents.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {gridEvents.map((event) => (
                    <div
                      key={event.id}
                      className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5
                        transition-all duration-300 ease-in-out
                        hover:scale-[1.02] hover:-translate-y-0.5
                        hover:shadow-[0_16px_32px_-8px_rgba(27,34,119,0.12)]"
                    >
                      <div
                        className="w-8 h-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--church-green)' }}
                        aria-hidden="true"
                      />
                      <h3
                        className="text-base font-bold"
                        style={{ color: 'rgba(27,34,119,1)' }}
                      >
                        {event.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed flex-1">
                        {event.description}
                      </p>
                      <div className="flex flex-col gap-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3 flex-none" aria-hidden="true" />
                          {formatLongDate(event.date)}
                        </span>
                        {event.time && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3 flex-none" aria-hidden="true" />
                            {event.time}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-3 flex-none" aria-hidden="true" />
                            {event.location}
                          </span>
                        )}
                      </div>
                      {event.registrationHref && (
                        <Link
                          href={event.registrationHref}
                          className="mt-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold border transition-colors hover:bg-gray-50"
                          style={{
                            borderColor: 'rgba(232,232,232,1)',
                            color: 'rgba(27,34,119,1)',
                          }}
                        >
                          Register
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Newsletter CTA ── */}
      <section
        className="py-10 px-6 md:px-16"
        style={{ backgroundColor: 'rgba(248,250,252,1)' }}
      >
        <div className="max-w-[var(--container-max)] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-4">
            <h2
              className="text-2xl md:text-3xl font-extrabold leading-tight"
              style={{ color: 'rgba(27,34,119,1)' }}
            >
              Never Miss a Moment.
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
              Subscribe to our weekly newsletter for liturgical readings, upcoming
              events, and stories of transformation from our community.
            </p>
            <NewsletterForm />
          </div>
          <div className="rounded-2xl overflow-hidden aspect-[16/7] relative">
            <Image
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80"
              alt="Community gathering"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer
        logo={{ src: '/logo-with-no-bg.png', alt: 'RCCG Glory Tabernacle' }}
        tagline="Furnish  ·  Transform  ·  Influence"
        columns={[
          {
            heading: 'Quick Links',
            links: [
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Media', href: '/sermons' },
              { label: 'Volunteer', href: '/volunteer' },
              { label: 'Connect', href: '/connect' },
            ],
          },
          {
            heading: 'Contact',
            links: [
              { label: 'Contact Us', href: '/contact' },
              { label: 'Small Groups', href: '/groups' },
              { label: 'Prayer Request', href: '/prayer' },
            ],
          },
        ]}
        socialLinks={[
          { platform: 'instagram', href: '#' },
          { platform: 'youtube', href: '#' },
          { platform: 'facebook', href: '#' },
          { platform: 'x', href: '#' },
          { platform: 'tiktok', href: '#' },
        ]}
        contactInfo={{
          address:
            'North Devon College, Old Sticklepath Hill Barnstaple EX31 2BQ England',
          phone: '+1 (555) 123-4567',
          email: 'info@rccgglory.org',
          directionsHref: 'https://maps.google.com',
        }}
        copyrightText={`© ${new Date().getFullYear()} RCCG Glory Tabernacle. All rights reserved.`}
      />
    </>
  )
}
