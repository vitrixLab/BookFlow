const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Drop the existing LoginTrace table (CASCADE removes any dependent objects)
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "LoginTrace" CASCADE;`)
  console.log('✅ LoginTrace table dropped.')
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
})