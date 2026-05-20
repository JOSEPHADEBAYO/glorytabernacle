import Image from 'next/image'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { prisma } from '@/lib/prisma'
import {
  VolunteerInterestForm,
  type VolunteerStrengthOption,
} from './volunteer-interest-form'

export const dynamic = 'force-dynamic'

async function loadGroups(): Promise<VolunteerStrengthOption[]> {
  try {
    const groups: VolunteerStrengthOption[] = await prisma.group.findMany({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
      select: { id: true, title: true },
    })
    return groups
  } catch (error) {
    console.error('Error loading volunteer strength groups:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return []
  }
}

export default async function VolunteerInterestPage() {
  const groups = await loadGroups()

  return (
    <>
      <TopNavBar />
      <main className="bg-[#f4f4f4]">
        <section className="relative flex min-h-[24rem] items-center overflow-hidden pt-16">
          <Image
            src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1920&auto=format&fit=crop&q=80"
            alt="Volunteers serving together"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#000666]/78" />
          <div className="relative z-10 mx-auto w-full max-w-[var(--container-max)] px-[var(--section-padding-x)] py-16 text-white">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-white/65">
              Step into service
            </p>
            <h1 className="max-w-3xl text-5xl font-extrabold leading-tight md:text-6xl">
              Volunteer Interest
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/75">
              Share your strengths, experience, and readiness to serve. Our team will review your interest from the dashboard and follow up.
            </p>
          </div>
        </section>

        <section className="px-[var(--section-padding-x)] py-16">
          <VolunteerInterestForm groups={groups} />
        </section>
      </main>
      <Footer
        logo={{ src: '/logo.png', alt: 'RCCG Glory Tabernacle, Barnstaple' }}
        tagline="Furnish  .  Transform  .  Influence"
        columns={[
          {
            heading: 'Quick Links',
            links: [
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
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
