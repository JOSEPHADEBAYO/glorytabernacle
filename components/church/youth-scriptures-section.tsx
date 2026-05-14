'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, ChevronLeft, ChevronRight } from 'lucide-react'

const DEFAULT_IMAGE =
  'https://res.cloudinary.com/deckwmsth/image/upload/v1778769720/rod-long-DRgrzQQsJDA-unsplash_egb8xy.jpg'

interface YouthScripture {
  reference: string
  text: string
  videoUrl: string | null
  date: string
}

interface YouthScripturesSectionProps {
  heading?: string
  subtext?: string
  scriptures: YouthScripture[]
  cardImageUrl?: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ScriptureCard({
  scripture,
  imageUrl,
  compact,
}: {
  scripture: YouthScripture
  imageUrl: string
  compact?: boolean
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Image header */}
      <div className="relative w-full aspect-[16/9] overflow-hidden">
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-3 p-5">
        {/* Date */}
        <span className="text-xs text-white/40 font-medium tracking-wide">
          {compact ? formatShortDate(scripture.date) : formatDate(scripture.date)}
        </span>

        {/* Reference */}
        <h3
          className={`font-extrabold tracking-tight ${compact ? 'text-base' : 'text-lg'}`}
          style={{ color: 'var(--church-light-green)' }}
        >
          {scripture.reference}
        </h3>

        {/* Scripture text */}
        {!compact && (
          <p className="text-base leading-relaxed text-white/85 italic">
            &ldquo;{scripture.text}&rdquo;
          </p>
        )}
        {compact && (
          <p className="text-sm leading-relaxed text-white/70 italic line-clamp-2">
            &ldquo;{scripture.text}&rdquo;
          </p>
        )}

        {/* YouTube link */}
        {scripture.videoUrl && (
          <a
            href={scripture.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 self-start"
            style={{ backgroundColor: '#FF0000' }}
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            Watch on YouTube
          </a>
        )}
      </div>
    </div>
  )
}

function PreviousWeeksCarousel({
  scriptures,
  imageUrl,
}: {
  scriptures: YouthScripture[]
  imageUrl: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const isHovering = useRef(false)
  const scrollFnRef = useRef<() => void>(() => {})

  useEffect(() => {
    scrollFnRef.current = () => {
      if (!scrollRef.current || isHovering.current) {
        rafRef.current = requestAnimationFrame(scrollFnRef.current)
        return
      }

      const el = scrollRef.current
      const maxScroll = el.scrollWidth - el.clientWidth
      const step = 0.5

      if (el.scrollLeft >= maxScroll - 1) {
        el.scrollTo({ left: 0, behavior: 'instant' })
      } else {
        el.scrollLeft += step
      }

      rafRef.current = requestAnimationFrame(scrollFnRef.current)
    }

    rafRef.current = requestAnimationFrame(scrollFnRef.current)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const scrollBy = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.6
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative">
      {/* Scroll buttons */}
      <button
        type="button"
        onClick={() => scrollBy('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 h-10 w-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-colors"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 h-10 w-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-colors"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Carousel track */}
      <div
        ref={scrollRef}
        onMouseEnter={() => { isHovering.current = true }}
        onMouseLeave={() => { isHovering.current = false }}
        className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {scriptures.map((s) => (
          <div key={s.reference + s.date} className="min-w-[280px] max-w-[320px] flex-none">
            <ScriptureCard scripture={s} imageUrl={imageUrl} compact />
          </div>
        ))}
      </div>
    </div>
  )
}

export function YouthScripturesSection({
  heading = 'Youth Weekly Scripture',
  subtext = 'A word for the youth — refreshed every week.',
  scriptures,
  cardImageUrl = DEFAULT_IMAGE,
}: YouthScripturesSectionProps) {
  const [showPrevious, setShowPrevious] = useState(false)

  if (scriptures.length === 0) return null

  const [featured, ...previous] = scriptures

  return (
    <section
      aria-label="Youth Weekly Scripture"
      className="relative w-full overflow-hidden py-12 px-[var(--section-padding-x)]"
      style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
    >
      {/* Radial glow — top centre */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        aria-hidden="true"
        style={{
          width: '60%',
          height: '50%',
          background:
            'radial-gradient(ellipse at center top, rgba(163,246,156,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Diagonal stripe texture — right edge */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-64 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, white 0px, white 1px, transparent 1px, transparent 14px)',
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-max)]">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div
            className="h-1 w-10 rounded-full"
            style={{ backgroundColor: 'var(--church-light-green)' }}
            aria-hidden="true"
          />
          <h2 className="text-3xl font-extrabold uppercase tracking-[0.18em] text-white md:text-4xl">
            {heading}
          </h2>
          <p className="text-sm text-white/50 tracking-wide">{subtext}</p>
        </div>

        {/* Featured weekly card — centered */}
        <div className="mx-auto max-w-md">
          <ScriptureCard scripture={featured} imageUrl={cardImageUrl} />
        </div>

        {/* See previous weeks button */}
        {previous.length > 0 && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowPrevious((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--church-green)' }}
            >
              {showPrevious ? 'Hide previous weeks' : `See previous weeks (${previous.length})`}
            </button>
          </div>
        )}

        {/* Previous weeks carousel */}
        {showPrevious && previous.length > 0 && (
          <div className="mt-8">
            <PreviousWeeksCarousel scriptures={previous} imageUrl={cardImageUrl} />
          </div>
        )}
      </div>
    </section>
  )
}
