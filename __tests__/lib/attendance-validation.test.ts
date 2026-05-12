/**
 * Unit tests for the Adult Attendance Zod schemas + the
 * suggestCurrentService helper.
 */

import { describe, it, expect } from 'vitest'
import {
  submitAttendanceSchema,
  adminAttendanceQuerySchema,
} from '@/lib/validation/attendance'
import {
  ATTENDANCE_SERVICES,
  suggestCurrentService,
} from '@/lib/types/attendance'

const valid = {
  name: 'David Segun',
  email: 'David@Example.com',
  service: 'Sunday First Service' as const,
}

describe('submitAttendanceSchema', () => {
  it('accepts a valid payload and lowercases email', () => {
    const r = submitAttendanceSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe('david@example.com')
  })

  it.each(ATTENDANCE_SERVICES)('accepts known service: %s', (svc) => {
    expect(
      submitAttendanceSchema.safeParse({ ...valid, service: svc }).success
    ).toBe(true)
  })

  it('rejects an unknown service', () => {
    expect(
      submitAttendanceSchema.safeParse({ ...valid, service: 'Imaginary Service' })
        .success
    ).toBe(false)
  })

  it('rejects empty name', () => {
    expect(submitAttendanceSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('rejects whitespace-only name', () => {
    expect(
      submitAttendanceSchema.safeParse({ ...valid, name: '   ' }).success
    ).toBe(false)
  })

  it('rejects malformed email', () => {
    expect(
      submitAttendanceSchema.safeParse({ ...valid, email: 'not-an-email' })
        .success
    ).toBe(false)
  })

  it('rejects name longer than 100 chars', () => {
    expect(
      submitAttendanceSchema.safeParse({ ...valid, name: 'x'.repeat(101) }).success
    ).toBe(false)
  })
})

describe('adminAttendanceQuerySchema', () => {
  it('accepts no params', () => {
    expect(adminAttendanceQuerySchema.safeParse({}).success).toBe(true)
  })

  it('coerces page and pageSize to numbers', () => {
    const r = adminAttendanceQuerySchema.safeParse({ page: '2', pageSize: '50' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.page).toBe(2)
      expect(r.data.pageSize).toBe(50)
    }
  })

  it('rejects pageSize > 100', () => {
    expect(
      adminAttendanceQuerySchema.safeParse({ pageSize: 500 }).success
    ).toBe(false)
  })

  it('rejects page < 1', () => {
    expect(adminAttendanceQuerySchema.safeParse({ page: 0 }).success).toBe(false)
  })

  it('accepts valid service filter', () => {
    expect(
      adminAttendanceQuerySchema.safeParse({ service: 'Midweek Service' })
        .success
    ).toBe(true)
  })

  it('rejects unknown service filter', () => {
    expect(
      adminAttendanceQuerySchema.safeParse({ service: 'Imaginary' }).success
    ).toBe(false)
  })

  it('coerces fromDate / toDate strings', () => {
    const r = adminAttendanceQuerySchema.safeParse({
      fromDate: '2026-05-01',
      toDate: '2026-05-31',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.fromDate).toBeInstanceOf(Date)
      expect(r.data.toDate).toBeInstanceOf(Date)
    }
  })
})

describe('suggestCurrentService', () => {
  it('suggests Sunday First Service early Sunday morning', () => {
    const d = new Date('2026-05-10T08:30:00')
    expect(suggestCurrentService(d)).toBe('Sunday First Service')
  })

  it('suggests Sunday Second Service later on Sunday', () => {
    const d = new Date('2026-05-10T12:30:00')
    expect(suggestCurrentService(d)).toBe('Sunday Second Service')
  })

  it('suggests Midweek Service on a Wednesday', () => {
    const d = new Date('2026-05-13T19:00:00') // Wed
    expect(suggestCurrentService(d)).toBe('Midweek Service')
  })

  it('falls back to Other on a quiet day', () => {
    const d = new Date('2026-05-12T10:00:00') // Tue
    expect(suggestCurrentService(d)).toBe('Other')
  })
})
