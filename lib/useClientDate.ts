import { useState, useEffect } from 'react'

export function useClientDate(
  iso: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    if (iso) {
      const d = new Date(iso)
      if (!isNaN(d.getTime())) {
        // Only format on client
        setDateStr(d.toLocaleString(undefined, options || undefined))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, JSON.stringify(options)])

  return dateStr
}
