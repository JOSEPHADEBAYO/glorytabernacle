import Image from 'next/image'

const STORY_PARAGRAPHS = [
  "Ours began with this one: What if a church could be more than a Sunday gathering? What if it could be a place where people don't just attend but are furnished unto every good work, transformed within and without, and sent out to influence the world around them for Jesus Christ?",
  "That question became a conviction, that conviction became a calling, and that calling became The RCCG Glory Tabernacle, planted in the heart of Barnstaple, North Devon, with a mandate to liberate God's people, thereby walking in absolute victory.",
  "We are a people in pursuit of God's presence, His purpose, and His glory. We believe that every person who walks through our door carries a destiny too significant to be left unfinished. We believe that ordinary people, when they encounter an extraordinary God, they become extraordinary themselves.",
  "From our first gathering to where we stand today, one thing has never changed, our hunger for His presence. Because we have learned that when God's glory rests in a place, atmospheres shift, hearts are convicted unto conversion, thereby resulting to salvation and discipleship of many.",
  'This is not just our story, it is the beginning of yours.',
  'You may have come broken, but you will not leave broken. You may have come small, but you cannot remain small because nothing small is found in the Tabernacle.',
]

export function OurStorySection() {
  return (
    <section className="bg-white px-[var(--section-padding-x)] py-20 md:py-24">
      <div className="mx-auto max-w-[88rem]">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[0.95fr_1fr] lg:gap-20">
          <div className="relative">
            <div
              className="absolute left-0 top-0 h-full w-4 rounded-l-lg"
              style={{ backgroundColor: 'var(--church-green)' }}
              aria-hidden="true"
            />
            <div className="ml-4 overflow-hidden rounded-lg bg-[#000666] shadow-[0_32px_70px_rgba(0,6,102,0.18)]">
              <div className="relative flex min-h-[38rem] items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.08),transparent_36%),linear-gradient(180deg,#07184a_0%,#000666_100%)] p-10 md:min-h-[54rem]">
                <Image
                  src="/logo-white-bg.png"
                  alt="RCCG Glory Tabernacle"
                  width={620}
                  height={620}
                  className="h-auto w-full max-w-[34rem] object-contain opacity-95"
                  sizes="(max-width: 1024px) 85vw, 42vw"
                />
              </div>
            </div>
          </div>

          <div>
            <p
              className="mb-10 text-base font-extrabold uppercase tracking-[0.2em]"
              style={{ color: 'var(--church-red)' }}
            >
              Our Story
            </p>
            <h2
              className="max-w-[54rem] text-5xl font-extrabold leading-[1.03] tracking-normal md:text-6xl xl:text-7xl"
              style={{ color: 'rgba(0, 6, 102, 1)' }}
            >
              Every Great Move of God Begins With a Question.
            </h2>

            <div className="mt-12 space-y-8 text-sm leading-[1.65] text-[#555864] md:text-[0.95rem]">
              {STORY_PARAGRAPHS.slice(0, 3).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}

              <p className="font-extrabold" style={{ color: 'rgba(0, 6, 102, 1)' }}>
                We build the Tabernacle, God fills it with His Glory. Because
                you are the TABERNACLE.
              </p>

              {STORY_PARAGRAPHS.slice(3).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p className="font-extrabold" style={{ color: 'rgba(0, 6, 102, 1)' }}>
                Welcome to RCCG GLORY TABERNACLE, Barnstaple
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
