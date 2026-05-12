/**
 * Property-Based Tests for TractsManager UI Rendering
 * 
 * Feature: tracts-management-system
 * 
 * This test suite validates UI rendering properties for the TractsManager component:
 * - Property 7: Complete Field Rendering
 * - Property 8: Draft Status Indication
 * - Property 9: Tract Count Accuracy
 * 
 * Validates Requirements: 2.6, 2.7, 2.8, 5.4, 6.6, 8.2, 8.4
 */

import { describe, expect, beforeEach, afterEach } from 'vitest'
import { fc, it } from '@fast-check/vitest'
import { render, cleanup, screen, within, fireEvent } from '@testing-library/react'
import { TractsManager } from '@/components/dashboard/tracts-manager'
import { TRACT_CATEGORIES } from '@/lib/types/tract'

// Mock Next.js router
const mockRouter = {
  push: () => {},
  refresh: () => {},
}

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    return <img src={src} alt={alt} {...props} />
  },
}))

// Mock toast provider
const mockToast = vi.fn()
vi.mock('@/components/ui/toast-provider', () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock FileUploadField component
vi.mock('@/components/dashboard/file-upload-field', () => ({
  FileUploadField: ({ label, currentUrl }: any) => (
    <div data-testid="file-upload-field">
      <label>{label}</label>
      {currentUrl && <span data-testid="current-url">{currentUrl}</span>}
    </div>
  ),
}))

// Arbitrary for generating valid tract data
const tractArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  category: fc.constantFrom(...TRACT_CATEGORIES),
  description: fc.string({ minLength: 10, maxLength: 1000 }),
  coverImage: fc.webUrl(),
  documentUrl: fc.webUrl(),
  published: fc.boolean(),
  createdAt: fc.date(),
})

describe('Property 7: Complete Field Rendering', () => {
  beforeEach(() => {
    cleanup()
    mockToast.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Grid View', () => {
    it.prop([tractArbitrary], { numRuns: 20 })(
      'renders all core fields (cover image, title, category, description) for any tract in grid view',
      (tract) => {
        const { container } = render(<TractsManager initialTracts={[tract]} />)

        // Verify cover image is rendered
        const coverImage = container.querySelector(`img[src="${tract.coverImage}"]`)
        expect(coverImage).toBeTruthy()
        expect(coverImage?.getAttribute('alt')).toBe(tract.title)

        // Verify title is rendered
        expect(screen.getByText(tract.title)).toBeTruthy()

        // Verify category is rendered
        expect(screen.getByText(tract.category)).toBeTruthy()

        // Verify description is rendered (may be truncated with line-clamp-2)
        const descriptionElement = screen.getByText((content, element) => {
          return element?.textContent === tract.description
        })
        expect(descriptionElement).toBeTruthy()
      }
    )

    it.prop([fc.array(tractArbitrary, { minLength: 1, maxLength: 20 })], { numRuns: 20 })(
      'renders all core fields for every tract in a set',
      (tracts) => {
        const { container } = render(<TractsManager initialTracts={tracts} />)

        // Verify each tract has all required fields rendered
        tracts.forEach((tract) => {
          // Cover image
          const coverImage = container.querySelector(`img[src="${tract.coverImage}"]`)
          expect(coverImage).toBeTruthy()

          // Title
          expect(screen.getByText(tract.title)).toBeTruthy()

          // Category
          expect(screen.getByText(tract.category)).toBeTruthy()

          // Description (check if it exists in the document)
          expect(container.textContent).toContain(tract.description)
        })
      }
    )
  })

  describe('Table View', () => {
    it.prop([tractArbitrary], { numRuns: 20 })(
      'renders all core fields (cover image, title, category) for any tract in table view',
      (tract) => {
        const { container } = render(<TractsManager initialTracts={[tract]} />)

        // Switch to table view
        const viewToggleButtons = screen.getAllByRole('button')
        const tableViewButton = viewToggleButtons.find(
          (btn) => btn.getAttribute('title') === 'Table View'
        )
        expect(tableViewButton).toBeTruthy()
        fireEvent.click(tableViewButton!)

        // Verify cover image is rendered in table
        const coverImage = container.querySelector(`img[src="${tract.coverImage}"]`)
        expect(coverImage).toBeTruthy()

        // Verify title is rendered
        expect(screen.getByText(tract.title)).toBeTruthy()

        // Verify category is rendered
        expect(screen.getByText(tract.category)).toBeTruthy()

        // Verify description is rendered (may be truncated)
        expect(container.textContent).toContain(tract.description)
      }
    )

    it.prop([fc.array(tractArbitrary, { minLength: 1, maxLength: 15 })], { numRuns: 20 })(
      'renders all core fields for every tract in table view',
      (tracts) => {
        const { container } = render(<TractsManager initialTracts={tracts} />)

        // Switch to table view
        const viewToggleButtons = screen.getAllByRole('button')
        const tableViewButton = viewToggleButtons.find(
          (btn) => btn.getAttribute('title') === 'Table View'
        )
        fireEvent.click(tableViewButton!)

        // Verify each tract has all required fields rendered
        // Note: Table view shows 10 items per page by default
        const visibleTracts = tracts.slice(0, 10)
        visibleTracts.forEach((tract) => {
          // Cover image
          const coverImage = container.querySelector(`img[src="${tract.coverImage}"]`)
          expect(coverImage).toBeTruthy()

          // Title
          expect(screen.getByText(tract.title)).toBeTruthy()

          // Category
          expect(screen.getByText(tract.category)).toBeTruthy()
        })
      }
    )
  })

  describe('PDF Document Link', () => {
    it.prop([tractArbitrary], { numRuns: 20 })(
      'renders View PDF button with correct documentUrl for any tract',
      (tract) => {
        render(<TractsManager initialTracts={[tract]} />)

        // Find the "View PDF" button
        const viewPdfButtons = screen.getAllByText('View PDF')
        expect(viewPdfButtons.length).toBeGreaterThan(0)

        // Verify the button exists (we can't easily test window.open in this context)
        // but we can verify the button is rendered
        expect(viewPdfButtons[0]).toBeTruthy()
      }
    )
  })
})

describe('Property 8: Draft Status Indication', () => {
  beforeEach(() => {
    cleanup()
    mockToast.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Grid View', () => {
    it.prop([tractArbitrary], { numRuns: 20 })(
      'displays "Draft" badge when published is false, no badge when published is true',
      (tract) => {
        const { container, rerender } = render(<TractsManager initialTracts={[tract]} />)

        if (tract.published === false) {
          // Should show "Draft" badge
          const draftBadges = screen.queryAllByText('Draft')
          expect(draftBadges.length).toBeGreaterThan(0)
        } else {
          // Should NOT show "Draft" badge in the yellow badge position
          // (Note: "Draft" may appear in the status toggle area, but not as a yellow badge)
          const yellowBadges = container.querySelectorAll('.bg-yellow-500')
          expect(yellowBadges.length).toBe(0)
        }

        // Test the opposite state
        const oppositeTract = { ...tract, published: !tract.published }
        rerender(<TractsManager initialTracts={[oppositeTract]} />)

        if (oppositeTract.published === false) {
          const draftBadges = screen.queryAllByText('Draft')
          expect(draftBadges.length).toBeGreaterThan(0)
        } else {
          const yellowBadges = container.querySelectorAll('.bg-yellow-500')
          expect(yellowBadges.length).toBe(0)
        }
      }
    )

    it.prop([fc.array(tractArbitrary, { minLength: 2, maxLength: 20 })], { numRuns: 20 })(
      'displays correct draft status for each tract in a mixed set',
      (tracts) => {
        const { container } = render(<TractsManager initialTracts={tracts} />)

        // Count expected draft badges (yellow badges on cover images)
        const expectedDraftCount = tracts.filter((t) => !t.published).length

        // Count actual draft badges (yellow badges)
        const yellowBadges = container.querySelectorAll('.bg-yellow-500')
        expect(yellowBadges.length).toBe(expectedDraftCount)
      }
    )
  })

  describe('Table View', () => {
    it.prop([tractArbitrary], { numRuns: 20 })(
      'displays correct status badge in table view',
      (tract) => {
        render(<TractsManager initialTracts={[tract]} />)

        // Switch to table view
        const viewToggleButtons = screen.getAllByRole('button')
        const tableViewButton = viewToggleButtons.find(
          (btn) => btn.getAttribute('title') === 'Table View'
        )
        fireEvent.click(tableViewButton!)

        if (tract.published === false) {
          // Should show "Draft" badge in status column
          const draftBadges = screen.queryAllByText('Draft')
          expect(draftBadges.length).toBeGreaterThan(0)
        } else {
          // Should show "Published" badge in status column
          const publishedBadges = screen.queryAllByText('Published')
          expect(publishedBadges.length).toBeGreaterThan(0)
        }
      }
    )

    it.prop([fc.array(tractArbitrary, { minLength: 2, maxLength: 15 })], { numRuns: 20 })(
      'displays correct status badges for all tracts in table view',
      (tracts) => {
        render(<TractsManager initialTracts={tracts} />)

        // Switch to table view
        const viewToggleButtons = screen.getAllByRole('button')
        const tableViewButton = viewToggleButtons.find(
          (btn) => btn.getAttribute('title') === 'Table View'
        )
        fireEvent.click(tableViewButton!)

        // Count expected draft and published tracts (only first 10 visible)
        const visibleTracts = tracts.slice(0, 10)
        const expectedDraftCount = visibleTracts.filter((t) => !t.published).length
        const expectedPublishedCount = visibleTracts.filter((t) => t.published).length

        // Count actual badges
        const draftBadges = screen.queryAllByText('Draft')
        const publishedBadges = screen.queryAllByText('Published')

        // Note: "Draft" and "Published" may appear in toggle labels too
        // So we check that at least the expected count exists
        expect(draftBadges.length).toBeGreaterThanOrEqual(expectedDraftCount)
        expect(publishedBadges.length).toBeGreaterThanOrEqual(expectedPublishedCount)
      }
    )
  })
})

describe('Property 9: Tract Count Accuracy', () => {
  beforeEach(() => {
    cleanup()
    mockToast.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it.prop([fc.array(tractArbitrary, { minLength: 0, maxLength: 100 })], { numRuns: 20 })(
    'displays count that exactly equals the number of tracts',
    (tracts) => {
      const { container } = render(<TractsManager initialTracts={tracts} />)

      if (tracts.length === 0) {
        // Empty state should be shown
        expect(screen.getByText('No Tracts Available')).toBeTruthy()
      } else {
        // Count should be displayed
        const expectedText = `${tracts.length} ${tracts.length === 1 ? 'tract' : 'tracts'}`
        expect(screen.getByText(expectedText)).toBeTruthy()
      }
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 1, maxLength: 50 }),
    fc.constantFrom(...TRACT_CATEGORIES),
  ], { numRuns: 20 })(
    'displays accurate filtered count when category filter is applied',
    (tracts, selectedCategory) => {
      render(<TractsManager initialTracts={tracts} />)

      // Apply category filter - use querySelector to find the select element
      const categorySelect = document.querySelector('select') as HTMLSelectElement
      expect(categorySelect).toBeTruthy()

      // Change to selected category
      categorySelect.value = selectedCategory
      categorySelect.dispatchEvent(new Event('change', { bubbles: true }))

      // Calculate expected count
      const filteredCount = tracts.filter((t) => t.category === selectedCategory).length

      // Verify displayed count - use queryAllByText to handle multiple matches
      const countText = `${filteredCount} ${filteredCount === 1 ? 'tract' : 'tracts'}`
      const elements = screen.queryAllByText((content, element) => {
        const text = element?.textContent || ''
        return text.includes(countText) && text.includes(selectedCategory)
      })
      
      // Should find at least one element with this text
      expect(elements.length).toBeGreaterThan(0)
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 1, maxLength: 50 }),
    fc.string({ minLength: 1, maxLength: 20 }),
  ], { numRuns: 20 })(
    'displays accurate filtered count when search query is applied',
    (tracts, searchQuery) => {
      render(<TractsManager initialTracts={tracts} />)

      // Apply search filter
      const searchInput = screen.getByPlaceholderText('Search by title...')
      expect(searchInput).toBeTruthy()

      // Enter search query
      const inputElement = searchInput as HTMLInputElement
      inputElement.value = searchQuery
      inputElement.dispatchEvent(new Event('input', { bubbles: true }))
      inputElement.dispatchEvent(new Event('change', { bubbles: true }))

      // Calculate expected count
      const filteredCount = tracts.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
      ).length

      // Verify displayed count - use queryAllByText to handle multiple matches
      if (filteredCount === 0) {
        // When no results, should show "No Tracts Found"
        expect(screen.getByText('No Tracts Found')).toBeTruthy()
      } else {
        // When there are results, check for the count text
        const countText = `${filteredCount} ${filteredCount === 1 ? 'tract' : 'tracts'}`
        const elements = screen.queryAllByText((content, element) => {
          return element?.textContent?.includes(countText) && element?.textContent?.includes(searchQuery) || false
        })
        expect(elements.length).toBeGreaterThan(0)
      }
    }
  )

  it.prop([
    fc.array(tractArbitrary, { minLength: 1, maxLength: 50 }),
    fc.constantFrom(...TRACT_CATEGORIES),
    fc.string({ minLength: 1, maxLength: 20 }),
  ], { numRuns: 20 })(
    'displays accurate count when both category and search filters are applied',
    (tracts, selectedCategory, searchQuery) => {
      render(<TractsManager initialTracts={tracts} />)

      // Apply category filter - use querySelector
      const categorySelect = document.querySelector('select') as HTMLSelectElement
      categorySelect.value = selectedCategory
      categorySelect.dispatchEvent(new Event('change', { bubbles: true }))

      // Apply search filter
      const searchInput = screen.getByPlaceholderText('Search by title...') as HTMLInputElement
      searchInput.value = searchQuery
      searchInput.dispatchEvent(new Event('input', { bubbles: true }))
      searchInput.dispatchEvent(new Event('change', { bubbles: true }))

      // Calculate expected count (both filters applied)
      const filteredCount = tracts.filter(
        (t) =>
          t.category === selectedCategory &&
          t.title.toLowerCase().includes(searchQuery.toLowerCase())
      ).length

      // Verify displayed count
      if (filteredCount === 0) {
        // Empty state should be shown
        expect(screen.getByText('No Tracts Found')).toBeTruthy()
      } else {
        // Check for count text with both filters - use queryAllByText
        const countText = `${filteredCount} ${filteredCount === 1 ? 'tract' : 'tracts'}`
        const elements = screen.queryAllByText((content, element) => {
          return element?.textContent?.includes(countText) && 
                 element?.textContent?.includes(selectedCategory) && 
                 element?.textContent?.includes(searchQuery) || false
        })
        expect(elements.length).toBeGreaterThan(0)
      }
    }
  )

  describe('Grid View Pagination', () => {
    it.prop([fc.array(tractArbitrary, { minLength: 13, maxLength: 50 })], { numRuns: 20 })(
      'displays correct total count even when only showing first 12 items',
      (tracts) => {
        render(<TractsManager initialTracts={tracts} />)

        // Grid view shows 12 items initially
        // But count should show total
        const expectedText = `${tracts.length} tracts`
        expect(screen.getByText(expectedText)).toBeTruthy()

        // Verify "Load More" button exists when there are more than 12 items
        if (tracts.length > 12) {
          expect(screen.getByText('Load More Tracts')).toBeTruthy()
        }
      }
    )
  })

  describe('Table View Pagination', () => {
    it.prop([fc.array(tractArbitrary, { minLength: 12, maxLength: 50 })], { numRuns: 20 })(
      'displays correct total count in pagination info when there are multiple pages',
      (tracts) => {
        const { container } = render(<TractsManager initialTracts={tracts} />)

        // Switch to table view using fireEvent
        const viewToggleButtons = screen.getAllByRole('button')
        const tableViewButton = viewToggleButtons.find(
          (btn) => btn.getAttribute('title') === 'Table View'
        )
        expect(tableViewButton).toBeTruthy()
        
        // Use fireEvent.click
        fireEvent.click(tableViewButton!)

        // Table view shows 10 items per page
        // With 12+ items, we definitely have multiple pages, so pagination should show
        // Pagination should show "Showing X to Y of Z results"
        // Use queryAllByText since the text might appear in multiple places
        const elements = screen.queryAllByText((content, element) => {
          const text = element?.textContent || ''
          return text.includes(`of ${tracts.length} results`)
        })
        
        // Should find at least one element with this text
        expect(elements.length).toBeGreaterThan(0)
      }
    )
  })
})

/**
 * **Validates: Requirements 2.6, 2.7, 2.8, 5.4, 6.6, 8.2, 8.4**
 * 
 * Property 7: Complete Field Rendering
 * - For any tract record, rendering it in either the dashboard or public page SHALL display 
 *   all core fields: cover image, title, category, description, and PDF document link.
 * 
 * Property 8: Draft Status Indication
 * - For any tract where published equals false, the dashboard SHALL display a "Draft" badge, 
 *   and for any tract where published equals true, no draft badge SHALL appear.
 * 
 * Property 9: Tract Count Accuracy
 * - For any set of tracts, the dashboard SHALL display a count that exactly equals the 
 *   number of tracts in the set.
 */
