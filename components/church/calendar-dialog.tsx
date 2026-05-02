'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, Clock, MapPin, Calendar } from 'lucide-react'
import type { ChurchEvent } from '@/components/church/event-card'

interface CalendarDialogProps {
  events: ChurchEvent[]
  open: boolean
  onClose: () => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function CalendarDialog({ events, open, onClose }: CalendarDialogProps) {
  const today = new Date()

  // Find the first upcoming event to set initial view month
  const firstUpcoming = events
    .map(e => new Date(e.date + 'T00:00:00'))
    .filter(d => d >= new Date(today.getFullYear(), today.getMonth(), 1))
    .sort((a, b) => a.getTime() - b.getTime())[0]

  const initialDate = firstUpcoming ?? today

  const [viewYear, setViewYear] = useState(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  if (!open) return null

  // Build event map: "YYYY-MM-DD" → ChurchEvent[]
  const eventMap: Record<string, ChurchEvent[]> = {}
  events.forEach((e) => {
    if (!eventMap[e.date]) eventMap[e.date] = []
    eventMap[e.date].push(e)
  })

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setSelectedDate(null)
  }

  function toISO(day: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const selectedEvents = selectedDate ? (eventMap[selectedDate] ?? []) : []

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Event Calendar"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ backgroundColor: 'rgba(27,34,119,1)' }}
          >
            <div className="flex items-center gap-3">
              <Calendar className="size-5 text-white/70" aria-hidden="true" />
              <h2 className="text-base font-bold text-white">Event Calendar</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
              aria-label="Close calendar"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-5">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-5 text-gray-600" />
              </button>
              <span className="text-base font-bold" style={{ color: 'rgba(27,34,119,1)' }}>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2"
                aria-label="Next month"
              >
                <ChevronRight className="size-5 text-gray-600" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-bold uppercase tracking-wider text-gray-400 py-1">
                  {d}
                </div>
              ))}

              {/* Day cells */}
              {cells.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />
                const iso = toISO(day)
                const hasEvents = !!eventMap[iso]?.length
                const isToday =
                  day === today.getDate() &&
                  viewMonth === today.getMonth() &&
                  viewYear === today.getFullYear()
                const isSelected = selectedDate === iso

                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDate(isSelected ? null : iso)}
                    className={`
                      relative flex flex-col items-center justify-center rounded-xl py-2 text-sm font-semibold
                      transition-all duration-150 focus-visible:outline-none focus-visible:ring-2
                      ${isSelected
                        ? 'text-white'
                        : isToday
                          ? 'text-white'
                          : hasEvents
                            ? 'text-gray-800 hover:bg-gray-100'
                            : 'text-gray-400 hover:bg-gray-50'
                      }
                    `}
                    style={
                      isSelected
                        ? { backgroundColor: 'rgba(27,34,119,1)' }
                        : isToday
                          ? { backgroundColor: 'var(--church-green)' }
                          : {}
                    }
                    aria-label={`${day} ${MONTHS[viewMonth]}${hasEvents ? `, ${eventMap[iso].length} event(s)` : ''}`}
                    aria-pressed={isSelected}
                  >
                    {day}
                    {hasEvents && (
                      <span
                        className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected || isToday ? 'bg-white/70' : ''}`}
                        style={!isSelected && !isToday ? { backgroundColor: 'var(--church-green)' } : {}}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected date events */}
            {selectedDate && (
              <div className="border-t border-gray-100 pt-4">
                {selectedEvents.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">No events on this date.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    {selectedEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <h3 className="text-sm font-bold" style={{ color: 'rgba(27,34,119,1)' }}>
                          {ev.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed">{ev.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" aria-hidden="true" />
                            {ev.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" aria-hidden="true" />
                            {ev.location}
                          </span>
                        </div>
                        {ev.registrationHref && ev.registrationHref.length > 0 && (
                          <a
                            href={ev.registrationHref}
                            className="self-start mt-1 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: 'var(--church-green)' }}
                          >
                            Register
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
