-- CreateTable
CREATE TABLE "ProgramInterest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramInterest_email_key" ON "ProgramInterest"("email");

-- CreateIndex
CREATE INDEX "ProgramInterest_createdAt_idx" ON "ProgramInterest"("createdAt");
