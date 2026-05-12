'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Clock, ExternalLink, Search } from 'lucide-react'

export interface PublicSermon {
  id: string
  title: string
  series: string | null
  speaker: string
  date: string
  duration: string
  description: string
  thumbnail: string
  videoUrl: string
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function SermonGrid({ sermons }: { sermons: PublicSermon[] }) {
  const [search, setSearch] = useState('')
  const [series, setSeries] = useState('All Series')

  const seriesOptions = useMemo(
    () => Array.from(new Set(sermons.map((sermon) => sermon.series).filter(Boolean))) as string[],
    [sermons]
  )

  const filtered = sermons.filter((sermon) => {
    const matchesSearch =
      search.trim() === '' ||
      sermon.title.toLowerCase().includes(search.trim().toLowerCase())
    const matchesSeries = series === 'All Series' || sermon.series === series
    return matchesSearch && matchesSeries
  })

  if (sermons.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
        No sermons are available yet. Check back soon.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-[1fr_220px]">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sermons"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--church-green)] focus:ring-2 focus:ring-green-100"
          />
        </label>
        <select
          value={series}
          onChange={(event) => setSeries(event.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[var(--church-green)] focus:ring-2 focus:ring-green-100"
        >
          <option>All Series</option>
          {seriesOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          No sermons match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sermon) => (
            <article
              key={sermon.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-video bg-gray-100">
                <Image
                  src={sermon.thumbnail}
                  alt={sermon.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                />
              </div>
              <div className="flex min-h-56 flex-col gap-3 p-5">
                {sermon.series && (
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--church-green)' }}>
                    {sermon.series}
                  </p>
                )}
                <h3 className="text-lg font-extrabold leading-snug" style={{ color: 'rgba(27,34,119,1)' }}>
                  {sermon.title}
                </h3>
                <p className="text-xs font-medium text-gray-500">
                  {sermon.speaker} · {formatDate(sermon.date)}
                </p>
                <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">
                  {sermon.description}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    {sermon.duration}
                  </span>
                  <a
                    href={sermon.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-white"
                    style={{ backgroundColor: 'var(--church-green)' }}
                  >
                    Watch
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
