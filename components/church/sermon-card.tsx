import Image from 'next/image'
import { Play } from 'lucide-react'

export interface Sermon {
  id: string
  title: string
  speaker: string
  date: string
  series?: string
  thumbnailSrc: string
  videoHref?: string
  audioHref?: string
  duration?: string
  featured?: boolean
}

interface SermonCardProps {
  sermon: Sermon
  featured?: boolean
}

export function SermonCard({ sermon, featured = false }: SermonCardProps) {
  const href = sermon.videoHref ?? sermon.audioHref ?? '#'

  if (featured) {
    return (
      <a
        href={href}
        className="group relative block w-full h-full rounded-2xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label={`Watch featured sermon: ${sermon.title}`}
      >
        {/* Background image */}
        <Image
          src={sermon.thumbnailSrc}
          alt={sermon.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 60vw"
        />

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-3">
          {/* Badges row */}
          <div className="flex items-center gap-3">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest text-white"
              style={{ backgroundColor: 'var(--church-green)' }}
            >
              Featured
            </span>
            {sermon.series && (
              <span className="text-xs text-white/80">
                Series: {sermon.series}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            {sermon.title}
          </h3>

          {/* Play button */}
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 transition-colors group-hover:bg-white/30"
            aria-hidden="true"
          >
            <Play className="size-5 text-white fill-white" />
          </div>
        </div>
      </a>
    )
  }

  // Small card
  return (
    <a
      href={href}
      className="group relative block w-full h-full rounded-2xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      aria-label={`Watch sermon: ${sermon.title}`}
    >
      <Image
        src={sermon.thumbnailSrc}
        alt={sermon.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 35vw"
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-base font-bold text-white leading-snug">
          {sermon.title}
        </h3>
        <p className="text-xs text-white/70 mt-0.5">
          {sermon.speaker}{sermon.duration ? ` • ${sermon.duration}` : ''}
        </p>
      </div>
    </a>
  )
}
