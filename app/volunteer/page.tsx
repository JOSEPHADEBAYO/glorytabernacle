import Image from 'next/image'
import Link from 'next/link'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { Users, Target } from 'lucide-react'

export default function VolunteerPage() {
  return (
    <>
      <TopNavBar />

      {/* ── Hero ── */}
      <section
        className="relative w-full overflow-hidden flex items-center"
        style={{ minHeight: '50vh' }}
      >
        <Image
          src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1920&auto=format&fit=crop&q=80"
          alt="Volunteers serving together"
          fill
          className="object-cover object-center"
          loading="eager"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0, 6, 102, 0.68)', backdropFilter: 'blur(1px)', WebkitBackdropFilter: 'blur(1px)' }}
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-[var(--container-max)] mx-auto px-6 md:px-16 py-16 md:py-24">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-5">
            <span className="block w-px h-5 bg-white/50" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              Service &amp; Stewardship
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-2xl mb-5">
            The Strength of Our<br />Walls is Our People.
          </h1>

          {/* Subtext */}
          <p className="text-sm md:text-base text-white/65 leading-relaxed max-w-md mb-8">
            Join a legacy of service. At RCCG Glory Tabernacle, Barnstaple, we believe that every hand extended is a reflection of the light that we carry.
          </p>

          {/* CTA */}
          <Link
            href="/volunteer-interest"
            className="inline-flex items-center justify-center px-7 py-3 rounded-lg font-bold text-white text-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ backgroundColor: 'var(--church-green)' }}
          >
            Volunteer Now
          </Link>
        </div>
      </section>

      {/* ── Why Volunteer? ── */}
      <section className="bg-white py-[var(--section-padding-y)] px-6 md:px-16">
        <div className="max-w-[var(--container-max)] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left: text */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3" style={{ color: 'rgba(27,34,119,1)' }}>
                Why Volunteer?
              </h2>
              {/* Green underline accent */}
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--church-green)' }} aria-hidden="true" />
            </div>

            <p className="text-sm md:text-base text-gray-500 leading-relaxed">
              At RCCG Glory Tabernacle, Barnstaple, volunteering is more than serving—it is becoming part of God’s purpose. We believe God does not only use people to serve His purposes, He also makes them transgenerational blessings. If God can use you, He can bless you. Through serving, people are FURNISHED for good works, TRANSFORMED in character and purpose, and empowered to INFLUENCE their world for Jesus Christ. Whatever your gift or experience is, there is a place for you to grow, belong, and make kingdom impact
            </p>

            {/* Benefit bullets */}
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <div
                  className="flex-none w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(163,246,156,0.25)' }}
                >
                  <Users className="size-4" style={{ color: 'var(--church-green)' }} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-0.5" style={{ color: 'rgba(27,34,119,1)' }}>Find Your Family</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Forge bonds with those who share your values and vision for the city.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className="flex-none w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(163,246,156,0.25)' }}
                >
                  <Target className="size-4" style={{ color: 'var(--church-green)' }} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-0.5" style={{ color: 'rgba(27,34,119,1)' }}>Cultivate Purpose</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Discover how your unique talents can solve real-world needs in our congregation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: two stacked images */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden aspect-square relative col-span-2 sm:col-span-1">
              <Image
                src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&auto=format&fit=crop&q=80"
                alt="Service team"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 25vw"
              />
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-black/40">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Service</span>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-square relative col-span-2 sm:col-span-1">
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80"
                alt="Team coordination"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 25vw"
              />
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-black/40">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Team Coordination</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Step into Service ── */}
      <section
        id="step-into-service"
        className="py-[var(--section-padding-y)] px-6 md:px-16"
        style={{ backgroundColor: 'rgba(248,250,252,1)' }}
      >
        <div className="max-w-[var(--container-max)] mx-auto">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-8 md:px-14 py-10 md:py-14">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

              {/* Left */}
              <div className="flex flex-col gap-4 max-w-xl">
                <div>
                  <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3" style={{ color: 'rgba(27,34,119,1)' }}>
                    Step into Service
                  </h2>
                  <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--church-green)' }} aria-hidden="true" />
                </div>
                <p className="text-sm md:text-base text-gray-500 leading-relaxed">
                  Your dedication is the cornerstone of our community. Every role, no matter how small it may seem, builds up the monolith of our shared faith. Join a team where your unique gifts make an eternal impact.
                </p>
              </div>

              {/* Right: CTA */}
              <div className="flex-none">
                <Link
                  href="/volunteer-interest"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-bold text-white text-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ backgroundColor: 'var(--church-green)' }}
                >
                  Volunteer Now
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer
        logo={{ src: '/logo.png', alt: 'RCCG Glory Tabernacle, Barnstaple' }}
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
          { platform: 'instagram', href: 'https://www.instagram.com/glorytabernaclebarnstaple?igsh=MWkxaTF0Yjd1czk3Mg%3D%3D&utm_source=qr' },
          { platform: 'youtube', href: 'https://www.youtube.com/@glorytabernaclehq' },
          { platform: 'facebook', href: 'https://www.facebook.com/share/1CDurcWmxG/?mibextid=wwXIfr' },
          { platform: 'x', href: 'https://x.com/rccggthq' },
          { platform: 'tiktok', href: 'https://www.tiktok.com/@rccgglorytabernaclebarns?_r=1&_t=ZN-965RffiNMP8X' },
        ]}
        contactInfo={{
          address: 'North Devon College, Old Sticklepath Hill Barnstaple EX31 2BQ England',
          phone: '+1 (555) 123-4567',
          email: 'info@rccgglory.org',
          directionsHref: 'https://maps.google.com',
        }}
        copyrightText={`© ${new Date().getFullYear()} RCCG Glory Tabernacle, Barnstaple. All rights reserved.`}
      />
    </>
  )
}
