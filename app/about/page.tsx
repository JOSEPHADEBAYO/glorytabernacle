import Image from 'next/image'
import Link from 'next/link'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { RootsVisionClient } from './roots-vision-client'
import { DNAClient } from './dna-client'

// ─── Data ────────────────────────────────────────────────────────────────────

const PASTORS = [
  {
    id: 'p1',
    name: 'Pastor E.A Adebayo',
    title: 'General Overseer, RCCG',
    bio: 'Pastor Adebayo has led RCCG worldwide with vision and passion for over 45 years, championing revival across the globe.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'p2',
    name: 'Pastor (Mrs.) Bukola Adebayo',
    title: 'Associate Pastor',
    bio: 'Pastor Bukola leads the women\'s ministry and discipleship programs, nurturing spiritual growth across all generations.',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'p3',
    name: 'Pastor Segun Segun',
    title: 'Youth & Young Adults Pastor',
    bio: 'Pastor Segun is passionate about raising the next generation of leaders who will impact their world for Christ.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      <TopNavBar />

      {/* ── Hero ── */}
      <section
        className="relative w-full overflow-hidden flex items-center"
        style={{ height: 'calc(100vh - 4rem)', minHeight: 360 }}
      >
        <Image
          src="/fellowship.png"
          alt="Church interior"
          fill
          className="object-cover object-center"
          loading="eager"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0, 6, 102, 0.65)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
          aria-hidden="true"
        />
        <div className="relative z-10 px-6 md:px-16 lg:px-24 max-w-[var(--container-max)] mx-auto w-full">
          <div
            className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm"
          >
            <span className="text-xs font-semibold tracking-[0.2em] text-white/90 uppercase">Our Story</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight max-w-2xl">
            The Glory<br />Tabernacle<br />Story.
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/70 max-w-5xl leading-relaxed">
            Every great move of God begins with a question.
Ours began with this one: What if a church could be more than a Sunday gathering? What if it could be a place where people don't just attend but are furnished unto every good work, transformed within and without, and sent out to Influence the world around them?
That question became a conviction, that conviction became a calling, and that calling became RCCG Glory Tabernacle - planted in the heart of Barnstaple, North Devon, with a mandate that stretches far beyond its walls.
We are a people in pursuit of God's presence, His purpose, and His glory. We believe that every person who walks through our doors carries a destiny too significant to be left unfinished. We believe that ordinary people, when they encounter an extraordinary God, become extraordinary themselves.
We build the Tabernacle God fills it with His Glory, because you are the TABERNACLE.
From our first gathering to where we stand today, one thing has never changed, our hunger for His presence. Because we have learned that when God's glory rests in a place, atmospheres shift, hearts are healed, and lives are never the same again.
This is not just our story. It is the beginning of yours.
You may have come broken. You will not leave broken. You may have come small. You cannot remain small. Nothing small is found in a Tabernacle.
Welcome home. Welcome to RCCG Glory Tabernacle.
          </p>
        </div>
      </section>

      {/* ── Roots & Vision ── */}
      <RootsVisionClient />

      {/* ── Our DNA ── */}
      <DNAClient />

      {/* ── Pastoral Leadership ── */}
      <section className="bg-white py-[var(--section-padding-y)] px-[var(--section-padding-x)]">
        <div className="max-w-[var(--container-max)] mx-auto">
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--church-green)' }}>
                Ordained By
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: 'rgba(27, 34, 119, 1)' }}>
                Pastoral Leadership
              </h2>
            </div>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              Our pastors are committed to serving with humility, integrity, and a deep love for God and people.
            </p>
          </div>

          {/* Pastor cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {PASTORS.map((pastor) => (
              <div
                key={pastor.id}
                className="group flex flex-col gap-4 rounded-2xl overflow-hidden border border-gray-100 bg-white
                  transition-all duration-300 ease-in-out
                  hover:scale-[1.03] hover:-translate-y-1
                  hover:shadow-[0_24px_48px_-8px_rgba(27,34,119,0.18)]
                  hover:border-[rgba(27,34,119,0.12)]"
              >
                <div className="overflow-hidden aspect-[4/5] relative">
                  <Image
                    src={pastor.image}
                    alt={pastor.name}
                    fill
                    className="object-cover object-top transition-transform duration-500 ease-in-out group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-col gap-1 px-5 pb-6">
                  <h3 className="text-base font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>{pastor.name}</h3>
                  <p className="text-xs font-semibold" style={{ color: 'var(--church-green)' }}>{pastor.title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed mt-1">{pastor.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="w-full px-[var(--section-padding-x)] py-[var(--section-padding-y)] bg-white">
        <div
          className="relative overflow-hidden rounded-2xl w-full max-w-[var(--container-max)] mx-auto px-8 md:px-14 py-12 md:py-16"
          style={{ background: 'linear-gradient(to right, rgba(0, 6, 102, 1), rgba(26, 35, 126, 1))' }}
        >
          {/* Diagonal accent */}
          <div
            className="absolute top-0 right-0 w-1/2 h-full"
            style={{ background: 'rgba(26, 35, 126, 0.6)', clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="flex flex-col gap-3 max-w-lg">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                Ready to find your place in the story?
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                We would love to walk alongside you. Join us at RCCG Glory Tabernacle and discover where you belong.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-none">
              <Link
                href="https://www.google.com/maps/place/51.072269,-4.069444"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--church-green)' }}
              >
                Get Directions
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-bold text-white border-2 border-white/40 bg-transparent transition-colors hover:bg-white/10"
              >
                Contact Us
              </Link>
            </div>
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
          address: 'North Devon College, Old Sticklepath Hill Barnstaple EX31 2BQ England',
          phone: '+447478137599',
          email: 'admin@glorytabernacle.co.uk',
          directionsHref: 'https://www.google.com/maps/place/51.072269,-4.069444',
        }}
        copyrightText={`© ${new Date().getFullYear()} RCCG Glory Tabernacle. All rights reserved.`}
      />
    </>
  )
}
