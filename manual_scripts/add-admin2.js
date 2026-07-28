// add-admin2.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')   // use the same library as your seed

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12)

  const user = await prisma.user.create({
    data: {
      name: 'Admin 2 User',
      email: 'admin2@booking.com',
      password: passwordHash,
      role: 'ADMIN',
      phone: null,
      photo: 'user_images/2.png',
      plan: 'business',
      approvedBy: null,
      maxEmployees: null,
      maxClients: null,
      maxAdmins: null,
      isSuperAdmin: false,
      // createdAt and updatedAt are auto‑generated
    },
  })

  console.log('✅ Admin 2 created:', user.id, user.email)
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
})