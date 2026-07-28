const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.user.update({
    where: { email: 'admin@booking.com' },  // adjust if different
    data: { isSuperAdmin: true },
  })
  console.log('✅ Admin is now super-admin.')
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
})