import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Clean existing data
  await prisma.bookedAppointment.deleteMany()
  await prisma.service.deleteMany()
  await prisma.user.deleteMany()

  const hash = async (pw: string) => bcrypt.hash(pw, 12)

  // ── 1. Users ──────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@booking.com',
      password: await hash('admin123'),
      role: 'ADMIN',
      plan: 'business',
      maxEmployees: null,
      maxClients: null,
      maxAdmins: null,
    },
  })

  const emma = await prisma.user.create({
    data: { name: 'Emma Johnson', email: 'emma.johnson@booking.com', password: await hash('demo123'), role: 'EMPLOYEE' },
  })
  const michael = await prisma.user.create({
    data: { name: 'Michael Chen', email: 'michael.chen@booking.com', password: await hash('demo123'), role: 'EMPLOYEE' },
  })
  const sarahE = await prisma.user.create({
    data: { name: 'Sarah Williams', email: 'sarah.williams@booking.com', password: await hash('demo123'), role: 'EMPLOYEE' },
  })

  const client1 = await prisma.user.create({
    data: { name: 'John Client', email: 'client1@example.com', password: await hash('demo123'), role: 'CLIENT' },
  })
  const client2 = await prisma.user.create({
    data: { name: 'Sarah Client', email: 'sarah@example.com', password: await hash('demo123'), role: 'CLIENT' },
  })
  const client3 = await prisma.user.create({
    data: { name: 'Mike Client', email: 'mike@example.com', password: await hash('demo123'), role: 'CLIENT' },
  })
  const client4 = await prisma.user.create({
    data: { name: 'Lisa Client', email: 'lisa@example.com', password: await hash('demo123'), role: 'CLIENT' },
  })

  // Assign photos
  const allUsers = [admin, emma, michael, sarahE, client1, client2, client3, client4]
  for (let i = 0; i < allUsers.length; i++) {
    await prisma.user.update({
      where: { id: allUsers[i].id },
      data: { photo: `user_images/${i + 1}.png` },
    })
  }

  // ── 2. Services ───────────────────────────────────
  const services = await Promise.all([
    prisma.service.create({ data: { name: '60-min Deep Tissue Massage', description: 'Full body massage focusing on muscle knots', durationMin: 60, price: 80 } }),
    prisma.service.create({ data: { name: '90-min Swedish Massage', description: 'Relaxing full body massage', durationMin: 90, price: 110 } }),
    prisma.service.create({ data: { name: '30-min Express Chair Massage', description: 'Quick tension relief', durationMin: 30, price: 40 } }),
    prisma.service.create({ data: { name: 'Hot Stone Therapy', description: 'Warm stones for deep relaxation', durationMin: 75, price: 95 } }),
    prisma.service.create({ data: { name: 'Reflexology Session', description: 'Foot reflexology for stress relief', durationMin: 45, price: 65 } }),
    prisma.service.create({ data: { name: 'Aromatherapy Massage', description: 'Essential oils for relaxation', durationMin: 60, price: 85 } }),
  ])

  // ── 3. Sample Appointments ────────────────────────
  const now = new Date()
  const day = 86_400_000  // milliseconds in a day

  const relativeDate = (offsetDays: number, hour: number, minute = 0) => {
    const d = new Date(now.getTime() + offsetDays * day)
    d.setHours(hour, minute, 0, 0)
    return d
  }

  // The last element can be string | null | undefined
  const appointmentsData: [any, any, any, Date, string, (string | null)?][] = [
    // Today
    [client1, services[0], emma,    relativeDate(0, 10),  'PENDING',  'First time client'],
    [client2, services[1], michael, relativeDate(0, 14),  'CONFIRMED', null],
    [client3, services[2], sarahE,  relativeDate(0, 16),  'COMPLETED', null],
    // Tomorrow
    [client4, services[3], emma,    relativeDate(1, 9),   'CONFIRMED', 'Prefers hot stones'],
    [client1, services[4], michael, relativeDate(1, 11),  'PENDING',  null],
    // Day after tomorrow
    [client2, services[5], sarahE,  relativeDate(2, 13),  'CONFIRMED', 'Aromatherapy requested'],
    [client3, services[0], emma,    relativeDate(2, 15),  'PENDING',  null],
    // Overdue (past, still pending)
    [client4, services[1], michael, relativeDate(-1, 12), 'PENDING',  'Missed appointment – needs reschedule'],
    [client1, services[2], sarahE,  relativeDate(-2, 10), 'PENDING',  'Overdue – follow up'],
    // Upcoming next week
    [client2, services[3], emma,    relativeDate(5, 10),  'CONFIRMED', null],
    [client3, services[4], michael, relativeDate(6, 14),  'PENDING',  'Birthday special'],
    [client4, services[5], sarahE,  relativeDate(7, 11),  'CONFIRMED', null],
  ]

  for (const [client, service, employee, datetime, status, notes] of appointmentsData) {
    await prisma.bookedAppointment.create({
      data: {
        clientId: client.id,
        serviceId: service.id,
        employeeId: employee.id,
        datetime,
        status: status as any,
        notes: notes ?? null,
        smsSent: status === 'CONFIRMED' ? true : false,
        smsRetryCount: 0,
      },
    })
  }

  console.log('✅ Seed completed — users, services, and appointments created.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())