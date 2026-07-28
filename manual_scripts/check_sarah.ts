import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'sarah.williams@booking.com' } })
  if (!user) return console.log('Employee Sarah Williams not found.')

  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

  const all = await prisma.bookedAppointment.findMany({
    where: { employeeId: user.id },
    include: { service: true, client: true },
    orderBy: { datetime: 'asc' },
  })

  const future = all.filter(a => a.datetime >= today)

  console.log(`\n--- ${user.name} (ID: ${user.id}) ---`)
  console.log(`Total appointments: ${all.length}`)
  console.log(`Upcoming (including today): ${future.length}`)
  console.log(`Today's appointments (filtered): ${all.filter(a => a.datetime >= today && a.datetime < tomorrow).length}`)

  console.log('\nAll appointments:')
  console.table(all.map(a => ({
    date: a.datetime.toISOString(),
    client: a.client.name,
    service: a.service.name,
    status: a.status,
  })))
}

main().finally(() => prisma.$disconnect())
