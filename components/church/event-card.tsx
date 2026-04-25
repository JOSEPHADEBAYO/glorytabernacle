import Link from 'next/link'

export interface ChurchEvent {
  id: string
  title: string
  date: string        // ISO 8601 e.g. "2025-06-15"
  time: string        // e.g. "7:00 PM"
  location: string
  description: string
  image?: string
  registrationHref?: string
}

interface EventCardProps {
  event: ChurchEvent
}

function parseDateParts(iso: string): { month: string; day: string } {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: String(day),
  }
}

export function EventCard({ event }: EventCardProps) {
  const { month, day } = parseDateParts(event.date)

  return (
    <div className="flex items-center gap-4 min-w-0">
      {/* Date badge */}
      <div
        className="flex-none flex flex-col items-center justify-center w-16 h-16 rounded-xl"
        style={{ backgroundColor: 'rgba(232, 232, 232, 1)' }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-widest leading-none"
          style={{ color: 'rgba(27, 34, 119, 1)' }}
        >
          {month}
        </span>
        <span
          className="text-3xl font-extrabold leading-tight"
          style={{ color: 'var(--church-green)' }}
        >
          {day}
        </span>
      </div>

      {/* Event info */}
      <div className="flex flex-col min-w-0">
        <h3
          className="text-sm font-bold leading-snug truncate"
          style={{ color: 'rgba(27, 34, 119, 1)' }}
        >
          {event.registrationHref && event.registrationHref.length > 0 ? (
            <Link href={event.registrationHref} className="hover:underline">
              {event.title}
            </Link>
          ) : (
            event.title
          )}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {event.time} &bull; {event.location}
        </p>
      </div>
    </div>
  )
}
