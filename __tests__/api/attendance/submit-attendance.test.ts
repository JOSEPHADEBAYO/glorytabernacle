/**
 * Unit tests for POST /api/attendance (public submission endpoint).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/attendance/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    adultAttendance: { create: vi.fn() },
  },
}))

const valid = {
  name: 'David Segun',
  email: 'david@example.com',
  service: 'Sunday First Service',
}

function makeRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

describe('POST /api/attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('records valid submission and returns 200', async () => {
    vi.mocked(prisma.adultAttendance.create).mockResolvedValue({} as never)
    const res = await POST(makeRequest(valid))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.recorded).toBe(true)
    expect(prisma.adultAttendance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: valid.name,
        email: valid.email,
        service: valid.service,
      }),
    })
  })

  it('lowercases email before storing', async () => {
    vi.mocked(prisma.adultAttendance.create).mockResolvedValue({} as never)
    await POST(makeRequest({ ...valid, email: 'David@Example.COM' }))
    expect(prisma.adultAttendance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: 'david@example.com' }),
    })
  })

  it('returns 400 when name is missing', async () => {
    const { name: _omit, ...rest } = valid
    void _omit
    const res = await POST(makeRequest(rest))
    expect(res.status).toBe(400)
    expect(prisma.adultAttendance.create).not.toHaveBeenCalled()
  })

  it('returns 400 with malformed email', async () => {
    const res = await POST(makeRequest({ ...valid, email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when service is unknown', async () => {
    const res = await POST(makeRequest({ ...valid, service: 'Imaginary Service' }))
    expect(res.status).toBe(400)
  })

  it('returns 500 if Prisma throws', async () => {
    vi.mocked(prisma.adultAttendance.create).mockRejectedValue(new Error('db down'))
    const res = await POST(makeRequest(valid))
    expect(res.status).toBe(500)
  })
})
