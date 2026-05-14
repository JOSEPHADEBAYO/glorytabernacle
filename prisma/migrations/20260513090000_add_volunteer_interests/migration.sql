-- CreateTable
CREATE TABLE "VolunteerInterest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "areaStrengths" JSONB NOT NULL,
    "pastExperience" TEXT NOT NULL,
    "contributionStatement" TEXT NOT NULL,
    "bornAgain" BOOLEAN NOT NULL,
    "filledWithHolyGhost" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VolunteerInterest_email_idx" ON "VolunteerInterest"("email");

-- CreateIndex
CREATE INDEX "VolunteerInterest_createdAt_idx" ON "VolunteerInterest"("createdAt");
