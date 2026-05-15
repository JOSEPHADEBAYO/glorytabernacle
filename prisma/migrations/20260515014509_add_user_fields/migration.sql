-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "position" TEXT;
