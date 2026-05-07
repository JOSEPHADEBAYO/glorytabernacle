'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Calendar, Clock, MapPin } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnnouncementEvent {
  /** ISO 8601 date — modal only shows if this is within the next 14 days */
  date: string
  time: string
  title: string
  subtitle?: string
  description: string
  location: string
  imageSrc?: string
  ctaLabel?: string
  ctaHref?: string
  /** localStorage key — prevents re-showing after dismiss */
  storageKey?: string
}

interface EventAnnouncementModalProps {
  event: AnnouncementEvent
  /** Days ahead to show the modal (default 14) */
  daysAhead?: number
  /** Delay before showing in ms (default 800) */
  showDelay?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function isWithinDays(iso: string, days: number) {
  const now = Date.now()
  const target = new Date(iso).getTime()
  return target >= now && target <= now + days * 86_400_000
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EventAnnouncementModal({
  event,
  daysAhead = 14,
  showDelay = 800,
}: EventAnnouncementModalProps) {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const storageKey = event.storageKey ?? `announcement-dismissed-${event.title}`

  useEffect(() => {
    // Only show if event is upcoming and not already dismissed
    if (!isWithinDays(event.date, daysAhead)) return
    if (typeof window !== 'undefined' && localStorage.getItem(storageKey)) return

    const timer = setTimeout(() => {
      setMounted(true)
      // Small tick to allow CSS transition to fire
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    }, showDelay)

    return () => clearTimeout(timer)
  }, [event.date, daysAhead, showDelay, storageKey])

  const dismiss = () => {
    setVisible(false)
    setTimeout(() => setMounted(false), 350) // wait for exit animation
    localStorage.setItem(storageKey, '1')
  }

  if (!mounted) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
        }}
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-title"
        className="fixed z-[101] w-full max-w-md"
        style={{
          top: '50%',
          left: '50%',
          opacity: visible ? 1 : 0,
          transform: visible
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -52%) scale(0.96)',
          transition: 'opacity 0.3s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className="relative overflow-hidden rounded-2xl bg-white"
          style={{ boxShadow: '0px 32px 64px -12px rgba(0,0,0,0.35)' }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close announcement"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Image */}
          {event.imageSrc && (
            <div className="relative w-full" style={{ height: '180px' }}>
              <Image
                src={event.imageSrc}
                alt={event.title}
                fill
                className="object-cover"
                sizes="448px"
              />
              {/* Gradient over image */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(0,6,102,0.7) 0%, transparent 60%)',
                }}
                aria-hidden="true"
              />
              {/* Tag on image */}
              <div className="absolute bottom-3 left-4">
                <span
                  className="rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-white"
                  style={{ backgroundColor: 'var(--church-green)' }}
                >
                  Upcoming Event
                </span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex flex-col gap-4 p-6">
            {/* Title */}
            <div>
              {event.subtitle && (
                <p
                  className="mb-1 text-[0.65rem] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--church-green)' }}
                >
                  {event.subtitle}
                </p>
              )}
              <h2
                id="announcement-title"
                className="text-xl font-extrabold leading-snug"
                style={{ color: 'rgba(0,6,102,1)' }}
              >
                {event.title}
              </h2>
            </div>

            {/* Meta */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--church-green)' }} />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--church-green)' }} />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--church-green)' }} />
                <span>{event.location}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100" aria-hidden="true" />

            {/* Description */}
            <p className="text-sm leading-relaxed text-gray-600">{event.description}</p>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              {event.ctaHref && (
                <Link
                  href={event.ctaHref}
                  onClick={dismiss}
                  className="flex-1 flex items-center justify-center rounded-lg py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--church-green)' }}
                >
                  {event.ctaLabel ?? 'Learn More'}
                </Link>
              )}
              <button
                type="button"
                onClick={dismiss}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
