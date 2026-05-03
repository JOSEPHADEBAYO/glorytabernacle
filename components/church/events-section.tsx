'use client'

import { useState } from 'react'
import { EventCard, type ChurchEvent } from '@/components/church/event-card'
import { CalendarDialog } from '@/components/church/calendar-dialog'

interface EventsSectionProps {
  heading: string
  events: ChurchEvent[]
  viewAllHref?: string
}

export function EventsSection({ events }: EventsSectionProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)

  return (
    <>
      <section
        className="py-12 px-[var(--section-padding-x)]"
        style={{ backgroundColor: 'rgba(232, 232, 232, 1)' }}
      >
        <div className="max-w-[var(--container-max)] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">

            {/* Left label */}
            <div className="flex-none flex flex-row md:flex-col items-baseline md:items-start gap-1.5 md:gap-0 min-w-[90px]">
              <span
                className="text-base font-extrabold uppercase tracking-wider leading-none"
                style={{ color: 'rgba(27, 34, 119, 1)' }}
              >
                Upcoming
              </span>
              <span
                className="text-base font-extrabold uppercase tracking-wider leading-none"
                style={{ color: 'var(--church-green)' }}
              >
                Events
              </span>
            </div>

            {/* Divider — desktop only */}
            <div
              className="hidden md:block flex-none w-px self-stretch"
              style={{ backgroundColor: 'rgba(27, 34, 119, 0.15)' }}
              aria-hidden="true"
            />

            {/* Events list */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex flex-row gap-6 md:gap-10 min-w-0 pb-1">
                {events.map((event) => (
                  <div key={event.id} className="flex-none w-52 md:w-auto md:flex-1">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            </div>

            {/* View Calendar button */}
            <button
              onClick={() => setCalendarOpen(true)}
              className="flex-none text-xs font-extrabold uppercase tracking-[0.15em] transition-opacity hover:opacity-70 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
              style={{ color: 'rgba(27, 34, 119, 1)' }}
            >
              View Calendar
            </button>

          </div>
        </div>
      </section>

      <CalendarDialog
        events={events}
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
    </>
  )
}
