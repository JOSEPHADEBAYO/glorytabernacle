import Image from 'next/image'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Book {
  imageSrc: string
  imageAlt: string
  title: string
  author: string
  description: string
  purchaseHref: string
}

interface BooksSectionProps {
  eyebrow?: string
  heading?: string
  featured?: Book
  secondary?: Book[]
}

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const DEFAULT_FEATURED: Book = {
  imageSrc: '/book1.png',
  imageAlt: 'The Power of Persistent Prayer book cover',
  title: 'The Power of Persistent Prayer',
  author: 'Dr. Emmanuel T. Adeniyi',
  description:
    'Discover the ancient keys to unlocking heaven\'s gates through unwavering spiritual discipline and practical roadmaps.',
  purchaseHref: '/books',
}

const DEFAULT_SECONDARY: Book[] = [
  {
    imageSrc: '/book2.png',
    imageAlt: 'Foundations of Restoration book cover',
    title: 'Foundations of Restoration',
    author: 'Pastor John Doe',
    description:
      'A comprehensive guide to rebuilding your spiritual walk and reclaiming lost territory in every area of life.',
    purchaseHref: '/books',
  },
  {
    imageSrc: '/book3.png',
    imageAlt: 'The Monolith Mandate book cover',
    title: 'The Monolith Mandate',
    author: 'Sarah Johnson',
    description:
      'Exploring the immutable principles of faith that create a life of weight, stability, and enduring kingdom impact.',
    purchaseHref: '/books',
  },
]

// ---------------------------------------------------------------------------
// Featured card (large left)
// ---------------------------------------------------------------------------

function FeaturedBookCard({ book }: { book: Book }) {
  return (
    <div
      className="flex flex-col sm:flex-row gap-6 rounded-2xl bg-white p-6 h-full"
      style={{ boxShadow: '0px 4px 24px 0px rgba(0, 0, 0, 0.07)' }}
    >
      {/* Book cover */}
      <div className="shrink-0 self-start">
        <div className="relative overflow-hidden rounded-xl" style={{ width: '160px', height: '220px' }}>
          <Image
            src={book.imageSrc}
            alt={book.imageAlt}
            fill
            className="object-cover"
            sizes="160px"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center gap-3">
        <h3
          className="text-2xl font-extrabold leading-snug"
          style={{ color: 'rgba(0, 6, 102, 1)' }}
        >
          {book.title}
        </h3>
        <p
          className="text-sm font-semibold"
          style={{ color: 'var(--church-green)' }}
        >
          by {book.author}
        </p>
        <p className="text-sm leading-relaxed text-gray-500">{book.description}</p>
        <Link
          href={book.purchaseHref}
          className="mt-2 inline-flex w-fit items-center justify-center rounded-md px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--church-green)' }}
        >
          Get Your Copy
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Secondary card (small right)
// ---------------------------------------------------------------------------

function SecondaryBookCard({ book }: { book: Book }) {
  return (
    <div
      className="flex gap-4 rounded-2xl bg-white p-4"
      style={{ boxShadow: '0px 4px 24px 0px rgba(0, 0, 0, 0.07)' }}
    >
      {/* Book cover */}
      <div className="shrink-0">
        <div className="relative overflow-hidden rounded-lg" style={{ width: '80px', height: '110px' }}>
          <Image
            src={book.imageSrc}
            alt={book.imageAlt}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between gap-2 min-w-0">
        <div className="flex flex-col gap-1">
          <h3
            className="text-sm font-extrabold leading-snug"
            style={{ color: 'rgba(0, 6, 102, 1)' }}
          >
            {book.title}
          </h3>
          <p
            className="text-xs font-semibold"
            style={{ color: 'var(--church-green)' }}
          >
            by {book.author}
          </p>
          <p className="text-xs leading-relaxed text-gray-500 line-clamp-3">{book.description}</p>
        </div>
        <Link
          href={book.purchaseHref}
          className="inline-flex w-full items-center justify-center rounded-md py-2 text-[0.65rem] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'rgba(0, 6, 102, 1)' }}
        >
          Get Your Copy
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function BooksSection({
  eyebrow = 'Featured Resources',
  heading = 'Books of the Month',
  featured = DEFAULT_FEATURED,
  secondary = DEFAULT_SECONDARY,
}: BooksSectionProps) {
  return (
    <section
      aria-label="Books of the month"
      className="w-full py-12 px-[var(--section-padding-x)]"
      style={{ backgroundColor: 'rgba(235, 241, 250, 1)' }}
    >
      <div className="mx-auto max-w-[var(--container-max)]">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          {/* Eyebrow with lines */}
          <div className="flex items-center gap-3">
            <div
              className="h-px w-8"
              style={{ backgroundColor: 'var(--church-green)' }}
              aria-hidden="true"
            />
            <span
              className="text-[0.65rem] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'var(--church-green)' }}
            >
              {eyebrow}
            </span>
            <div
              className="h-px w-8"
              style={{ backgroundColor: 'var(--church-green)' }}
              aria-hidden="true"
            />
          </div>

          <h2
            className="text-3xl font-extrabold leading-tight md:text-4xl"
            style={{ color: 'rgba(0, 6, 102, 1)' }}
          >
            {heading}
          </h2>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr] max-w-4xl mx-auto">
          {/* Left — featured */}
          <FeaturedBookCard book={featured} />

          {/* Right — two stacked secondary cards */}
          <div className="flex flex-col gap-5">
            {secondary.map((book) => (
              <SecondaryBookCard key={book.title} book={book} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
