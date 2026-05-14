-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'YOUTH';

-- DropIndex
DROP INDEX "MembershipApplication_email_idx";

-- CreateTable
CREATE TABLE "YouthCheckIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YouthCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyScripture" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reference" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "videoUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyScripture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YouthCheckIn_userId_idx" ON "YouthCheckIn"("userId");

-- CreateIndex
CREATE INDEX "YouthCheckIn_signedInAt_idx" ON "YouthCheckIn"("signedInAt");

-- CreateIndex
CREATE INDEX "YouthCheckIn_signedOutAt_idx" ON "YouthCheckIn"("signedOutAt");

-- CreateIndex
CREATE INDEX "DailyScripture_date_idx" ON "DailyScripture"("date");

-- CreateIndex
CREATE INDEX "DailyScripture_published_idx" ON "DailyScripture"("published");

-- AddForeignKey
ALTER TABLE "YouthCheckIn" ADD CONSTRAINT "YouthCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
