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

  return (
    <section
      role="region"
      aria-label="Hero slideshow"
      className="relative w-full overflow-x-hidden"
      style={{ height: 'calc(100vh - 4rem)' }}
      onMouseEnter={clearCurrentInterval}
      onMouseLeave={startInterval}
    >
      {/* Background slides */}
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
          />
        </div>
      ))}

      {/* Overlay: dark navy + blur */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 6, 102, 0.6)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* Content — centered horizontally and vertically */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{ zIndex: 2 }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`w-full flex flex-col items-center transition-all duration-700 ease-in-out ${
              index === activeIndex
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4 absolute pointer-events-none'
            }`}
          >
            {/* Eyebrow pill */}
            {slide.eyebrow && (
              <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm">
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

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white max-w-4xl">
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
              <p className="mt-4 text-base sm:text-lg text-white/75 max-w-xl">
                {slide.subtext}
              </p>
            )}
          </div>
        ))}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link
            href={primaryCta.href}
            className="inline-flex items-center justify-center px-8 py-3 rounded-md font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ backgroundColor: 'var(--church-green)' }}
          >
            {primaryCta.label}
          </Link>
          <Link
            href={secondaryCta.href}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-md font-semibold text-white border-2 border-white/60 bg-transparent transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
