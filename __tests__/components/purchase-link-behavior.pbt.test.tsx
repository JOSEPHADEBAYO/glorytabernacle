/**
 * Property-Based Test: Purchase Link Behavior
 * 
 * Property 17: Purchase Link Behavior
 * Validates Requirements: 8.5, 8.6
 * 
 * This property verifies that:
 * 1. "Get Book" button links to purchaseUrl when present
 * 2. Button is disabled or shows placeholder when purchaseUrl is absent
 * 3. Behavior is consistent across all books
 */

import { describe, it, expect, vi } from 'vitest'
import fc from 'fast-check'
import { render, screen } from '@testing-library/react'
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

describe('Property Test: Purchase Link Behavior', () => {
  it('should link to purchaseUrl when present', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(bookArbitrary, { minLength: 1, maxLength: 10 }),
        async (books) => {
          const booksWithPurchaseUrl = books.filter((b) => b.purchaseUrl !== null) as Book[]
          
          if (booksWithPurchaseUrl.length === 0) {
            return // Skip if no books with purchase URLs
          }

          const { container } = render(<BookLibrary books={booksWithPurchaseUrl} />)

          // Property: All books with purchaseUrl should have clickable "Get Book" links
          booksWithPurchaseUrl.forEach((book) => {
            const getBookLinks = Array.from(container.querySelectorAll('a'))
              .filter((link) => link.textContent?.includes('Get Book'))
            
            // At least one link should point to the purchase URL
            const hasCorrectLink = getBookLinks.some(
              (link) => link.getAttribute('href') === book.purchaseUrl
            )
            expect(hasCorrectLink).toBe(true)
          })
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should disable button when purchaseUrl is absent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            ...bookArbitrary.value,
            purchaseUrl: fc.constant(null),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (books) => {
          const booksWithoutPurchaseUrl = books as Book[]
          const { container } = render(<BookLibrary books={booksWithoutPurchaseUrl} />)

          // Property: All books without purchaseUrl should have disabled buttons
          const disabledButtons = container.querySelectorAll('button[disabled]')
          expect(disabledButtons.length).toBeGreaterThan(0)

          // Property: Disabled buttons should show "Not Available" text
          disabledButtons.forEach((button) => {
            expect(button.textContent).toContain('Not Available')
          })

          // Property: No "Get Book" links should exist
          const getBookLinks = Array.from(container.querySelectorAll('a'))
            .filter((link) => link.textContent?.includes('Get Book'))
          expect(getBookLinks.length).toBe(0)
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should handle mixed books with and without purchaseUrl correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(bookArbitrary, { minLength: 2, maxLength: 10 }),
        async (books) => {
          const allBooks = books as Book[]
          const booksWithUrl = allBooks.filter((b) => b.purchaseUrl !== null)
          const booksWithoutUrl = allBooks.filter((b) => b.purchaseUrl === null)

          if (booksWithUrl.length === 0 || booksWithoutUrl.length === 0) {
            return // Skip if we don't have both types
          }

          const { container } = render(<BookLibrary books={allBooks} />)

          // Property: Number of "Get Book" links should equal books with purchaseUrl
          const getBookLinks = Array.from(container.querySelectorAll('a'))
            .filter((link) => link.textContent?.includes('Get Book'))
          expect(getBookLinks.length).toBe(booksWithUrl.length)

          // Property: Number of disabled buttons should equal books without purchaseUrl
          const disabledButtons = Array.from(container.querySelectorAll('button[disabled]'))
            .filter((btn) => btn.textContent?.includes('Not Available'))
          expect(disabledButtons.length).toBe(booksWithoutUrl.length)

          // Property: Total interactive elements should equal total books
          expect(getBookLinks.length + disabledButtons.length).toBe(allBooks.length)
        }
      ),
      { numRuns: 30 }
    )
  })

  it('should never show both link and disabled button for same book', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(bookArbitrary, { minLength: 1, maxLength: 10 }),
        async (books) => {
          const allBooks = books as Book[]
          const { container } = render(<BookLibrary books={allBooks} />)

          // Property: Each book card should have exactly one action element
          const bookCards = container.querySelectorAll('[class*="flex-col"]')
          
          bookCards.forEach((card) => {
            const links = card.querySelectorAll('a')
            const disabledButtons = card.querySelectorAll('button[disabled]')
            
            // Each card should have either a link OR a disabled button, not both
            const hasLink = Array.from(links).some((link) => 
              link.textContent?.includes('Get Book')
            )
            const hasDisabledButton = Array.from(disabledButtons).some((btn) => 
              btn.textContent?.includes('Not Available')
            )
            
            // XOR: exactly one should be true
            expect(hasLink !== hasDisabledButton).toBe(true)
          })
        }
      ),
      { numRuns: 30 }
    )
  })
})
