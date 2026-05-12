-- CreateTable
CREATE TABLE "AdultAttendance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "attendedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdultAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdultAttendance_email_idx" ON "AdultAttendance"("email");

-- CreateIndex
CREATE INDEX "AdultAttendance_service_idx" ON "AdultAttendance"("service");

-- CreateIndex
CREATE INDEX "AdultAttendance_attendedAt_idx" ON "AdultAttendance"("attendedAt");
