// lib/bloom.ts
import { prisma } from './db'

// ── Simple Bloom filter (no external deps) ──────────
class BloomFilter {
  private bits: Uint8Array
  private size: number
  private hashCount: number

  constructor(expectedItems: number, falsePositiveRate: number) {
    // Optimal size = ceil((expectedItems * log(fpRate)) / log(1 / 2^log(2)))
    const n = expectedItems
    const p = falsePositiveRate
    const m = Math.ceil(-(n * Math.log(p)) / (Math.LN2 * Math.LN2))
    const k = Math.ceil((m / n) * Math.LN2)

    this.size = Math.max(m, 8)
    this.hashCount = Math.max(k, 1)
    this.bits = new Uint8Array(this.size)
  }

  // FNV‑1a hash with different seeds for multiple hash functions
  private hash(value: string, seed: number): number {
    let h = 0x811c9dc5 ^ seed
    for (let i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i)
      h = Math.imul(h, 0x01000193)
    }
    return Math.abs(h) % this.size
  }

  add(value: string): void {
    for (let i = 0; i < this.hashCount; i++) {
      const idx = this.hash(value, i)
      this.bits[idx] = 1
    }
  }

  has(value: string): boolean {
    for (let i = 0; i < this.hashCount; i++) {
      const idx = this.hash(value, i)
      if (!this.bits[idx]) return false
    }
    return true
  }
}

// ── Singleton filters with lazy initialization ────────
let emailFilter: BloomFilter | null = null
let appointmentFilter: BloomFilter | null = null
let initPromise: Promise<void> | null = null

async function initBloomFilters() {
  const users = await prisma.user.findMany({ select: { email: true } })
  emailFilter = new BloomFilter(users.length, 0.01)
  users.forEach(u => emailFilter!.add(u.email))

  const appointments = await prisma.bookedAppointment.findMany({ select: { id: true } })
  appointmentFilter = new BloomFilter(appointments.length, 0.01)
  appointments.forEach(a => appointmentFilter!.add(String(a.id)))

  console.log(
    `🌼 Bloom filters ready – emails: ${users.length}, appointments: ${appointments.length}`
  )
}

export async function ensureBloomFilters() {
  if (!initPromise) {
    initPromise = initBloomFilters()
  }
  return initPromise
}

// ── Stats ────────────────────────────────────────────
export interface BloomStats {
  emailChecks: number
  emailSaved: number
  appointmentChecks: number
  appointmentSaved: number
}

const stats: BloomStats = {
  emailChecks: 0,
  emailSaved: 0,
  appointmentChecks: 0,
  appointmentSaved: 0,
}

export function getBloomStats(): BloomStats {
  return { ...stats }
}

// ── Exported helpers (same interface as before) ──────
export function emailProbablyExists(email: string): boolean {
  stats.emailChecks++
  if (!emailFilter) return true
  const exists = emailFilter.has(email)
  if (!exists) stats.emailSaved++
  return exists
}

export function appointmentProbablyExists(id: number | string): boolean {
  stats.appointmentChecks++
  if (!appointmentFilter) return true
  const exists = appointmentFilter.has(String(id))
  if (!exists) stats.appointmentSaved++
  return exists
}

export function addEmailToFilter(email: string): void {
  emailFilter?.add(email)
}

export function addAppointmentIdToFilter(id: number | string): void {
  appointmentFilter?.add(String(id))
}
