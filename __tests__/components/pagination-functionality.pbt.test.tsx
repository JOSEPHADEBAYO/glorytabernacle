/**
 * Property-Based Test: Pagination Functionality
 * 
 * Property 18: Pagination Functionality
 * Validates Requirements: 8.7
 * 
 * This property verifies that:
 * 1. Pagination controls display for large book sets
 * 2. Activating controls loads additional books correctly
 * 3. Pagination behavior is consistent across different book set sizes
 */

import { describe, it, expect, vi } from 'vitest'
import fc from 'fast-check'
import { render, fireEvent } from '@testing-library/react'
import { BookLibrary } from '@/app/books/book-library'
import type { Book } from '@/lib/types/book'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

// Arbitrary book generator
const bookArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  author: fc.string({ minLength: 1, maxLength: 100 }),
  category: fc.constantFrom(
    'Spiritual Growth',
    'Prayer & Intercession',
    'Faith & Doctrine',
    'Christian Living',
    'Leadership',
    'Family & Relationships',
    'Devotional',
    'Theology',
    'Biography',
    'Other'
  ),
  description: fc.string({ minLength: 1, maxLength: 2000 }),
  coverImage: fc.webUrl(),
  purchaseUrl: fc.option(fc.webUrl(), { nil: null }),
  published: fc.constant(true),
  createdBy: fc.string({ minLength: 1 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
})

const INITIAL_COUNT = 12
const LOAD_MORE_COUNT = 6

describe('Property Test: Pagination Functionality', () => {
  it('should display pagination controls only when books exceed initial count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 30 }),
        async (bookCount) => {
          const books = Array.from({ length: bookCount }, (_, i) => ({
            id: `book-${i}`,
            title: `Book ${i}`,
            author: `Author ${i}`,
            category: 'Spiritual Growth' as const,
            description: `Description ${i}`,
            coverImage: `/book${i}.png`,
            purchaseUrl: `https://example.com/book${i}`,
            published: true,
            createdBy: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
          })) as Book[]

          const { container, queryByText } = render(<BookLibrary books={books} />)

          // Property: "Load More" button should only appear when books > 12
          const hasLoadMore = queryByText('Load More Titles') !== null
          expect(hasLoadMore).toBe(bookCount > INITIAL_COUNT)

          // Property: Initially displayed books should not exceed INITIAL_COUNT
          const displayedBooks = container.querySelectorAll('h3').length
          expect(displayedBooks).toBeLessThanOrEqual(Math.min(bookCount, INITIAL_COUNT))
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should load correct number of additional books when "Load More" is clicked', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 13, max: 30 }),
        async (bookCount) => {
          const books = Array.from({ length: bookCount }, (_, i) => ({
            id: `book-${i}`,
            title: `Book ${i}`,
            author: `Author ${i}`,
            category: 'Spiritual Growth' as const,
            description: `Description ${i}`,
            coverImage: `/book${i}.png`,
            purchaseUrl: `https://example.com/book${i}`,
            published: true,
            createdBy: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
          })) as Book[]

          const { container, getByText } = render(<BookLibrary books={books} />)

          // Initial count
          const initialDisplayed = container.querySelectorAll('h3').length
          expect(initialDisplayed).toBe(INITIAL_COUNT)

          // Click "Load More"
          const loadMoreButton = getByText('Load More Titles')
          fireEvent.click(loadMoreButton)

          // Property: After clicking, should display INITIAL_COUNT + LOAD_MORE_COUNT or all books
          const afterLoadMore = container.querySelectorAll('h3').length
          const expectedCount = Math.min(bookCount, INITIAL_COUNT + LOAD_MORE_COUNT)
          expect(afterLoadMore).toBe(expectedCount)
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should hide "Load More" when all books are displayed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 13, max: 30 }),
        async (bookCount) => {
          const books = Array.from({ length: bookCount }, (_, i) => ({
            id: `book-${i}`,
            title: `Book ${i}`,
            author: `Author ${i}`,
            category: 'Spiritual Growth' as const,
            description: `Description ${i}`,
            coverImage: `/book${i}.png`,
            purchaseUrl: `https://example.com/book${i}`,
            published: true,
            createdBy: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
          })) as Book[]

          const { container, getByText, queryByText } = render(<BookLibrary books={books} />)

          // Click "Load More" until all books are displayed
          let loadMoreButton = queryByText('Load More Titles')
          while (loadMoreButton) {
            fireEvent.click(loadMoreButton)
            loadMoreButton = queryByText('Load More Titles')
          }

          // Property: All books should be displayed
          const displayedBooks = container.querySelectorAll('h3').length
          expect(displayedBooks).toBe(bookCount)

          // Property: "Load More" button should not be present
          expect(queryByText('Load More Titles')).toBeNull()
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should show "Collapse" button only after loading more books', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 13, max: 30 }),
        async (bookCount) => {
          const books = Array.from({ length: bookCount }, (_, i) => ({
            id: `book-${i}`,
            title: `Book ${i}`,
            author: `Author ${i}`,
            category: 'Spiritual Growth' as const,
            description: `Description ${i}`,
            coverImage: `/book${i}.png`,
            purchaseUrl: `https://example.com/book${i}`,
            published: true,
            createdBy: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
          })) as Book[]

          const { getByText, queryByText } = render(<BookLibrary books={books} />)

          // Property: Initially no "Collapse" button
          expect(queryByText(/Collapse/i)).toBeNull()

          // Click "Load More"
          const loadMoreButton = getByText('Load More Titles')
          fireEvent.click(loadMoreButton)

          // Property: "Collapse" button should now be present
          expect(queryByText(/Collapse/i)).not.toBeNull()
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should reset to initial count when "Collapse" is clicked', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 13, max: 30 }),
        async (bookCount) => {
          const books = Array.from({ length: bookCount }, (_, i) => ({
            id: `book-${i}`,
            title: `Book ${i}`,
            author: `Author ${i}`,
            category: 'Spiritual Growth' as const,
            description: `Description ${i}`,
            coverImage: `/book${i}.png`,
            purchaseUrl: `https://example.com/book${i}`,
            published: true,
            createdBy: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
          })) as Book[]

          const { container, getByText } = render(<BookLibrary books={books} />)

          // Load more books
          const loadMoreButton = getByText('Load More Titles')
          fireEvent.click(loadMoreButton)

          // Click "Collapse"
          const collapseButton = getByText(/Collapse/i)
          fireEvent.click(collapseButton)

          // Property: Should be back to INITIAL_COUNT
          const displayedBooks = container.querySelectorAll('h3').length
          expect(displayedBooks).toBe(INITIAL_COUNT)

          // Property: "Load More" button should be visible again
          expect(getByText('Load More Titles')).toBeDefined()
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should never display more books than available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(bookArbitrary, { minLength: 1, maxLength: 50 }),
        async (books) => {
          const allBooks = books as Book[]
          const { container, queryByText } = render(<BookLibrary books={allBooks} />)

          // Click "Load More" multiple times
          let loadMoreButton = queryByText('Load More Titles')
          let clickCount = 0
          while (loadMoreButton && clickCount < 10) {
            fireEvent.click(loadMoreButton)
            loadMoreButton = queryByText('Load More Titles')
            clickCount++
          }

          // Property: Displayed books should never exceed total books
          const displayedBooks = container.querySelectorAll('h3').length
          expect(displayedBooks).toBeLessThanOrEqual(allBooks.length)
          expect(displayedBooks).toBe(allBooks.length)
        }
      ),
      { numRuns: 30 }
    )
  })
})
