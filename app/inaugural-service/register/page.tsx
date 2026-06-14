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
        <section className="bg-[#000666] pb-12 pt-20 md:pt-24">
          <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--section-padding-x)]">
            {/* The programme poster carries the title (INAUGURAL SERVICE),
                theme (GLORY AHEAD · Haggai 2:9), date, and venue by design,
                so we display it cleanly with NO overlay and no duplicate
                text on top — the artwork is the hero. The tappable Date /
                Time / Venue / Parking cards live below for scannable info. */}
            <div className="overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              <Image
                src="https://res.cloudinary.com/deckwmsth/image/upload/v1781457692/WhatsApp_Image_2026-06-14_at_13.44.11_brtvwr.jpg"
                alt={`Inaugural Service — ${INAUGURAL_THEME.title} (${INAUGURAL_THEME.scripture}), ${FORMATTED_SERVICE_DATE} at ${INAUGURAL_SERVICE_TIME}, ${INAUGURAL_SERVICE_VENUE.name}`}
                width={1600}
                height={600}
                priority
                className="h-auto w-full"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
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
