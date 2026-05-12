CREATE TABLE "HeroCarouselImage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "publicId" TEXT,
    "filename" TEXT,
    "format" TEXT,
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroCarouselImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HeroCarouselImage_published_idx" ON "HeroCarouselImage"("published");
CREATE INDEX "HeroCarouselImage_order_idx" ON "HeroCarouselImage"("order");
CREATE INDEX "HeroCarouselImage_createdAt_idx" ON "HeroCarouselImage"("createdAt");
