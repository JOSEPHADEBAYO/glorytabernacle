'use client'

import Image from 'next/image'
import { useRef, useEffect } from 'react'

interface MinistryCard {
  imageSrc: string
  imageAlt: string
  tag: string
  title: string
}

interface MinistriesSectionProps {
  heading?: string
  subtext?: string
  ministries?: MinistryCard[]
}

const DEFAULT_MINISTRIES: MinistryCard[] = [
  {
    imageSrc: '/youths.png',
    imageAlt: 'Youth and young adults gathered in worship',
    tag: 'THE FORGE',
    title: 'Youth & Young Adults',
  },
  {
    imageSrc: '/men.png',
    imageAlt: 'Men of Valour ministry gathering',
    tag: 'MEN OF VALOUR',
    title: "Men's Ministry",
  },
  {
    imageSrc: '/women.png',
    imageAlt: 'Daughters of Zion women in worship',
    tag: 'DAUGHTERS OF ZION',
    title: "Women's Ministry",
  },
  {
    imageSrc: '/fellowship.png',
    imageAlt: 'Children in Sunday school',
    tag: 'LITTLE LIGHTS',
    title: "Children's Ministry",
  },
  {
    imageSrc: '/religion.png',
    imageAlt: 'Prayer and intercession ministry',
    tag: 'THE UPPER ROOM',
    title: 'Prayer & Intercession',
  },
]

// Duplicate cards for seamless infinite loop
const LOOPED = [...DEFAULT_MINISTRIES, ...DEFAULT_MINISTRIES]

export function MinistriesSection({
  heading = 'Where You Fit',
  subtext = 'Find your community within our many expressions of ministry.',
  ministries = DEFAULT_MINISTRIES,
}: MinistriesSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number | null>(null)
  const posRef = useRef(0)
  const pausedRef = useRef(false)

  // Card width + gap in px — must match the CSS below
  const CARD_W = 220
  const GAP = 16
  const STEP = CARD_W + GAP
  const TOTAL = STEP * ministries.length // width of one full set

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const tick = () => {
      if (!pausedRef.current) {
        posRef.current += 0.5 // px per frame — gentle speed
        if (posRef.current >= TOTAL) posRef.current -= TOTAL
        track.style.transform = `translateX(-${posRef.current}px)`
      }
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [TOTAL])

  const looped = [...ministries, ...ministries]

  return (
    <section
      aria-label="Ministries section"
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
          <p className="mt-2 text-sm text-gray-500">{subtext}</p>
        </div>

        {/* Carousel — overflow hidden, no scrollbar */}
        <div
          className="overflow-hidden"
          onMouseEnter={() => { pausedRef.current = true }}
          onMouseLeave={() => { pausedRef.current = false }}
        >
          <div
            ref={trackRef}
            className="flex will-change-transform"
            style={{ gap: `${GAP}px` }}
          >
            {looped.map((ministry, i) => (
              <div
                key={`${ministry.tag}-${i}`}
                className="group relative shrink-0 cursor-pointer overflow-hidden rounded-xl"
                style={{
                  width: `${CARD_W}px`,
                  // height: aspect ratio 3:4 of card width minus ~10px
                  height: `${Math.round(CARD_W * (4 / 3)) - 10}px`,
                }}
                role="button"
                tabIndex={0}
                aria-label={ministry.title}
              >
                {/* Background image */}
                <Image
                  src={ministry.imageSrc}
                  alt={ministry.imageAlt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="220px"
                />

                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,6,102,1) 0%, rgba(0,6,102,0.2) 55%, rgba(0,6,102,0) 100%)',
                  }}
                  aria-hidden="true"
                />

                {/* Text */}
                <div className="absolute bottom-0 left-0 p-4">
                  <p
                    className="mb-1 text-[0.55rem] font-bold uppercase tracking-widest"
                    style={{ color: 'rgba(163, 246, 156, 1)' }}
                  >
                    {ministry.tag}
                  </p>
                  <h3 className="text-sm font-bold leading-snug text-white">
                    {ministry.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
