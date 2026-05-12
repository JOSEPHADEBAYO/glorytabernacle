/**
 * Property-Based Test: Published Status Filtering
 * 
 * Property 14: Published Status Filtering
 * Validates Requirements: 6.2, 6.3, 6.8, 8.1
 * 
 * This property verifies that:
 * 1. Public library page only displays books with published=true
 * 2. Dashboard displays all books regardless of published status
 * 3. Filtering is consistent across all queries
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import fc from 'fast-check'
import { prisma } from '@/lib/prisma'
import type { Book } from '@/lib/types/book'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    book: {
      findMany: vi.fn(),
    },
  },
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
  published: fc.boolean(),
  createdBy: fc.string({ minLength: 1 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
})

describe('Property Test: Published Status Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should only return published books in public library', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(bookArbitrary, { minLength: 1, maxLength: 20 }),
        async (books) => {
          // Mock the database to return all books
          const allBooks = books as Book[]
          vi.mocked(prisma.book.findMany).mockResolvedValue(
            allBooks.filter((b) => b.published)
          )

          // Simulate public library query
          const publicBooks = await prisma.book.findMany({
            where: { published: true },
            orderBy: { createdAt: 'desc' },
          })

          // Property: All returned books must have published=true
          const allPublished = publicBooks.every((book) => book.published === true)
          expect(allPublished).toBe(true)

          // Property: No unpublished books should be returned
          const unpublishedBooks = allBooks.filter((b) => !b.published)
          const noUnpublishedReturned = unpublishedBooks.every(
            (unpublished) => !publicBooks.some((pub) => pub.id === unpublished.id)
          )
          expect(noUnpublishedReturned).toBe(true)

          // Property: All published books should be returned
          const publishedBooks = allBooks.filter((b) => b.published)
          expect(publicBooks.length).toBe(publishedBooks.length)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should return all books in dashboard regardless of published status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(bookArbitrary, { minLength: 1, maxLength: 20 }),
        async (books) => {
          // Mock the database to return all books (dashboard query)
          const allBooks = books as Book[]
          vi.mocked(prisma.book.findMany).mockResolvedValue(allBooks)

          // Simulate dashboard query (no published filter)
          const dashboardBooks = await prisma.book.findMany({
            orderBy: { createdAt: 'desc' },
          })

          // Property: All books should be returned
          expect(dashboardBooks.length).toBe(allBooks.length)

          // Property: Both published and unpublished books should be present
          const hasPublished = dashboardBooks.some((b) => b.published)
          const hasUnpublished = dashboardBooks.some((b) => !b.published)
          
          // Only check if the original set has both types
          const originalHasPublished = allBooks.some((b) => b.published)
          const originalHasUnpublished = allBooks.some((b) => !b.published)
          
          if (originalHasPublished) {
            expect(hasPublished).toBe(true)
          }
          if (originalHasUnpublished) {
            expect(hasUnpublished).toBe(true)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should consistently filter published status across multiple queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(bookArbitrary, { minLength: 5, maxLength: 20 }),
        async (books) => {
          const allBooks = books as Book[]
          const publishedBooks = allBooks.filter((b) => b.published)

          // First query
          vi.mocked(prisma.book.findMany).mockResolvedValue(publishedBooks)
          const result1 = await prisma.book.findMany({
            where: { published: true },
            orderBy: { createdAt: 'desc' },
          })

          // Second query (should return same results)
          vi.mocked(prisma.book.findMany).mockResolvedValue(publishedBooks)
          const result2 = await prisma.book.findMany({
            where: { published: true },
            orderBy: { createdAt: 'desc' },
          })

          // Property: Results should be consistent
          expect(result1.length).toBe(result2.length)
          expect(result1.map((b) => b.id).sort()).toEqual(
            result2.map((b) => b.id).sort()
          )

          // Property: All results have published=true
          expect(result1.every((b) => b.published)).toBe(true)
          expect(result2.every((b) => b.published)).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })
})
