import Image from 'next/image'

interface Stat {
  value: string
  label: string
}

interface GlobalConnectionSectionProps {
  heading?: string
  body?: string
  stats?: Stat[]
  imageSrc?: string
  imageAlt?: string
}

const DEFAULT_STATS: Stat[] = [
  { value: '190+', label: 'Nations' },
  { value: '40k+', label: 'Parishes' },
]

export function GlobalConnectionSection({
  heading = 'A Global Connection',
  body = 'Glory Tabernacle is a proud parish of the Redeemed Christian Church of God (RCCG). We are part of a global movement with over 40,000 parishes in 190 nations, committed to the expansion of God\'s Kingdom through radical love and relentless faith.',
  stats = DEFAULT_STATS,
  imageSrc = '/globe.png',
  imageAlt = 'World map showing RCCG global presence',
}: GlobalConnectionSectionProps) {
  return (
    <section
      aria-label="Global connection"
      className="w-full py-[var(--section-padding-y)] px-[var(--section-padding-x)]"
      style={{ backgroundColor: 'rgba(249, 249, 249, 1)' }}
    >
      <div
        className="mx-auto max-w-5xl overflow-hidden rounded-2xl"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 1)',
          boxShadow: '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* ── Left: text content ── */}
          <div className="flex flex-col justify-center gap-6 p-10 lg:p-16 min-h-[360px]">
            <h2
              className="text-2xl font-extrabold leading-tight md:text-3xl"
              style={{ color: 'rgba(0, 6, 102, 1)' }}
            >
              {heading}
            </h2>

            <p className="text-sm leading-7 text-gray-500">{body}</p>

            {/* Stats row */}
            <div className="flex items-center gap-0">
              {stats.map((stat, i) => (
                <div key={stat.label} className="flex items-center">
                  {/* Vertical divider between stats */}
                  {i > 0 && (
                    <div
                      className="mx-6 h-10 w-px"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.12)' }}
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-3xl font-extrabold leading-none"
                      style={{ color: 'var(--church-green)' }}
                    >
                      {stat.value}
                    </span>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-gray-400">
                      {stat.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: image ── */}
          <div className="relative min-h-[360px] md:min-h-0">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              style={{ boxShadow: '0px 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
