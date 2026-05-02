import { TopNavBar } from '@/components/church/nav-bar'
import { HeroSection } from '@/components/church/hero'
import { LiveStreamSection } from '@/components/church/live-stream-section'
import { AboutSection } from '@/components/church/about-section'
import { MinistriesSection } from '@/components/church/ministries-section'
import { EventsSection } from '@/components/church/events-section'
import { SermonsSection } from '@/components/church/sermons-section'
import { UpcomingEncountersSection } from '@/components/church/upcoming-encounters-section'
import { TestimonialsSection } from '@/components/church/testimonials-section'
import { GlobalConnectionSection } from '@/components/church/global-connection-section'
import { SupportSection } from '@/components/church/support-section'
import { Footer } from '@/components/church/footer'
import type { ChurchEvent } from '@/components/church/event-card'
import type { Sermon } from '@/components/church/sermon-card'

const EVENTS: ChurchEvent[] = [
  {
    id: 'evt-1',
    title: 'Sunday Worship Service',
    date: '2025-08-03',
    time: '10:00 AM',
    location: 'Main Sanctuary',
    description: 'Join us for our weekly Sunday worship service filled with praise, prayer, and the Word of God.',
    image: 'https://placehold.co/600x400',
    registrationHref: '',
  },
  {
    id: 'evt-2',
    title: 'Youth Conference 2025',
    date: '2025-08-15',
    time: '9:00 AM',
    location: 'Fellowship Hall',
    description: 'A two-day conference empowering the next generation to walk boldly in their faith and purpose.',
    image: 'https://placehold.co/600x400/1B6D24/ffffff',
    registrationHref: '#',
  },
  {
    id: 'evt-3',
    title: 'Community Outreach Day',
    date: '2025-09-06',
    time: '8:00 AM',
    location: 'City Park, Main Street',
    description: 'Serving our local community through food distribution, prayer, and acts of kindness in the name of Christ.',
    image: 'https://placehold.co/600x400/1b2277/ffffff',
    registrationHref: '#',
  },
]

const SERMONS: Sermon[] = [
  {
    id: 'serm-1',
    title: 'Finding Hope in Desert Seasons',
    speaker: 'Pastor John Adeyemi',
    date: '2025-07-20',
    series: 'The Wilderness',
    thumbnailSrc: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&auto=format&fit=crop',
    videoHref: '#',
    duration: '52 min',
    featured: true,
  },
  {
    id: 'serm-2',
    title: 'The Power of Stillness',
    speaker: 'Pastor David Reed',
    date: '2025-07-13',
    thumbnailSrc: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop',
    videoHref: '#',
    duration: '42 min',
  },
  {
    id: 'serm-3',
    title: 'Cultivating the Soul',
    speaker: 'Pastor Sarah Chen',
    date: '2025-07-06',
    thumbnailSrc: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop',
    videoHref: '#',
    duration: '38 min',
  },
]

export default function Home() {
  return (
    <>
      <TopNavBar />
      <HeroSection
        slides={[
          {
            backgroundImage: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2342&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            eyebrow: 'Welcome to Our Sanctuary',
            headline: 'A Place of',
            headlineAccent: 'Recovery,',
            headlineLine2: 'Restoration & Revival',
          },
          {
            backgroundImage: 'https://images.unsplash.com/photo-1674566159068-16fd62db547c?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            eyebrow: 'Growing in Faith',
            headline: 'Building a',
            headlineAccent: 'Community',
            headlineLine2: 'Rooted in Christ',
          },
          {
            backgroundImage: 'https://images.unsplash.com/photo-1519915734606-32d972e3b9b7?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8aW1hZ2VzJTIwb2YlMjBwZW9wbGUlMjBwcmF5aW5nJTIwcG93ZXJmdWxseSUyMGl8ZW58MHx8MHx8fDA%3D',
            eyebrow: 'Making Disciples',
            headline: 'Spreading the',
            headlineAccent: 'Gospel',
            headlineLine2: 'to All Nations',
          },
        ]}
        primaryCta={{ label: 'Plan a Visit', href: '/about' }}
        secondaryCta={{ label: 'Watch Sermons', href: '/sermons' }}
      />
      <LiveStreamSection
        thumbnailSrc="/livestream.png"
        thumbnailAlt="RCCG Glory Tabernacle congregation in worship"
        isLive={false}
        youtubeLiveHref="https://www.youtube.com/@RCCGGloryTabernacle/live"
        nextServiceDate="2026-05-10T10:00:00"
      />
      <AboutSection
        eyebrow="Our Foundation"
        heading="Resilient Faith for a Modern World."
        body="At RCCG Glory Tabernacle, we believe that the ancient truths of the Gospel are the firm foundation for navigating today's complexities. We are a community dedicated to the transformative power of grace and the relentless pursuit of spiritual growth."
        pillars={[
          {
            title: 'Restoration',
            description: 'Healing the broken through the unconditional love of the Father.',
          },
          {
            title: 'Revival',
            description: 'Awakening the soul to the vibrant presence of the Holy Spirit.',
          },
        ]}
        yearsOfMinistry={74}
        image={{
          src: '/fellowship.png',
          alt: 'RCCG Glory Tabernacle fellowship',
          width: 700,
          height: 600,
        }}
      />
      <MinistriesSection />
      <EventsSection
        heading="Upcoming Events"
        events={EVENTS}
        viewAllHref="/events"
      />
      <SermonsSection
        heading="Recent Sermons"
        sermons={SERMONS}
        viewAllHref="/sermons"
      />
      <UpcomingEncountersSection />
      <TestimonialsSection />
      <GlobalConnectionSection />
      <SupportSection
        heading="Support the Mission"
        body="Your generosity fuels our community programs, global missions, and the upkeep of this sanctuary. Partner with us as we spread the message of hope."
        primaryCta={{ label: 'Give Online', href: '/giving' }}
      />
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
          address: 'North Devon College, Old Sticklepath Hill Barnstaple EX31 2BQ England',
          phone: '+1 (555) 123-4567',
          email: 'info@rccgglory.org',
          directionsHref: 'https://maps.google.com',
        }}
        copyrightText={`© ${new Date().getFullYear()} RCCG Glory Tabernacle. All rights reserved.`}
      />
    </>
  )
}
