/**
 * Property-Based Tests for TractGrid Public Display
 * 
 * Feature: tracts-management-system
 * 
 * This test suite validates public display properties for the TractGrid component:
 * - Property 17: PDF Document Link Rendering
 * - Property 18: Title Search Accuracy
 * 
 * Validates Requirements: 8.4, 8.5, 8.7, 16.2
 */

import { describe, expect, beforeEach, afterEach } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import { TractGrid } from '@/app/tracts/tract-grid'
import { TRACT_CATEGORIES } from '@/lib/types/tract'
import type { Tract } from '@/lib/types/tract'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    return <img src={src} alt={alt} {...props} />
  },
}))

// Arbitrary for generating valid tract data
const tractArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  category: fc.constantFrom(...TRACT_CATEGORIES),
  description: fc.string({ minLength: 10, maxLength: 1000 }),
  coverImage: fc.webUrl(),
  documentUrl: fc.webUrl(),
  published: fc.constant(true), // Public page only shows published tracts
  createdBy: fc.constant('test-user'),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<Tract>

describe('Property 17: PDF Document Link Rendering', () => {
  beforeEach(() => {
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  it.prop([tractArbitrary], { numRuns: 20 })(
    'renders a "View PDF" button that links to documentUrl with target="_blank" for any tract',
    (tract) => {
      const { container } = render(<TractGrid tracts={[tract]} />)

      // Find all "View PDF" buttons
      const viewPdfButtons = screen.getAllByText('View PDF')
      expect(viewPdfButtons.length).toBeGreaterThan(0)

      // Find the link element that contains "View PDF"
      const viewPdfLink = viewPdfButtons[0].closest('a')
      expect(viewPdfLink).toBeTruthy()

      // Verify the link has correct href (documentUrl)
      expect(viewPdfLink?.getAttribute('href')).toBe(tract.documentUrl)

      // Verify the link opens in a new tab
      expect(viewPdfLink?.getAttribute('target')).toBe('_blank')

      // Verify the link has security attributes
      expect(viewPdfLink?.getAttribute('rel')).toContain('noopener')
      expect(viewPdfLink?.getAttribute('rel')).toContain('noreferrer')
    }
  )

  it.prop([fc.array(tractArbitrary, { minLength: 1, maxLength: 20 })], { numRuns: 20 })(
    'renders correct PDF links for every tract in a set',
    (tracts) => {
      const { container } = render(<TractGrid tracts={tracts} />)

      // Verify each tract has a "View PDF" button with correct link
      tracts.forEach((tract) => {
        // Find all links with the tract's documentUrl
        const links = container.querySelectorAll(`a[href="${tract.documentUrl}"]`)
        
        // Should have at least one link (View PDF button)
        expect(links.length).toBeGreaterThan(0)

        // Verify at least one link has target="_blank"
        const viewPdfLink = Array.from(links).find(
          (link) => link.getAttribute('target') === '_blank'
        )
        expect(viewPdfLink).toBeTruthy()
      })
    }
  )

  it.prop([tractArbitrary], { numRuns: 20 })(
    'renders a "Download PDF" link that also points to documentUrl',
    (tract) => {
      const { container } = render(<TractGrid tracts={[tract]} />)

      // Find the "Download PDF" text
      const downloadPdfText = screen.getByText('Download PDF')
      expect(downloadPdfText).toBeTruthy()

      // Find the link element that contains "Download PDF"
      const downloadPdfLink = downloadPdfText.closest('a')
      expect(downloadPdfLink).toBeTruthy()

      // Verify the link has correct href (documentUrl)
      expect(downloadPdfLink?.getAttribute('href')).toBe(tract.documentUrl)

      // Verify the link has download attribute
      expect(downloadPdfLink?.hasAttribute('download')).toBe(true)

      // Verify the link opens in a new tab
      expect(downloadPdfLink?.getAttribute('target')).toBe('_blank')
    }
  )

  it.prop([fc.array(tractArbitrary, { minLength: 2, maxLength: 10 })], { numRuns: 20 })(
    'renders unique PDF links for tracts with different documentUrls',
    (tracts) => {
      // Ensure tracts have unique documentUrls
      const uniqueTracts = tracts.map((tract, index) => ({
        ...tract,
        documentUrl: `https://example.com/pdf-${index}.pdf`,
      }))

      const { container } = render(<TractGrid tracts={uniqueTracts} />)

      // Verify each unique documentUrl appears in the rendered output
      uniqueTracts.forEach((tract) => {
        const links = container.querySelectorAll(`a[href="${tract.documentUrl}"]`)
        expect(links.length).toBeGreaterThan(0)
      })

      // Verify the total number of unique documentUrls matches
      const allLinks = container.querySelectorAll('a[href^="https://example.com/pdf-"]')
      const uniqueHrefs = new Set(
        Array.from(allLinks).map((link) => link.getAttribute('href'))
      )
      expect(uniqueHrefs.size).toBe(uniqueTracts.length)
    }
  )

  it.prop([tractArbitrary], { numRuns: 20 })(
    'PDF link remains accessible even when image fails to load',
    (tract) => {
      const { container } = render(<TractGrid tracts={[tract]} />)

      // Simulate image load error
      const image = container.querySelector('img')
      if (image) {
        fireEvent.error(image)
      }

      // Verify "View PDF" button is still present and functional
      const viewPdfButtons = screen.getAllByText('View PDF')
      expect(viewPdfButtons.length).toBeGreaterThan(0)

      const viewPdfLink = viewPdfButtons[0].closest('a')
      expect(viewPdfLink?.getAttribute('href')).toBe(tract.documentUrl)
    }
  )
})

describe('Property 18: Title Search Accuracy', () => {
  beforeEach(() => {
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  it.prop([
    fc.array(tractArbitrary, { minLength: 5, maxLength: 20 }),
    fc.string({ minLength: 1, maxLength: 20 }),
  ], { numRuns: 20 })(
    'returns only tracts whose title contains the search query (case-insensitive)',
    (tracts, searchQuery) => {
      render(<TractGrid tracts={tracts} />)

      // Find and interact with search input
      const searchInput = screen.getByPlaceholderText('Search by title...')
      expect(searchInput).toBeTruthy()

      // Enter search query
      fireEvent.change(searchInput, { target: { value: searchQuery } })

      // Calculate expected results
      const expectedTracts = tracts.filter((tract) =>
        tract.title.toLowerCase().includes(searchQuery.toLowerCase())
      )

      if (expectedTracts.length === 0) {
        // When no results, should show empty state or no tract cards
        const tractCards = screen.queryAllByText('View PDF')
        expect(tractCards.length).toBe(0)
      } else {
        // Verify only matching tracts are displayed
        expectedTracts.forEach((tract) => {
          // Title should be visible
          expect(screen.getByText(tract.title)).toBeTruthy()
        })

        // Verify non-matching tracts are NOT displayed
        const nonMatchingTracts = tracts.filter(
          (tract) => !tract.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        nonMatchingTracts.forEach((tract) => {
          // Title should NOT be visible
          expect(screen.queryByText(tract.title)).toBeFalsy()
        })
      }
    }
  )

  it.prop([
    fc.array(
      fc.record({
        id: fc.uuid(),
        title: fc.constantFrom(
          'The Gospel of Grace',
          'Salvation Through Faith',
          'Prayer and Intercession',
          'Christian Living Guide',
          'End Times Prophecy'
        ),
        category: fc.constantFrom(...TRACT_CATEGORIES),
        description: fc.string({ minLength: 10, maxLength: 1000 }),
        coverImage: fc.webUrl(),
        documentUrl: fc.webUrl(),
        published: fc.constant(true),
        createdBy: fc.constant('test-user'),
        createdAt: fc.date(),
        updatedAt: fc.date(),
      }) as fc.Arbitrary<Tract>,
      { minLength: 5, maxLength: 5 }
    ),
  ], { numRuns: 20 })(
    'search is case-insensitive for known titles',
    (tracts) => {
      render(<TractGrid tracts={tracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')

      // Test with lowercase search
      fireEvent.change(searchInput, { target: { value: 'gospel' } })
      const gospelTracts = tracts.filter((t) =>
        t.title.toLowerCase().includes('gospel')
      )
      if (gospelTracts.length > 0) {
        gospelTracts.forEach((tract) => {
          expect(screen.getByText(tract.title)).toBeTruthy()
        })
      }

      // Test with uppercase search
      fireEvent.change(searchInput, { target: { value: 'GOSPEL' } })
      if (gospelTracts.length > 0) {
        gospelTracts.forEach((tract) => {
          expect(screen.getByText(tract.title)).toBeTruthy()
        })
      }

      // Test with mixed case search
      fireEvent.change(searchInput, { target: { value: 'GoSpEl' } })
      if (gospelTracts.length > 0) {
        gospelTracts.forEach((tract) => {
          expect(screen.getByText(tract.title)).toBeTruthy()
        })
      }
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 3, maxLength: 15 }),
  ], { numRuns: 20 })(
    'partial title matches are included in search results',
    (tracts) => {
      // Pick a random tract and extract a substring from its title
      fc.pre(tracts.length > 0)
      
      const randomTract = tracts[0]
      const titleWords = randomTract.title.split(' ')
      
      // Skip if title is too short
      fc.pre(titleWords.length > 0 && titleWords[0].length > 2)
      
      const partialQuery = titleWords[0].substring(0, Math.max(2, Math.floor(titleWords[0].length / 2)))

      render(<TractGrid tracts={tracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')
      fireEvent.change(searchInput, { target: { value: partialQuery } })

      // The tract with the matching substring should be visible
      const matchingTracts = tracts.filter((tract) =>
        tract.title.toLowerCase().includes(partialQuery.toLowerCase())
      )

      if (matchingTracts.length > 0) {
        matchingTracts.forEach((tract) => {
          expect(screen.getByText(tract.title)).toBeTruthy()
        })
      }
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 5, maxLength: 20 }),
  ], { numRuns: 20 })(
    'empty search query shows all tracts',
    (tracts) => {
      render(<TractGrid tracts={tracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')
      
      // Start with a search query
      fireEvent.change(searchInput, { target: { value: 'test' } })
      
      // Clear the search
      fireEvent.change(searchInput, { target: { value: '' } })

      // All tracts should be visible
      tracts.forEach((tract) => {
        expect(screen.getByText(tract.title)).toBeTruthy()
      })
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 5, maxLength: 20 }),
    fc.string({ minLength: 1, maxLength: 10 }),
  ], { numRuns: 20 })(
    'search query with no matches shows no tract cards',
    (tracts, searchQuery) => {
      // Ensure the search query doesn't match any tract titles
      const noMatches = tracts.every(
        (tract) => !tract.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      fc.pre(noMatches)

      render(<TractGrid tracts={tracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')
      fireEvent.change(searchInput, { target: { value: searchQuery } })

      // No "View PDF" buttons should be visible (indicating no tract cards)
      const viewPdfButtons = screen.queryAllByText('View PDF')
      expect(viewPdfButtons.length).toBe(0)
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 5, maxLength: 20 }),
    fc.string({ minLength: 1, maxLength: 20 }),
  ], { numRuns: 20 })(
    'search does not affect tracts that do not match',
    (tracts, searchQuery) => {
      render(<TractGrid tracts={tracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')
      fireEvent.change(searchInput, { target: { value: searchQuery } })

      // Calculate matching and non-matching tracts
      const matchingTracts = tracts.filter((tract) =>
        tract.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      const nonMatchingTracts = tracts.filter(
        (tract) => !tract.title.toLowerCase().includes(searchQuery.toLowerCase())
      )

      // Verify matching tracts are visible
      matchingTracts.forEach((tract) => {
        expect(screen.getByText(tract.title)).toBeTruthy()
      })

      // Verify non-matching tracts are NOT visible
      nonMatchingTracts.forEach((tract) => {
        expect(screen.queryByText(tract.title)).toBeFalsy()
      })
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 5, maxLength: 20 }),
    fc.string({ minLength: 1, maxLength: 20 }),
    fc.constantFrom(...TRACT_CATEGORIES),
  ], { numRuns: 20 })(
    'search works in combination with category filter',
    (tracts, searchQuery, selectedCategory) => {
      render(<TractGrid tracts={tracts} />)

      // Apply category filter first
      const categoryButtons = screen.getAllByRole('button')
      const categoryButton = categoryButtons.find(
        (btn) => btn.textContent === selectedCategory
      )
      if (categoryButton) {
        fireEvent.click(categoryButton)
      }

      // Apply search filter
      const searchInput = screen.getByPlaceholderText('Search by title...')
      fireEvent.change(searchInput, { target: { value: searchQuery } })

      // Calculate expected results (both filters applied)
      const expectedTracts = tracts.filter(
        (tract) =>
          tract.category === selectedCategory &&
          tract.title.toLowerCase().includes(searchQuery.toLowerCase())
      )

      if (expectedTracts.length === 0) {
        // No tract cards should be visible
        const viewPdfButtons = screen.queryAllByText('View PDF')
        expect(viewPdfButtons.length).toBe(0)
      } else {
        // Only matching tracts should be visible
        expectedTracts.forEach((tract) => {
          expect(screen.getByText(tract.title)).toBeTruthy()
        })

        // Verify the count matches
        const viewPdfButtons = screen.getAllByText('View PDF')
        expect(viewPdfButtons.length).toBe(expectedTracts.length)
      }
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 5, maxLength: 20 }),
    fc.string({ minLength: 1, maxLength: 20 }),
  ], { numRuns: 20 })(
    'clearing search query restores all tracts',
    (tracts, searchQuery) => {
      render(<TractGrid tracts={tracts} />)

      const searchInput = screen.getByPlaceholderText('Search by title...')
      
      // Apply search
      fireEvent.change(searchInput, { target: { value: searchQuery } })

      // Clear search using the clear button
      const clearButton = screen.queryByLabelText('Clear search')
      if (clearButton) {
        fireEvent.click(clearButton)
      } else {
        // Fallback: clear by setting value to empty
        fireEvent.change(searchInput, { target: { value: '' } })
      }

      // All tracts should be visible again
      tracts.forEach((tract) => {
        expect(screen.getByText(tract.title)).toBeTruthy()
      })
    }
  )
})

/**
 * **Validates: Requirements 8.4, 8.5, 8.7, 16.2**
 * 
 * Property 17: PDF Document Link Rendering
 * - For any tract with a documentUrl, the public page SHALL display a "View PDF" or 
 *   "Download" button that links to that URL with target="_blank" to open in a new tab.
 * 
 * Property 18: Title Search Accuracy
 * - For any search query string and any set of tracts with various titles, searching by 
 *   title SHALL return only tracts whose title contains the query string (case-insensitive).
 */
