// lib/chatbotCache.ts
import { prisma } from './db'                   // <-- adjust if your Prisma client lives elsewhere
import { startOfDay, endOfDay } from 'date-fns'

// ── Types ────────────────────────────────────────
export interface ChatCache {
  timestamp: number
  data: {
    // Admin fields
    totalUsers?: number
    totalEmployees?: number          // NEW
    totalClients?: number            // NEW
    totalAdmins?: number             // optional, rarely asked but complete
    totalServices?: number
    totalAppointments?: number
    todayAppointments?: number
    // Employee fields
    todayAppts?: number
    nextAppointment?: {
      serviceName: string
      clientName: string
      datetime: string
    } | null
    clientCount?: number             // NEW
    clients?: string[]               // kept for detailed follow‑ups
    // Client fields
    bookingCount?: number
    nextBooking?: {
      serviceName: string
      employeeName: string
      datetime: string
    } | null
    recentBooking?: {
      serviceName: string
      datetime: string
    } | null
  }
}

// ── Builder ──────────────────────────────────────
export async function buildChatCache(user: {
  id: number
  role: string
}): Promise<ChatCache> {
  const cache: ChatCache = { timestamp: Date.now(), data: {} }

  if (user.role === 'ADMIN') {
    const [
      totalUsers,
      totalEmployees,
      totalClients,
      totalAdmins,
      totalServices,
      totalAppointments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'EMPLOYEE' } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.service.count(),
      prisma.bookedAppointment.count(),
    ])

    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())
    const todayAppointments = await prisma.bookedAppointment.count({
      where: { datetime: { gte: todayStart, lte: todayEnd } },
    })

    cache.data = {
      totalUsers,
      totalEmployees,
      totalClients,
      totalAdmins,
      totalServices,
      totalAppointments,
      todayAppointments,
    }
  } else if (user.role === 'EMPLOYEE') {
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())

    const [todayAppts, nextAppointment, clients] = await Promise.all([
      prisma.bookedAppointment.count({
        where: { employeeId: user.id, datetime: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.bookedAppointment.findFirst({
        where: { employeeId: user.id, datetime: { gte: new Date() } },
        orderBy: { datetime: 'asc' },
        select: {
          datetime: true,
          service: { select: { name: true } },
          client: { select: { name: true } },
        },
      }),
      prisma.bookedAppointment.findMany({
        where: { employeeId: user.id },
        select: { client: { select: { name: true } } },
        distinct: ['clientId'],
      }),
    ])

    cache.data = {
      todayAppts,
      nextAppointment: nextAppointment
        ? {
            serviceName: nextAppointment.service.name,
            clientName: nextAppointment.client.name,
            datetime: nextAppointment.datetime.toISOString(),
          }
        : null,
      clientCount: clients.length,
      clients: clients.map(c => c.client.name),
    }
  } else if (user.role === 'CLIENT') {
    const [bookingCount, nextBooking, recentBooking] = await Promise.all([
      prisma.bookedAppointment.count({ where: { clientId: user.id } }),
      prisma.bookedAppointment.findFirst({
        where: { clientId: user.id, datetime: { gte: new Date() } },
        orderBy: { datetime: 'asc' },
        select: {
          datetime: true,
          service: { select: { name: true } },
          employee: { select: { name: true } },
        },
      }),
      prisma.bookedAppointment.findFirst({
        where: { clientId: user.id },
        orderBy: { datetime: 'desc' },
        select: { datetime: true, service: { select: { name: true } } },
      }),
    ])

    cache.data = {
      bookingCount,
      nextBooking: nextBooking
        ? {
            serviceName: nextBooking.service.name,
            employeeName: nextBooking.employee?.name ?? 'Unassigned',
            datetime: nextBooking.datetime.toISOString(),
          }
        : null,
      recentBooking: recentBooking
        ? {
            serviceName: recentBooking.service.name,
            datetime: recentBooking.datetime.toISOString(),
          }
        : null,
    }
  }

  return cache
}

// ── TTL‑based cache (prevents hitting DB on every message) ──
let cacheInstance: ChatCache | null = null
const CACHE_TTL = 60_000 // 1 minute (adjust as needed)

export async function getChatCache(user: { id: number; role: string }) {
  if (cacheInstance && Date.now() - cacheInstance.timestamp < CACHE_TTL) {
    return cacheInstance
  }
  cacheInstance = await buildChatCache(user)
  return cacheInstance
}