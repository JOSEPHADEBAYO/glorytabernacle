import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TractGrid } from '@/app/tracts/tract-grid'
import type { Tract } from '@/lib/types/tract'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}))

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}

global.IntersectionObserver = MockIntersectionObserver as any

describe('TractGrid - Search Functionality (Task 18.2)', () => {
  const mockTracts: Tract[] = [
    {
      id: '1',
      title: 'The Power of Prayer',
      category: 'Prayer & Intercession',
      description: 'A comprehensive guide to prayer and intercession',
      coverImage: 'https://example.com/image1.jpg',
      documentUrl: 'https://example.com/doc1.pdf',
      published: true,
      createdBy: 'admin',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      title: 'Salvation Through Faith',
      category: 'Salvation',
      description: 'Understanding salvation and grace',
      coverImage: 'https://example.com/image2.jpg',
      documentUrl: 'https://example.com/doc2.pdf',
      published: true,
      createdBy: 'admin',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: '3',
      title: 'End Times Prophecy',
      category: 'End Times',
      description: 'Biblical prophecy about the end times',
      coverImage: 'https://example.com/image3.jpg',
      documentUrl: 'https://example.com/doc3.pdf',
      published: true,
      createdBy: 'admin',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
    {
      id: '4',
      title: 'Faith and Doctrine',
      category: 'Faith & Doctrine',
      description: 'Understanding core Christian beliefs',
      coverImage: 'https://example.com/image4.jpg',
      documentUrl: 'https://example.com/doc4.pdf',
      published: true,
      createdBy: 'admin',
      createdAt: new Date('2024-01-04'),
      updatedAt: new Date('2024-01-04'),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display search bar with label and input field', () => {
    render(<TractGrid tracts={mockTracts} />)

    // Check that the search label exists
    expect(screen.getByText('Search Tracts')).toBeTruthy()

    // Check that the search input exists
    const searchInput = screen.getByPlaceholderText('Search by title...')
    expect(searchInput).toBeTruthy()
  })

  it('should display search icon in the input field', () => {
    render(<TractGrid tracts={mockTracts} />)

    const searchInput = screen.getByPlaceholderText('Search by title...')
    const container = searchInput.parentElement

    // Check for search icon (magnifying glass SVG)
    const searchIcon = container?.querySelector('svg path[d*="M21 21l-5.197-5.197"]')
    expect(searchIcon).toBeTruthy()
  })

  it('should filter tracts by title (case-insensitive)', () => {
    render(<TractGrid tracts={mockTracts} />)

    const searchInput = screen.getByPlaceholderText('Search by title...')

    // Search for "prayer" (lowercase)
    fireEvent.change(searchInput, { target: { value: 'prayer' } })

    // Should only show "The Power of Prayer"
    const tractTitles = screen.getAllByRole('heading', { level: 3 })
    expect(tractTitles).toHaveLength(1)
    expect(screen.getByText('The Power of Prayer')).toBeTruthy()
  })

  it('should match partial strings in title', () => {
    render(<TractGrid tracts={mockTracts} />)

    const searchInput = screen.getByPlaceholderText('Search by title...')

    // Search for "faith" (matches both "Salvation Through Faith" and "Faith and Doctrine")
    fireEvent.change(searchInput, { target: { value: 'faith' } })

    // Should show 2 tracts with "faith" in the title
    const tractTitles = screen.getAllByRole('heading', { level: 3 })
    expect(tractTitles).toHaveLength(2)
    expect(screen.getByText('Salvation Through Faith')).toBeTruthy()
    expect(screen.getByText('Faith and Doctrine')).toBeTruthy()
  })

  it('should combine search with category filter (AND logic)', () => {
    render(<TractGrid tracts={mockTracts} />)

    const searchInput = screen.getByPlaceholderText('Search by title...')

    // Filter by "Salvation" category
    const salvationButton = screen.getByText('Salvation')
    fireEvent.click(salvationButton)

    // Then search for "faith"
    fireEvent.change(searchInput, { target: { value: 'faith' } })

    // Should only show "Salvation Through Faith"
    // (matches both category AND search)
    const tractTitles = screen.getAllByRole('heading', { level: 3 })
    expect(tractTitles).toHaveLength(1)
    expect(screen.getByText('Salvation Through Faith')).toBeTruthy()
  })

  it('should show no results when search and category do not match any tracts', () => {
    render(<TractGrid tracts={mockTracts} />)

    const searchInput = screen.getByPlaceholderText('Search by title...')

    // Filter by "Theology" category
    const theologyButton = screen.getByText('Theology')
    fireEvent.click(theologyButton)

    // Search for "prayer" (no Theology tracts with "prayer" in title)
    fireEvent.change(searchInput, { target: { value: 'prayer' } })

    // Should show no tracts (empty grid)
    const tractTitles = screen.queryAllByRole('heading', { level: 3 })
    expect(tractTitles).toHaveLength(0)
  })

  it('should display clear search button when search query is not empty', () => {
    render(<TractGrid tracts={mockTracts} />)

    const searchInput = screen.getByPlaceholderText('Search by title...')

    // Initially no clear button
    expect(screen.queryByLabelText('Clear search')).toBeNull()

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'prayer' } })

    // Clear button should appear
    const clearButton = screen.getByLabelText('Clear search')
    expect(clearButton).toBeTruthy()
  })

  it('should clear search when clear button is clicked', () => {
    render(<TractGrid tracts={mockTracts} />)

    const searchInput = screen.getByPlaceholderText('Search by title...') as HTMLInputElement

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'prayer' } })
    expect(searchInput.value).toBe('prayer')

    // Click clear button
    const clearButton = screen.getByLabelText('Clear search')
    fireEvent.click(clearButton)

    // Search should be cleared
    expect(searchInput.value).toBe('')

    // All tracts should be visible again
    const tractTitles = screen.getAllByRole('heading', { level: 3 })
    expect(tractTitles).toHaveLength(4)
  })

  it('should be case-insensitive for title searches', () => {
    render(<TractGrid tracts={mockTracts} />)

    const searchInput = screen.getByPlaceholderText('Search by title...')

    // Test uppercase
    fireEvent.change(searchInput, { target: { value: 'PRAYER' } })
    expect(screen.getByText('The Power of Prayer')).toBeTruthy()

    // Test mixed case
    fireEvent.change(searchInput, { target: { value: 'FaItH' } })
    const tractTitles = screen.getAllByRole('heading', { level: 3 })
    expect(tractTitles).toHaveLength(2)
  })

  it('should show all tracts when search query is empty', () => {
    render(<TractGrid tracts={mockTracts} />)

    const searchInput = screen.getByPlaceholderText('Search by title...')

    // Type and then clear
    fireEvent.change(searchInput, { target: { value: 'prayer' } })
    fireEvent.change(searchInput, { target: { value: '' } })

    // All tracts should be visible
    const tractTitles = screen.getAllByRole('heading', { level: 3 })
    expect(tractTitles).toHaveLength(4)
  })

  it('should maintain search when switching categories', () => {
    render(<TractGrid tracts={mockTracts} />)

    const searchInput = screen.getByPlaceholderText('Search by title...')

    // Search for "faith"
    fireEvent.change(searchInput, { target: { value: 'faith' } })

    // Verify search is applied (2 tracts with "faith")
    let tractTitles = screen.getAllByRole('heading', { level: 3 })
    expect(tractTitles).toHaveLength(2)

    // Switch to "Salvation" category
    const salvationButton = screen.getByText('Salvation')
    fireEvent.click(salvationButton)

    // Search should still be "faith" and only show 1 tract
    expect((searchInput as HTMLInputElement).value).toBe('faith')
    tractTitles = screen.getAllByRole('heading', { level: 3 })
    expect(tractTitles).toHaveLength(1)
    expect(screen.getByText('Salvation Through Faith')).toBeTruthy()
  })

  it('should filter correctly with "All Tracts" category selected', () => {
    render(<TractGrid tracts={mockTracts} />)

    const searchInput = screen.getByPlaceholderText('Search by title...')

    // First select a specific category
    const salvationButton = screen.getByText('Salvation')
    fireEvent.click(salvationButton)

    // Then go back to "All Tracts"
    const allTractsButton = screen.getByText('All Tracts')
    fireEvent.click(allTractsButton)

    // Search for "faith"
    fireEvent.change(searchInput, { target: { value: 'faith' } })

    // Should show both tracts with "faith" in title
    const tractTitles = screen.getAllByRole('heading', { level: 3 })
    expect(tractTitles).toHaveLength(2)
  })

  it('should handle search with no matching results', () => {
    render(<TractGrid tracts={mockTracts} />)

    const searchInput = screen.getByPlaceholderText('Search by title...')

    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    // Should show no tracts
    const tractTitles = screen.queryAllByRole('heading', { level: 3 })
    expect(tractTitles).toHaveLength(0)
  })

  it('should handle empty tracts array', () => {
    render(<TractGrid tracts={[]} />)

    // Should show empty state message
    expect(screen.getByText('No tracts available at the moment. Check back soon!')).toBeTruthy()

    // Search bar should not be rendered
    expect(screen.queryByPlaceholderText('Search by title...')).toBeNull()
  })
})
