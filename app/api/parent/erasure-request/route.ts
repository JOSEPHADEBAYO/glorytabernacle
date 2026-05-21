import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createErasureRequestSchema } from '@/lib/validation/erasure'

/**
 * POST /api/parent/erasure-request
 *
 * Publicly accessible — a parent/guardian asks us to erase their child's
 * data (UK GDPR Article 17, "right to be forgotten"). No auth: anyone can
 * ask. This endpoint ONLY records the request as PENDING; nothing is deleted
 * until a Children Leader / Super Admin reviews the queue and runs the
 * "erase all data" action from the dashboard.
 *
 * We attempt a best-effort match to a registered child (by guardian email +
 * child name) so the reviewer sees which record the request likely refers to,
 * but the match is advisory — the reviewer confirms before erasing.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validation = createErasureRequestSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const guardianEmail = data.guardianEmail.toLowerCase()

    // Best-effort match: among children whose primary guardian email matches
    // (case-insensitive), find the one whose full name matches what was typed.
    // Only auto-link when exactly one child matches — anything ambiguous is
    // left unlinked for the reviewer to resolve.
    let matchedChildId: string | null = null
    const candidates = await prisma.child.findMany({
      where: {
        primaryGuardianEmail: { equals: guardianEmail, mode: 'insensitive' },
      },
      select: { id: true, firstName: true, lastName: true },
    })
    const wanted = data.childName.trim().toLowerCase().replace(/\s+/g, ' ')
    const nameMatches = candidates.filter((c) => {
      const full = `${c.firstName} ${c.lastName}`.toLowerCase().replace(/\s+/g, ' ')
      return full === wanted
    })
    if (nameMatches.length === 1) {
      matchedChildId = nameMatches[0].id
    }

    const created = await prisma.erasureRequest.create({
      data: {
        childName: data.childName,
        guardianName: data.guardianName,
        guardianEmail,
        message: data.message?.trim() || null,
        childId: matchedChildId,
        status: 'PENDING',
      },
      select: { id: true },
    })

    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch (err) {
    console.error('Erasure-request submit error:', {
      error: err instanceof Error ? err.message : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Could not submit your request. Please try again.' },
      { status: 500 }
    )
  }
}
