const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function selectAll() {
  const users = await prisma.user.findMany()
  const services = await prisma.service.findMany()
  const appointments = await prisma.bookedAppointment.findMany()
  const smsLogs = await prisma.smsLog.findMany()
  const loginTraces = await prisma.loginTrace.findMany()

  console.log(JSON.stringify({ users, services, appointments, smsLogs, loginTraces }, null, 2))
  await prisma.$disconnect()
}

selectAll().catch(e => {
  console.error(e)
  prisma.$disconnect()
})