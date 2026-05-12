-- CreateTable
CREATE TABLE "Tract" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tract_published_idx" ON "Tract"("published");

-- CreateIndex
CREATE INDEX "Tract_category_idx" ON "Tract"("category");
