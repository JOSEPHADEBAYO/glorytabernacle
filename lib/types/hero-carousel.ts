export const HERO_CAROUSEL_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'CONTENT_EDITOR',
] as const

export type HeroCarouselAdminRole =
  (typeof HERO_CAROUSEL_ADMIN_ROLES)[number]

export interface HeroCarouselImage {
  id: string
  title: string
  imageUrl: string
  imageAlt: string
  publicId: string | null
  filename: string | null
  format: string | null
  size: number | null
  width: number | null
  height: number | null
  order: number
  published: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
