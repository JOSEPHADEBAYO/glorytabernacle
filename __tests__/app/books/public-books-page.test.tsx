/**
 * Unit tests for public books page
 * Tests that the page fetches only published books from the database
 * 
 * Requirements tested:
 * - 6.2: Public library displays only published books
 * - 6.3: Published status filtering
 * - 8.1: Books ordered by creation date descending
 * - 8.3: Ordering consistency
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
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

// Mock Next.js components
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock components
vi.mock('@/components/church/nav-bar', () => ({
  TopNavBar: () => <div data-testid="nav-bar">NavBar</div>,
}))

vi.mock('@/components/church/footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}))

vi.mock('@/components/church/newsletter-form', () => ({
  NewsletterForm: () => <div data-testid="newsletter">Newsletter</div>,
}))

vi.mock('@/app/books/book-library', () => ({
  BookLibrary: ({ books }: { books: Book[] }) => (
    <div data-testid="book-library">
      {books.map((book) => (
        <div key={book.id} data-testid={`book-${book.id}`}>
          {book.title}
        </div>
      ))}
    </div>
  ),
}))

describe('Public Books Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch only published books from database', async () => {
    const mockBooks: Book[] = [
      {
        id: '1',
        title: 'Published Book 1',
        author: 'Author 1',
        category: 'Spiritual Growth',
        description: 'Description 1',
        coverImage: '/book1.png',
        purchaseUrl: 'https://example.com/book1',
        published: true,
        createdBy: 'admin',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        title: 'Published Book 2',
        author: 'Author 2',
        category: 'Prayer & Intercession',
        description: 'Description 2',
        coverImage: '/book2.png',
        purchaseUrl: 'https://example.com/book2',
        published: true,
        createdBy: 'admin',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
    ]

    vi.mocked(prisma.book.findMany).mockResolvedValue(mockBooks)

    // Dynamically import the page component
    const BooksPage = (await import('@/app/books/page')).default
    const { render } = await import('@testing-library/react')
    
    // Render the page (it's an async server component)
    const PageElement = await BooksPage()
    const { getByTestId } = render(PageElement)

    // Verify Prisma was called with correct filters
    expect(prisma.book.findMany).toHaveBeenCalledWith({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    })

    // Verify books are passed to BookLibrary
    const library = getByTestId('book-library')
    expect(library).toBeDefined()
  })

  it('should order books by createdAt descending (newest first)', async () => {
    const mockBooks: Book[] = [
      {
        id: '3',
        title: 'Newest Book',
        author: 'Author 3',
        category: 'Faith & Doctrine',
        description: 'Description 3',
        coverImage: '/book3.png',
        purchaseUrl: null,
        published: true,
        createdBy: 'admin',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        id: '2',
        title: 'Middle Book',
        author: 'Author 2',
        category: 'Christian Living',
        description: 'Description 2',
        coverImage: '/book2.png',
        purchaseUrl: 'https://example.com/book2',
        published: true,
        createdBy: 'admin',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: '1',
        title: 'Oldest Book',
        author: 'Author 1',
        category: 'Leadership',
        description: 'Description 1',
        coverImage: '/book1.png',
        purchaseUrl: 'https://example.com/book1',
        published: true,
        createdBy: 'admin',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
    ]

    vi.mocked(prisma.book.findMany).mockResolvedValue(mockBooks)

    const BooksPage = (await import('@/app/books/page')).default
    const { render } = await import('@testing-library/react')
    
    const PageElement = await BooksPage()
    render(PageElement)

    // Verify ordering parameter
    expect(prisma.book.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    )
  })

  it('should display appropriate message when no books are available', async () => {
    vi.mocked(prisma.book.findMany).mockResolvedValue([])

    const BooksPage = (await import('@/app/books/page')).default
    const { render } = await import('@testing-library/react')
    
    const PageElement = await BooksPage()
    const { getByText } = render(PageElement)

    // Verify empty state message is displayed
    expect(getByText(/No books available at the moment/i)).toBeDefined()
  })

  it('should handle database errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(prisma.book.findMany).mockRejectedValue(new Error('Database connection failed'))

    const BooksPage = (await import('@/app/books/page')).default
    const { render } = await import('@testing-library/react')
    
    const PageElement = await BooksPage()
    const { getByText } = render(PageElement)

    // Verify error message is displayed
    expect(getByText(/Failed to load books/i)).toBeDefined()
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled()
    
    consoleErrorSpy.mockRestore()
  })
})
