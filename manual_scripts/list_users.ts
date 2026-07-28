import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.table(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      photo: u.photo,
    }))
  )
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
