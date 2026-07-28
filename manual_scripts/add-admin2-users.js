// add-admin2-users.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const adminId = 9
  const passwordHash = await bcrypt.hash('123456', 12)

  // ── Employees ──
  const emp1 = await prisma.user.create({
    data: {
      name: 'Emily Watson',
      email: 'emily.watson@example.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      phone: '+63 912 345 6789',
      approvedBy: adminId,
    },
  })

  const emp2 = await prisma.user.create({
    data: {
      name: 'Daniel Reyes',
      email: 'daniel.reyes@example.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      phone: '+63 917 654 3210',
      approvedBy: adminId,
    },
  })

  // ── Clients ──
  const client1 = await prisma.user.create({
    data: {
      name: 'Sophia Cruz',
      email: 'sophia.cruz@example.com',
      password: passwordHash,
      role: 'CLIENT',
      phone: '+63 923 111 2222',
      approvedBy: adminId,
    },
  })

  const client2 = await prisma.user.create({
    data: {
      name: 'Liam Santos',
      email: 'liam.santos@example.com',
      password: passwordHash,
      role: 'CLIENT',
      phone: '+63 926 333 4444',
      approvedBy: adminId,
    },
  })

  const client3 = await prisma.user.create({
    data: {
      name: 'Olivia Reyes',
      email: 'olivia.reyes@example.com',
      password: passwordHash,
      role: 'CLIENT',
      phone: '+63 935 555 6666',
      approvedBy: adminId,
    },
  })

  console.log('✅ Created users for admin2:')
  console.log('Employees:', emp1.email, emp2.email)
  console.log('Clients:', client1.email, client2.email, client3.email)

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
})