import Image from 'next/image'
import Link from 'next/link'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { NewsletterForm } from '@/components/church/newsletter-form'
import { Play, Search, Clock, Filter } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURED = {
  id: 'feat-1',
  title: 'The Unshakeable Kingdom',
  series: 'Kingdom Living',
  speaker: 'Pastor E.A Adebayo',
  date: 'May 18, 2025',
  duration: '54 min',
  description: 'In a world of constant change and uncertainty, discover the unshakeable foundation of God\'s Kingdom and how to build your life upon it with confidence and faith.',
  thumbnail: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=900&auto=format&fit=crop&q=80',
  videoHref: '#',
}

const SERMONS = [
  { id: 's1', title: 'Walking in Light', series: 'Holiness', speaker: 'Pastor E.A Adebayo', date: 'May 11, 2025', duration: '48 min', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', videoHref: '#' },
  { id: 's2', title: 'The Cost of Grace', series: 'Grace & Truth', speaker: 'Pastor Bukola Adebayo', date: 'May 4, 2025', duration: '42 min', thumbnail: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&auto=format&fit=crop&q=80', videoHref: '#' },
  { id: 's3', title: 'Silence & Solitude', series: 'Spiritual Disciplines', speaker: 'Pastor Segun Segun', date: 'Apr 27, 2025', duration: '38 min', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=80', videoHref: '#' },
  { id: 's4', title: 'The City on a Hill', series: 'Kingdom Living', speaker: 'Pastor E.A Adebayo', date: 'Apr 20, 2025', duration: '51 min', thumbnail: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80', videoHref: '#' },
  { id: 's5', title: 'Radical Welcome', series: 'Community', speaker: 'Pastor Bukola Adebayo', date: 'Apr 13, 2025', duration: '44 min', thumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80', videoHref: '#' },
  { id: 's6', title: 'The Narrow Gate', series: 'Discipleship', speaker: 'Pastor Segun Segun', date: 'Apr 6, 2025', duration: '39 min', thumbnail: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80', videoHref: '#' },
]

const TABS = ['All Media', 'Series', 'Topic', 'Speakers', 'Podcast']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SermonsPage() {
  return (
    <>
      <TopNavBar />

      {/* ── Hero ── */}
      <section
        className="relative w-full overflow-hidden flex items-center"
        style={{ minHeight: '42vh' }}
      >
        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1920&auto=format&fit=crop&q=80"
          alt="Church interior"
          fill
          className="object-cover object-center"
          loading="eager"
          sizes="100vw"
        />
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(0, 6, 102, 0.72)',
            backdropFilter: 'blur(1px)',
            WebkitBackdropFilter: 'blur(1px)',
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-[var(--container-max)] mx-auto px-6 md:px-16 py-16 md:py-20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">

            {/* Left */}
            <div className="flex flex-col gap-4 max-w-lg">
              {/* Eyebrow with vertical line */}
              <div className="flex items-center gap-3">
                <span className="block w-px h-5 bg-white/50" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  The Library
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                <span className="text-white">Words that</span>
                <br />
                <span style={{ color: 'var(--church-light-green)' }}>Resonate.</span>
              </h1>

              {/* Subtext */}
              <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-sm">
                Explore our collection of sermons, teachings, and media.<br />
                Find the wisdom you need for your journey of faith.
              </p>
            </div>

            {/* Right: frosted glass search card */}
            <div
              className="flex-none w-full md:w-80 rounded-2xl p-5 flex flex-col gap-4"
              style={{
                background: 'rgba(27, 34, 119, 0.45)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search scripture or topic..."
                  className="w-full rounded-lg bg-white/10 border border-white/15 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Latest / Popular buttons */}
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-white text-gray-800 hover:bg-white/90 transition-colors">
                  Latest
                </button>
                <button className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white/80 bg-transparent hover:bg-white/10 transition-colors">
                  Popular
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Filter tabs ── */}
      <section className="bg-white border-b border-gray-100 px-6 md:px-16 sticky top-16 z-40">
        <div className="max-w-[var(--container-max)] mx-auto flex items-center justify-between">
          <div className="flex overflow-x-auto">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                className={`flex-none px-4 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  i === 0
                    ? 'border-[var(--church-green)] text-[var(--church-green)]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="flex-none flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-800 transition-colors ml-4">
            <Filter className="size-3.5" aria-hidden="true" />
            Filter
          </button>
        </div>
      </section>

      {/* ── Featured sermon ── */}
      <section className="bg-white py-10 px-6 md:px-16">
        <div className="max-w-[var(--container-max)] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            {/* Image */}
            <div className="relative aspect-video md:aspect-auto md:min-h-[420px]">
              <Image
                src={FEATURED.thumbnail}
                alt={FEATURED.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-black/30 flex items-end p-5">
                <a
                  href={FEATURED.videoHref}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold hover:bg-white/30 transition-colors"
                >
                  <Play className="size-4 fill-white" aria-hidden="true" />
                  Watch Latest Message
                </a>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center gap-4 p-6 md:p-8 bg-white">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest text-white" style={{ backgroundColor: 'var(--church-green)' }}>
                  Featured
                </span>
                <span className="text-xs text-gray-400">Series: {FEATURED.series}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold leading-tight" style={{ color: 'rgba(27,34,119,1)' }}>
                {FEATURED.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">{FEATURED.description}</p>
              <div className="flex flex-col gap-1 text-xs text-gray-400">
                <span className="font-semibold text-gray-600">{FEATURED.speaker}</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" aria-hidden="true" />
                  {FEATURED.duration} &bull; {FEATURED.date}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sermon grid ── */}
      <section className="bg-white pb-12 px-6 md:px-16">
        <div className="max-w-[var(--container-max)] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERMONS.map((sermon) => (
              <a
                key={sermon.id}
                href={sermon.videoHref}
                className="group flex flex-col rounded-2xl overflow-hidden border border-gray-100 bg-white transition-all duration-300 ease-in-out hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-8px_rgba(27,34,119,0.15)]"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={sermon.thumbnail}
                    alt={sermon.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="size-5 fill-white text-white" aria-hidden="true" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold">
                    {sermon.duration}
                  </span>
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1.5 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--church-green)' }}>
                    {sermon.series}
                  </span>
                  <h3 className="text-sm font-bold leading-snug" style={{ color: 'rgba(27,34,119,1)' }}>
                    {sermon.title}
                  </h3>
                  <p className="text-xs text-gray-400">{sermon.speaker} &bull; {sermon.date}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-10">
            {['‹', '1', '2', '3', '›'].map((p, i) => (
              <button
                key={i}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  p === '1'
                    ? 'text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                style={p === '1' ? { backgroundColor: 'rgba(27,34,119,1)' } : {}}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter CTA ── */}
      <section className="py-10 px-6 md:px-16" style={{ backgroundColor: 'rgba(248,250,252,1)' }}>
        <div className="max-w-[var(--container-max)] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight" style={{ color: 'rgba(27,34,119,1)' }}>
              Never Miss a Moment.
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
              Subscribe to our weekly newsletter for liturgical readings, upcoming events, and stories of transformation from our community.
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
        logo={{ src: '/logo.png', alt: 'RCCG Glory Tabernacle' }}
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
          address: '123 Church Street, City, State 12345',
          phone: '+1 (555) 123-4567',
          email: 'info@rccgglory.org',
          directionsHref: 'https://maps.google.com',
        }}
        copyrightText={`© ${new Date().getFullYear()} RCCG Glory Tabernacle. All rights reserved.`}
      />
    </>
  )
}
