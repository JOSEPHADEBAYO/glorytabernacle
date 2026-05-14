import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { TopNavBar } from '@/components/church/nav-bar'
import { Footer } from '@/components/church/footer'
import { prisma } from '@/lib/prisma'
import {
  INFORMATION_CATEGORY_LABELS,
  type InformationCategory,
} from '@/lib/types/information'
import { InformationSubmitForm } from './information-submit-form'

export const dynamic = 'force-dynamic'

type PublicInformationItem = {
  id: string
  title: string
  description: string
  linkUrl: string
  category: string
  submittedBy: string | null
  createdAt: Date
}

async function loadPublishedInformation(): Promise<PublicInformationItem[]> {
  try {
    const items: PublicInformationItem[] = await prisma.informationItem.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        linkUrl: true,
        category: true,
        submittedBy: true,
        createdAt: true,
      },
    })
    return items
  } catch (error) {
    console.error('Error loading information hub:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return []
  }
}

function categoryLabel(category: string) {
  return (
    INFORMATION_CATEGORY_LABELS[category as InformationCategory] ??
    'Information'
  )
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function InfoArticle({ item }: { item: PublicInformationItem }) {
  return (
    <article className="border-b border-gray-200 py-8 first:pt-0">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
        <span>{categoryLabel(item.category)}</span>
        <span aria-hidden="true">/</span>
        <time dateTime={item.createdAt.toISOString()}>{formatDate(item.createdAt)}</time>
      </div>
      <h2 className="text-2xl font-bold leading-tight text-gray-950 md:text-3xl">
        {item.title}
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-gray-700">
        {item.description}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={item.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-950 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-950"
        >
          Read full information
          <ExternalLink className="h-4 w-4" />
        </Link>
        {item.submittedBy && (
          <span className="text-sm text-gray-500">Shared by {item.submittedBy}</span>
        )}
      </div>
    </article>
  )
}

function JobCard({ item }: { item: PublicInformationItem }) {
  return (
    <article className="border-b border-gray-200 py-5 first:pt-0">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
        Job post
      </div>
      <h3 className="text-base font-bold leading-snug text-gray-950">{item.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
        {item.description}
      </p>
      <Link
        href={item.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gray-950"
      >
        Open role
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </article>
  )
}

export default async function InformationPage() {
  const items = await loadPublishedInformation()
  const jobs = items.filter((item) => item.category === 'JOB')
  const mainItems = items.filter((item) => item.category !== 'JOB')
  const featured = mainItems[0] ?? items[0] ?? null
  const remaining = featured
    ? mainItems.filter((item) => item.id !== featured.id)
    : mainItems

  return (
    <>
      <TopNavBar />
      <main className="bg-[#f7f7f2] pt-16 text-gray-950">
        <section className="border-b border-gray-300 bg-[#f7f7f2] px-6 py-12 md:px-16">
          <div className="mx-auto max-w-[var(--container-max)]">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-gray-500">
                Information Hub
              </p>
              <h1 className="text-5xl font-black leading-none tracking-normal md:text-7xl">
                Practical updates for life in North Devon.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-700 md:text-lg">
                Immigration notes, community opportunities, job posts, and useful links curated by Glory Tabernacle.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-10 md:px-16">
          <div className="mx-auto grid max-w-[var(--container-max)] gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              {featured ? (
                <article className="border-b border-gray-950 pb-10">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Featured
                  </div>
                  <h2 className="max-w-3xl text-4xl font-black leading-tight md:text-5xl">
                    {featured.title}
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-700">
                    {featured.description}
                  </p>
                  <Link
                    href={featured.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-950 px-5 py-2 text-sm font-bold hover:bg-gray-950 hover:text-white"
                  >
                    Read the full post
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </article>
              ) : (
                <div className="border border-dashed border-gray-400 bg-white/60 p-8 text-gray-600">
                  No published information yet.
                </div>
              )}

              <div className="mt-8">
                {remaining.map((item) => (
                  <InfoArticle key={item.id} item={item} />
                ))}
              </div>
            </div>

            <aside className="space-y-8 lg:border-l lg:border-gray-300 lg:pl-8">
              <section>
                <div className="mb-4 flex items-end justify-between border-b border-gray-950 pb-2">
                  <h2 className="text-xl font-black">Jobs</h2>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Side notes
                  </span>
                </div>
                {jobs.length > 0 ? (
                  jobs.map((job) => <JobCard key={job.id} item={job} />)
                ) : (
                  <p className="py-5 text-sm leading-6 text-gray-600">
                    No job posts have been published yet.
                  </p>
                )}
              </section>

              <section className="border border-gray-300 bg-white p-5">
                <h2 className="text-xl font-black">Share information</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Submissions go to the dashboard first and appear here after review.
                </p>
                <div className="mt-5">
                  <InformationSubmitForm />
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>
      <Footer
        logo={{ src: '/logo.png', alt: 'RCCG Glory Tabernacle' }}
        tagline="Furnish  .  Transform  .  Influence"
        columns={[
          {
            heading: 'Quick Links',
            links: [
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Information', href: '/information' },
              { label: 'Events', href: '/events' },
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
        copyrightText={`Copyright ${new Date().getFullYear()} RCCG Glory Tabernacle. All rights reserved.`}
      />
    </>
  )
}
