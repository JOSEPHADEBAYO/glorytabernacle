'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export interface HeroSlide {
  backgroundImage: string
  backgroundAlt?: string
  eyebrow?: string
  headline: string
  headlineAccent?: string
  headlineLine2?: string
  subtext?: string
}

interface HeroSectionProps {
  slides: HeroSlide[]
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
  autoPlayInterval?: number
}

export function HeroSection({
  slides,
  primaryCta,
  secondaryCta,
  autoPlayInterval = 5000,
}: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startInterval = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, autoPlayInterval)
  }, [slides.length, autoPlayInterval])

  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    startInterval()
    return () => clearCurrentInterval()
  }, [startInterval, clearCurrentInterval])

  // Track each image's natural dimensions so the hero's aspect ratio can
  // match the active slide exactly — that way the whole image is visible
  // at full width with no cropping, regardless of the photo's shape.
  const [imageDims, setImageDims] = useState<
    Record<number, { w: number; h: number }>
  >({})

  const handleImageLoad = useCallback(
    (index: number, w: number, h: number) => {
      if (!w || !h) return
      setImageDims((prev) => (prev[index] ? prev : { ...prev, [index]: { w, h } }))
    },
    []
  )

  // Aspect ratio for the active slide; fall back to 16:9 until the first
  // photo has been measured.
  const activeDims = imageDims[activeIndex]
  const sectionAspectRatio = activeDims
    ? `${activeDims.w} / ${activeDims.h}`
    : '16 / 9'

  return (
    <section
      role="region"
      aria-label="Hero slideshow"
      className="relative w-full overflow-x-hidden"
      style={{
        aspectRatio: sectionAspectRatio,
        transition: 'aspect-ratio 700ms ease-in-out',
      }}
      onMouseEnter={clearCurrentInterval}
      onMouseLeave={startInterval}
    >
      {/* Background slides. The section's aspect ratio is driven by the
          active slide's measured dimensions, so object-cover here fills the
          full hero without cropping a single pixel — every detail of the
          photo is shown at full width. */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1200 ease-in-out ${
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ zIndex: 0 }}
        >
          <Image
            src={slide.backgroundImage}
            alt={slide.backgroundAlt ?? slide.headline}
            fill
            className="object-cover object-center"
            {...(index === 0 ? { loading: 'eager' } : { loading: 'lazy' })}
            sizes="100vw"
            onLoad={(event) => {
              const img = event.currentTarget as HTMLImageElement
              handleImageLoad(index, img.naturalWidth, img.naturalHeight)
            }}
          />
        </div>
      ))}

      {/* Overlay: kept very subtle so the photo stays clear. A faint dark
          band at the very bottom keeps the dot indicators legible against
          bright photos; the headline + CTAs no longer need overlay contrast
          because they live inside the glass panel on the right. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, transparent 78%, rgba(0, 0, 0, 0.25) 100%)',
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* Content — glassmorphism panel pinned to the right on md+ screens.
          On mobile the panel is hidden entirely so the photo can breathe;
          the small screen has no room for a side panel without crowding the
          image. */}
      <div
        className="absolute inset-0 hidden md:flex items-center justify-end md:px-10 lg:px-16"
        style={{ zIndex: 2 }}
      >
        <div
          className="relative w-full max-w-md lg:max-w-lg rounded-2xl border border-white/25 p-6 sm:p-8 md:p-9 text-left shadow-2xl"
          style={{
            // Dark-tinted frosted glass instead of light. White text and
            // white-bordered CTAs now have proper contrast even when the
            // photo behind the panel is bright.
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`w-full transition-all duration-700 ease-in-out ${
                index === activeIndex
                  ? 'opacity-100 translate-y-0 relative'
                  : 'opacity-0 translate-y-4 absolute inset-x-6 sm:inset-x-8 md:inset-x-9 top-6 sm:top-8 md:top-9 pointer-events-none'
              }`}
            >
              {/* Eyebrow pill */}
              {slide.eyebrow && (
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-white/30 bg-white/10">
                  <Image
                    src="/religion.png"
                    alt=""
                    width={14}
                    height={14}
                    className="opacity-80"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold tracking-[0.2em] text-white/90 uppercase">
                    {slide.eyebrow}
                  </span>
                </div>
              )}

              {/* Headline. No text-shadow needed — the glass panel provides
                  the contrast. */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
                {slide.headline}{' '}
                {slide.headlineAccent && (
                  <span style={{ color: 'var(--church-light-green)' }}>
                    {slide.headlineAccent}
                  </span>
                )}
                {slide.headlineLine2 && (
                  <>
                    <br />
                    {slide.headlineLine2}
                  </>
                )}
              </h1>

              {slide.subtext && (
                <p className="mt-4 text-sm sm:text-base text-white/90">
                  {slide.subtext}
                </p>
              )}
            </div>
          ))}

          {/* CTAs — shared across slides, left-aligned inside the panel. */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
            <Link
              href={primaryCta.href}
              className="inline-flex items-center justify-center px-6 py-3 rounded-md font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ backgroundColor: 'var(--church-green)' }}
            >
              {primaryCta.label}
            </Link>
            <Link
              href={secondaryCta.href}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold text-white border-2 border-white/80 bg-transparent transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Image
                src="/play.png"
                alt=""
                width={18}
                height={18}
                className="opacity-90"
                aria-hidden="true"
              />
              {secondaryCta.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div
        className="absolute bottom-6 left-0 right-0 flex justify-center gap-3"
        style={{ zIndex: 3 }}
        aria-label="Slide indicators"
      >
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              index === activeIndex
                ? 'w-6 h-3 bg-white opacity-100'
                : 'w-3 h-3 bg-white opacity-40'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
