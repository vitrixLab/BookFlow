import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Update users 1–8 with corresponding photo paths
  for (let id = 1; id <= 8; id++) {
    await prisma.user.update({
      where: { id },
      data: { photo: `user_images/${id}.png` },
    })
  }
  console.log('✅ All 8 users updated with photo paths')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
