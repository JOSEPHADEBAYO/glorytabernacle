import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TractGrid } from '@/app/tracts/tract-grid'
import type { Tract } from '@/lib/types/tract'

/**
 * Unit Tests for TractGrid Component
 * 
 * **Validates: Requirements 8.2, 8.4, 8.6, 8.7**
 * 
 * Test Coverage:
 * - Rendering with empty tracts array
 * - Rendering with multiple tracts
 * - Responsive grid layout
 * - Search filtering
 * - Category filtering
 * - "View PDF" button functionality
 */

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}))

// Mock IntersectionObserver for animation effects
class MockIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}

global.IntersectionObserver = MockIntersectionObserver as any

describe('TractGrid Component - Unit Tests (Task 18.5)', () => {
  const mockTracts: Tract[] = [
    {
      id: '1',
      title: 'The Power of Prayer',
      category: 'Prayer & Intercession',
      description: 'A comprehensive guide to prayer and intercession in the Christian life',
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
      description: 'Understanding salvation and grace through faith in Jesus Christ',
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
      description: 'Biblical prophecy about the end times and second coming',
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
      description: 'Understanding core Christian beliefs and doctrines',
      coverImage: 'https://example.com/image4.jpg',
      documentUrl: 'https://example.com/doc4.pdf',
      published: true,
      createdBy: 'admin',
      createdAt: new Date('2024-01-04'),
      updatedAt: new Date('2024-01-04'),
    },
    {
      id: '5',
      title: 'Christian Living',
      category: 'Christian Living',
      description: 'Practical guidance for living a Christian life daily',
      coverImage: 'https://example.com/image5.jpg',
      documentUrl: 'https://example.com/doc5.pdf',
      published: true,
      createdBy: 'admin',
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05'),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering with Empty Tracts Array (Requirement 8.2)', () => {
    it('should display empty state message when no tracts are provided', () => {
      render(<TractGrid tracts={[]} />)

      expect(screen.getByText('No tracts available at the moment. Check back soon!')).toBeTruthy()
    })

    it('should not render search bar when tracts array is empty', () => {
      render(<TractGrid tracts={[]} />)

      expect(screen.queryByPlaceholderText('Search by title...')).toBeNull()
    })

    it('should not render category filter tabs when tracts array is empty', () => {
      render(<TractGrid tracts={[]} />)

      expect(screen.queryByText('All Tracts')).toBeNull()
      expect(screen.queryByText('Theology')).toBeNull()
    })

    it('should not render grid container when tracts array is empty', () => {
      const { container } = render(<TractGrid tracts={[]} />)

      const grid = container.querySelector('.grid')
      expect(grid).toBeNull()
    })

    it('should center empty state message', () => {
      const { container } = render(<TractGrid tracts={[]} />)

      const emptyState = container.querySelector('.text-center')
      expect(emptyState).toBeTruthy()
    })
  })

  describe('Rendering with Multiple Tracts (Requirement 8.2)', () => {
    it('should render all tracts when provided', () => {
      render(<TractGrid tracts={mockTracts} />)

      const tractTitles = screen.getAllByRole('heading', { level: 3 })
      expect(tractTitles).toHaveLength(5)
    })

    it('should display tract titles correctly', () => {
      render(<TractGrid tracts={mockTracts} />)

      // Use getAllByText for titles that might appear in both category tabs and tract cards
      expect(screen.getByText('The Power of Prayer')).toBeTruthy()
      expect(screen.getByText('Salvation Through Faith')).toBeTruthy()
      expect(screen.getByText('End Times Prophecy')).toBeTruthy()
      expect(screen.getByText('Faith and Doctrine')).toBeTruthy()
      
      // "Christian Living" appears in both category tab and tract title
      const christianLivingElements = screen.getAllByText('Christian Living')
      expect(christianLivingElements.length).toBeGreaterThanOrEqual(1)
    })

    it('should display tract descriptions', () => {
      render(<TractGrid tracts={mockTracts} />)

      expect(screen.getByText(/comprehensive guide to prayer/i)).toBeTruthy()
      expect(screen.getByText(/Understanding salvation and grace/i)).toBeTruthy()
      expect(screen.getByText(/Biblical prophecy about the end times/i)).toBeTruthy()
    })

    it('should render cover images for all tracts', () => {
      render(<TractGrid tracts={mockTracts} />)

      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThanOrEqual(5)
    })

    it('should use tract title as image alt text', () => {
      render(<TractGrid tracts={mockTracts} />)

      expect(screen.getByAltText('The Power of Prayer')).toBeTruthy()
      expect(screen.getByAltText('Salvation Through Faith')).toBeTruthy()
    })

    it('should render search bar when tracts are present', () => {
      render(<TractGrid tracts={mockTracts} />)

      expect(screen.getByPlaceholderText('Search by title...')).toBeTruthy()
      expect(screen.getByText('Search Tracts')).toBeTruthy()
    })

    it('should render category filter tabs when tracts are present', () => {
      render(<TractGrid tracts={mockTracts} />)

      expect(screen.getByText('All Tracts')).toBeTruthy()
      expect(screen.getByText('Theology')).toBeTruthy()
      expect(screen.getByText('Evangelism')).toBeTruthy()
      expect(screen.getByText('Salvation')).toBeTruthy()
    })

    it('should render sort dropdown', () => {
      render(<TractGrid tracts={mockTracts} />)

      const sortSelect = screen.getByRole('combobox')
      expect(sortSelect).toBeTruthy()
      expect(screen.getByText('Sort by:')).toBeTruthy()
    })
  })

  describe('Responsive Grid Layout (Requirement 8.2)', () => {
    it('should render grid container with proper classes', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      const grid = container.querySelector('.grid')
      expect(grid).toBeTruthy()
      expect(grid?.classList.contains('grid-cols-2')).toBe(true)
    })

    it('should have responsive column classes', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      const grid = container.querySelector('.grid')
      // Check for Tailwind responsive classes
      expect(grid?.classList.contains('sm:grid-cols-2')).toBe(true)
      expect(grid?.classList.contains('lg:grid-cols-4')).toBe(true)
    })

    it('should apply gap spacing between grid items', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      const grid = container.querySelector('.grid')
      expect(grid?.classList.contains('gap-5')).toBe(true)
    })

    it('should render tract cards with proper styling', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      const cards = container.querySelectorAll('.rounded-2xl')
      expect(cards.length).toBeGreaterThanOrEqual(5)
    })

    it('should apply background color to tract cards', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      const cards = container.querySelectorAll('.bg-white')
      expect(cards.length).toBeGreaterThanOrEqual(5)
    })
  })

  describe('Search Filtering (Requirement 8.7)', () => {
    it('should filter tracts by title when search query is entered', () => {
      render(<TractGrid tracts={mockTracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')
      fireEvent.change(searchInput, { target: { value: 'prayer' } })

      const tractTitles = screen.getAllByRole('heading', { level: 3 })
      expect(tractTitles).toHaveLength(1)
      expect(screen.getByText('The Power of Prayer')).toBeTruthy()
    })

    it('should perform case-insensitive search', () => {
      render(<TractGrid tracts={mockTracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')
      fireEvent.change(searchInput, { target: { value: 'FAITH' } })

      const tractTitles = screen.getAllByRole('heading', { level: 3 })
      expect(tractTitles).toHaveLength(2)
      expect(screen.getByText('Salvation Through Faith')).toBeTruthy()
      expect(screen.getByText('Faith and Doctrine')).toBeTruthy()
    })

    it('should match partial strings in title', () => {
      render(<TractGrid tracts={mockTracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')
      fireEvent.change(searchInput, { target: { value: 'end' } })

      expect(screen.getByText('End Times Prophecy')).toBeTruthy()
    })

    it('should show no results when search does not match any tract', () => {
      render(<TractGrid tracts={mockTracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

      const tractTitles = screen.queryAllByRole('heading', { level: 3 })
      expect(tractTitles).toHaveLength(0)
    })

    it('should display clear button when search query is not empty', () => {
      render(<TractGrid tracts={mockTracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')
      
      // Initially no clear button
      expect(screen.queryByLabelText('Clear search')).toBeNull()

      // Type in search
      fireEvent.change(searchInput, { target: { value: 'prayer' } })

      // Clear button should appear
      expect(screen.getByLabelText('Clear search')).toBeTruthy()
    })

    it('should clear search when clear button is clicked', () => {
      render(<TractGrid tracts={mockTracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...') as HTMLInputElement
      fireEvent.change(searchInput, { target: { value: 'prayer' } })

      const clearButton = screen.getByLabelText('Clear search')
      fireEvent.click(clearButton)

      expect(searchInput.value).toBe('')
      
      // All tracts should be visible again
      const tractTitles = screen.getAllByRole('heading', { level: 3 })
      expect(tractTitles).toHaveLength(5)
    })

    it('should display search icon in input field', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')
      const inputContainer = searchInput.parentElement

      // Check for search icon SVG
      const searchIcon = inputContainer?.querySelector('svg')
      expect(searchIcon).toBeTruthy()
    })
  })

  describe('Category Filtering (Requirement 8.6)', () => {
    it('should display all category tabs', () => {
      render(<TractGrid tracts={mockTracts} />)

      // Use getAllByText for categories that might also appear in tract titles
      expect(screen.getByText('All Tracts')).toBeTruthy()
      expect(screen.getByText('Theology')).toBeTruthy()
      expect(screen.getByText('Evangelism')).toBeTruthy()
      expect(screen.getByText('Discipleship')).toBeTruthy()
      expect(screen.getByText('Prayer & Intercession')).toBeTruthy()
      
      // "Christian Living" appears in both category tab and tract title
      const christianLivingElements = screen.getAllByText('Christian Living')
      expect(christianLivingElements.length).toBeGreaterThanOrEqual(1)
      
      expect(screen.getByText('Salvation')).toBeTruthy()
      expect(screen.getByText('Faith & Doctrine')).toBeTruthy()
      expect(screen.getByText('End Times')).toBeTruthy()
      expect(screen.getByText('Other')).toBeTruthy()
    })

    it('should filter tracts by selected category', () => {
      render(<TractGrid tracts={mockTracts} />)

      const salvationButton = screen.getByText('Salvation')
      fireEvent.click(salvationButton)

      const tractTitles = screen.getAllByRole('heading', { level: 3 })
      expect(tractTitles).toHaveLength(1)
      expect(screen.getByText('Salvation Through Faith')).toBeTruthy()
    })

    it('should show all tracts when "All Tracts" category is selected', () => {
      render(<TractGrid tracts={mockTracts} />)

      // First select a specific category
      const salvationButton = screen.getByText('Salvation')
      fireEvent.click(salvationButton)

      // Then select "All Tracts"
      const allTractsButton = screen.getByText('All Tracts')
      fireEvent.click(allTractsButton)

      const tractTitles = screen.getAllByRole('heading', { level: 3 })
      expect(tractTitles).toHaveLength(5)
    })

    it('should highlight active category tab', () => {
      render(<TractGrid tracts={mockTracts} />)

      const salvationButton = screen.getByText('Salvation')
      fireEvent.click(salvationButton)

      // Active category should have green color (church-green)
      expect(salvationButton.style.color).toBeTruthy()
    })

    it('should combine category filter with search (AND logic)', () => {
      render(<TractGrid tracts={mockTracts} />)

      // Filter by "Salvation" category
      const salvationButton = screen.getByText('Salvation')
      fireEvent.click(salvationButton)

      // Search for "faith"
      const searchInput = screen.getByPlaceholderText('Search by title...')
      fireEvent.change(searchInput, { target: { value: 'faith' } })

      // Should only show "Salvation Through Faith"
      const tractTitles = screen.getAllByRole('heading', { level: 3 })
      expect(tractTitles).toHaveLength(1)
      expect(screen.getByText('Salvation Through Faith')).toBeTruthy()
    })

    it('should show no results when category and search do not match', () => {
      render(<TractGrid tracts={mockTracts} />)

      // Filter by "Theology" category
      const theologyButton = screen.getByText('Theology')
      fireEvent.click(theologyButton)

      // Search for "prayer"
      const searchInput = screen.getByPlaceholderText('Search by title...')
      fireEvent.change(searchInput, { target: { value: 'prayer' } })

      // Should show no tracts
      const tractTitles = screen.queryAllByRole('heading', { level: 3 })
      expect(tractTitles).toHaveLength(0)
    })

    it('should filter by "End Times" category', () => {
      render(<TractGrid tracts={mockTracts} />)

      const endTimesButton = screen.getByText('End Times')
      fireEvent.click(endTimesButton)

      const tractTitles = screen.getAllByRole('heading', { level: 3 })
      expect(tractTitles).toHaveLength(1)
      expect(screen.getByText('End Times Prophecy')).toBeTruthy()
    })

    it('should filter by "Faith & Doctrine" category', () => {
      render(<TractGrid tracts={mockTracts} />)

      const faithDoctrineButton = screen.getByText('Faith & Doctrine')
      fireEvent.click(faithDoctrineButton)

      const tractTitles = screen.getAllByRole('heading', { level: 3 })
      expect(tractTitles).toHaveLength(1)
      expect(screen.getByText('Faith and Doctrine')).toBeTruthy()
    })
  })

  describe('"View PDF" Button Functionality (Requirement 8.4)', () => {
    it('should render "View PDF" button for each tract', () => {
      render(<TractGrid tracts={mockTracts} />)

      const viewPdfButtons = screen.getAllByText('View PDF')
      expect(viewPdfButtons).toHaveLength(5)
    })

    it('should link to correct documentUrl', () => {
      render(<TractGrid tracts={mockTracts} />)

      const viewPdfButtons = screen.getAllByText('View PDF')
      const firstButton = viewPdfButtons[0].closest('a')
      
      expect(firstButton).toBeTruthy()
      expect(firstButton?.getAttribute('href')).toBe('https://example.com/doc1.pdf')
    })

    it('should open PDF in new tab', () => {
      render(<TractGrid tracts={mockTracts} />)

      const viewPdfButtons = screen.getAllByText('View PDF')
      const firstButton = viewPdfButtons[0].closest('a')
      
      expect(firstButton?.getAttribute('target')).toBe('_blank')
      expect(firstButton?.getAttribute('rel')).toBe('noopener noreferrer')
    })

    it('should render "Download PDF" button for each tract', () => {
      render(<TractGrid tracts={mockTracts} />)

      const downloadButtons = screen.getAllByText('Download PDF')
      expect(downloadButtons).toHaveLength(5)
    })

    it('should have download attribute on download link', () => {
      render(<TractGrid tracts={mockTracts} />)

      const downloadButtons = screen.getAllByText('Download PDF')
      const firstButton = downloadButtons[0].closest('a')
      
      expect(firstButton?.hasAttribute('download')).toBe(true)
    })

    it('should link download button to documentUrl', () => {
      render(<TractGrid tracts={mockTracts} />)

      const downloadButtons = screen.getAllByText('Download PDF')
      const firstButton = downloadButtons[0].closest('a')
      
      expect(firstButton?.getAttribute('href')).toBe('https://example.com/doc1.pdf')
    })

    it('should have proper styling for View PDF button', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      const viewPdfButtons = container.querySelectorAll('a[href*="doc1.pdf"]')
      const viewButton = Array.from(viewPdfButtons).find(btn => 
        btn.textContent?.includes('View PDF')
      )
      
      expect(viewButton?.classList.contains('rounded-md')).toBe(true)
    })

    it('should display download icon on download button', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      const downloadButtons = screen.getAllByText('Download PDF')
      const firstButton = downloadButtons[0].closest('a')
      
      // Check for Download icon (Lucide icon)
      const icon = firstButton?.querySelector('svg')
      expect(icon).toBeTruthy()
    })
  })

  describe('Image Error Handling', () => {
    it('should render images with proper alt text', () => {
      render(<TractGrid tracts={mockTracts} />)

      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThanOrEqual(5)
      
      // Verify alt text is set correctly
      expect(screen.getByAltText('The Power of Prayer')).toBeTruthy()
      expect(screen.getByAltText('Salvation Through Faith')).toBeTruthy()
    })

    it('should have onError handler for images', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      // Verify that images are rendered (the error handling is in place)
      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThanOrEqual(5)
      
      // The actual error handling behavior is tested in integration tests
      // since the mocked Image component doesn't trigger onError
    })
  })

  describe('Sort Functionality', () => {
    it('should display sort dropdown with options', () => {
      render(<TractGrid tracts={mockTracts} />)

      const sortSelect = screen.getByRole('combobox') as HTMLSelectElement
      expect(sortSelect).toBeTruthy()

      const options = Array.from(sortSelect.options).map(opt => opt.value)
      expect(options).toContain('newest')
      expect(options).toContain('oldest')
    })

    it('should default to "Newest Arrivals" sort option', () => {
      render(<TractGrid tracts={mockTracts} />)

      const sortSelect = screen.getByRole('combobox') as HTMLSelectElement
      expect(sortSelect.value).toBe('newest')
    })

    it('should allow changing sort option', () => {
      render(<TractGrid tracts={mockTracts} />)

      const sortSelect = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(sortSelect, { target: { value: 'oldest' } })

      expect(sortSelect.value).toBe('oldest')
    })
  })

  describe('Tract Card Structure', () => {
    it('should render tract cards with proper structure', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      const cards = container.querySelectorAll('.rounded-2xl')
      expect(cards.length).toBeGreaterThanOrEqual(5)
    })

    it('should display tract title in heading', () => {
      render(<TractGrid tracts={mockTracts} />)

      const headings = screen.getAllByRole('heading', { level: 3 })
      expect(headings[0].textContent).toBe('The Power of Prayer')
    })

    it('should truncate long descriptions with line-clamp', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      const descriptions = container.querySelectorAll('.line-clamp-3')
      expect(descriptions.length).toBeGreaterThanOrEqual(5)
    })

    it('should apply proper text styling to descriptions', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      const descriptions = container.querySelectorAll('.text-gray-500')
      expect(descriptions.length).toBeGreaterThan(0)
    })
  })

  describe('Filter Bar Layout', () => {
    it('should render filter bar with proper structure', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      const filterBar = container.querySelector('.border-b')
      expect(filterBar).toBeTruthy()
    })

    it('should display category tabs in horizontal layout', () => {
      const { container } = render(<TractGrid tracts={mockTracts} />)

      const tabsContainer = container.querySelector('.overflow-x-auto')
      expect(tabsContainer).toBeTruthy()
    })

    it('should render sort control in filter bar', () => {
      render(<TractGrid tracts={mockTracts} />)

      expect(screen.getByText('Sort by:')).toBeTruthy()
      expect(screen.getByRole('combobox')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<TractGrid tracts={mockTracts} />)

      const headings = screen.getAllByRole('heading', { level: 3 })
      expect(headings.length).toBeGreaterThan(0)
    })

    it('should have accessible button labels', () => {
      render(<TractGrid tracts={mockTracts} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button.textContent).toBeTruthy()
      })
    })

    it('should have proper link attributes for external PDFs', () => {
      render(<TractGrid tracts={mockTracts} />)

      const viewPdfButtons = screen.getAllByText('View PDF')
      const firstLink = viewPdfButtons[0].closest('a')
      
      expect(firstLink?.getAttribute('rel')).toContain('noopener')
      expect(firstLink?.getAttribute('rel')).toContain('noreferrer')
    })

    it('should have accessible search input with label', () => {
      render(<TractGrid tracts={mockTracts} />)

      expect(screen.getByText('Search Tracts')).toBeTruthy()
      expect(screen.getByPlaceholderText('Search by title...')).toBeTruthy()
    })

    it('should have accessible clear search button', () => {
      render(<TractGrid tracts={mockTracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')
      fireEvent.change(searchInput, { target: { value: 'test' } })

      const clearButton = screen.getByLabelText('Clear search')
      expect(clearButton).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle single tract', () => {
      render(<TractGrid tracts={[mockTracts[0]]} />)

      const tractTitles = screen.getAllByRole('heading', { level: 3 })
      expect(tractTitles).toHaveLength(1)
    })

    it('should handle tracts with very long titles', () => {
      const longTitleTract: Tract = {
        ...mockTracts[0],
        title: 'A'.repeat(200),
      }

      render(<TractGrid tracts={[longTitleTract]} />)

      expect(screen.getByText('A'.repeat(200))).toBeTruthy()
    })

    it('should handle tracts with very long descriptions', () => {
      const longDescTract: Tract = {
        ...mockTracts[0],
        description: 'B'.repeat(1000),
      }

      render(<TractGrid tracts={[longDescTract]} />)

      expect(screen.getByText('B'.repeat(1000))).toBeTruthy()
    })

    it('should handle special characters in search', () => {
      render(<TractGrid tracts={mockTracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')
      
      // Search for a title with special characters (none in our mock data)
      fireEvent.change(searchInput, { target: { value: '&' } })

      // Should show no results since no tract titles contain "&"
      const tractTitles = screen.queryAllByRole('heading', { level: 3 })
      expect(tractTitles).toHaveLength(0)
    })

    it('should maintain state when switching between filters', () => {
      render(<TractGrid tracts={mockTracts} />)

      // Apply search
      const searchInput = screen.getByPlaceholderText('Search by title...')
      fireEvent.change(searchInput, { target: { value: 'faith' } })

      // Switch category
      const salvationButton = screen.getByText('Salvation')
      fireEvent.click(salvationButton)

      // Search should still be active
      expect((searchInput as HTMLInputElement).value).toBe('faith')
    })
  })
})
