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

describe('BooksManager - Search Functionality (Task 13)', () => {
  const mockBooks = [
    {
      id: '1',
      title: 'The Power of Prayer',
      author: 'John Smith',
      category: 'Prayer & Intercession',
      description: 'A comprehensive guide to prayer',
      coverImage: 'https://example.com/image1.jpg',
      purchaseUrl: 'https://example.com/buy1',
      published: true,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      title: 'Spiritual Growth Journey',
      author: 'Jane Doe',
      category: 'Spiritual Growth',
      description: 'Growing in faith',
      coverImage: 'https://example.com/image2.jpg',
      purchaseUrl: null,
      published: true,
      createdAt: new Date('2024-01-02'),
    },
    {
      id: '3',
      title: 'Leadership Principles',
      author: 'John Maxwell',
      category: 'Leadership',
      description: 'Biblical leadership principles',
      coverImage: 'https://example.com/image3.jpg',
      purchaseUrl: 'https://example.com/buy3',
      published: false,
      createdAt: new Date('2024-01-03'),
    },
    {
      id: '4',
      title: 'Faith and Doctrine',
      author: 'Sarah Williams',
      category: 'Faith & Doctrine',
      description: 'Understanding core beliefs',
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

  it('should display search bar with label and input field', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    // Check that the search label exists
    expect(screen.getByText('Search Books')).toBeTruthy()

    // Check that the search input exists
    const searchInput = screen.getByPlaceholderText('Search by title or author...')
    expect(searchInput).toBeTruthy()
  })

  it('should display search icon in the input field', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')
    const container = searchInput.parentElement

    // Check for search icon (magnifying glass SVG)
    const searchIcon = container?.querySelector('svg path[d*="M21 21l-5.197-5.197"]')
    expect(searchIcon).toBeTruthy()
  })

  it('should filter books by title (case-insensitive)', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')

    // Search for "prayer" (lowercase)
    fireEvent.change(searchInput, { target: { value: 'prayer' } })

    // Should only show "The Power of Prayer"
    const bookTitles = screen.getAllByRole('heading', { level: 3 })
    expect(bookTitles).toHaveLength(1)
    expect(screen.getByText('The Power of Prayer')).toBeTruthy()
  })

  it('should filter books by author (case-insensitive)', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')

    // Search for "john" (matches both John Smith and John Maxwell)
    fireEvent.change(searchInput, { target: { value: 'john' } })

    // Should show 2 books by authors with "John" in their name
    const bookTitles = screen.getAllByRole('heading', { level: 3 })
    expect(bookTitles).toHaveLength(2)
    expect(screen.getByText('The Power of Prayer')).toBeTruthy()
    expect(screen.getByText('Leadership Principles')).toBeTruthy()
  })

  it('should match partial strings in title', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')

    // Search for "spirit" (partial match for "Spiritual")
    fireEvent.change(searchInput, { target: { value: 'spirit' } })

    // Should show "Spiritual Growth Journey"
    const bookTitles = screen.getAllByRole('heading', { level: 3 })
    expect(bookTitles).toHaveLength(1)
    expect(screen.getByText('Spiritual Growth Journey')).toBeTruthy()
  })

  it('should match partial strings in author', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')

    // Search for "doe" (partial match for "Jane Doe")
    fireEvent.change(searchInput, { target: { value: 'doe' } })

    // Should show book by Jane Doe
    const bookTitles = screen.getAllByRole('heading', { level: 3 })
    expect(bookTitles).toHaveLength(1)
    expect(screen.getByText('Spiritual Growth Journey')).toBeTruthy()
  })

  it('should combine search with category filter (AND logic)', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')
    const categoryDropdown = screen.getByRole('combobox') as HTMLSelectElement

    // Filter by "Leadership" category
    fireEvent.change(categoryDropdown, { target: { value: 'Leadership' } })

    // Then search for "john"
    fireEvent.change(searchInput, { target: { value: 'john' } })

    // Should only show "Leadership Principles" by John Maxwell
    // (matches both category AND search)
    const bookTitles = screen.getAllByRole('heading', { level: 3 })
    expect(bookTitles).toHaveLength(1)
    expect(screen.getByText('Leadership Principles')).toBeTruthy()
  })

  it('should show no results when search and category do not match any books', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')
    const categoryDropdown = screen.getByRole('combobox') as HTMLSelectElement

    // Filter by "Leadership" category
    fireEvent.change(categoryDropdown, { target: { value: 'Leadership' } })

    // Search for "williams" (no Leadership books by Williams)
    fireEvent.change(searchInput, { target: { value: 'williams' } })

    // Should show empty state
    expect(screen.getByText('No Books Found')).toBeTruthy()
    expect(screen.getByText(/No books match the search "williams" in category: Leadership/)).toBeTruthy()
  })

  it('should update book count to reflect search results', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    // Initially shows all 4 books
    expect(screen.getByText('4 books')).toBeTruthy()

    const searchInput = screen.getByPlaceholderText('Search by title or author...')

    // Search for "john"
    fireEvent.change(searchInput, { target: { value: 'john' } })

    // Should show 2 books matching "john"
    expect(screen.getByText('2 books matching "john"')).toBeTruthy()
  })

  it('should show singular "book" when search returns 1 result', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')

    // Search for "williams"
    fireEvent.change(searchInput, { target: { value: 'williams' } })

    // Should show "1 book" (singular)
    expect(screen.getByText('1 book matching "williams"')).toBeTruthy()
  })

  it('should display clear search button when search query is not empty', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')

    // Initially no clear button
    expect(screen.queryByLabelText('Clear search')).toBeNull()

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'prayer' } })

    // Clear button should appear
    const clearButton = screen.getByLabelText('Clear search')
    expect(clearButton).toBeTruthy()
  })

  it('should clear search when clear button is clicked', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...') as HTMLInputElement

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'prayer' } })
    expect(searchInput.value).toBe('prayer')

    // Click clear button
    const clearButton = screen.getByLabelText('Clear search')
    fireEvent.click(clearButton)

    // Search should be cleared
    expect(searchInput.value).toBe('')

    // All books should be visible again
    const bookTitles = screen.getAllByRole('heading', { level: 3 })
    expect(bookTitles).toHaveLength(4)
  })

  it('should show empty state with clear search button when no results', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')

    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    // Should show empty state
    expect(screen.getByText('No Books Found')).toBeTruthy()
    expect(screen.getByText(/No books match the search: "nonexistent"/)).toBeTruthy()

    // Should have "Clear Search" button
    const clearSearchButton = screen.getByText('Clear Search')
    expect(clearSearchButton).toBeTruthy()

    // Click clear search
    fireEvent.click(clearSearchButton)

    // All books should be visible again
    const bookTitles = screen.getAllByRole('heading', { level: 3 })
    expect(bookTitles).toHaveLength(4)
  })

  it('should show both clear buttons when both filters are active and no results', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')
    const categoryDropdown = screen.getByRole('combobox') as HTMLSelectElement

    // Apply both filters
    fireEvent.change(categoryDropdown, { target: { value: 'Theology' } })
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    // Should show empty state
    expect(screen.getByText('No Books Found')).toBeTruthy()

    // Should have both clear buttons
    expect(screen.getByText('Clear Search')).toBeTruthy()
    expect(screen.getByText('Clear Category Filter')).toBeTruthy()
  })

  it('should maintain search when toggling publish status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockBooks[0], published: false }),
    })
    global.fetch = mockFetch

    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')

    // Search for "john"
    fireEvent.change(searchInput, { target: { value: 'john' } })

    // Verify search is applied
    expect(screen.getByText('2 books matching "john"')).toBeTruthy()

    // Toggle publish status on one of the books
    const toggleButtons = screen.getAllByRole('button', { name: /publish book|unpublish book/i })
    fireEvent.click(toggleButtons[0])

    // Search should still be "john"
    expect((searchInput as HTMLInputElement).value).toBe('john')
  })

  it('should be case-insensitive for both title and author searches', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')

    // Test uppercase
    fireEvent.change(searchInput, { target: { value: 'PRAYER' } })
    expect(screen.getByText('The Power of Prayer')).toBeTruthy()

    // Test mixed case
    fireEvent.change(searchInput, { target: { value: 'JoHn' } })
    const bookTitles = screen.getAllByRole('heading', { level: 3 })
    expect(bookTitles).toHaveLength(2)
  })

  it('should show all books when search query is empty', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')

    // Type and then clear
    fireEvent.change(searchInput, { target: { value: 'prayer' } })
    fireEvent.change(searchInput, { target: { value: '' } })

    // All books should be visible
    const bookTitles = screen.getAllByRole('heading', { level: 3 })
    expect(bookTitles).toHaveLength(4)
  })

  it('should update count message to include both category and search when both are active', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    const searchInput = screen.getByPlaceholderText('Search by title or author...')
    const categoryDropdown = screen.getByRole('combobox') as HTMLSelectElement

    // Apply category filter
    fireEvent.change(categoryDropdown, { target: { value: 'Leadership' } })

    // Apply search
    fireEvent.change(searchInput, { target: { value: 'john' } })

    // Should show count with both filters mentioned
    expect(screen.getByText('1 book in Leadership matching "john"')).toBeTruthy()
  })
})
