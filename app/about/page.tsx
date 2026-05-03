import Image from 'next/image'
import Link from 'next/link'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'

// ─── Data ────────────────────────────────────────────────────────────────────

const DNA_VALUES = [
  { title: 'Relationship', body: 'Building authentic connections between God, people, and community through love and accountability.' },
  { title: 'Repentance', body: 'Embracing a lifestyle of turning toward God and away from all that separates us from His best.' },
  { title: 'Reconciliation', body: 'Restoring broken relationships — with God, with others, and within ourselves through Christ.' },
  { title: 'Redemption', body: 'Believing in the power of God to redeem every story, every season, and every soul.' },
  { title: 'Restoration', body: 'Seeing lives, families, and communities made whole through the healing power of the Gospel.' },
  { title: 'Revival', body: 'Pursuing a fresh outpouring of the Holy Spirit that transforms hearts and ignites the Church.' },
  { title: 'Righteousness', body: 'Walking in the standards of God\'s Word and reflecting His character in every area of life.' },
  { title: 'Relevance', body: 'Communicating timeless truth in ways that connect with and speak to our generation.' },
  { title: 'Reward', body: 'Living with an eternal perspective, knowing that faithfulness to God is never without its reward.' },
]

const PASTORS = [
  {
    id: 'p1',
    name: 'Pastor E.A Adebayo',
    title: 'Senior Pastor',
    bio: 'Pastor Adebayo has led RCCG Glory Tabernacle with vision and passion for over two decades, championing revival across the city.',
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
          src="https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1920&auto=format&fit=crop&q=80"
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
          <p className="mt-4 text-base md:text-lg text-white/70 max-w-xl leading-relaxed">
            A movement born from a passion for the lost, the broken, and the searching — rooted in the Word and empowered by the Spirit.
          </p>
        </div>
      </section>

      {/* ── Roots & Vision ── */}
      <section className="bg-white py-[var(--section-padding-y)] px-[var(--section-padding-x)]">
        <div className="max-w-[var(--container-max)] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left */}
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight" style={{ color: 'rgba(27, 34, 119, 1)' }}>
              Our Roots &amp; RCCG Vision
            </h2>
            <p className="text-sm md:text-base text-gray-500 leading-relaxed">
              We are a parish of the Redeemed Christian Church of God, one of the fastest-growing churches in the world. Our local expression carries the global mandate:
            </p>
            <ul className="flex flex-col gap-2">
              {[
                'To make heaven and to take as many people as possible with us.',
                'To have a member of RCCG in every family in all nations.',
                'To accomplish these through planting churches within five minutes of every person.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-500">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-none" style={{ backgroundColor: 'var(--church-green)' }} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            {/* Two icon cards */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              {[
                { icon: '🌱', title: 'Our Heritage', body: 'Founded on the principles of holiness, prayer, and evangelism that have defined RCCG for decades.' },
                { icon: '🎯', title: 'Our Strategy', body: 'Discipleship, community impact, and church planting — reaching every stratum of society with the Gospel.' },
              ].map((card) => (
                <div key={card.title} className="rounded-xl p-4 border border-gray-100 bg-gray-50 flex flex-col gap-2">
                  <span className="text-2xl">{card.icon}</span>
                  <h3 className="text-sm font-bold" style={{ color: 'rgba(27, 34, 119, 1)' }}>{card.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: image */}
          <div className="relative">
            <div
              className="rounded-2xl overflow-hidden bg-white"
              style={{ boxShadow: '0px 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            >
              <Image
                src="/fellowship.png"
                alt="RCCG Glory Tabernacle building"
                width={600}
                height={500}
                className="object-cover w-full h-auto"
                style={{ filter: 'grayscale(20%) brightness(0.95)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Our DNA ── */}
      <section className="py-[var(--section-padding-y)] px-[var(--section-padding-x)]" style={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}>
        <div className="max-w-[var(--container-max)] mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--church-green)' }}>
              A Reflection of Our Faith
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold" style={{ color: 'rgba(27, 34, 119, 1)' }}>
              Our DNA
            </h2>
          </div>

          {/* 3-col grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DNA_VALUES.map((val) => (
              <div
                key={val.title}
                className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-6 cursor-default
                  transition-all duration-300 ease-in-out
                  hover:scale-[1.04] hover:-translate-y-1
                  hover:shadow-[0_20px_40px_-8px_rgba(27,34,119,0.15)]
                  hover:border-[rgba(27,34,119,0.15)]"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-extrabold flex-none
                    transition-colors duration-300 group-hover:bg-[rgba(27,34,119,1)]"
                  style={{ backgroundColor: 'var(--church-green)' }}
                >
                  {val.title[0]}
                </div>
                <h3
                  className="text-base font-bold transition-colors duration-300"
                  style={{ color: 'rgba(27, 34, 119, 1)' }}
                >
                  {val.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{val.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                href="/giving"
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
