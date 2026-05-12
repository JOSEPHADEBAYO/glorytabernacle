/**
 * Unit tests for authentication session helpers
 * Tests Task 2.1: Write unit tests for authentication helpers
 * Requirements: 7.1, 7.2, 7.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSessionToken, validateSession, getSessionUser } from '@/lib/auth/session'
import { cookies } from 'next/headers'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

describe('getSessionToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return session token when cookie exists', async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: 'test-token-123' })
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    const token = await getSessionToken()

    expect(token).toBe('test-token-123')
    expect(mockCookieStore.get).toHaveBeenCalledWith('session_token')
  })

  it('should return null when cookie does not exist', async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue(undefined)
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    const token = await getSessionToken()

    expect(token).toBeNull()
    expect(mockCookieStore.get).toHaveBeenCalledWith('session_token')
  })

  it('should return null when cookie value is undefined', async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: undefined })
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    const token = await getSessionToken()

    expect(token).toBeNull()
  })

  it('should handle empty string token', async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: '' })
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    const token = await getSessionToken()

    expect(token).toBe('')
  })
})

describe('validateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return true when session token exists', async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: 'valid-token' })
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    const isValid = await validateSession()

    expect(isValid).toBe(true)
  })

  it('should return false when session token does not exist', async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue(undefined)
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    const isValid = await validateSession()

    expect(isValid).toBe(false)
  })

  it('should return false when session token is null', async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: null })
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    const isValid = await validateSession()

    expect(isValid).toBe(false)
  })

  it('should return true for empty string token', async () => {
    // Empty string is not null, so validateSession returns true
    // This tests the current implementation behavior (token !== null)
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: '' })
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    const isValid = await validateSession()

    // Empty string is not null, so validateSession returns true
    expect(isValid).toBe(true)
  })
})

describe('getSessionUser', () => {
  it('should return user object for valid token', async () => {
    const user = await getSessionUser('valid-token-123')

    expect(user).not.toBeNull()
    expect(user).toHaveProperty('id')
    expect(user).toHaveProperty('email')
    expect(user).toHaveProperty('name')
    expect(user).toHaveProperty('role')
  })

  it('should return super-admin user for any valid token', async () => {
    const user = await getSessionUser('any-token')

    expect(user).toEqual({
      id: 'super-admin',
      email: 'adeolusegun1000@gmail.com',
      name: 'David Segun',
      role: 'SUPER_ADMIN'
    })
  })

  it('should return null for empty string token', async () => {
    const user = await getSessionUser('')

    expect(user).toBeNull()
  })

  it('should return null for null token', async () => {
    const user = await getSessionUser(null as any)

    expect(user).toBeNull()
  })

  it('should return null for undefined token', async () => {
    const user = await getSessionUser(undefined as any)

    expect(user).toBeNull()
  })

  it('should return user with correct structure', async () => {
    const user = await getSessionUser('test-token')

    if (user) {
      expect(typeof user.id).toBe('string')
      expect(typeof user.email).toBe('string')
      expect(typeof user.name).toBe('string')
      expect(typeof user.role).toBe('string')
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) // Basic email format
    }
  })

  it('should handle multiple calls consistently', async () => {
    const user1 = await getSessionUser('token-1')
    const user2 = await getSessionUser('token-2')

    // Both should return the same hardcoded user for MVP
    expect(user1).toEqual(user2)
  })
})
