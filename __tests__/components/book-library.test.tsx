/**
 * Unit tests for BookLibrary component
 * Tests that the component correctly renders books from props
 * 
 * Requirements tested:
 * - 8.2: Display all book fields (title, author, category, description, cover image)
 * - 8.4: Complete field rendering
 * - 8.5: Purchase link behavior when URL present
 * - 8.6: Purchase link disabled when URL absent
 */

import { describe, it, expect, vi } from 'vitest'
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

describe('BookLibrary Component', () => {
  const mockBooks: Book[] = [
    {
      id: '1',
      title: 'Foundations of Grace',
      author: 'Dr. Emmanuel T. Adeniyi',
      category: 'Spiritual Growth',
      description: 'An in-depth exploration of God\'s unmerited favour.',
      coverImage: '/book1.png',
      purchaseUrl: 'https://example.com/book1',
      published: true,
      createdBy: 'admin',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      title: 'Silent Echoes',
      author: 'Pastor John Doe',
      category: 'Prayer & Intercession',
      description: 'Discover the hidden language of prayer.',
      coverImage: '/book2.png',
      purchaseUrl: null,
      published: true,
      createdBy: 'admin',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
    },
  ]

  it('should render books from props', () => {
    render(<BookLibrary books={mockBooks} />)

    // Verify both books are rendered
    expect(screen.getByText('Foundations of Grace')).toBeDefined()
    expect(screen.getByText('Silent Echoes')).toBeDefined()
  })

  it('should display all book fields correctly', () => {
    render(<BookLibrary books={[mockBooks[0]]} />)

    // Verify all fields are displayed
    expect(screen.getByText('Foundations of Grace')).toBeDefined()
    expect(screen.getByText('Dr. Emmanuel T. Adeniyi')).toBeDefined()
    expect(screen.getByText('Spiritual Growth')).toBeDefined()
    expect(screen.getByText(/An in-depth exploration/i)).toBeDefined()
    
    // Verify cover image
    const image = screen.getByAlt('Foundations of Grace')
    expect(image).toBeDefined()
    expect(image.getAttribute('src')).toBe('/book1.png')
  })

  it('should link "Get Book" button to purchaseUrl when present', () => {
    render(<BookLibrary books={[mockBooks[0]]} />)

    const getBookLink = screen.getByText('Get Book →').closest('a')
    expect(getBookLink).toBeDefined()
    expect(getBookLink?.getAttribute('href')).toBe('https://example.com/book1')
  })

  it('should disable "Get Book" button when purchaseUrl is absent', () => {
    render(<BookLibrary books={[mockBooks[1]]} />)

    const notAvailableButton = screen.getByText('Not Available')
    expect(notAvailableButton).toBeDefined()
    expect(notAvailableButton.getAttribute('disabled')).toBe('')
  })

  it('should handle empty books array with appropriate message', () => {
    render(<BookLibrary books={[]} />)

    expect(screen.getByText(/No books available at the moment/i)).toBeDefined()
  })

  it('should render multiple books in a grid', () => {
    const manyBooks: Book[] = [
      ...mockBooks,
      {
        id: '3',
        title: 'Bloodline of Faith',
        author: 'Sarah Johnson',
        category: 'Faith & Doctrine',
        description: 'Tracing the unbroken thread of faith.',
        coverImage: '/book3.png',
        purchaseUrl: 'https://example.com/book3',
        published: true,
        createdBy: 'admin',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
      },
    ]

    render(<BookLibrary books={manyBooks} />)

    // Verify all three books are rendered
    expect(screen.getByText('Foundations of Grace')).toBeDefined()
    expect(screen.getByText('Silent Echoes')).toBeDefined()
    expect(screen.getByText('Bloodline of Faith')).toBeDefined()
  })

  it('should show load more button when books exceed initial count', () => {
    // Create 15 books (more than INITIAL_COUNT of 12)
    const manyBooks: Book[] = Array.from({ length: 15 }, (_, i) => ({
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

    render(<BookLibrary books={manyBooks} />)

    // Verify load more button is present
    expect(screen.getByText('Load More Titles')).toBeDefined()
  })

  it('should not show load more button when books are 12 or fewer', () => {
    const twelveBooks: Book[] = Array.from({ length: 12 }, (_, i) => ({
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

    render(<BookLibrary books={twelveBooks} />)

    // Verify load more button is NOT present
    expect(screen.queryByText('Load More Titles')).toBeNull()
  })
})
