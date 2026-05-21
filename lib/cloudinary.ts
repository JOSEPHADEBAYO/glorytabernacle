/**
 * Shared Cloudinary config + helpers.
 *
 * Children's-ministry photos (child + authorised-collector) are uploaded as
 * `authenticated` assets so they can't be viewed by anyone who simply has
 * the URL. We store the public_id and generate a *signed* delivery URL on
 * read; the signature can't be computed without the API secret, so an
 * unsigned or forged URL returns 401.
 *
 * Required env vars:
 *   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

/**
 * Folders whose assets must be access-controlled (uploaded as
 * `authenticated`). Everything else (gallery, events, books, tracts) stays
 * publicly deliverable.
 */
export function isProtectedFolder(folder: string | null | undefined): boolean {
  return typeof folder === 'string' && folder.startsWith('children/')
}

/**
 * Build a signed delivery URL for an authenticated image. Deterministic
 * (same public_id → same URL), so it's cache-friendly and won't thrash
 * <next/image>. Returns null when there's no public_id.
 *
 * NOTE: this signs the URL but does not time-limit it. For expiring URLs,
 * enable Cloudinary token-based auth and switch to `auth_token`. The
 * signed-URL approach here works on all Cloudinary plans and already stops
 * unsigned / guessed / scraped access.
 */
export function signedChildImageUrl(
  publicId: string | null | undefined
): string | null {
  if (!publicId) return null
  return cloudinary.url(publicId, {
    type: 'authenticated',
    resource_type: 'image',
    secure: true,
    sign_url: true,
  })
}

/**
 * Resolve the deliverable photo URL for a child / collector record:
 * a freshly-signed authenticated URL when a public_id is stored, else the
 * legacy public photoUrl. Call this in every read path before returning the
 * record to the client.
 */
export function resolvePhotoUrl(item: {
  photoUrl?: string | null
  photoPublicId?: string | null
}): string | null {
  if (item.photoPublicId) return signedChildImageUrl(item.photoPublicId)
  return item.photoUrl ?? null
}

/**
 * Permanently destroy an authenticated children's-ministry image. Used when a
 * child record is erased (right to erasure / data retention) so the photo
 * doesn't linger in Cloudinary after the DB row is gone.
 *
 * Best-effort: a failed destroy (already-deleted asset, transient Cloudinary
 * error) is logged but does NOT throw, so a single bad asset can't block the
 * erasure of the rest of the record. Returns true when Cloudinary reports the
 * asset was removed (or was already absent).
 */
export async function deleteChildImage(
  publicId: string | null | undefined
): Promise<boolean> {
  if (!publicId) return false
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      type: 'authenticated',
      resource_type: 'image',
      invalidate: true,
    })
    // `ok` on success, `not found` when the asset is already gone — both are
    // fine for an erasure (the end state is "no asset").
    return result.result === 'ok' || result.result === 'not found'
  } catch (error) {
    console.error('Failed to delete Cloudinary child image:', {
      publicId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return false
  }
}
