/**
 * Unit tests for BookLibrary image optimization
 * Tests that images use Next.js Image component with proper optimization
 * 
 * Requirements tested:
 * - 10.3: Next.js Image component used for all book covers
 * - 10.4: Error handler shows placeholder on failure
 * - 10.6: Images have proper alt text
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BookLibrary } from '@/app/books/book-library'
import type { Book } from '@/lib/types/book'

// Track Image component usage
const mockImageCalls: Array<{ src: string; alt: string; loading?: string; sizes?: string }> = []

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, loading, sizes, onError }: any) => {
    mockImageCalls.push({ src, alt, loading, sizes })
    return (
      <img
        src={src}
        alt={alt}
        data-loading={loading}
        data-sizes={sizes}
        onError={onError}
        data-testid="next-image"
      />
    )
  },
}))

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('BookLibrary Image Optimization', () => {
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
      coverImage: 'https://example.com/book2.jpg',
      purchaseUrl: null,
      published: true,
      createdBy: 'admin',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
    },
  ]

  beforeEach(() => {
    mockImageCalls.length = 0
  })

  it('should use Next.js Image component for all book covers', () => {
    render(<BookLibrary books={mockBooks} />)

    // Verify Image component was called for each book
    expect(mockImageCalls.length).toBe(mockBooks.length)

    // Verify each book's cover image is rendered
    mockBooks.forEach((book) => {
      const imageCall = mockImageCalls.find((call) => call.src === book.coverImage)
      expect(imageCall).toBeDefined()
    })
  })

  it('should have proper alt text for all images', () => {
    render(<BookLibrary books={mockBooks} />)

    // Verify each image has alt text matching the book title
    mockBooks.forEach((book) => {
      const imageCall = mockImageCalls.find((call) => call.src === book.coverImage)
      expect(imageCall?.alt).toBe(book.title)
    })

    // Verify alt text is accessible in the DOM
    const images = screen.getAllByRole('img')
    expect(images.length).toBe(mockBooks.length)
    images.forEach((img) => {
      expect(img.getAttribute('alt')).toBeTruthy()
      expect(img.getAttribute('alt')).not.toBe('')
    })
  })

  it('should use lazy loading for images', () => {
    render(<BookLibrary books={mockBooks} />)

    // Verify all images have loading="lazy"
    mockImageCalls.forEach((call) => {
      expect(call.loading).toBe('lazy')
    })
  })

  it('should have proper sizes attribute for responsive images', () => {
    render(<BookLibrary books={mockBooks} />)

    // Verify all images have the correct sizes attribute
    mockImageCalls.forEach((call) => {
      expect(call.sizes).toBe('(max-width: 768px) 100vw, 33vw')
    })
  })

  it('should show placeholder when image fails to load', () => {
    const { container } = render(<BookLibrary books={[mockBooks[0]]} />)

    // Find the image element
    const image = container.querySelector('img[data-testid="next-image"]')
    expect(image).toBeDefined()

    // Simulate image load error
    fireEvent.error(image!)

    // Verify placeholder is shown
    expect(screen.getByText('Image unavailable')).toBeDefined()
  })

  it('should handle external URLs correctly', () => {
    render(<BookLibrary books={mockBooks} />)

    // Verify external URL is passed to Image component
    const externalImageCall = mockImageCalls.find(
      (call) => call.src === 'https://example.com/book2.jpg'
    )
    expect(externalImageCall).toBeDefined()
  })

  it('should handle local paths correctly', () => {
    render(<BookLibrary books={mockBooks} />)

    // Verify local path is passed to Image component
    const localImageCall = mockImageCalls.find((call) => call.src === '/book1.png')
    expect(localImageCall).toBeDefined()
  })
})
