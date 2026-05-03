'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Download } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Tract {
  id: string
  imageSrc: string
  imageAlt: string
  category: 'theology' | 'evangelism' | 'christian-life'
  title: string
  description: string
  readHref: string
  downloadHref: string
}

// ---------------------------------------------------------------------------
// Data — 12 tracts
// ---------------------------------------------------------------------------

export const TRACTS: Tract[] = [
  { id: 't1',  imageSrc: '/imagegallery1.png', imageAlt: 'The Hope of Glory',       category: 'theology',       title: 'The Hope of Glory',       description: 'A profound exploration of eternal life and the promises God has prepared for those who love Him.',         readHref: '#', downloadHref: '#' },
  { id: 't2',  imageSrc: '/imagegallery2.png', imageAlt: 'Finding True Peace',      category: 'evangelism',     title: 'Finding True Peace',      description: 'In a chaotic world, discover the biblical path to an untroubled heart and lasting inner peace.',           readHref: '#', downloadHref: '#' },
  { id: 't3',  imageSrc: '/imagegallery3.png', imageAlt: 'The Narrow Gate',         category: 'evangelism',     title: 'The Narrow Gate',         description: 'A clear, uncompromising presentation of the Gospel and the call to follow Jesus wholeheartedly.',          readHref: '#', downloadHref: '#' },
  { id: 't4',  imageSrc: '/imagegallery1.png', imageAlt: 'Grace Unmeasured',        category: 'theology',       title: 'Grace Unmeasured',        description: 'Understanding the boundless nature of God\'s forgiveness and how it transforms the human heart.',           readHref: '#', downloadHref: '#' },
  { id: 't5',  imageSrc: '/imagegallery2.png', imageAlt: 'Walking in Light',        category: 'christian-life', title: 'Walking in Light',        description: 'A guide to Christian ethics and daily devotion in an increasingly dark and confused world.',                readHref: '#', downloadHref: '#' },
  { id: 't6',  imageSrc: '/imagegallery3.png', imageAlt: 'The Ancient Paths',       category: 'theology',       title: 'The Ancient Paths',       description: 'Recovering the historical foundations of our faith and applying them to the challenges of modern life.',    readHref: '#', downloadHref: '#' },
  { id: 't7',  imageSrc: '/imagegallery1.png', imageAlt: 'Unity in Spirit',         category: 'christian-life', title: 'Unity in Spirit',         description: 'Strengthening the bonds of the church through biblical principles of love, forgiveness, and fellowship.',   readHref: '#', downloadHref: '#' },
  { id: 't8',  imageSrc: '/imagegallery2.png', imageAlt: 'Crucial Questions',       category: 'evangelism',     title: 'Crucial Questions',       description: 'Direct answers to the most common objections and questions people raise about the Christian faith.',         readHref: '#', downloadHref: '#' },
  { id: 't9',  imageSrc: '/imagegallery3.png', imageAlt: 'The Resurrection Truth',  category: 'theology',       title: 'The Resurrection Truth',  description: 'Examining the historical and spiritual evidence for the resurrection of Jesus Christ.',                     readHref: '#', downloadHref: '#' },
  { id: 't10', imageSrc: '/imagegallery1.png', imageAlt: 'Born Again',              category: 'evangelism',     title: 'Born Again',              description: 'What does it truly mean to be born again? A simple, clear explanation for seekers and new believers.',       readHref: '#', downloadHref: '#' },
  { id: 't11', imageSrc: '/imagegallery2.png', imageAlt: 'The Fruit of the Spirit', category: 'christian-life', title: 'The Fruit of the Spirit', description: 'How the Holy Spirit produces lasting character change in the life of every surrendered believer.',            readHref: '#', downloadHref: '#' },
  { id: 't12', imageSrc: '/imagegallery3.png', imageAlt: 'Eternity Matters',        category: 'evangelism',     title: 'Eternity Matters',        description: 'A sobering and compassionate look at what the Bible says about heaven, hell, and the choices we make now.',  readHref: '#', downloadHref: '#' },
]

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Tracts',
  theology: 'Theology',
  evangelism: 'Evangelism',
  'christian-life': 'Christian Life',
}

// ---------------------------------------------------------------------------
// Single tract card
// ---------------------------------------------------------------------------

function TractCard({ tract, index }: { tract: Tract; index: number }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Staggered slide-in on mount via IntersectionObserver
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-500"
      style={{
        boxShadow: '0px 4px 20px 0px rgba(0,0,0,0.07)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${index * 80}ms`,
        maxWidth: 'calc(100% - 16px)',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden rounded-t-2xl" style={{ height: '180px' }}>
        <Image
          src={tract.imageSrc}
          alt={tract.imageAlt}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3
          className="text-sm font-extrabold leading-snug"
          style={{ color: 'rgba(0, 6, 102, 1)' }}
        >
          {tract.title}
        </h3>
        <p className="flex-1 text-xs leading-relaxed text-gray-500 line-clamp-3">
          {tract.description}
        </p>

        {/* Read Online button */}
        <a
          href={tract.readHref}
          className="group/read mt-3 flex items-center justify-center gap-2 overflow-hidden rounded-md py-1 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:gap-3"
          style={{ backgroundColor: 'var(--church-green)' }}
        >
          <span className="transition-all duration-300 group-hover/read:opacity-0 group-hover/read:w-0 group-hover/read:overflow-hidden">
            Read Online
          </span>
          <span className="w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover/read:w-auto group-hover/read:opacity-100">
            📖 Read Online
          </span>
        </a>

        {/* Download PDF */}
        <a
          href={tract.downloadHref}
          download
          className="group/dl mt-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold transition-all duration-300"
          style={{ color: 'var(--church-green)' }}
        >
          <Download
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover/dl:translate-y-0.5"
          />
          <span className="underline underline-offset-2 transition-all duration-300 group-hover/dl:tracking-wide">
            Download PDF
          </span>
        </a>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grid with filter tabs
// ---------------------------------------------------------------------------

export function TractGrid() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [sort, setSort] = useState<string>('newest')

  const filtered = activeCategory === 'all'
    ? TRACTS
    : TRACTS.filter((t) => t.category === activeCategory)

  return (
    <>
      {/* Filter bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
        {/* Category tabs */}
        <div className="flex items-center gap-6 overflow-x-auto">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveCategory(key)}
              className="shrink-0 pb-1 text-xs font-bold uppercase tracking-widest transition-colors duration-200"
              style={{
                color: activeCategory === key ? 'var(--church-green)' : 'rgba(150,150,150,1)',
                borderBottom: activeCategory === key ? '2px solid var(--church-green)' : '2px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-medium">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-600 focus:outline-none"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((tract, i) => (
          <TractCard key={tract.id} tract={tract} index={i} />
        ))}
      </div>
    </>
  )
}
