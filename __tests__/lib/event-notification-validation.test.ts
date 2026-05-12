/**
 * Unit tests for the EventNotification Zod validation schema.
 */

import { describe, it, expect } from 'vitest'
import { subscribeNotificationSchema } from '@/lib/validation/event-notification'

describe('subscribeNotificationSchema', () => {
  it('accepts a valid name + email pair', () => {
    const result = subscribeNotificationSchema.safeParse({
      name: 'David Segun',
      email: 'david@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('lowercases and trims the email', () => {
    const result = subscribeNotificationSchema.safeParse({
      name: 'David',
      email: '  David@Example.COM  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('david@example.com')
    }
  })

  it('trims the name', () => {
    const result = subscribeNotificationSchema.safeParse({
      name: '   David   ',
      email: 'a@b.com',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name).toBe('David')
  })

  it('rejects empty name', () => {
    const result = subscribeNotificationSchema.safeParse({
      name: '',
      email: 'a@b.com',
    })
    expect(result.success).toBe(false)
  })

  it('rejects whitespace-only name', () => {
    const result = subscribeNotificationSchema.safeParse({
      name: '   ',
      email: 'a@b.com',
    })
    expect(result.success).toBe(false)
  })

  it('rejects malformed email', () => {
    const result = subscribeNotificationSchema.safeParse({
      name: 'David',
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty email', () => {
    const result = subscribeNotificationSchema.safeParse({
      name: 'David',
      email: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects name exceeding 100 chars', () => {
    const result = subscribeNotificationSchema.safeParse({
      name: 'a'.repeat(101),
      email: 'a@b.com',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    expect(subscribeNotificationSchema.safeParse({}).success).toBe(false)
    expect(
      subscribeNotificationSchema.safeParse({ name: 'David' }).success
    ).toBe(false)
    expect(
      subscribeNotificationSchema.safeParse({ email: 'a@b.com' }).success
    ).toBe(false)
  })
})
