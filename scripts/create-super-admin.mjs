// One-shot bootstrap to create (or refresh) a Super Admin user. Run after
// applying migrations on a fresh database, or any time you need to add /
// reset a top-level admin account.
//
// Usage (Node 20.6+):
//
//   SUPER_ADMIN_EMAIL=admin@... \
//   SUPER_ADMIN_PASSWORD='hunter2' \
//   SUPER_ADMIN_NAME='Site Owner' \
//   node --env-file=.env.local scripts/create-super-admin.mjs
//
// The script is idempotent — it upserts on the email, so re-running with the
// same values is safe (and useful for resetting a forgotten password without
// going through the dashboard).
//
// SECURITY: credentials are read from env vars (not hardcoded) so the
// password never lands in git history.

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const EMAIL = process.env.SUPER_ADMIN_EMAIL
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD
const NAME = process.env.SUPER_ADMIN_NAME ?? 'Super Admin'
const SALT_ROUNDS = 12

if (!EMAIL || !PASSWORD) {
  console.error(
    'Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD. Run like:\n\n' +
      '  SUPER_ADMIN_EMAIL=admin@glorytabernacle.co.uk \\\n' +
      "  SUPER_ADMIN_PASSWORD='Glory2026@@' \\\n" +
      "  SUPER_ADMIN_NAME='Super Admin' \\\n" +
      '  node --env-file=.env.local scripts/create-super-admin.mjs\n'
  )
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error(
    'Missing DATABASE_URL. Make sure --env-file points at a file containing it ' +
      '(e.g. --env-file=.env.local).'
  )
  process.exit(1)
}

// Mirror the exact Prisma setup the app uses (see lib/prisma.ts): a pg Pool
// behind a PrismaPg driver adapter, then PrismaClient with that adapter.
// Prisma 7 requires the adapter explicitly — `new PrismaClient()` on its
// own throws PrismaClientInitializationError.
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

try {
  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS)
  const user = await prisma.user.upsert({
    where: { email: EMAIL.toLowerCase() },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      email: EMAIL.toLowerCase(),
      name: NAME,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      mustChangePassword: false,
    },
  })

  console.log('Super Admin ready:')
  console.log('  Email: ' + user.email)
  console.log('  Name:  ' + user.name)
  console.log('  Role:  ' + user.role)
  console.log('  ID:    ' + user.id)
  console.log('')
  console.log('Sign in at /login with the email + password you provided.')
} catch (err) {
  console.error('Failed to create Super Admin:', err)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
  await pool.end()
}
