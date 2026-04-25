/**
 * Property 16: ThemeProvider persists theme to localStorage (round trip)
 * Validates: Requirements 9.5
 */
import { describe } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import * as fc from 'fast-check'
import { ThemeProvider, useTheme, type Theme } from '@/components/providers/theme-provider'

// jsdom doesn't implement matchMedia — provide a minimal stub
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Helper: renders ThemeProvider and exposes setTheme via a child component
function TestConsumer({ onMount }: { onMount: (setTheme: (t: Theme) => void) => void }) {
  const { setTheme } = useTheme()
  onMount(setTheme)
  return null
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    cleanup()
  })

  test('Property 16: setTheme persists any valid theme to localStorage', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Theme>('light', 'dark', 'system'),
        (theme) => {
          let capturedSetTheme: ((t: Theme) => void) | null = null

          render(
            <ThemeProvider>
              <TestConsumer onMount={(fn) => { capturedSetTheme = fn }} />
            </ThemeProvider>
          )

          act(() => {
            capturedSetTheme!(theme)
          })

          return localStorage.getItem('theme') === theme
        }
      ),
      { numRuns: 20 }
    )
  })
})
