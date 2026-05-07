'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Group {
  id: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  ctaLabel?: string
  ctaHref?: string
}

interface HighlightCard {
  id: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  ctaLabel: string
  ctaHref: string
}

interface GroupsClientProps {
  groups: Group[]
  highlightCards: HighlightCard[]
}

export function GroupsClient({ groups, highlightCards }: GroupsClientProps) {
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set(prev).add(entry.target.id))
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    const elements = document.querySelectorAll('[data-animate]')
    elements.forEach((el) => {
      if (observerRef.current) {
        observerRef.current.observe(el)
      }
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  const highlightBackgrounds = [
    'rgba(26, 35, 126, 1)',
    'rgba(228, 226, 225, 1)',
    'rgba(246, 243, 242, 1)',
  ]

  return (
    <div className="space-y-16 md:space-y-20">
      {groups.map((group, index) => {
        const isImageLeft = index % 2 === 0
        const groupNumber = index + 1
        const shouldShowHighlight = groupNumber % 4 === 0
        const highlightIndex = Math.floor(groupNumber / 4) - 1
        const bgColor = highlightBackgrounds[highlightIndex % highlightBackgrounds.length]
        const isDarkBg = bgColor === 'rgba(26, 35, 126, 1)'

        return (
          <div key={group.id} className="space-y-16 md:space-y-20">
            {/* Regular Group Card */}
            <article className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center group">
              {/* Image */}
              <div
                id={`image-${group.id}`}
                data-animate="true"
                className={`relative overflow-hidden rounded-2xl shadow-md transition-all duration-1000 w-full group-hover:shadow-2xl ${
                  isImageLeft ? 'md:order-1' : 'md:order-2'
                } ${
                  visibleItems.has(`image-${group.id}`)
                    ? 'opacity-100 translate-x-0'
                    : isImageLeft
                    ? 'opacity-0 -translate-x-20'
                    : 'opacity-0 translate-x-20'
                }`}
                style={{ 
                  aspectRatio: '4/3', 
                  maxWidth: '500px', 
                  height: 'auto',
                  minHeight: '300px',
                  margin: isImageLeft ? '0' : '0 0 0 auto' 
                }}
              >
                <Image
                  src={group.imageSrc}
                  alt={group.imageAlt}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
                {/* Subtle overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* Text Content */}
              <div
                id={`text-${group.id}`}
                data-animate="true"
                className={`flex flex-col gap-5 transition-all duration-1000 delay-300 ${
                  isImageLeft ? 'md:order-2' : 'md:order-1'
                } ${
                  visibleItems.has(`text-${group.id}`)
                    ? 'opacity-100'
                    : 'opacity-0'
                }`}
              >
                {/* Group Title */}
                <h3
                  className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight group-hover:text-[#1A237E] transition-colors duration-300"
                  style={{ color: '#000666' }}
                >
                  {group.title}
                </h3>

                {/* Group Description */}
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  {group.description}
                </p>

                {/* CTA Button */}
                {group.ctaLabel && group.ctaHref && (
                  <Link
                    href={group.ctaHref}
                    className="inline-flex items-center justify-center gap-2 w-fit px-8 py-3.5 rounded-lg font-semibold text-white text-base transition-all hover:gap-3 hover:shadow-lg hover:-translate-y-0.5"
                    style={{ backgroundColor: '#1B6D24' }}
                  >
                    {group.ctaLabel}
                    <svg
                      className="w-4 h-4 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                )}
              </div>
            </article>

            {/* Highlight Card - appears after every 4 groups */}
            {shouldShowHighlight && highlightIndex < highlightCards.length && (
              <article
                id={`highlight-${highlightIndex}`}
                data-animate="true"
                className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-1000 group ${
                  visibleItems.has(`highlight-${highlightIndex}`)
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-20'
                }`}
                style={{ backgroundColor: bgColor }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center min-h-[380px]">
                  {/* Image */}
                  <div className="relative w-full h-80 md:h-full md:min-h-[380px] overflow-hidden" style={{ maxHeight: '420px' }}>
                    <Image
                      src={highlightCards[highlightIndex].imageSrc}
                      alt={highlightCards[highlightIndex].imageAlt}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {/* Subtle overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
                  </div>

                  {/* Text Content */}
                  <div className="flex flex-col gap-7 p-10 md:p-12 lg:p-16">
                    {/* Title */}
                    <h3
                      className={`text-3xl md:text-4xl lg:text-5xl font-bold leading-tight ${
                        isDarkBg ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {highlightCards[highlightIndex].title}
                    </h3>

                    {/* Description */}
                    <p
                      className={`text-base md:text-lg leading-relaxed ${
                        isDarkBg ? 'text-white/95' : 'text-gray-700'
                      }`}
                    >
                      {highlightCards[highlightIndex].description}
                    </p>

                    {/* CTA Button */}
                    <Link
                      href={highlightCards[highlightIndex].ctaHref}
                      className={`inline-flex items-center justify-center gap-2 w-fit px-8 py-4 rounded-lg font-semibold text-base transition-all hover:gap-3 hover:shadow-2xl hover:-translate-y-0.5 ${
                        isDarkBg 
                          ? 'bg-white text-gray-900 hover:bg-gray-50' 
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {highlightCards[highlightIndex].ctaLabel}
                      <svg
                        className="w-5 h-5 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            )}
          </div>
        )
      })}
    </div>
  )
}
