import Image from 'next/image'

interface Pillar {
  title: string
  description: string
}

interface AboutSectionProps {
  eyebrow?: string
  heading: string
  body: string
  pillars?: Pillar[]
  yearsOfMinistry?: number
  image: {
    src: string
    alt: string
    width: number
    height: number
  }
}

export function AboutSection({
  eyebrow = 'Our Foundation',
  heading,
  body,
  pillars,
  yearsOfMinistry,
  image,
}: AboutSectionProps) {
  return (
    <section
      className="py-[var(--section-padding-y)] px-[var(--section-padding-x)]"
      style={{ backgroundColor: 'rgba(249, 249, 249, 1)' }}
    >
      <div className="max-w-[var(--container-max)] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Left: text column */}
        <div className="flex flex-col gap-6">

          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span
              className="block h-0.5 w-8"
              style={{ backgroundColor: 'var(--church-green)' }}
              aria-hidden="true"
            />
            <span
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: 'var(--church-green)' }}
            >
              {eyebrow}
            </span>
          </div>

          {/* Heading */}
          <h2
            className="text-4xl md:text-5xl font-extrabold leading-tight"
            style={{ color: 'rgba(27, 34, 119, 1)' }}
          >
            {heading}
          </h2>

          {/* Body */}
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            {body}
          </p>

          {/* Pillars — two columns */}
          {pillars && pillars.length > 0 && (
            <div className="grid grid-cols-2 gap-6 pt-2">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="flex flex-col gap-1">
                  <h3
                    className="text-base font-bold"
                    style={{ color: 'var(--church-green)' }}
                  >
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: image with badge */}
        <div className="relative flex justify-center md:justify-end">
          {/* Outer wrapper — overflow visible so badge can bleed outside */}
          <div className="relative w-full max-w-md">
            {/* Image card */}
            <div
              className="relative rounded-2xl overflow-hidden w-full bg-white"
              style={{
                boxShadow: '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={300}
                //className="object-cover w-full h-auto"
                style={{ filter: 'grayscale(30%) brightness(0.92) contrast(1.05)' }}
              />
            </div>

            {/* Years of ministry badge — vertically centered, bleeds off right edge */}
            {yearsOfMinistry && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -right-5 flex flex-col items-center justify-center w-32 h-32 rounded-2xl shadow-lg"
                style={{ backgroundColor: 'rgba(160, 243, 153, 1)' }}
              >
                <span
                  className="text-4xl font-extrabold leading-none"
                  style={{ color: 'var(--church-green)' }}
                >
                  {yearsOfMinistry}+
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-widest text-center mt-1 leading-tight"
                  style={{ color: 'var(--church-green)' }}
                >
                  Years of<br />Ministry
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
