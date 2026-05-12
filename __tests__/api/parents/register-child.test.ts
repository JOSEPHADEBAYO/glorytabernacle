/**
 * Unit tests for the parent register-child endpoint
 * (POST /api/parents/me/children).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/parents/me/children/route'
import { NextRequest } from 'next/server'
import * as parentSession from '@/lib/auth/parent-session'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/auth/parent-session')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    child: {
      create: vi.fn(),
    },
  },
}))

const parent = {
  id: 'parent-1',
  email: 'p@example.com',
  name: 'Parent A',
  image: null,
}

const eightYearsAgo = new Date()
eightYearsAgo.setFullYear(eightYearsAgo.getFullYear() - 8)

const validBody = {
  firstName: 'Joy',
  lastName: 'Adeniyi',
  dateOfBirth: eightYearsAgo.toISOString().slice(0, 10),
  gender: 'FEMALE',
  emergencyContactName: 'Grace',
  emergencyContactPhone: '07478 137599',
  emergencyContactRelation: 'Grandmother',
}

function makeRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

describe('POST /api/parents/me/children', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no parent session', async () => {
    vi.mocked(parentSession.getParentUser).mockResolvedValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
    expect(prisma.child.create).not.toHaveBeenCalled()
  })

  it('returns 400 with invalid body', async () => {
    vi.mocked(parentSession.getParentUser).mockResolvedValue(parent)
    const res = await POST(makeRequest({ ...validBody, firstName: '' }))
    expect(res.status).toBe(400)
    expect(prisma.child.create).not.toHaveBeenCalled()
  })

  it('creates child linked to the signed-in parent and returns 201', async () => {
    vi.mocked(parentSession.getParentUser).mockResolvedValue(parent)
    vi.mocked(prisma.child.create).mockResolvedValue({
      id: 'c-1',
      ...validBody,
      dateOfBirth: new Date(validBody.dateOfBirth),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(201)
    expect(prisma.child.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        firstName: 'Joy',
        parents: { connect: { id: 'parent-1' } },
      }),
    })
  })

  it('normalizes empty optional strings to null', async () => {
    vi.mocked(parentSession.getParentUser).mockResolvedValue(parent)
    vi.mocked(prisma.child.create).mockResolvedValue({} as never)

    await POST(
      makeRequest({
        ...validBody,
        allergies: '',
        medicalNotes: '',
        specialNeeds: '',
        photoUrl: '',
      })
    )

    expect(prisma.child.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        allergies: null,
        medicalNotes: null,
        specialNeeds: null,
        photoUrl: null,
      }),
    })
  })
})
