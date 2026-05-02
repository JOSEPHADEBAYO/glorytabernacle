import Image from 'next/image'

interface MinistryCard {
  imageSrc: string
  imageAlt: string
  tag: string        // e.g. "THE FORGE"
  title: string      // e.g. "Youth & Young Adults"
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
]

export function MinistriesSection({
  heading = 'Where You Fit',
  subtext = 'Find your community within our many expressions of ministry.',
  ministries = DEFAULT_MINISTRIES,
}: MinistriesSectionProps) {
  return (
    <section
      aria-label="Ministries section"
      className="w-full py-[var(--section-padding-y)] px-[var(--section-padding-x)]"
      style={{ backgroundColor: 'rgba(249, 249, 249, 1)' }}
    >
      <div className="mx-auto max-w-[var(--container-max)]">
        {/* Header */}
        <div className="mb-10">
          <h2
            className="text-3xl font-extrabold leading-tight md:text-4xl"
            style={{ color: 'rgba(0, 6, 102, 1)' }}
          >
            {heading}
          </h2>
          <p className="mt-2 text-sm text-gray-500">{subtext}</p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry) => (
            <div
              key={ministry.tag}
              className="group relative overflow-hidden rounded-2xl"
              style={{ aspectRatio: '4 / 5' }}
            >
              {/* Background image */}
              <Image
                src={ministry.imageSrc}
                alt={ministry.imageAlt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />

              {/* Gradient overlay — bottom to top */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,6,102,1) 0%, rgba(0,6,102,0.2) 50%, rgba(0,6,102,0) 100%)',
                }}
                aria-hidden="true"
              />

              {/* Text content — pinned to bottom-left */}
              <div className="absolute bottom-0 left-0 p-6">
                <p
                  className="mb-1.5 text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'rgba(163, 246, 156, 1)' }}
                >
                  {ministry.tag}
                </p>
                <h3 className="text-xl font-bold leading-snug text-white md:text-2xl">
                  {ministry.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
