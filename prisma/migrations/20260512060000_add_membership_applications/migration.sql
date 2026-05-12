CREATE TABLE "MembershipApplication" (
    "id" TEXT NOT NULL,
    "membershipClass" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "maritalStatus" "MaritalStatus" NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "stateProvince" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "rccgMember" BOOLEAN NOT NULL,
    "saved" BOOLEAN NOT NULL,
    "expectations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MembershipApplication_createdAt_idx" ON "MembershipApplication"("createdAt");
CREATE INDEX "MembershipApplication_email_idx" ON "MembershipApplication"("email");
CREATE INDEX "MembershipApplication_membershipClass_idx" ON "MembershipApplication"("membershipClass");
