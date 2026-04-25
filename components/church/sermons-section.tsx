import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { SermonCard, type Sermon } from '@/components/church/sermon-card'

interface SermonsSectionProps {
  heading: string
  sermons: Sermon[]
  viewAllHref: string
}

export function SermonsSection({ sermons, viewAllHref }: SermonsSectionProps) {
  const [featured, ...rest] = sermons

  return (
    <section className="bg-white py-[var(--section-padding-y)] px-[var(--section-padding-x)]">
      <div className="max-w-[var(--container-max)] mx-auto">

        {/* Header row */}
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.18em] mb-1"
              style={{ color: 'var(--church-green)' }}
            >
              Watch &amp; Listen
            </p>
            <h2
              className="text-4xl md:text-5xl font-extrabold leading-tight"
              style={{ color: 'rgba(27, 34, 119, 1)' }}
            >
              Recent Sermons
            </h2>
          </div>

          <Link
            href={viewAllHref}
            className="flex-none inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              borderColor: 'rgba(232, 232, 232, 1)',
              color: 'rgba(27, 34, 119, 1)',
            }}
          >
            Explore Full Library
            <BookOpen className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Asymmetric grid */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">

          {/* Featured — tall left card */}
          {featured && (
            <div className="h-[420px] md:h-[500px]">
              <SermonCard sermon={featured} featured />
            </div>
          )}

          {/* Right column — two stacked cards */}
          <div className="grid grid-rows-2 gap-4 h-[420px] md:h-[500px]">
            {rest.slice(0, 2).map((sermon) => (
              <div key={sermon.id} className="h-full">
                <SermonCard sermon={sermon} />
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
