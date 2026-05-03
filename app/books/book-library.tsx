'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Book {
  id: string
  imageSrc: string
  imageAlt: string
  category: string
  title: string
  author: string
  description: string
  purchaseHref: string
}

// ---------------------------------------------------------------------------
// 30 books
// ---------------------------------------------------------------------------

export const BOOKS: Book[] = [
  { id: 'b1',  imageSrc: '/book1.png', imageAlt: 'Foundations of Grace',         category: 'Spiritual Growth', title: 'Foundations of Grace',          author: 'Dr. Emmanuel T. Adeniyi',  description: 'An in-depth exploration of God\'s unmerited favour and how it transforms every area of your life.',                              purchaseHref: '#' },
  { id: 'b2',  imageSrc: '/book2.png', imageAlt: 'Silent Echoes',                category: 'Prayer',           title: 'Silent Echoes',                  author: 'Pastor John Doe',          description: 'Discover the hidden language of prayer and how silence becomes the loudest conversation with God.',                              purchaseHref: '#' },
  { id: 'b3',  imageSrc: '/book3.png', imageAlt: 'Bloodline of Faith',           category: 'Faith',            title: 'Bloodline of Faith',             author: 'Sarah Johnson',            description: 'Tracing the unbroken thread of faith from Abraham to you — and what it means for your destiny.',                               purchaseHref: '#' },
  { id: 'b4',  imageSrc: '/book1.png', imageAlt: 'The Resilient Spirit',         category: 'Resilience',       title: 'The Resilient Spirit',           author: 'Pastor James Okafor',      description: 'Practical wisdom for bouncing back from life\'s hardest seasons with renewed purpose and strength.',                            purchaseHref: '#' },
  { id: 'b5',  imageSrc: '/book2.png', imageAlt: 'Walking in Light',             category: 'Discipleship',     title: 'Walking in Light',               author: 'Deaconess Ruth Mensah',    description: 'A step-by-step guide to living a life that reflects the glory of God in every ordinary moment.',                               purchaseHref: '#' },
  { id: 'b6',  imageSrc: '/book3.png', imageAlt: 'Lead Like Gideon',             category: 'Leadership',       title: 'Lead Like Gideon',               author: 'Bishop Samuel Eze',        description: 'Kingdom leadership principles drawn from the life of Gideon for the modern believer.',                                          purchaseHref: '#' },
  { id: 'b7',  imageSrc: '/book1.png', imageAlt: 'The Living Word',              category: 'Bible Study',      title: 'The Living Word',                author: 'Dr. Emmanuel T. Adeniyi',  description: 'How to make Scripture come alive in your daily devotion and transform your thinking.',                                          purchaseHref: '#' },
  { id: 'b8',  imageSrc: '/book2.png', imageAlt: 'Reigning in Wisdom',           category: 'Wisdom',           title: 'Reigning in Wisdom',             author: 'Pastor John Doe',          description: 'Unlocking the seven pillars of divine wisdom that position you for lasting kingdom impact.',                                    purchaseHref: '#' },
  { id: 'b9',  imageSrc: '/book3.png', imageAlt: 'Still Waters',                 category: 'Peace',            title: 'Still Waters',                   author: 'Sarah Johnson',            description: 'A contemplative journey into the peace that surpasses all understanding, even in life\'s storms.',                              purchaseHref: '#' },
  { id: 'b10', imageSrc: '/book1.png', imageAlt: 'The Anointed Life',            category: 'Holy Spirit',      title: 'The Anointed Life',              author: 'Pastor James Okafor',      description: 'Understanding the role of the Holy Spirit in empowering you for purpose-driven living.',                                        purchaseHref: '#' },
  { id: 'b11', imageSrc: '/book2.png', imageAlt: 'Covenant Keeper',              category: 'Faith',            title: 'Covenant Keeper',                author: 'Deaconess Ruth Mensah',    description: 'Exploring God\'s unbreakable promises and how to stand firm on every word He has spoken.',                                     purchaseHref: '#' },
  { id: 'b12', imageSrc: '/book3.png', imageAlt: 'Kingdom Economics',            category: 'Stewardship',      title: 'Kingdom Economics',              author: 'Bishop Samuel Eze',        description: 'Biblical principles for financial freedom, generosity, and building wealth for God\'s glory.',                                  purchaseHref: '#' },
  { id: 'b13', imageSrc: '/book1.png', imageAlt: 'Unshakeable',                  category: 'Resilience',       title: 'Unshakeable',                    author: 'Dr. Emmanuel T. Adeniyi',  description: 'How to build a faith that stands firm when everything around you is shifting and uncertain.',                                   purchaseHref: '#' },
  { id: 'b14', imageSrc: '/book2.png', imageAlt: 'The Worshipper\'s Heart',      category: 'Worship',          title: 'The Worshipper\'s Heart',        author: 'Pastor John Doe',          description: 'Cultivating a lifestyle of worship that goes beyond Sunday and permeates every moment of your day.',                            purchaseHref: '#' },
  { id: 'b15', imageSrc: '/book3.png', imageAlt: 'Prophetic Dimensions',         category: 'Prophecy',         title: 'Prophetic Dimensions',           author: 'Sarah Johnson',            description: 'Navigating the prophetic gifts with wisdom, accountability, and a heart surrendered to God.',                                   purchaseHref: '#' },
  { id: 'b16', imageSrc: '/book1.png', imageAlt: 'Grace Under Fire',             category: 'Spiritual Growth', title: 'Grace Under Fire',               author: 'Pastor James Okafor',      description: 'Stories and principles of believers who thrived in the most difficult circumstances through grace.',                             purchaseHref: '#' },
  { id: 'b17', imageSrc: '/book2.png', imageAlt: 'The Praying Family',           category: 'Family',           title: 'The Praying Family',             author: 'Deaconess Ruth Mensah',    description: 'Practical tools for building a home where prayer is the foundation of every relationship.',                                     purchaseHref: '#' },
  { id: 'b18', imageSrc: '/book3.png', imageAlt: 'Marketplace Ministry',         category: 'Leadership',       title: 'Marketplace Ministry',           author: 'Bishop Samuel Eze',        description: 'How to carry the presence of God into your workplace and transform your professional sphere.',                                  purchaseHref: '#' },
  { id: 'b19', imageSrc: '/book1.png', imageAlt: 'Healing Streams',              category: 'Healing',          title: 'Healing Streams',                author: 'Dr. Emmanuel T. Adeniyi',  description: 'A scriptural journey through God\'s healing power and how to receive it in body, soul, and spirit.',                           purchaseHref: '#' },
  { id: 'b20', imageSrc: '/book2.png', imageAlt: 'The Fasting Life',             category: 'Prayer',           title: 'The Fasting Life',               author: 'Pastor John Doe',          description: 'Unlocking the spiritual discipline of fasting and its transformative power in the life of a believer.',                         purchaseHref: '#' },
  { id: 'b21', imageSrc: '/book3.png', imageAlt: 'Daughters of Destiny',         category: 'Women',            title: 'Daughters of Destiny',           author: 'Sarah Johnson',            description: 'Empowering women to walk boldly in their God-given identity, gifts, and calling.',                                              purchaseHref: '#' },
  { id: 'b22', imageSrc: '/book1.png', imageAlt: 'Sons of Thunder',              category: 'Men',              title: 'Sons of Thunder',                author: 'Pastor James Okafor',      description: 'A call to men to rise up in spiritual authority, integrity, and sacrificial love for their families.',                           purchaseHref: '#' },
  { id: 'b23', imageSrc: '/book2.png', imageAlt: 'The Intercession Manual',      category: 'Prayer',           title: 'The Intercession Manual',        author: 'Deaconess Ruth Mensah',    description: 'A comprehensive guide to standing in the gap for nations, families, and communities through prayer.',                           purchaseHref: '#' },
  { id: 'b24', imageSrc: '/book3.png', imageAlt: 'Redeeming the Time',           category: 'Discipleship',     title: 'Redeeming the Time',             author: 'Bishop Samuel Eze',        description: 'How to steward your hours, days, and seasons with intentionality and kingdom purpose.',                                         purchaseHref: '#' },
  { id: 'b25', imageSrc: '/book1.png', imageAlt: 'The Overcomer\'s Code',        category: 'Faith',            title: 'The Overcomer\'s Code',          author: 'Dr. Emmanuel T. Adeniyi',  description: 'Seven biblical keys that unlock the power to overcome every obstacle the enemy places in your path.',                           purchaseHref: '#' },
  { id: 'b26', imageSrc: '/book2.png', imageAlt: 'Rooted and Grounded',          category: 'Spiritual Growth', title: 'Rooted and Grounded',            author: 'Pastor John Doe',          description: 'Building deep spiritual roots that sustain you through every season of growth and pruning.',                                    purchaseHref: '#' },
  { id: 'b27', imageSrc: '/book3.png', imageAlt: 'The Servant King',             category: 'Leadership',       title: 'The Servant King',               author: 'Sarah Johnson',            description: 'Redefining greatness through the lens of Jesus\' model of servant leadership for today\'s world.',                             purchaseHref: '#' },
  { id: 'b28', imageSrc: '/book1.png', imageAlt: 'Fire on the Altar',            category: 'Worship',          title: 'Fire on the Altar',              author: 'Pastor James Okafor',      description: 'Keeping the flame of devotion burning bright through consistent spiritual disciplines and sacrifice.',                           purchaseHref: '#' },
  { id: 'b29', imageSrc: '/book2.png', imageAlt: 'The Promised Land Mindset',    category: 'Faith',            title: 'The Promised Land Mindset',      author: 'Deaconess Ruth Mensah',    description: 'Shifting your thinking from wilderness survival to promised land abundance in every area of life.',                             purchaseHref: '#' },
  { id: 'b30', imageSrc: '/book3.png', imageAlt: 'Eternal Perspective',          category: 'Bible Study',      title: 'Eternal Perspective',            author: 'Bishop Samuel Eze',        description: 'How keeping eternity in view transforms the way you live, love, work, and make decisions today.',                               purchaseHref: '#' },
]

const INITIAL_COUNT = 12
const LOAD_MORE_COUNT = 6

// ---------------------------------------------------------------------------
// Book card
// ---------------------------------------------------------------------------

function BookCard({ book }: { book: Book }) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl bg-white"
      style={{
        boxShadow: '0px 4px 20px 0px rgba(0,0,0,0.07)',
        maxWidth: 'calc(100% - 80px)',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Image — top corners match card radius exactly */}
      <div className="relative w-full overflow-hidden rounded-t-2xl" style={{ height: '200px' }}>
        <Image
          src={book.imageSrc}
          alt={book.imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p
          className="text-[0.65rem] font-bold uppercase tracking-widest"
          style={{ color: 'var(--church-green)' }}
        >
          {book.category}
        </p>
        <h3
          className="text-base font-extrabold leading-snug"
          style={{ color: 'rgba(0, 6, 102, 1)' }}
        >
          {book.title}
        </h3>
        <p className="text-xs text-gray-400">{book.author}</p>
        <p className="flex-1 text-xs leading-relaxed text-gray-500">{book.description}</p>
        <Link
          href={book.purchaseHref}
          className="mt-3 flex items-center justify-center gap-1 rounded-md py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--church-green)' }}
        >
          Get Book →
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Library with load-more
// ---------------------------------------------------------------------------

export function BookLibrary() {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const visibleBooks = BOOKS.slice(0, visibleCount)
  const hasMore = visibleCount < BOOKS.length
  const showLoadMore = BOOKS.length > 12 && hasMore

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {/* Footer controls */}
      {(BOOKS.length > 12) && (
        <div className="mt-10 flex items-center justify-between">
          {/* Load More — centred, only when more remain */}
          <div className="flex-1 flex justify-center">
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => Math.min(c + LOAD_MORE_COUNT, BOOKS.length))}
                className="text-sm font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: 'rgba(0, 6, 102, 1)' }}
              >
                Load More Titles
              </button>
            )}
          </div>

          {/* Collapse — bottom right, only when expanded beyond initial */}
          {visibleCount > INITIAL_COUNT && (
            <button
              type="button"
              onClick={() => setVisibleCount(INITIAL_COUNT)}
              className="shrink-0 text-xs font-semibold text-gray-400 underline underline-offset-2 transition-colors hover:text-gray-700"
            >
              Collapse ↑
            </button>
          )}
        </div>
      )}
    </>
  )
}
