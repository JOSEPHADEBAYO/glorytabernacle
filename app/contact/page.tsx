'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Phone, Mail, MapPin, Building2 } from 'lucide-react'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'

// ---------------------------------------------------------------------------
// Contact info bar
// ---------------------------------------------------------------------------

function ContactBar() {
  return (
    <div className="mx-auto max-w-3xl -mt-8 relative z-20 px-[var(--section-padding-x)]">
      <div
        className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 rounded-2xl bg-white px-2"
        style={{ boxShadow: '0px 8px 32px 0px rgba(0,0,0,0.10)' }}
      >
        {[
          { icon: <Phone className="h-4 w-4" />, label: 'CALL US', value: '+44 (0) 1234 567890' },
          { icon: <Mail className="h-4 w-4" />, label: 'EMAIL US', value: 'info@glorytabernacle.org' },
          { icon: <MapPin className="h-4 w-4" />, label: 'OUR LOCATION', value: 'Barnstaple, EX31 2BQ' },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-6 py-5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(0,6,102,0.08)', color: 'rgba(0,6,102,1)' }}
            >
              {icon}
            </span>
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">{label}</p>
              <p className="text-sm font-semibold" style={{ color: 'rgba(0,6,102,1)' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[var(--church-navy)] focus:ring-2 focus:ring-[rgba(0,6,102,0.1)]"

  return (
    <div>
      <h2 className="mb-6 text-xl font-extrabold" style={{ color: 'rgba(0,6,102,1)' }}>
        Send Us a Message
      </h2>

      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-green-50 py-10 text-center">
          <span className="text-3xl">✅</span>
          <p className="font-bold text-green-700">Message sent!</p>
          <p className="text-sm text-gray-500">We'll get back to you within 24 hours.</p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-2 text-xs font-semibold underline text-gray-400 hover:text-gray-600"
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className={inputClass}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                placeholder="email@address.com"
                className={inputClass}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</label>
            <select
              className={inputClass}
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            >
              <option>General Inquiry</option>
              <option>Prayer Request</option>
              <option>Media Team</option>
              <option>Volunteering</option>
              <option>Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</label>
            <textarea
              placeholder="How can we help you?"
              rows={5}
              className={`${inputClass} resize-none`}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              required
            />
          </div>

          <button
            type="submit"
            className="flex w-fit items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--church-green)' }}
          >
            Send Message →
          </button>
        </form>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Department contacts + address
// ---------------------------------------------------------------------------

function DepartmentContacts() {
  const departments = [
    { name: 'General Inquiry', email: 'info@glorytabernacle.org' },
    { name: 'Prayer Requests', email: 'prayer@glorytabernacle.org' },
    { name: 'Media Team', email: 'media@glorytabernacle.org' },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Department contacts */}
      <div>
        <h3 className="mb-4 text-base font-extrabold" style={{ color: 'var(--church-green)' }}>
          Department Contacts
        </h3>
        <div className="flex flex-col gap-3">
          {departments.map(dept => (
            <div
              key={dept.name}
              className="border-l-4 pl-3 py-0.5"
              style={{ borderColor: 'var(--church-green)' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'rgba(0,6,102,1)' }}>{dept.name}</p>
              <a
                href={`mailto:${dept.email}`}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {dept.email}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Church address */}
      <div>
        <h3 className="mb-4 text-base font-extrabold" style={{ color: 'var(--church-green)' }}>
          Church Address
        </h3>
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(0,6,102,1)' }}>
              RCCG Glory Tabernacle
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
              North Devon College<br />
              Old Sticklepath Hill<br />
              Barnstaple EX31 2BQ<br />
              England, United Kingdom
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Google Maps embed
// ---------------------------------------------------------------------------

function MapSection() {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: '400px' }}>
      <iframe
        title="RCCG Glory Tabernacle location"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2524.123456789!2d-4.0601!3d51.0801!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x486c4b1234567890%3A0xabcdef1234567890!2sNorth%20Devon%20College%2C%20Old%20Sticklepath%20Hill%2C%20Barnstaple%20EX31%202BQ!5e0!3m2!1sen!2suk!4v1234567890"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Meeting location overlay card */}
      <div
        className="absolute left-4 top-4 z-10 max-w-[200px] rounded-xl p-4 text-white"
        style={{ backgroundColor: 'rgba(0,6,102,0.92)' }}
      >
        <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest" style={{ color: 'var(--church-light-green)' }}>
          Our Meeting Location
        </p>
        <p className="text-xs leading-relaxed">
          North Devon College<br />
          Old Sticklepath Hill<br />
          Barnstaple EX31 2BQ<br />
          United Kingdom
        </p>
        <a
          href="https://maps.google.com/?q=North+Devon+College+Barnstaple+EX31+2BQ"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-[0.65rem] font-bold underline underline-offset-2 transition-opacity hover:opacity-80"
          style={{ color: 'var(--church-light-green)' }}
        >
          Open in Maps →
        </a>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Social community section
// ---------------------------------------------------------------------------

function SocialSection() {
  const socials = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7" aria-hidden="true">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
      name: 'Facebook', description: 'Join our group and stay updated', href: '#', bg: '#1877F2',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
        </svg>
      ),
      name: 'Instagram', description: 'Follow our weekly life', href: '#', bg: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7" aria-hidden="true">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
          <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#FF0000" />
        </svg>
      ),
      name: 'YouTube', description: 'Watch sermons and worship live', href: '#', bg: '#FF0000',
    },
  ]

  return (
    <section
      className="w-full py-20 px-[var(--section-padding-x)]"
      style={{ backgroundColor: 'rgba(0,6,102,1)' }}
    >
      <div className="mx-auto max-w-[var(--container-max)]">
        <h2 className="mb-10 text-center text-2xl font-extrabold text-white md:text-3xl">
          Join Our Online Community
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {socials.map(social => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 text-center transition-opacity hover:opacity-80"
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
                style={{ background: social.bg }}
              >
                {social.icon}
              </div>
              <p className="text-base font-bold text-white">{social.name}</p>
              <p className="text-xs text-white/60">{social.description}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContactPage() {
  return (
    <>
      <TopNavBar />

      {/* Hero */}
      <section
        className="relative w-full pt-16 flex items-center"
        style={{ backgroundColor: 'rgba(0,6,102,1)', minHeight: '500px' }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/contact.png"
            alt=""
            fill
            className="object-cover opacity-80"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(0,6,102,0.9) 40%, rgba(0,6,102,0.4) 100%)' }}
            aria-hidden="true"
          />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[var(--container-max)] px-[var(--section-padding-x)] pb-16">
          <p
            className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--church-light-green)' }}
          >
            Get in Touch
          </p>
          <h1 className="text-5xl font-extrabold text-white md:text-6xl">Connect With Us</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
            We are a community that believes in the power of connection. Reach out and find your place with us today.
          </p>
        </div>
      </section>

      {/* Contact bar — overlaps hero */}
      <div className="w-full" style={{ backgroundColor: 'rgba(249,249,249,1)' }}>
        <ContactBar />

        {/* Form + sidebar */}
        <div className="mx-auto max-w-[var(--container-max)] px-[var(--section-padding-x)] py-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_320px]">
            <ContactForm />
            <DepartmentContacts />
          </div>
        </div>
      </div>

      {/* Map */}
      <MapSection />

      {/* Social community */}
      <SocialSection />

      <Footer
        logo={{ src: '/logo.png', alt: 'RCCG Glory Tabernacle' }}
        tagline="Recovering the past, restoring the present, and reviving the future."
        columns={[
          {
            heading: 'Quick Links',
            links: [
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Sermons', href: '/sermons' },
              { label: 'Books', href: '/books' },
              { label: 'Give', href: '/giving' },
              { label: 'Contact', href: '/contact' },
            ],
          },
        ]}
        socialLinks={[
          { platform: 'instagram', href: '#' },
          { platform: 'youtube', href: '#' },
          { platform: 'facebook', href: '#' },
        ]}
        contactInfo={{
          address: 'North Devon College, Old Sticklepath Hill Barnstaple EX31 2BQ England',
          phone: '+44 (0) 1234 567890',
          email: 'info@glorytabernacle.org',
          directionsHref: 'https://maps.google.com/?q=North+Devon+College+Barnstaple+EX31+2BQ',
        }}
        copyrightText={`© ${new Date().getFullYear()} RCCG Glory Tabernacle. All rights reserved.`}
      />
    </>
  )
}
