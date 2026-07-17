import { useEffect, useState } from 'react'

interface PersistedValue<T> {
  version: number
  data: T
}

// Version 4 adds complete manual milestone schedule windows and the resource
// issue grain used by the secondary operating surfaces.
const STORAGE_VERSION = 4

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (!stored) return initialValue
      const parsed = JSON.parse(stored) as PersistedValue<T>
      return parsed.version === STORAGE_VERSION ? parsed.data : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      const payload: PersistedValue<T> = { version: STORAGE_VERSION, data: value }
      window.localStorage.setItem(key, JSON.stringify(payload))
    } catch {
      // Storage can be unavailable in hardened/private browser contexts.
      // The workspace remains fully usable for the current session.
    }
  }, [key, value])

  return [value, setValue] as const
}
