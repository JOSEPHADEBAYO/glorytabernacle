-- CreateTable
CREATE TABLE "InformationItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "submittedBy" TEXT,
    "submitterEmail" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InformationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InformationItem_published_idx" ON "InformationItem"("published");

-- CreateIndex
CREATE INDEX "InformationItem_category_idx" ON "InformationItem"("category");

-- CreateIndex
CREATE INDEX "InformationItem_createdAt_idx" ON "InformationItem"("createdAt");
