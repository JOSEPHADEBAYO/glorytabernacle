import Link from 'next/link'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { AttendanceForm } from '@/components/church/attendance-form'
import { suggestCurrentService } from '@/lib/types/attendance'

/**
 * Public attendance check-in page.
 * - Anyone can submit. No auth required.
 * - The service dropdown is pre-selected to the most likely current service
 *   based on day-of-week + time, but the visitor can change it.
 */
export default function AttendancePage() {
  const suggestedService = suggestCurrentService()

  return (
    <>
      <TopNavBar />
      <main className="min-h-[60vh] py-16 px-6">
        <div className="mx-auto max-w-md">
          <div className="text-center mb-8">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: 'var(--church-light-green, rgb(27, 109, 36))' }}
            >
              We&apos;re glad you&apos;re here
            </p>
            <h1
              className="mt-2 text-3xl font-extrabold leading-tight"
              style={{ color: 'rgba(27, 34, 119, 1)' }}
            >
              Mark your attendance
            </h1>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Drop your name and email so we can welcome you, follow up if
              you&apos;re new, and pray for you through the week.
            </p>
          </div>

          <AttendanceForm initialService={suggestedService} />

          <p className="mt-6 text-center text-sm text-gray-600">
            <Link href="/" className="text-blue-600 hover:underline">
              ← Back to homepage
            </Link>
          </p>
        </div>
      </main>
      <Footer
        logo={{ src: '/logo-with-no-bg.png', alt: 'RCCG Glory Tabernacle' }}
        tagline="Furnish · Transform · Influence"
        columns={[
          {
            heading: 'Quick Links',
            links: [
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Events', href: '/events' },
              { label: 'Groups', href: '/groups' },
            ],
          },
        ]}
        socialLinks={[
          { platform: 'instagram', href: '#' },
          { platform: 'youtube', href: '#' },
          { platform: 'facebook', href: '#' },
        ]}
        contactInfo={{
          address:
            'North Devon College, Old Sticklepath Hill Barnstaple EX31 2BQ England',
          phone: '+1 (555) 123-4567',
          email: 'info@rccgglory.org',
          directionsHref: 'https://maps.google.com',
        }}
        copyrightText={`© ${new Date().getFullYear()} RCCG Glory Tabernacle. All rights reserved.`}
      />
    </>
  )
}
