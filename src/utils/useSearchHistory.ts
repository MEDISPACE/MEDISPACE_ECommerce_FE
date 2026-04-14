import { useState, useEffect } from 'react'

export interface SearchHistoryItem {
  query: string
  timestamp: number
  resultCount?: number
}

export function useSearchHistory() {
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('medispace-search-history')
      if (stored) {
        const history: SearchHistoryItem[] = JSON.parse(stored)
        setSearchHistory(history)
        setRecentSearches(history.slice(0, 5).map((item) => item.query))
      }
    } catch (error) {}
  }, [])

  const addToHistory = (query: string, resultCount?: number) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    const newItem: SearchHistoryItem = {
      query: trimmedQuery,
      timestamp: Date.now(),
      resultCount,
    }

    setSearchHistory((prev) => {
      // Remove existing entry if present
      const filtered = prev.filter((item) => item.query !== trimmedQuery)
      // Add new item at the beginning
      const updated = [newItem, ...filtered].slice(0, 20) // Keep only last 20 searches

      try {
        localStorage.setItem('medispace-search-history', JSON.stringify(updated))
      } catch (error) {}

      return updated
    })

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== trimmedQuery)
      return [trimmedQuery, ...filtered].slice(0, 5)
    })
  }

  const clearHistory = () => {
    setSearchHistory([])
    setRecentSearches([])
    try {
      localStorage.removeItem('medispace-search-history')
    } catch (error) {}
  }

  const removeFromHistory = (query: string) => {
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item.query !== query)
      try {
        localStorage.setItem('medispace-search-history', JSON.stringify(updated))
      } catch (error) {}
      return updated
    })

    setRecentSearches((prev) => prev.filter((item) => item !== query))
  }

  return {
    recentSearches,
    searchHistory,
    addToHistory,
    clearHistory,
    removeFromHistory,
  }
}
