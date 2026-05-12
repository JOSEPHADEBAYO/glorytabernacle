/**
 * Unit tests for BookLibrary pagination
 * Tests that the "Load More" functionality works correctly
 * 
 * Requirements tested:
 * - 8.7: Pagination or load more functionality
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

describe('BookLibrary Pagination', () => {
  // Helper to create mock books
  const createMockBooks = (count: number): Book[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${i + 1}`,
      title: `Book ${i + 1}`,
      author: `Author ${i + 1}`,
      category: 'Spiritual Growth' as const,
      description: `Description ${i + 1}`,
      coverImage: `/book${i + 1}.png`,
      purchaseUrl: `https://example.com/book${i + 1}`,
      published: true,
      createdBy: 'admin',
      createdAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
      updatedAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
    }))
  }

  it('should display "Load More" button when books exceed initial count (12)', () => {
    const books = createMockBooks(15)
    render(<BookLibrary books={books} />)

    // Verify "Load More" button is present
    expect(screen.getByText('Load More Titles')).toBeDefined()
  })

  it('should not display "Load More" button when books are 12 or fewer', () => {
    const books = createMockBooks(12)
    render(<BookLibrary books={books} />)

    // Verify "Load More" button is NOT present
    expect(screen.queryByText('Load More Titles')).toBeNull()
  })

  it('should initially display only 12 books when more are available', () => {
    const books = createMockBooks(20)
    const { container } = render(<BookLibrary books={books} />)

    // Count rendered book cards (look for book titles)
    const renderedTitles = Array.from(container.querySelectorAll('h3')).filter((h3) =>
      h3.textContent?.startsWith('Book ')
    )
    expect(renderedTitles.length).toBe(12)
  })

  it('should load 6 more books when "Load More" is clicked', () => {
    const books = createMockBooks(20)
    const { container } = render(<BookLibrary books={books} />)

    // Initially 12 books
    let renderedTitles = Array.from(container.querySelectorAll('h3')).filter((h3) =>
      h3.textContent?.startsWith('Book ')
    )
    expect(renderedTitles.length).toBe(12)

    // Click "Load More"
    const loadMoreButton = screen.getByText('Load More Titles')
    fireEvent.click(loadMoreButton)

    // Now should have 18 books (12 + 6)
    renderedTitles = Array.from(container.querySelectorAll('h3')).filter((h3) =>
      h3.textContent?.startsWith('Book ')
    )
    expect(renderedTitles.length).toBe(18)
  })

  it('should hide "Load More" button when all books are displayed', () => {
    const books = createMockBooks(15)
    render(<BookLibrary books={books} />)

    // Click "Load More" once (12 + 6 = 18, but only 15 books exist)
    const loadMoreButton = screen.getByText('Load More Titles')
    fireEvent.click(loadMoreButton)

    // "Load More" button should be gone
    expect(screen.queryByText('Load More Titles')).toBeNull()
  })

  it('should display "Collapse" button after loading more books', () => {
    const books = createMockBooks(20)
    render(<BookLibrary books={books} />)

    // Initially no "Collapse" button
    expect(screen.queryByText(/Collapse/i)).toBeNull()

    // Click "Load More"
    const loadMoreButton = screen.getByText('Load More Titles')
    fireEvent.click(loadMoreButton)

    // Now "Collapse" button should appear
    expect(screen.getByText(/Collapse/i)).toBeDefined()
  })

  it('should collapse back to initial 12 books when "Collapse" is clicked', () => {
    const books = createMockBooks(20)
    const { container } = render(<BookLibrary books={books} />)

    // Load more books
    const loadMoreButton = screen.getByText('Load More Titles')
    fireEvent.click(loadMoreButton)

    // Verify 18 books displayed
    let renderedTitles = Array.from(container.querySelectorAll('h3')).filter((h3) =>
      h3.textContent?.startsWith('Book ')
    )
    expect(renderedTitles.length).toBe(18)

    // Click "Collapse"
    const collapseButton = screen.getByText(/Collapse/i)
    fireEvent.click(collapseButton)

    // Should be back to 12 books
    renderedTitles = Array.from(container.querySelectorAll('h3')).filter((h3) =>
      h3.textContent?.startsWith('Book ')
    )
    expect(renderedTitles.length).toBe(12)

    // "Load More" button should be visible again
    expect(screen.getByText('Load More Titles')).toBeDefined()
  })

  it('should handle small book sets without pagination controls', () => {
    const books = createMockBooks(5)
    const { container } = render(<BookLibrary books={books} />)

    // All 5 books should be displayed
    const renderedTitles = Array.from(container.querySelectorAll('h3')).filter((h3) =>
      h3.textContent?.startsWith('Book ')
    )
    expect(renderedTitles.length).toBe(5)

    // No pagination controls
    expect(screen.queryByText('Load More Titles')).toBeNull()
    expect(screen.queryByText(/Collapse/i)).toBeNull()
  })

  it('should load all remaining books when "Load More" is clicked and fewer than 6 remain', () => {
    const books = createMockBooks(14) // 12 initial + 2 remaining
    const { container } = render(<BookLibrary books={books} />)

    // Click "Load More"
    const loadMoreButton = screen.getByText('Load More Titles')
    fireEvent.click(loadMoreButton)

    // Should display all 14 books
    const renderedTitles = Array.from(container.querySelectorAll('h3')).filter((h3) =>
      h3.textContent?.startsWith('Book ')
    )
    expect(renderedTitles.length).toBe(14)

    // "Load More" button should be gone
    expect(screen.queryByText('Load More Titles')).toBeNull()
  })
})
