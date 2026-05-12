'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Download } from 'lucide-react'
import type { Tract } from '@/lib/types/tract'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// For display purposes, we'll map the database Tract to a display format
interface DisplayTract {
  id: string
  imageSrc: string
  imageAlt: string
  category: string
  title: string
  description: string
  documentUrl: string
}

/**
 * Maps a database Tract record to the DisplayTract format used by the UI
 */
function mapTractToDisplay(tract: Tract): DisplayTract {
  return {
    id: tract.id,
    imageSrc: tract.coverImage,
    imageAlt: tract.title,
    category: tract.category,
    title: tract.title,
    description: tract.description,
    documentUrl: tract.documentUrl,
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Tracts',
  Theology: 'Theology',
  Evangelism: 'Evangelism',
  Discipleship: 'Discipleship',
  'Prayer & Intercession': 'Prayer & Intercession',
  'Christian Living': 'Christian Living',
  Salvation: 'Salvation',
  'Faith & Doctrine': 'Faith & Doctrine',
  'End Times': 'End Times',
  Other: 'Other',
}

// ---------------------------------------------------------------------------
// Single tract card
// ---------------------------------------------------------------------------

function TractCard({ tract, index }: { tract: DisplayTract; index: number }) {
  const [visible, setVisible] = useState(false)
  const [imageError, setImageError] = useState(false)
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
        {imageError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-gray-400 mb-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <span className="text-gray-400 text-xs">Image unavailable</span>
          </div>
        ) : (
          <Image
            src={tract.imageSrc}
            alt={tract.imageAlt}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={index < 4}
            onError={() => setImageError(true)}
          />
        )}
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

        {/* View PDF button */}
        <a
          href={tract.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group/read mt-3 flex items-center justify-center gap-2 overflow-hidden rounded-md py-1 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:gap-3"
          style={{ backgroundColor: 'var(--church-green)' }}
        >
          <span className="transition-all duration-300 group-hover/read:opacity-0 group-hover/read:w-0 group-hover/read:overflow-hidden">
            View PDF
          </span>
          <span className="w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover/read:w-auto group-hover/read:opacity-100">
            📖 View PDF
          </span>
        </a>

        {/* Download PDF */}
        <a
          href={tract.documentUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
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

interface TractGridProps {
  tracts: Tract[]
}

export function TractGrid({ tracts }: TractGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [sort, setSort] = useState<string>('newest')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Map database tracts to display format
  const displayTracts = tracts.map(mapTractToDisplay)

  // Apply category and search filters
  const filtered = displayTracts.filter((t) => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory
    const matchesSearch = searchQuery === '' || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Handle empty state
  if (displayTracts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tracts available at the moment. Check back soon!</p>
      </div>
    )
  }

  return (
    <>
      {/* Search Bar */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Tracts
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

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
