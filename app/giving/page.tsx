import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { Building2, Globe, CreditCard, Landmark, Smartphone, Users } from 'lucide-react'

export default function GivingPage() {
  return (
    <>
      <TopNavBar />

      {/* ── Hero ── */}
      <section
        className="relative w-full flex items-center"
        style={{
          background: 'linear-gradient(135deg, rgba(0,6,102,1) 0%, rgba(26,35,126,1) 50%, rgba(27,34,119,0.95) 100%)',
          minHeight: '45vh',
        }}
      >
        {/* Subtle watermark cross shape */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-[var(--container-max)] mx-auto px-6 md:px-16 py-16 md:py-24">
          <div className="flex items-center gap-3 mb-5">
            <span className="block w-px h-5 bg-white/50" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              Worship Through Giving
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-2xl mb-5">
            Generosity from the Heart
          </h1>
          <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-md">
            Your faithfulness fuels the monolith. Partner with us to<br className="hidden md:block" />
            build a legacy of hope and light in our community.
          </p>
        </div>
      </section>

      {/* ── Ways to Give ── */}
      <section className="bg-white py-[var(--section-padding-y)] px-6 md:px-16">
        <div className="max-w-[var(--container-max)] mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: 'rgba(27,34,119,1)' }}>
              Ways to Give
            </h2>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed">
              Secure, convenient, and direct methods to support the ministry. Choose the option that best fits your location and preference.
            </p>
          </div>

          {/* 3×2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* ── Bank Transfer UK ── */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(232,232,232,1)' }}>
                  <Building2 className="size-4 text-gray-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'rgba(27,34,119,1)' }}>Bank Transfer (UK)</h3>
                  <p className="text-[11px] text-gray-400">Direct Deposit</p>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 overflow-hidden text-xs">
                {[
                  { label: 'Name', value: 'Calvary Place', highlight: true },
                  { label: 'Bank', value: 'Wise', highlight: false },
                  { label: 'Sort Code', value: '23-94-64', highlight: false },
                  { label: 'Account', value: '75345144', highlight: false },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between px-3 py-2 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <span className="text-gray-400">{row.label}</span>
                    <span className={`font-semibold ${row.highlight ? '' : 'text-gray-700'}`} style={row.highlight ? { color: 'rgba(27,34,119,1)' } : {}}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Bank Transfer Nigeria ── */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(163,246,156,0.25)' }}>
                  <Landmark className="size-4" style={{ color: 'var(--church-green)' }} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'rgba(27,34,119,1)' }}>Bank Transfer (Nigeria)</h3>
                  <p className="text-[11px] text-gray-400">Premium Trust Bank</p>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 p-3 flex flex-col gap-2 bg-gray-50">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Name</span>
                  <span className="font-semibold" style={{ color: 'rgba(27,34,119,1)' }}>RCCG Calvary Place</span>
                </div>
                <div className="flex flex-col gap-0.5 text-xs">
                  <span className="text-gray-400">Account Number</span>
                  <span className="text-xl font-extrabold tracking-wider" style={{ color: 'rgba(27,34,119,1)' }}>
                    0040215084
                  </span>
                </div>
              </div>
            </div>

            {/* ── PayPal ── */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(232,232,232,1)' }}>
                  <Globe className="size-4 text-gray-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'rgba(27,34,119,1)' }}>PayPal</h3>
                  <p className="text-[11px] text-gray-400">Quick &amp; Secure Online</p>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <svg className="size-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-600">give@calvary.place</span>
                </div>
                <a
                  href="https://paypal.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'rgba(27,34,119,1)' }}
                >
                  Give via PayPal
                </a>
              </div>
            </div>

            {/* ── International ── */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(232,232,232,1)' }}>
                  <Globe className="size-4 text-gray-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'rgba(27,34,119,1)' }}>International</h3>
                  <p className="text-[11px] text-gray-400">Global Transfers</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                For international transfers, please route payments through{' '}
                <a
                  href="https://wise.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--church-green)' }}
                >
                  Wise Payments Limited
                </a>{' '}
                using the UK Account details provided above. Ensure to include your name in the reference.
              </p>
            </div>

            {/* ── Zelle ── */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(232,232,232,1)' }}>
                  <Smartphone className="size-4 text-gray-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'rgba(27,34,119,1)' }}>Zelle</h3>
                  <p className="text-[11px] text-gray-400">US Transfers</p>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Recipient Email</span>
                <span className="text-sm font-bold" style={{ color: 'rgba(27,34,119,1)' }}>
                  calvaryplace1@gmail.com
                </span>
              </div>
            </div>

            {/* ── In-Person ── */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
              {/* Subtle watermark */}
              <div className="absolute -right-4 -bottom-4 opacity-5" aria-hidden="true">
                <Users className="size-32 text-gray-800" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(232,232,232,1)' }}>
                  <Users className="size-4 text-gray-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'rgba(27,34,119,1)' }}>In-Person</h3>
                  <p className="text-[11px] text-gray-400">Sunday Gatherings</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed relative z-10">
                We receive tithes and offerings during our regular Sunday morning services. Envelopes are available in the sanctuary seating areas.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer
        logo={{ src: '/logo.png', alt: 'RCCG Glory Tabernacle' }}
        tagline="Recovering the past, restoring the present, and reviving the future of our city through faith and community."
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
