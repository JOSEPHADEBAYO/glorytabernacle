'use client'

import Image from 'next/image'
import { useRef } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GalleryItem {
  imageSrc: string
  imageAlt: string
  date: string   // e.g. "26/04/2026"
  title: string
  /** Optional short blurb shown under the title on the card. */
  description?: string
}

interface ImageGallerySectionProps {
  heading?: string
  subtext?: string
  items?: GalleryItem[]
}

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const DEFAULT_ITEMS: GalleryItem[] = [
  {
    imageSrc: '/imagegallery1.png',
    imageAlt: 'Sunday Service worship gathering',
    date: '26/04/2026',
    title: 'Sunday Service',
  },
  {
    imageSrc: '/imagegallery3.png',
    imageAlt: 'Digging Deep Experience conference',
    date: '21/04/2026',
    title: 'Digging Deep Experience',
  },
  {
    imageSrc: '/imagegallery2.png',
    imageAlt: 'Children Programme',
    date: '19/04/2026',
    title: 'Children Programme',
  },
  {
    imageSrc: '/imagegallery1.png',
    imageAlt: 'Young Adults gathering',
    date: '01/04/2026',
    title: 'Young Adults Night',
  },
  {
    imageSrc: '/imagegallery2.png',
    imageAlt: 'Community outreach day',
    date: '15/03/2026',
    title: 'Community Outreach Day',
  },
  {
    imageSrc: '/imagegallery3.png',
    imageAlt: 'Prayer and worship night',
    date: '08/03/2026',
    title: 'Prayer & Worship Night',
  },
]

// ---------------------------------------------------------------------------
// Single card
// ---------------------------------------------------------------------------

function GalleryCard({ item }: { item: GalleryItem }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-2xl bg-white"
      style={{
        width: '280px',
        boxShadow: '0px 4px 24px 0px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Image */}
      <div className="relative w-full" style={{ height: '200px' }}>
        <Image
          src={item.imageSrc}
          alt={item.imageAlt}
          fill
          className="object-cover"
          sizes="280px"
        />
      </div>

      {/* Text content */}
      <div className="flex flex-col gap-2 px-5 py-4">
        <p
          className="text-xs font-bold"
          style={{ color: 'var(--church-green)' }}
        >
          {item.date}
        </p>
        <h3
          className="text-base font-extrabold leading-snug"
          style={{ color: 'rgba(0, 6, 102, 1)' }}
        >
          {item.title}
        </h3>
        {item.description && (
          <p className="text-sm leading-snug text-gray-500 line-clamp-3">
            {item.description}
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function ImageGallerySection({
  heading = 'Image Gallery',
  subtext = 'Check out images from our recent programmes and feel the experience',
  items = DEFAULT_ITEMS,
}: ImageGallerySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Mouse drag-to-scroll
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0)
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - (scrollRef.current.offsetLeft ?? 0)
    const walk = (x - startX.current) * 1.2
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }

  const stopDrag = () => { isDragging.current = false }

  return (
    <section
      aria-label="Image gallery"
      className="w-full py-12 px-[var(--section-padding-x)]"
      style={{ backgroundColor: 'rgba(249, 249, 249, 1)' }}
    >
      <div className="mx-auto max-w-[var(--container-max)]">
        {/* Header */}
        <div className="mb-8">
          <h2
            className="text-3xl font-extrabold leading-tight md:text-4xl"
            style={{ color: 'rgba(0, 6, 102, 1)' }}
          >
            {heading}
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">{subtext}</p>
        </div>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing select-none"
          style={{
            scrollbarWidth: 'none',        /* Firefox */
            msOverflowStyle: 'none',       /* IE/Edge */
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          {/* Hide webkit scrollbar via inline style — Tailwind can't do this */}
          <style>{`.gallery-scroll::-webkit-scrollbar { display: none; }`}</style>

          {items.map((item, i) => (
            <GalleryCard key={i} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
