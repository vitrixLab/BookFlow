import { format, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale'

/**
 * Format an ISO date string into a human‑readable string.
 * Locale is hard‑coded to `enUS` so the output is identical
 * on the server and in any browser – no hydration mismatch.
 *
 * @param iso  - ISO 8601 date string (e.g., "2026-05-01T10:00:00.000Z")
 * @param fmt  - date-fns format token (default "MMM d, yyyy, h:mm a")
 * @returns    - formatted date string (e.g. "May 11, 2026, 12:04 AM")
 */
export function formatDate(iso: string, fmt = 'MMM d, yyyy, h:mm a'): string {
  try {
    const date = parseISO(iso)
    return format(date, fmt, { locale: enUS })
  } catch {
    return 'Invalid date'
  }
}