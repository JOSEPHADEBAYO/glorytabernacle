-- Add OAuth + children ministry tables.
-- This migration:
--   1. Relaxes User.passwordHash to nullable (Google users have no password)
--   2. Adds image + emailVerified columns to User for OAuth profile data
--   3. Adds PARENT role
--   4. Creates Auth.js Account / AuthSession / VerificationToken tables
--   5. Creates Child + ChildCheckIn tables
--   6. Creates the implicit M:M join table _ParentToChild

-- AlterTable: relax passwordHash, add OAuth profile fields
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "image" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);

-- Add PARENT to the UserRole enum
ALTER TYPE "UserRole" ADD VALUE 'PARENT';

-- AlterTable: index on role so admin role-checks are cheap
CREATE INDEX "User_role_idx" ON "User"("role");

-- Auth.js: Account table
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Auth.js: AuthSession table (separate from the legacy Session table)
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthSession_sessionToken_key" ON "AuthSession"("sessionToken");
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");

ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Auth.js: VerificationToken table (used by some flows even with OAuth-only)
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- Children: Child table
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "allergies" TEXT,
    "medicalNotes" TEXT,
    "specialNeeds" TEXT,
    "photoUrl" TEXT,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "emergencyContactRelation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Child_lastName_firstName_idx" ON "Child"("lastName", "firstName");

-- Children: ChildCheckIn table
CREATE TABLE "ChildCheckIn" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "signedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedInById" TEXT NOT NULL,
    "signedOutAt" TIMESTAMP(3),
    "signedOutById" TEXT,

    CONSTRAINT "ChildCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChildCheckIn_childId_idx" ON "ChildCheckIn"("childId");
CREATE INDEX "ChildCheckIn_signedInAt_idx" ON "ChildCheckIn"("signedInAt");
CREATE INDEX "ChildCheckIn_signedOutAt_idx" ON "ChildCheckIn"("signedOutAt");
CREATE INDEX "ChildCheckIn_signedInById_idx" ON "ChildCheckIn"("signedInById");

ALTER TABLE "ChildCheckIn" ADD CONSTRAINT "ChildCheckIn_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChildCheckIn" ADD CONSTRAINT "ChildCheckIn_signedInById_fkey" FOREIGN KEY ("signedInById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChildCheckIn" ADD CONSTRAINT "ChildCheckIn_signedOutById_fkey" FOREIGN KEY ("signedOutById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Implicit M:M join table for Parent <-> Child
CREATE TABLE "_ParentToChild" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ParentToChild_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_ParentToChild_B_index" ON "_ParentToChild"("B");

ALTER TABLE "_ParentToChild" ADD CONSTRAINT "_ParentToChild_A_fkey" FOREIGN KEY ("A") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ParentToChild" ADD CONSTRAINT "_ParentToChild_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
