import Image from 'next/image'
import Link from 'next/link'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { prisma } from '@/lib/prisma'
import {
  formatBadgeId,
  parseBadgeId,
  INAUGURAL_SERVICE_DATE,
  INAUGURAL_THEME,
  INAUGURAL_SERVICE_TIME,
  INAUGURAL_SERVICE_VENUE,
} from '@/lib/types/inaugural-registration'
import { Sparkles, CalendarDays, Clock3, MapPin, Car } from 'lucide-react'

export const metadata = {
  title: 'Inaugural Service — Programme | RCCG Glory Tabernacle, Barnstaple',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ id?: string }>
}

/**
 * Programme landing page hit when a badge's QR code is scanned. Today it's
 * a placeholder — verifies the registration ID exists, welcomes the
 * registrant by name, and tells them the schedule is coming soon. The real
 * schedule + booklet UI will replace the placeholder content below without
 * needing changes to the badge or the URL pattern.
 */
export default async function ProgrammePage({ searchParams }: PageProps) {
  const { id } = await searchParams
  const eventDate = INAUGURAL_SERVICE_DATE.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  let registrant:
    | { firstName: string; serialNumber: number; publicCode: string | null }
    | null = null
  let parsedId: string | null = null
  if (id) {
    const parsed = parseBadgeId(id)
    if (parsed) {
      try {
        // Prefer the new random publicCode column. Fall back to the legacy
        // serialNumber lookup so badges issued before randomisation still
        // resolve to the correct registrant.
        registrant = await prisma.inauguralRegistration.findUnique({
          where: { publicCode: parsed.code },
          select: { firstName: true, serialNumber: true, publicCode: true },
        })
        if (!registrant) {
          registrant = await prisma.inauguralRegistration.findUnique({
            where: { serialNumber: parsed.serial },
            select: { firstName: true, serialNumber: true, publicCode: true },
          })
        }
        if (registrant) parsedId = formatBadgeId(registrant)
      } catch (err) {
        console.error('Programme page: registrant lookup failed', err)
      }
    }
  }

  return (
    <>
      <TopNavBar />
      <main className="bg-[#f4f4f4]">
        <section className="relative flex min-h-[28rem] items-center overflow-hidden pt-16">
          <Image
            src="https://images.unsplash.com/photo-1778876089324-15f94de18275?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cGVudGVjb3N0YWwlMjBjaHJ1Y2glMjBpbmF1Z3VyYWwlMjBzZXJ2aWNlfGVufDB8fDB8fHww"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#000666]/85" />
          <div className="relative z-10 mx-auto w-full max-w-[var(--container-max)] px-[var(--section-padding-x)] py-16 text-center text-white">
            <h1 className="mb-4 text-lg font-bold uppercase tracking-[0.22em] text-[rgba(163,246,156,1)]">
              Inaugural Service · Programme
            </h1>
            <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
              {registrant ? `Welcome, ${registrant.firstName}` : 'Welcome'}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl font-serif text-lg italic text-white/90 md:text-2xl">
              Theme: <span className="font-bold not-italic">{INAUGURAL_THEME.title}</span> · {INAUGURAL_THEME.scripture}
            </p>
            <div className="mx-auto mt-6 grid max-w-4xl grid-cols-1 gap-3 text-left text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[rgba(163,246,156,1)]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-white/60">Date</p>
                  <p className="font-bold leading-tight text-white">{eventDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[rgba(163,246,156,1)]" aria-hidden="true" />
                <div>
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-white/60">Starts</p>
                  <p className="font-bold text-white">{INAUGURAL_SERVICE_TIME}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[rgba(163,246,156,1)]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-white/60">Venue</p>
                  <p className="font-bold leading-tight text-white">{INAUGURAL_SERVICE_VENUE.name}</p>
                  <p className="text-xs leading-tight text-white/70">{INAUGURAL_SERVICE_VENUE.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <Car className="mt-0.5 h-4 w-4 shrink-0 text-[rgba(163,246,156,1)]" aria-hidden="true" />
                <div>
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-white/60">Parking</p>
                  <p className="text-xs leading-relaxed text-white/85">{INAUGURAL_SERVICE_VENUE.parkingNotes}</p>
                </div>
              </div>
            </div>
            {parsedId && (
              <p className="mt-4 inline-block rounded-full border border-white/30 px-4 py-1.5 font-mono text-sm tracking-wider text-white/90">
                {parsedId}
              </p>
            )}
          </div>
        </section>

        <section className="px-[var(--section-padding-x)] py-16">
          <div className="mx-auto max-w-3xl rounded-2xl bg-white px-6 py-12 text-center shadow-[0_18px_50px_rgba(0,6,102,0.08)] md:px-10">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#1b6d24]/10">
              <Sparkles className="h-7 w-7 text-[#1b6d24]" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1b6d24]">
              Programme coming soon
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-[#000666] md:text-4xl">
              We&apos;re finalising the order of service
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-600 md:text-base">
              {registrant
                ? `Thank you for registering, ${registrant.firstName}. The full schedule and programme booklet will appear here ahead of the service. Save this page or scan your badge again any time — it&apos;ll update automatically.`
                : 'The full schedule and programme booklet will appear here ahead of the service. If you registered, scan the QR on your badge to come back and see your personal welcome page.'}
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#000666] underline-offset-4 hover:underline"
            >
              Back to homepage
            </Link>
          </div>
        </section>
      </main>
      <Footer
        logo={{ src: '/logo.png', alt: 'RCCG Glory Tabernacle, Barnstaple' }}
        tagline="Furnish  ·  Transform  ·  Influence"
        columns={[
          {
            heading: 'Quick Links',
            links: [
              { label: 'Home', href: '/' },
              { label: 'Events', href: '/events' },
              { label: 'Volunteer', href: '/volunteer' },
              { label: 'Contact', href: '/contact' },
            ],
          },
        ]}
        socialLinks={[
          { platform: 'instagram', href: 'https://www.instagram.com/glorytabernaclebarnstaple?igsh=MWkxaTF0Yjd1czk3Mg%3D%3D&utm_source=qr' },
          { platform: 'youtube', href: 'https://www.youtube.com/@glorytabernaclehq' },
          { platform: 'facebook', href: 'https://www.facebook.com/share/1CDurcWmxG/?mibextid=wwXIfr' },
          { platform: 'x', href: 'https://x.com/rccggthq' },
          { platform: 'tiktok', href: 'https://www.tiktok.com/@rccgglorytabernaclebarns?_r=1&_t=ZN-965RffiNMP8X' },
        ]}
        contactInfo={{
          address: 'North Devon College, Old Sticklepath Hill Barnstaple EX31 2BQ England',
          phone: '+447478137599',
          email: 'admin@glorytabernacle.co.uk',
          directionsHref: 'https://maps.google.com',
        }}
        copyrightText={`Copyright ${new Date().getFullYear()} RCCG Glory Tabernacle, Barnstaple. All rights reserved.`}
      />
    </>
  )
}
