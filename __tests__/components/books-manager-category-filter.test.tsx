import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BooksManager } from '@/components/dashboard/books-manager'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}))

describe('BooksManager - Category Filter (Task 12)', () => {
  const mockBooks = [
    {
      id: '1',
      title: 'Spiritual Book',
      author: 'Author 1',
      category: 'Spiritual Growth',
      description: 'Description 1',
      coverImage: 'https://example.com/image1.jpg',
      purchaseUrl: 'https://example.com/buy1',
      published: true,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      title: 'Prayer Book',
      author: 'Author 2',
      category: 'Prayer & Intercession',
      description: 'Description 2',
      coverImage: 'https://example.com/image2.jpg',
      purchaseUrl: null,
      published: true,
      createdAt: new Date('2024-01-02'),
    },
    {
      id: '3',
      title: 'Another Spiritual Book',
      author: 'Author 3',
      category: 'Spiritual Growth',
      description: 'Description 3',
      coverImage: 'https://example.com/image3.jpg',
      purchaseUrl: 'https://example.com/buy3',
      published: false,
      createdAt: new Date('2024-01-03'),
    },
    {
      id: '4',
      title: 'Theology Book',
      author: 'Author 4',
      category: 'Theology',
      description: 'Description 4',
      coverImage: 'https://example.com/image4.jpg',
      purchaseUrl: null,
      published: true,
      createdAt: new Date('2024-01-04'),
    },
  ]

  beforeEach(() => {
    global.fetch = vi.fn()
    vi.clearAllMocks()
  })

  it('should display category filter dropdown', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    // Check that the filter label exists
    expect(screen.getByText('Filter by Category')).toBeTruthy()

    // Check that the dropdown exists
    const dropdown = screen.getByRole('combobox')
    expect(dropdown).toBeTruthy()
  })

  it('should display all 10 categories plus "All Categories" option', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const dropdown = screen.getByRole('combobox') as HTMLSelectElement
    const options = Array.from(dropdown.options).map((opt) => opt.value)

    // Should have 11 options total (All Categories + 10 predefined categories)
    expect(options).toHaveLength(11)
    expect(options).toContain('All Categories')
    expect(options).toContain('Spiritual Growth')
    expect(options).toContain('Prayer & Intercession')
    expect(options).toContain('Faith & Doctrine')
    expect(options).toContain('Christian Living')
    expect(options).toContain('Leadership')
    expect(options).toContain('Family & Relationships')
    expect(options).toContain('Devotional')
    expect(options).toContain('Theology')
    expect(options).toContain('Biography')
    expect(options).toContain('Other')
  })

  it('should show all books when "All Categories" is selected', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    // By default, "All Categories" should be selected
    const bookCards = screen.getAllByRole('img')
    expect(bookCards).toHaveLength(4) // All 4 books should be visible
  })

  it('should filter books by selected category', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const dropdown = screen.getByRole('combobox') as HTMLSelectElement

    // Select "Spiritual Growth" category
    fireEvent.change(dropdown, { target: { value: 'Spiritual Growth' } })

    // Should only show 2 books with "Spiritual Growth" category
    const bookTitles = screen.getAllByRole('heading', { level: 3 })
    expect(bookTitles).toHaveLength(2)
    expect(screen.getByText('Spiritual Book')).toBeTruthy()
    expect(screen.getByText('Another Spiritual Book')).toBeTruthy()
  })

  it('should update book count to reflect filtered results', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    // Initially shows all 4 books
    expect(screen.getByText('4 books')).toBeTruthy()

    const dropdown = screen.getByRole('combobox') as HTMLSelectElement

    // Filter by "Spiritual Growth"
    fireEvent.change(dropdown, { target: { value: 'Spiritual Growth' } })

    // Should show 2 books in Spiritual Growth
    expect(screen.getByText('2 books in Spiritual Growth')).toBeTruthy()
  })

  it('should show singular "book" when count is 1', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const dropdown = screen.getByRole('combobox') as HTMLSelectElement

    // Filter by "Theology" (only 1 book)
    fireEvent.change(dropdown, { target: { value: 'Theology' } })

    // Should show "1 book" (singular)
    expect(screen.getByText('1 book in Theology')).toBeTruthy()
  })

  it('should persist filter selection in component state', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const dropdown = screen.getByRole('combobox') as HTMLSelectElement

    // Select "Prayer & Intercession"
    fireEvent.change(dropdown, { target: { value: 'Prayer & Intercession' } })

    // Verify the dropdown value is updated
    expect(dropdown.value).toBe('Prayer & Intercession')

    // Verify only 1 book is shown
    const bookTitles = screen.getAllByRole('heading', { level: 3 })
    expect(bookTitles).toHaveLength(1)
    expect(screen.getByText('Prayer Book')).toBeTruthy()
  })

  it('should show empty state when no books match selected category', () => {
    const booksWithoutBiography = mockBooks.filter((book) => book.category !== 'Biography')
    render(<BooksManager initialBooks={booksWithoutBiography} />)

    const dropdown = screen.getByRole('combobox') as HTMLSelectElement

    // Select "Biography" (no books in this category)
    fireEvent.change(dropdown, { target: { value: 'Biography' } })

    // Should show empty state message
    expect(screen.getByText('No Books Found')).toBeTruthy()
    expect(screen.getByText(/No books match the selected category: Biography/)).toBeTruthy()
  })

  it('should allow clearing filter from empty state', () => {
    const booksWithoutBiography = mockBooks.filter((book) => book.category !== 'Biography')
    render(<BooksManager initialBooks={booksWithoutBiography} />)

    const dropdown = screen.getByRole('combobox') as HTMLSelectElement

    // Select "Biography" to trigger empty state
    fireEvent.change(dropdown, { target: { value: 'Biography' } })

    // Click "Clear Category Filter" button
    const clearButton = screen.getByText('Clear Category Filter')
    fireEvent.click(clearButton)

    // Should reset to "All Categories"
    expect(dropdown.value).toBe('All Categories')

    // Should show all books again
    const bookCards = screen.getAllByRole('img')
    expect(bookCards).toHaveLength(4)
  })

  it('should not show empty state when books exist for selected category', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const dropdown = screen.getByRole('combobox') as HTMLSelectElement

    // Select "Spiritual Growth" (has 2 books)
    fireEvent.change(dropdown, { target: { value: 'Spiritual Growth' } })

    // Should NOT show empty state
    expect(screen.queryByText('No Books Found')).toBeNull()

    // Should show the books
    expect(screen.getByText('Spiritual Book')).toBeTruthy()
    expect(screen.getByText('Another Spiritual Book')).toBeTruthy()
  })

  it('should maintain filter when toggling publish status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockBooks[0], published: false }),
    })
    global.fetch = mockFetch

    render(<BooksManager initialBooks={mockBooks} />)

    const dropdown = screen.getByRole('combobox') as HTMLSelectElement

    // Filter by "Spiritual Growth"
    fireEvent.change(dropdown, { target: { value: 'Spiritual Growth' } })

    // Verify filter is applied
    expect(screen.getByText('2 books in Spiritual Growth')).toBeTruthy()

    // Toggle publish status on one of the books
    const toggleButtons = screen.getAllByRole('button', { name: /publish book|unpublish book/i })
    fireEvent.click(toggleButtons[0])

    // Filter should still be "Spiritual Growth"
    expect(dropdown.value).toBe('Spiritual Growth')
  })
})
