import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionToken, getSessionUser } from '@/lib/auth/session'
import { canHandleErasure } from '@/lib/types/erasure'
import { updateErasureRequestSchema } from '@/lib/validation/erasure'
import { eraseChild } from '@/lib/children/erase-child'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/admin/erasure-requests/[id]
 *
 * Handle a right-to-erasure request. Restricted to CHILDREN_LEADER +
 * SUPER_ADMIN. Supported transitions:
 *
 *   - { childId }                  → link/relink (or '' to unlink) the matched
 *                                    child WITHOUT erasing. Lets the reviewer
 *                                    correct a wrong/missing auto-match first.
 *   - { status: 'COMPLETED', childId? }
 *                                  → "erase child & complete". If a child is
 *                                    linked (or provided), it is permanently
 *                                    erased (photos + DB + cascade) and the
 *                                    request is stamped completed. If no child
 *                                    is linked, the request is simply marked
 *                                    completed (e.g. we hold no data).
 *   - { status: 'DISMISSED' }      → close without erasing (e.g. withdrawn /
 *                                    can't verify / not our data).
 *   - { status: 'PENDING' }        → reopen (clears the handled-by stamp).
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getSessionToken()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await getSessionUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!canHandleErasure(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const validation = updateErasureRequestSchema.safeParse(body)
    if (!validation.success) {
      const details = validation.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return NextResponse.json(
        { error: 'Validation failed', details },
        { status: 400 }
      )
    }
    const data = validation.data

    const existing = await prisma.erasureRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Resolve which child (if any) the action applies to. A non-empty childId
    // in the body overrides the stored match; an empty string means "unlink".
    let linkChildId: string | null | undefined
    if (data.childId !== undefined) {
      const trimmed = data.childId.trim()
      if (trimmed === '') {
        linkChildId = null
      } else {
        const child = await prisma.child.findUnique({
          where: { id: trimmed },
          select: { id: true },
        })
        if (!child) {
          return NextResponse.json(
            { error: 'Selected child not found' },
            { status: 404 }
          )
        }
        linkChildId = trimmed
      }
    }

    // The child this action targets: explicit selection wins, else the stored
    // match.
    const targetChildId =
      linkChildId !== undefined ? linkChildId : existing.childId

    // No status change → this is a link/relink only.
    if (data.status === undefined) {
      const updated = await prisma.erasureRequest.update({
        where: { id },
        data: { childId: linkChildId ?? null },
      })
      return NextResponse.json({ request: updated }, { status: 200 })
    }

    if (data.status === 'COMPLETED') {
      let erasedChild = false
      if (targetChildId) {
        const result = await eraseChild(targetChildId)
        // not-found is fine: the child may already be gone. We still complete.
        erasedChild = result.ok
      }
      const updated = await prisma.erasureRequest.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          // The child row is now gone; keep the record but drop the dangling
          // link (childName preserves who it referred to).
          childId: null,
          handledById: user.id,
          handledAt: new Date(),
        },
      })
      return NextResponse.json({ request: updated, erasedChild }, { status: 200 })
    }

    if (data.status === 'DISMISSED') {
      const updated = await prisma.erasureRequest.update({
        where: { id },
        data: {
          status: 'DISMISSED',
          childId: linkChildId !== undefined ? linkChildId : existing.childId,
          handledById: user.id,
          handledAt: new Date(),
        },
      })
      return NextResponse.json({ request: updated }, { status: 200 })
    }

    // PENDING (reopen): clear the handled-by stamp.
    const updated = await prisma.erasureRequest.update({
      where: { id },
      data: {
        status: 'PENDING',
        childId: linkChildId !== undefined ? linkChildId : existing.childId,
        handledById: null,
        handledAt: null,
      },
    })
    return NextResponse.json({ request: updated }, { status: 200 })
  } catch (error) {
    console.error('Error updating erasure request:', {
      error: error instanceof Error ? error.message : 'Unknown',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
