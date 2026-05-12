/**
 * Unit tests for the GroupMember Zod validation schemas.
 */

import { describe, it, expect } from 'vitest'
import {
  joinGroupSchema,
  groupMembersQuerySchema,
} from '@/lib/validation/group-member'

const valid = {
  firstName: 'David',
  lastName: 'Segun',
  email: 'david@example.com',
  phoneNumber: '07478 137599',
  birthDay: 12,
  birthMonth: 6,
  gender: 'MALE',
  maritalStatus: 'MARRIED',
  address: '12 Example St, Barnstaple, EX31 2BQ',
  filledWithHolyGhost: true,
}

describe('joinGroupSchema', () => {
  it('accepts a valid payload', () => {
    expect(joinGroupSchema.safeParse(valid).success).toBe(true)
  })

  it('lowercases email', () => {
    const r = joinGroupSchema.safeParse({ ...valid, email: 'David@Example.COM' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe('david@example.com')
  })

  describe('UK phone validation', () => {
    it.each([
      '07478137599',
      '07478 137599',
      '07478-137599',
      '+447478137599',
      '+44 7478 137599',
      '+44 (7478) 137599',
    ])('accepts %s', (phone) => {
      const r = joinGroupSchema.safeParse({ ...valid, phoneNumber: phone })
      expect(r.success).toBe(true)
    })

    it.each([
      '12345',
      '7478137599', // missing leading 0 or +44
      '00447478137599', // double zero, not valid UK
      '+1 5551234567', // US number
      'abcdefghij',
      '07478 12345', // too short
    ])('rejects %s', (phone) => {
      const r = joinGroupSchema.safeParse({ ...valid, phoneNumber: phone })
      expect(r.success).toBe(false)
    })
  })

  describe('Birthday range', () => {
    it('rejects day 0', () => {
      expect(joinGroupSchema.safeParse({ ...valid, birthDay: 0 }).success).toBe(false)
    })
    it('rejects day 32', () => {
      expect(joinGroupSchema.safeParse({ ...valid, birthDay: 32 }).success).toBe(false)
    })
    it('rejects month 0', () => {
      expect(joinGroupSchema.safeParse({ ...valid, birthMonth: 0 }).success).toBe(false)
    })
    it('rejects month 13', () => {
      expect(joinGroupSchema.safeParse({ ...valid, birthMonth: 13 }).success).toBe(false)
    })
    it('coerces string birthDay to number', () => {
      const r = joinGroupSchema.safeParse({ ...valid, birthDay: '15' })
      expect(r.success).toBe(true)
    })
  })

  describe('Enums', () => {
    it('rejects invalid gender', () => {
      expect(
        joinGroupSchema.safeParse({ ...valid, gender: 'OTHER' }).success
      ).toBe(false)
    })
    it('accepts FEMALE', () => {
      expect(joinGroupSchema.safeParse({ ...valid, gender: 'FEMALE' }).success).toBe(true)
    })
    it('accepts each valid marital status', () => {
      for (const status of ['SINGLE', 'ENGAGED', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED']) {
        expect(
          joinGroupSchema.safeParse({ ...valid, maritalStatus: status }).success
        ).toBe(true)
      }
    })
    it('rejects unknown marital status', () => {
      expect(
        joinGroupSchema.safeParse({ ...valid, maritalStatus: 'COMPLICATED' }).success
      ).toBe(false)
    })
  })

  describe('Required fields', () => {
    it.each(['firstName', 'lastName', 'email', 'address'])(
      'rejects missing %s',
      (field) => {
        const data = { ...valid } as Record<string, unknown>
        delete data[field]
        expect(joinGroupSchema.safeParse(data).success).toBe(false)
      }
    )

    it('rejects whitespace-only firstName', () => {
      expect(
        joinGroupSchema.safeParse({ ...valid, firstName: '   ' }).success
      ).toBe(false)
    })
  })
})

describe('groupMembersQuerySchema', () => {
  it('accepts no params', () => {
    expect(groupMembersQuerySchema.safeParse({}).success).toBe(true)
  })

  it('coerces page and pageSize to numbers', () => {
    const r = groupMembersQuerySchema.safeParse({ page: '3', pageSize: '50' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.page).toBe(3)
      expect(r.data.pageSize).toBe(50)
    }
  })

  it('rejects pageSize > 100', () => {
    expect(
      groupMembersQuerySchema.safeParse({ pageSize: 500 }).success
    ).toBe(false)
  })

  it('rejects page < 1', () => {
    expect(groupMembersQuerySchema.safeParse({ page: 0 }).success).toBe(false)
  })
})
