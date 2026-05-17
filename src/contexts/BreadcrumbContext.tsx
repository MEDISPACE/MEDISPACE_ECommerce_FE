import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { BreadcrumbItem } from '~/components/shared/UniversalBreadcrumb'

interface BreadcrumbContextType {
  items: BreadcrumbItem[]
  setItems: (items: BreadcrumbItem[]) => void
  clearItems: () => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | null>(null)

interface BreadcrumbProviderProps {
  children: ReactNode
}

export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
  const [items, setItemsState] = useState<BreadcrumbItem[]>([])

  const setItems = useCallback((newItems: BreadcrumbItem[]) => {
    setItemsState(newItems)
  }, [])

  const clearItems = useCallback(() => {
    setItemsState([])
  }, [])

  return <BreadcrumbContext.Provider value={{ items, setItems, clearItems }}>{children}</BreadcrumbContext.Provider>
}

export function useBreadcrumbContext() {
  const context = useContext(BreadcrumbContext)
  if (!context) {
    throw new Error('useBreadcrumbContext must be used within a BreadcrumbProvider')
  }
  return context
}

// Hook for pages to set their breadcrumb items
export function useSetBreadcrumb(items: BreadcrumbItem[]) {
  const { setItems, clearItems } = useBreadcrumbContext()

  // Set items on mount, clear on unmount
  // Use useEffect in the component that calls this
  return { setItems, clearItems, itemsToSet: items }
}
