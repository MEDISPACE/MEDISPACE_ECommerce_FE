import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react'
import { toast } from 'sonner'

// Define the shape of the context state
interface WishlistContextState {
  wishlist: string[]
  toggleWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  wishlistCount: number
}

// Create the context with a default undefined value
const WishlistContext = createContext<WishlistContextState | undefined>(undefined)

// Create a custom hook for easy access to the context
export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}

// Create the provider component
interface WishlistProviderProps {
  children: ReactNode
}

export const WishlistProvider = ({ children }: WishlistProviderProps) => {
  const [wishlist, setWishlist] = useState<string[]>(() => {
    // Initialize state from localStorage (only on client side)
    try {
      if (typeof window !== 'undefined') {
        const storedWishlist = window.localStorage.getItem('wishlist')
        return storedWishlist ? JSON.parse(storedWishlist) : []
      }
      return []
    } catch (error) {
      console.error('Failed to parse wishlist from localStorage', error)
      return []
    }
  })

  // Persist state to localStorage whenever it changes (only on client side)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('wishlist', JSON.stringify(wishlist))
      }
    } catch (error) {
      console.error('Failed to save wishlist to localStorage', error)
    }
  }, [wishlist])

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prevWishlist) => {
      const isInWishlist = prevWishlist.includes(productId)
      if (isInWishlist) {
        toast.info('Đã xóa sản phẩm khỏi danh sách yêu thích')
        return prevWishlist.filter((id) => id !== productId)
      } else {
        toast.success('Đã thêm sản phẩm vào danh sách yêu thích')
        return [...prevWishlist, productId]
      }
    })
  }, [])

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlist.includes(productId)
    },
    [wishlist],
  )

  const value = {
    wishlist,
    toggleWishlist,
    isInWishlist,
    wishlistCount: wishlist.length,
  }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
