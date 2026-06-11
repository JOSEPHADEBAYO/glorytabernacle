import Image from 'next/image'
import { CalendarDays, Clock3, MapPin, Car } from 'lucide-react'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import {
  INAUGURAL_THEME,
  INAUGURAL_SERVICE_TIME,
  INAUGURAL_SERVICE_VENUE,
  INAUGURAL_SERVICE_DATE,
} from '@/lib/types/inaugural-registration'
import { InauguralRegisterForm } from './inaugural-register-form'

const FORMATTED_SERVICE_DATE = INAUGURAL_SERVICE_DATE.toLocaleDateString(
  'en-GB',
  {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
)

export const metadata = {
  title: 'Inaugural Service — Register | RCCG Glory Tabernacle, Barnstaple',
  description:
    'Register your place for the inaugural service of RCCG Glory Tabernacle, Barnstaple on 19 July 2026.',
}

export default function InauguralRegisterPage() {
  return (
    <>
      <TopNavBar />
      <main className="bg-[#f4f4f4]">
        <section className="relative flex min-h-[24rem] items-center overflow-hidden pt-16">
          <Image
            src="https://images.unsplash.com/photo-1778876089324-15f94de18275?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cGVudGVjb3N0YWwlMjBjaHJ1Y2glMjBpbmF1Z3VyYWwlMjBzZXJ2aWNlfGVufDB8fDB8fHww"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#000666]/82" />
          <div className="relative z-10 mx-auto w-full max-w-[var(--container-max)] px-[var(--section-padding-x)] py-16 text-white">
            {/* <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/70">
              Glory Ahead
            </p> */}
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
              INAUGURAL SERVICE
            </h1>
            <div className="mt-5 inline-flex items-baseline gap-3 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-sm">
              <span className="text-[0.7rem] font-bold tracking-[0.22em] text-[rgba(163,246,156,1)]">
                theme: 
              </span>
              <span className="font-serif text-lg font-bold uppercase text-white md:text-xl">
                {INAUGURAL_THEME.title}
              </span>
              <span className="text-xs italic text-white/70">
                {INAUGURAL_THEME.scripture}
              </span>
            </div>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80">
              Save your seat and pick up a personal printed badge at the door.
            </p>

            <div className="mt-6 grid max-w-4xl grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[rgba(163,246,156,1)]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-white/60">Date</p>
                  <p className="font-bold leading-tight text-white">{FORMATTED_SERVICE_DATE}</p>
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
          </div>
        </section>

        <section className="px-[var(--section-padding-x)] py-16">
          <InauguralRegisterForm />
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
