import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RegularEncounter {
  type: 'regular'
  tag: string
  title: string
  description: string
  time: string
  registrationHref?: string
}

interface FeaturedEncounter {
  type: 'featured'
  tag: string
  title: string
  imageSrc: string
  imageAlt: string
  registerHref: string
}

interface LinkEncounter {
  type: 'link'
  tag: string
  title: string
  description: string
  linkLabel: string
  linkHref: string
}

type Encounter = RegularEncounter | FeaturedEncounter | LinkEncounter

interface UpcomingEncountersSectionProps {
  heading?: string
  encounters?: Encounter[]
}

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const DEFAULT_ENCOUNTERS: Encounter[] = [
  {
    type: 'regular',
    tag: 'NEXT SUNDAY',
    title: 'Total Recovery Service',
    description:
      'A special service dedicated to reclaiming everything the locust has eaten. Bring your testimonies.',
    time: '09:00 AM & 11:30 AM',
  },
  {
    type: 'featured',
    tag: 'SPECIAL EVENT',
    title: 'The 2026 Hub Leadership Summit',
    imageSrc: '/web.png',
    imageAlt: 'The 2026 Hub Leadership Summit',
    registerHref: '#',
  },
  {
    type: 'link',
    tag: 'MONTHLY',
    title: 'Community Outreach Day',
    description:
      'Sharing the love of Christ through practical service in our local neighbourhoods.',
    linkLabel: 'JOIN THE TEAM',
    linkHref: '#',
  },
]

// ---------------------------------------------------------------------------
// Card sub-components
// ---------------------------------------------------------------------------

function RegularCard({ card }: { card: RegularEncounter }) {
  return (
    <div
      className="flex flex-col justify-between rounded-xl p-5 h-full"
      style={{
        backgroundColor: 'rgba(240, 242, 240, 1)',
        borderLeft: '4px solid var(--church-green)',
      }}
    >
      <div className="flex flex-col gap-2">
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--church-green)' }}
        >
          {card.tag}
        </p>
        <h3
          className="text-lg font-bold leading-snug"
          style={{ color: 'rgba(0, 6, 102, 1)' }}
        >
          {card.title}
        </h3>
        <p className="text-xs leading-relaxed text-gray-500">{card.description}</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--church-green)' }} />
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--church-green)' }}
        >
          {card.time}
        </span>
      </div>
    </div>
  )
}

function FeaturedCard({ card }: { card: FeaturedEncounter }) {
  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
    >
      {/* Text header */}
      <div className="flex flex-col gap-2 p-5">
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--church-green)' }}
        >
          {card.tag}
        </p>
        <h3 className="text-lg font-bold leading-snug text-white">
          {card.title}
        </h3>
      </div>

      {/* Image */}
      <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
        <Image
          src={card.imageSrc}
          alt={card.imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
      </div>

      {/* Register button */}
      <Link
        href={card.registerHref}
        className="mx-4 mb-4 mt-3 flex items-center justify-center rounded-md py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: 'var(--church-green)' }}
      >
        Register Now
      </Link>
    </div>
  )
}

function LinkCard({ card }: { card: LinkEncounter }) {
  return (
    <div
      className="flex flex-col justify-between rounded-xl p-5 h-full"
      style={{ backgroundColor: 'rgba(240, 242, 240, 1)' }}
    >
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
          {card.tag}
        </p>
        <h3
          className="text-lg font-bold leading-snug"
          style={{ color: 'rgba(0, 6, 102, 1)' }}
        >
          {card.title}
        </h3>
        <p className="text-xs leading-relaxed text-gray-500">{card.description}</p>
      </div>

      <Link
        href={card.linkHref}
        className="mt-4 text-xs font-bold uppercase tracking-widest underline underline-offset-2 transition-opacity hover:opacity-70"
        style={{ color: 'rgba(0, 6, 102, 1)' }}
      >
        {card.linkLabel}
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function UpcomingEncountersSection({
  heading = 'Upcoming Encounters',
  encounters = DEFAULT_ENCOUNTERS,
}: UpcomingEncountersSectionProps) {
  return (
    <section
      aria-label="Upcoming encounters"
      className="w-full py-12 px-[var(--section-padding-x)]"
      style={{ backgroundColor: 'rgba(249, 249, 249, 1)' }}
    >
      <div className="mx-auto max-w-4xl">
        {/* Heading */}
        <h2
          className="mb-8 text-3xl font-extrabold leading-tight md:text-4xl"
          style={{ color: 'rgba(0, 6, 102, 1)' }}
        >
          {heading}
        </h2>

        {/* Cards — middle card is taller via self-stretch on outer, auto on sides */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:items-stretch">
          {encounters.map((encounter, i) => (
            <div key={i} className="flex flex-col">
              {encounter.type === 'regular' && (
                <RegularCard card={encounter} />
              )}
              {encounter.type === 'featured' && (
                <FeaturedCard card={encounter} />
              )}
              {encounter.type === 'link' && (
                <LinkCard card={encounter} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
