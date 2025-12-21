import { useState, useEffect, useCallback } from 'react'

type LocalStorageValue<T> = T | null

interface UseLocalStorageReturn<T> {
  value: LocalStorageValue<T>
  setValue: (value: T | ((prev: LocalStorageValue<T>) => T)) => void
  removeValue: () => void
  loading: boolean
  error: string | null
}

export const useLocalStorage = <T>(key: string, initialValue?: T): UseLocalStorageReturn<T> => {
  const [value, setStoredValue] = useState<LocalStorageValue<T>>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Read from localStorage on mount
  useEffect(() => {
    try {
      setError(null)
      const item = localStorage.getItem(key)

      if (item === null) {
        setStoredValue(initialValue || null)
      } else {
        const parsedValue = JSON.parse(item)
        setStoredValue(parsedValue)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read from localStorage')
      setStoredValue(initialValue || null)
    } finally {
      setLoading(false)
    }
  }, [key, initialValue])

  const setValue = useCallback(
    (newValue: T | ((prev: LocalStorageValue<T>) => T)) => {
      try {
        setError(null)

        // Allow value to be a function so we have the same API as useState
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue

        setStoredValue(valueToStore)

        // Save to localStorage
        if (valueToStore === null || valueToStore === undefined) {
          localStorage.removeItem(key)
        } else {
          localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to write to localStorage')
      }
    },
    [key, value],
  )

  const removeValue = useCallback(() => {
    try {
      setError(null)
      localStorage.removeItem(key)
      setStoredValue(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from localStorage')
    }
  }, [key])

  return {
    value,
    setValue,
    removeValue,
    loading,
    error,
  }
}

// Specialized hooks for common use cases
export const useAuthToken = () => {
  return useLocalStorage<string>('medispace_auth_token')
}

export const useUserData = () => {
  return useLocalStorage<{ id: string; email: string; name: string }>('medispace_user_data')
}
