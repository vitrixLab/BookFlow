// lib/chatbotQueries.ts
import { prisma } from './db'
import { startOfDay, endOfDay } from 'date-fns'
import type { ChatCache } from './chatbotCache'
import type { AppointmentStatus } from '@prisma/client'

// ── Types ─────────────────────────────────────────
type QuestionWord = 'what' | 'where' | 'when' | 'who' | 'how' | 'how-many'
type Subject = 'appointments' | 'bookings' | 'clients' | 'services' | 'users' | 'employees' | 'plan'
type TimeFrame = 'today' | 'tomorrow' | 'this-week' | 'next' | 'recent' | 'all' | 'none'

interface Intent {
  questionWord: QuestionWord
  subject: Subject
  timeFrame: TimeFrame
  isListRequest: boolean
  isCountRequest: boolean
  statusFilter?: AppointmentStatus
}

// ── Helpers ──────────────────────────────────────
function normalize(q: string) {
  return q.toLowerCase().replace(/[?.!,]/g, '').trim()
}

function detectQuestionWord(q: string): QuestionWord {
  if (/\bhow many\b/.test(q)) return 'how-many'
  if (/\bhow\b/.test(q)) return 'how'
  if (/\bwhat\b/.test(q)) return 'what'
  if (/\bwhere\b/.test(q)) return 'where'
  if (/\bwhen\b/.test(q)) return 'when'
  if (/\bwho\b/.test(q)) return 'who'
  return 'what'
}

function detectSubject(q: string): Subject {
  if (/\b(bookings|appointments)\b/.test(q)) return 'appointments'
  if (/\bemployees?\b/.test(q)) return 'employees'
  if (/\bclients?\b/.test(q)) return 'clients'
  if (/\bservices?\b/.test(q)) return 'services'
  if (/\busers?\b/.test(q)) return 'users'
  if (/\bplan\b/.test(q)) return 'plan'
  return 'appointments'
}

function detectTimeFrame(q: string): TimeFrame {
  if (/\btoday\b/.test(q)) return 'today'
  if (/\btomorrow\b/.test(q)) return 'tomorrow'
  if (/\bthis week\b/.test(q)) return 'this-week'
  if (/\bnext\b/.test(q)) return 'next'
  if (/\brecent\b|last\b/.test(q)) return 'recent'
  return 'none'
}

function isListRequest(q: string): boolean {
  return /\b(list|show|tell|what are|give|who are)\b/.test(q)
}

function isCountRequest(q: string): boolean {
  return /\bhow many\b/.test(q)
}

function detectStatus(q: string): AppointmentStatus | undefined {
  if (/\bpending\b/.test(q)) return 'PENDING'
  if (/\bconfirmed\b/.test(q)) return 'CONFIRMED'
  if (/\bcompleted\b/.test(q)) return 'COMPLETED'
  if (/\bcancelled\b/.test(q)) return 'CANCELLED'
  return undefined
}

function buildIntent(q: string): Intent {
  return {
    questionWord: detectQuestionWord(q),
    subject: detectSubject(q),
    timeFrame: detectTimeFrame(q),
    isListRequest: isListRequest(q),
    isCountRequest: isCountRequest(q),
    statusFilter: detectStatus(q),
  }
}

// ── Cache helpers ────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
function isValidCache(cache?: ChatCache | null): boolean {
  return !!(cache && Date.now() - cache.timestamp < CACHE_TTL)
}

// ── Where builder for appointments ───────────────
function buildAppointmentWhere(
  user: { id: number; role: string },
  intent: Intent
) {
  const where: any = {}

  // Role scoping
  if (user.role === 'EMPLOYEE') where.employeeId = user.id
  else if (user.role === 'CLIENT') where.clientId = user.id

  // Time frame
  if (intent.timeFrame === 'today') {
    const start = startOfDay(new Date())
    const end = endOfDay(new Date())
    where.datetime = { gte: start, lte: end }
  } else if (intent.timeFrame === 'tomorrow') {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const start = startOfDay(tomorrow)
    const end = endOfDay(tomorrow)
    where.datetime = { gte: start, lte: end }
  } else if (intent.timeFrame === 'next') {
    where.datetime = { gte: new Date() }
  } else if (intent.timeFrame === 'recent') {
    // handled via orderBy desc, no datetime filter needed
  }

  if (intent.statusFilter) {
    where.status = intent.statusFilter
  }

  return where
}

// ──── MAIN HANDLER ─────────────────────────────
export async function handleDataQuery(
  question: string,
  user: { id: number; role: string; plan?: string },
  cache?: ChatCache | null
): Promise<string | null> {
  const q = normalize(question)
  const intent = buildIntent(q)
  const useCache = isValidCache(cache)

  // Plan
  if (intent.subject === 'plan' || /my plan|what plan/i.test(q)) {
    return `You're on the ${user.plan || 'Solo'} plan.`
  }

  // ── ADMIN ──────────────────────────────────────
  if (user.role === 'ADMIN') {
    // Users (count)
    if (intent.subject === 'users' && intent.isCountRequest) {
      if (useCache && cache!.data.totalUsers !== undefined)
        return `There are ${cache!.data.totalUsers} users in the system.`
      const count = await prisma.user.count()
      return `There are ${count} users in the system.`
    }

    // Employees (count)
    if (intent.subject === 'employees' && intent.isCountRequest) {
      if (useCache && cache!.data.totalEmployees !== undefined)
        return `There are ${cache!.data.totalEmployees} employees.`
      const count = await prisma.user.count({ where: { role: 'EMPLOYEE' } })
      return `There are ${count} employees.`
    }

    // Clients (count)
    if (intent.subject === 'clients' && intent.isCountRequest) {
      if (useCache && cache!.data.totalClients !== undefined)
        return `There are ${cache!.data.totalClients} clients.`
      const count = await prisma.user.count({ where: { role: 'CLIENT' } })
      return `There are ${count} clients.`
    }

    // Services (count)
    if (intent.subject === 'services' && intent.isCountRequest) {
      if (useCache && cache!.data.totalServices !== undefined)
        return `There are ${cache!.data.totalServices} services available.`
      const count = await prisma.service.count()
      return `There are ${count} services available.`
    }

    // Appointments (count or by status)
    if (intent.subject === 'appointments') {
      if (intent.isCountRequest) {
        if (intent.statusFilter) {
          const key = intent.statusFilter.toLowerCase() // e.g. 'pending'
          if (useCache && cache?.data.appointmentStatusCounts?.[key] !== undefined) {
            return `There are ${cache!.data.appointmentStatusCounts![key]} ${key} appointments in total.`
          }
          const count = await prisma.bookedAppointment.count({
            where: { status: intent.statusFilter },
          })
          return `There are ${count} ${key} appointments in total.`
        }
        // No status filter
        if (useCache && cache!.data.totalAppointments !== undefined)
          return `There are ${cache!.data.totalAppointments} appointments in total.`
        const count = await prisma.bookedAppointment.count()
        return `There are ${count} appointments in total.`
      }

      // 👇 Only list if explicitly a list request
      if (intent.isListRequest) {
        const where = buildAppointmentWhere(user, intent)
        const orderBy: any = intent.timeFrame === 'recent' ? { datetime: 'desc' } : { datetime: 'asc' }
        const appointments = await prisma.bookedAppointment.findMany({
          where,
          orderBy,
          take: 10,
          select: {
            datetime: true,
            status: true,
            service: { select: { name: true } },
            client: { select: { name: true } },
            employee: { select: { name: true } },
          },
        })
        if (appointments.length === 0) return 'No appointments found.'
        const list = appointments.map(a => {
          const date = a.datetime.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
          return `• ${a.service.name} – ${a.client.name} with ${a.employee?.name ?? 'Unassigned'} on ${date} (${a.status})`
        }).join('\n')
        return `Appointments:\n${list}`
      }

      // If not count or list, fall through to LLM
      return null
    }
  }

  // ── EMPLOYEE ──────────────────────────────────
  if (user.role === 'EMPLOYEE') {
    // Appointments
    if (intent.subject === 'appointments') {
      // Today's count
      if (intent.timeFrame === 'today' && intent.isCountRequest) {
        if (useCache && cache!.data.todayAppts !== undefined)
          return `You have ${cache!.data.todayAppts} appointment(s) today.`
        const todayStart = startOfDay(new Date())
        const todayEnd = endOfDay(new Date())
        const count = await prisma.bookedAppointment.count({
          where: { employeeId: user.id, datetime: { gte: todayStart, lte: todayEnd } },
        })
        return `You have ${count} appointment(s) today.`
      }

      // Count by status
      if (intent.isCountRequest && intent.statusFilter) {
        const key = intent.statusFilter.toLowerCase()
        if (useCache && cache?.data.appointmentStatusCountsEmp?.[key] !== undefined)
          return `You have ${cache!.data.appointmentStatusCountsEmp![key]} ${key} appointment(s).`
        const count = await prisma.bookedAppointment.count({
          where: { employeeId: user.id, status: intent.statusFilter },
        })
        return `You have ${count} ${key} appointment(s).`
      }

      // Next appointment
      if (intent.timeFrame === 'next') {
        if (useCache) {
          if (cache!.data.nextAppointment) {
            const next = cache!.data.nextAppointment!
            const time = new Date(next.datetime).toLocaleString('en-US', {
              weekday: 'short',
              hour: 'numeric',
              minute: '2-digit',
            })
            return `Your next appointment is “${next.serviceName}” with ${next.clientName} on ${time}.`
          }
          return "You don't have any upcoming appointments."
        }
        const next = await prisma.bookedAppointment.findFirst({
          where: { employeeId: user.id, datetime: { gte: new Date() } },
          orderBy: { datetime: 'asc' },
          select: {
            datetime: true,
            service: { select: { name: true } },
            client: { select: { name: true } },
          },
        })
        if (!next) return "You don't have any upcoming appointments."
        const time = next.datetime.toLocaleString('en-US', {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
        })
        return `Your next appointment is “${next.service.name}” with ${next.client.name} on ${time}.`
      }

      // List upcoming (no filters)
      if (intent.isListRequest && intent.timeFrame === 'none' && !intent.statusFilter) {
        if (useCache && cache?.data.upcomingAppointments) {
          const upcoming = cache.data.upcomingAppointments
          if (upcoming.length === 0) return "You don't have any upcoming appointments."
          const list = upcoming.map(a => {
            const date = new Date(a.datetime).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
            return `• ${a.serviceName} for ${a.clientName!} on ${date} (${a.status})`
          }).join('\n')
          return `Your upcoming appointments:\n${list}`
        }
        // Fallback DB
        const upcoming = await prisma.bookedAppointment.findMany({
          where: { employeeId: user.id, datetime: { gte: new Date() } },
          orderBy: { datetime: 'asc' },
          take: 10,
          select: {
            datetime: true,
            status: true,
            service: { select: { name: true } },
            client: { select: { name: true } },
          },
        })
        if (upcoming.length === 0) return "You don't have any upcoming appointments."
        const list = upcoming.map(a => {
          const date = a.datetime.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
          return `• ${a.service.name} for ${a.client.name} on ${date} (${a.status})`
        }).join('\n')
        return `Your upcoming appointments:\n${list}`
      }

      // Default: DB query with filters (only if list requested)
      if (intent.isListRequest) {
        const where = buildAppointmentWhere(user, intent)
        const orderBy: any = intent.timeFrame === 'recent' ? { datetime: 'desc' } : { datetime: 'asc' }
        const appointments = await prisma.bookedAppointment.findMany({
          where,
          orderBy,
          take: 10,
          select: {
            datetime: true,
            status: true,
            service: { select: { name: true } },
            client: { select: { name: true } },
          },
        })
        if (appointments.length === 0) return 'No appointments found.'
        const list2 = appointments.map(a => {
          const date = a.datetime.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
          return `• ${a.service.name} for ${a.client.name} on ${date} (${a.status})`
        }).join('\n')
        return `Your appointments:\n${list2}`
      }

      // Not list or count → fall through
      return null
    }

    // Clients
    if (intent.subject === 'clients') {
      const requestCount = intent.isCountRequest || intent.questionWord === 'how-many'
      const requestList = intent.isListRequest || intent.questionWord === 'who'
      if (useCache && cache!.data.clients) {
        const names = cache!.data.clients
        if (names.length === 0) return 'You have no clients yet.'
        if (requestCount) return `You have ${names.length} client(s).`
        return `Your clients: ${names.join(', ')}.`
      }
      const appointments = await prisma.bookedAppointment.findMany({
        where: { employeeId: user.id },
        select: { client: { select: { name: true } } },
        distinct: ['clientId'],
      })
      const names = appointments.map(a => a.client.name)
      if (names.length === 0) return 'You have no clients yet.'
      if (requestCount) return `You have ${names.length} client(s).`
      return `Your clients: ${names.join(', ')}.`
    }
  }

  // ── CLIENT ─────────────────────────────────────
  if (user.role === 'CLIENT') {
    if (intent.subject === 'appointments') {
      // Booking count by status
      if (intent.isCountRequest && intent.statusFilter) {
        const key = intent.statusFilter.toLowerCase()
        if (useCache && cache?.data.bookingStatusCounts?.[key] !== undefined)
          return `You have ${cache!.data.bookingStatusCounts![key]} ${key} booking(s).`
        const count = await prisma.bookedAppointment.count({
          where: { clientId: user.id, status: intent.statusFilter },
        })
        return `You have ${count} ${key} booking(s).`
      }

      // Total booking count
      if (intent.isCountRequest) {
        if (useCache && cache!.data.bookingCount !== undefined)
          return `You have ${cache!.data.bookingCount} booking(s).`
        const count = await prisma.bookedAppointment.count({ where: { clientId: user.id } })
        return `You have ${count} booking(s).`
      }

      // Next booking
      if (intent.timeFrame === 'next') {
        if (useCache) {
          if (cache!.data.nextBooking) {
            const next = cache!.data.nextBooking!
            const time = new Date(next.datetime).toLocaleString('en-US', {
              weekday: 'short',
              hour: 'numeric',
              minute: '2-digit',
            })
            return `Your next booking is “${next.serviceName}” with ${next.employeeName} on ${time}.`
          }
          return "You don't have any upcoming bookings."
        }
        const next = await prisma.bookedAppointment.findFirst({
          where: { clientId: user.id, datetime: { gte: new Date() } },
          orderBy: { datetime: 'asc' },
          select: {
            datetime: true,
            service: { select: { name: true } },
            employee: { select: { name: true } },
          },
        })
        if (!next) return "You don't have any upcoming bookings."
        const time = next.datetime.toLocaleString('en-US', {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
        })
        return `Your next booking is “${next.service.name}” with ${next.employee?.name ?? 'Unassigned'} on ${time}.`
      }

      // Recent booking
      if (intent.timeFrame === 'recent') {
        if (useCache) {
          if (cache!.data.recentBooking) {
            const recent = cache!.data.recentBooking!
            const date = new Date(recent.datetime).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })
            return `Your most recent booking was “${recent.serviceName}” on ${date}.`
          }
          return "You haven't booked anything yet."
        }
        const recent = await prisma.bookedAppointment.findFirst({
          where: { clientId: user.id },
          orderBy: { datetime: 'desc' },
          select: { datetime: true, service: { select: { name: true } } },
        })
        if (!recent) return "You haven't booked anything yet."
        const date = recent.datetime.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
        return `Your most recent booking was “${recent.service.name}” on ${date}.`
      }

      // List upcoming (no filters) – use cache
      if (intent.isListRequest && intent.timeFrame === 'none' && !intent.statusFilter) {
        if (useCache && cache?.data.upcomingBookings) {
          const upcoming = cache.data.upcomingBookings
          if (upcoming.length === 0) return "You don't have any upcoming bookings."
          const list = upcoming.map(a => {
            const date = new Date(a.datetime).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
            return `• ${a.serviceName} with ${a.employeeName!} on ${date} (${a.status})`
          }).join('\n')
          return `Your upcoming bookings:\n${list}`
        }
        const upcoming = await prisma.bookedAppointment.findMany({
          where: { clientId: user.id, datetime: { gte: new Date() } },
          orderBy: { datetime: 'asc' },
          take: 10,
          select: {
            datetime: true,
            status: true,
            service: { select: { name: true } },
            employee: { select: { name: true } },
          },
        })
        if (upcoming.length === 0) return "You don't have any upcoming bookings."
        const list = upcoming.map(a => {
          const date = a.datetime.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
          return `• ${a.service.name} with ${a.employee.name} on ${date} (${a.status})`
        }).join('\n')
        return `Your upcoming bookings:\n${list}`
      }

      // Default DB query (only if list requested)
      if (intent.isListRequest) {
        const where = buildAppointmentWhere(user, intent)
        const orderBy: any = intent.timeFrame === 'recent' ? { datetime: 'desc' } : { datetime: 'asc' }
        const bookings = await prisma.bookedAppointment.findMany({
          where,
          orderBy,
          take: 10,
          select: {
            datetime: true,
            status: true,
            service: { select: { name: true } },
            employee: { select: { name: true } },
          },
        })
        if (bookings.length === 0) return 'No bookings found.'
        const list2 = bookings.map(a => {
          const date = a.datetime.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
          return `• ${a.service.name} with ${a.employee.name} on ${date} (${a.status})`
        }).join('\n')
        return `Your bookings:\n${list2}`
      }

      // Not list or count → fall through
      return null
    }
  }

  // Fall through to LLM
  return null
}