import { cookies } from 'next/headers'

/**
 * Session user data structure
 */
export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
}

/**
 * Extracts the session token from HTTP-only cookies
 * @returns The session token string or null if not present
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('session_token')?.value ?? null
}

/**
 * Validates if a session token is present
 * @returns True if a valid session token exists, false otherwise
 */
export async function validateSession(): Promise<boolean> {
  const token = await getSessionToken()
  return token !== null
}

/**
 * Retrieves user information from the session token
 * Currently returns a hardcoded super-admin user for MVP
 * Future enhancement: validate token against database Session table
 * 
 * @param token - The session token to validate
 * @returns User object if token is valid, null otherwise
 */
export async function getSessionUser(token: string): Promise<SessionUser | null> {
  // Validate token presence
  if (!token) return null
  
  // Placeholder implementation - return hardcoded super admin
  // Future: query Session table to get userId, then User table for full user data
  return {
    id: 'super-admin',
    email: 'adeolusegun1000@gmail.com',
    name: 'David Segun',
    role: 'SUPER_ADMIN'
  }
}
