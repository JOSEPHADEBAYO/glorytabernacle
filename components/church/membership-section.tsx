import Image from 'next/image'
import Link from 'next/link'

interface MembershipSectionProps {
  imageSrc?: string
  imageAlt?: string
  heading?: string
  body?: string
  ctaLabel?: string
  ctaHref?: string
}

export function MembershipSection({
  imageSrc = '/join.png',
  imageAlt = 'People worshipping with raised hands at Glory Tabernacle',
  heading = 'Join Glory Tabernacle Today.',
  body = 'Become a part of our growing community and find a place to belong, grow, and serve. Whether you’re new or have been with us for years, we’d love to officially welcome you.',
  ctaLabel = 'Become a Member',
  ctaHref = '/becomemember',
}: MembershipSectionProps) {
  return (
    <section
      aria-labelledby="membership-heading"
      className="w-full bg-[#f7f7f7] px-[var(--section-padding-x)] py-14 md:py-20"
    >
      <div className="mx-auto grid max-w-[88rem] grid-cols-1 overflow-hidden bg-white shadow-[0_18px_45px_rgba(0,6,102,0.08)] lg:min-h-[34rem] lg:grid-cols-2">
        <div className="relative min-h-[22rem] lg:min-h-full">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        <div className="flex items-center px-8 py-12 sm:px-12 md:px-16 lg:px-20">
          <div className="max-w-[34rem]">
            <h2
              id="membership-heading"
              className="text-4xl font-extrabold leading-[0.98] tracking-normal md:text-5xl lg:text-[4rem]"
              style={{ color: 'rgba(0, 6, 102, 1)' }}
            >
              {heading}
            </h2>

            <p className="mt-8 max-w-[32rem] text-xl font-normal leading-[1.65] text-[#555864] md:text-[1.55rem]">
              {body}
            </p>

            <Link
              href={ctaHref}
              className="mt-10 inline-flex min-h-16 min-w-[18rem] items-center justify-center rounded-md px-9 text-base font-extrabold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:text-lg"
              style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
