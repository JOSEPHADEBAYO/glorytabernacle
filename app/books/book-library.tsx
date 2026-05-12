'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Book } from '@/lib/types/book'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// For display purposes, we'll map the database Book to a display format
interface DisplayBook {
  id: string
  imageSrc: string
  imageAlt: string
  category: string
  title: string
  author: string
  description: string
  purchaseHref: string | null
}

const INITIAL_COUNT = 12
const LOAD_MORE_COUNT = 6

/**
 * Maps a database Book record to the DisplayBook format used by the UI
 */
function mapBookToDisplay(book: Book): DisplayBook {
  return {
    id: book.id,
    imageSrc: book.coverImage,
    imageAlt: book.title,
    category: book.category,
    title: book.title,
    author: book.author,
    description: book.description,
    purchaseHref: book.purchaseUrl,
  }
}

// ---------------------------------------------------------------------------
// Book card
// ---------------------------------------------------------------------------

function BookCard({ book }: { book: DisplayBook }) {
  const hasValidPurchaseUrl = book.purchaseHref && book.purchaseHref !== '#'
  const [imageError, setImageError] = useState(false)
  
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
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-sm">Image unavailable</span>
          </div>
        ) : (
          <Image
            src={book.imageSrc}
            alt={book.imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}
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
        {hasValidPurchaseUrl ? (
          <Link
            href={book.purchaseHref!}
            className="mt-3 flex items-center justify-center gap-1 rounded-md py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--church-green)' }}
          >
            Get Book →
          </Link>
        ) : (
          <button
            disabled
            className="mt-3 flex items-center justify-center gap-1 rounded-md py-2.5 text-xs font-bold uppercase tracking-widest text-white opacity-50 cursor-not-allowed"
            style={{ backgroundColor: 'var(--church-green)' }}
          >
            Not Available
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Library with load-more
// ---------------------------------------------------------------------------

interface BookLibraryProps {
  books: Book[]
}

export function BookLibrary({ books }: BookLibraryProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  
  // Map database books to display format
  const displayBooks = books.map(mapBookToDisplay)
  const visibleBooks = displayBooks.slice(0, visibleCount)
  const hasMore = visibleCount < displayBooks.length

  // Handle empty state
  if (displayBooks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No books available at the moment. Check back soon!</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {/* Footer controls */}
      {(displayBooks.length > 12) && (
        <div className="mt-10 flex items-center justify-between">
          {/* Load More — centred, only when more remain */}
          <div className="flex-1 flex justify-center">
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => Math.min(c + LOAD_MORE_COUNT, displayBooks.length))}
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
