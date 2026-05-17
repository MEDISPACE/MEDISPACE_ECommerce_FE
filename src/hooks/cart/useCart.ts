import { useState, useCallback } from 'react'

interface CartItem {
  id: string
  name: string
  price: number
  originalPrice?: number
  quantity: number
  image?: string
  brand?: string
}

interface UseCartReturn {
  items: CartItem[]
  itemCount: number
  total: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  isInCart: (id: string) => boolean
}

const CART_STORAGE_KEY = 'medispace_cart'

// Helper function to safely parse cart from localStorage
const getStoredCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    return []
  }
}

// Helper function to safely save cart to localStorage
const saveCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch (error) {}
}

export const useCart = (): UseCartReturn => {
  const [items, setItems] = useState<CartItem[]>(() => getStoredCart())

  // Calculate derived values
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === newItem.id)

      let updatedItems: CartItem[]
      if (existingItem) {
        // Item exists, increment quantity
        updatedItems = currentItems.map((item) =>
          item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      } else {
        // New item, add to cart
        updatedItems = [...currentItems, { ...newItem, quantity: 1 }]
      }

      saveCart(updatedItems)
      return updatedItems
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((currentItems) => {
      const updatedItems = currentItems.filter((item) => item.id !== id)
      saveCart(updatedItems)
      return updatedItems
    })
  }, [])

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(id)
        return
      }

      setItems((currentItems) => {
        const updatedItems = currentItems.map((item) => (item.id === id ? { ...item, quantity } : item))
        saveCart(updatedItems)
        return updatedItems
      })
    },
    [removeItem],
  )

  const clearCart = useCallback(() => {
    setItems([])
    localStorage.removeItem(CART_STORAGE_KEY)
  }, [])

  const isInCart = useCallback(
    (id: string) => {
      return items.some((item) => item.id === id)
    },
    [items],
  )

  return {
    items,
    itemCount,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
  }
}
