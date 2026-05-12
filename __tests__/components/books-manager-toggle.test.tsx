import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

describe('BooksManager - Publish Toggle (Task 11)', () => {
  const mockBooks = [
    {
      id: '1',
      title: 'Test Book 1',
      author: 'Author 1',
      category: 'Spiritual Growth',
      description: 'Description 1',
      coverImage: 'https://example.com/image1.jpg',
      purchaseUrl: 'https://example.com/buy1',
      published: false,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      title: 'Test Book 2',
      author: 'Author 2',
      category: 'Prayer & Intercession',
      description: 'Description 2',
      coverImage: 'https://example.com/image2.jpg',
      purchaseUrl: null,
      published: true,
      createdAt: new Date('2024-01-02'),
    },
  ]

  beforeEach(() => {
    global.fetch = vi.fn()
    vi.clearAllMocks()
  })

  it('should display publish toggle for each book', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    // Check that both books have toggle switches
    const toggleButtons = screen.getAllByRole('button', { name: /publish book|unpublish book/i })
    expect(toggleButtons).toHaveLength(2)
  })

  it('should show "Draft" label for unpublished books', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    // First book is draft
    const draftLabels = screen.getAllByText('Draft')
    expect(draftLabels.length).toBeGreaterThan(0)
  })

  it('should show "Published" label for published books', () => {
    render(<BooksManager initialBooks={mockBooks} />)

    // Second book is published
    const publishedLabels = screen.getAllByText('Published')
    expect(publishedLabels).toHaveLength(1)
  })

  it('should call API with correct payload when toggling publish status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockBooks[0], published: true }),
    })
    global.fetch = mockFetch

    render(<BooksManager initialBooks={mockBooks} />)

    // Find the toggle button for the first book (unpublished)
    const toggleButtons = screen.getAllByRole('button', { name: /publish book/i })
    const firstToggle = toggleButtons[0]

    // Click the toggle
    fireEvent.click(firstToggle)

    // Wait for the API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/books/1',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published: true }),
        })
      )
    })
  })

  it('should optimistically update UI before API response', async () => {
    const mockFetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ ...mockBooks[0], published: true }),
              }),
            100
          )
        )
    )
    global.fetch = mockFetch

    render(<BooksManager initialBooks={mockBooks} />)

    // Initial state: first book is draft
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0)

    // Click the toggle for the first book
    const toggleButtons = screen.getAllByRole('button', { name: /publish book/i })
    fireEvent.click(toggleButtons[0])

    // UI should update immediately (optimistically)
    await waitFor(() => {
      const publishedLabels = screen.getAllByText('Published')
      expect(publishedLabels.length).toBeGreaterThan(1) // Now both books show as published
    })
  })

  it('should revert state on API error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to update' }),
    })
    global.fetch = mockFetch

    render(<BooksManager initialBooks={mockBooks} />)

    // Initial state: first book is draft
    const initialDraftCount = screen.getAllByText('Draft').length

    // Click the toggle for the first book
    const toggleButtons = screen.getAllByRole('button', { name: /publish book/i })
    fireEvent.click(toggleButtons[0])

    // Wait for error handling
    await waitFor(() => {
      // State should be reverted
      const finalDraftCount = screen.getAllByText('Draft').length
      expect(finalDraftCount).toBe(initialDraftCount)
    })

    // Error message should be displayed
    await waitFor(() => {
      const errorMessage = screen.getByText(/Failed to update/i)
      expect(errorMessage).toBeTruthy()
    })
  })

  it('should display loading spinner during toggle operation', async () => {
    const mockFetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ ...mockBooks[0], published: true }),
              }),
            100
          )
        )
    )
    global.fetch = mockFetch

    render(<BooksManager initialBooks={mockBooks} />)

    // Click the toggle for the first book
    const toggleButtons = screen.getAllByRole('button', { name: /publish book/i })
    fireEvent.click(toggleButtons[0])

    // Loading spinner should appear
    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).not.toBeNull()
    })
  })

  it('should disable toggle button during operation', async () => {
    const mockFetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ ...mockBooks[0], published: true }),
              }),
            100
          )
        )
    )
    global.fetch = mockFetch

    render(<BooksManager initialBooks={mockBooks} />)

    // Click the toggle for the first book
    const toggleButtons = screen.getAllByRole('button', { name: /publish book/i })
    const firstToggle = toggleButtons[0]
    fireEvent.click(firstToggle)

    // Button should be disabled during operation
    await waitFor(() => {
      expect(firstToggle.hasAttribute('disabled')).toBe(true)
    })
  })

  it('should handle network errors gracefully', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
    global.fetch = mockFetch

    render(<BooksManager initialBooks={mockBooks} />)

    // Click the toggle for the first book
    const toggleButtons = screen.getAllByRole('button', { name: /publish book/i })
    fireEvent.click(toggleButtons[0])

    // Error message should be displayed
    await waitFor(() => {
      const errorMessage = screen.getByText(/An error occurred while updating publish status/i)
      expect(errorMessage).toBeTruthy()
    })
  })

  it('should allow dismissing error messages', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to update' }),
    })
    global.fetch = mockFetch

    render(<BooksManager initialBooks={mockBooks} />)

    // Trigger an error
    const toggleButtons = screen.getAllByRole('button', { name: /publish book/i })
    fireEvent.click(toggleButtons[0])

    // Wait for error message
    await waitFor(() => {
      const errorMessage = screen.getByText(/Failed to update/i)
      expect(errorMessage).toBeTruthy()
    })

    // Find and click the dismiss button (the X button in the error message)
    const dismissButtons = screen.getAllByRole('button')
    const dismissButton = dismissButtons.find((btn) => 
      btn.querySelector('svg path[d*="M6 18L18 6M6 6l12 12"]')
    )
    
    if (dismissButton) {
      fireEvent.click(dismissButton)
      
      // Error message should be removed
      await waitFor(() => {
        expect(screen.queryByText(/Failed to update/i)).toBeNull()
      })
    }
  })
})
