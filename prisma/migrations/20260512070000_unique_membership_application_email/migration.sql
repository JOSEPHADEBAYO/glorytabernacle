WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY LOWER("email")
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS rn
  FROM "MembershipApplication"
)
DELETE FROM "MembershipApplication"
WHERE "id" IN (
  SELECT "id"
  FROM ranked
  WHERE rn > 1
);

CREATE UNIQUE INDEX "MembershipApplication_email_key" ON "MembershipApplication"("email");
