/**
 * Single source of truth for *erasing* a child record (UK GDPR Article 17).
 *
 * Used by:
 *   - DELETE /api/admin/children/[id]            (manual delete from the roster)
 *   - PATCH  /api/admin/erasure-requests/[id]    ("erase child & complete")
 *
 * Erasure means: destroy the child's authenticated Cloudinary photo and every
 * authorised collector's photo, then delete the DB row (cascade removes
 * check-in history + collectors). Safeguarding concerns are NOT deleted — the
 * FK is ON DELETE SET NULL, so a concern survives with `childId` cleared,
 * keeping the free-text record the DSL is statutorily required to retain.
 */

import { prisma } from '@/lib/prisma'
import { deleteChildImage } from '@/lib/cloudinary'

export type EraseChildResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' }

/**
 * Permanently erase a single child by id. Returns { ok: false, reason:
 * 'not-found' } when the child no longer exists (idempotent-friendly).
 * Cloudinary purges are best-effort (deleteChildImage swallows its own
 * errors) so a stuck asset can't block the DB erasure.
 */
export async function eraseChild(childId: string): Promise<EraseChildResult> {
  const existing = await prisma.child.findUnique({
    where: { id: childId },
    include: { authorisedCollectors: { select: { photoPublicId: true } } },
  })
  if (!existing) return { ok: false, reason: 'not-found' }

  const publicIds = [
    existing.photoPublicId,
    ...existing.authorisedCollectors.map((c) => c.photoPublicId),
  ].filter((pid): pid is string => Boolean(pid))

  await Promise.all(publicIds.map((pid) => deleteChildImage(pid)))
  await prisma.child.delete({ where: { id: childId } })

  return { ok: true }
}
