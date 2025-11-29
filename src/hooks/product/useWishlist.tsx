import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react'
import { toast } from 'sonner'
import { AuthContext } from '../../contexts/AuthContext'
import { wishlistService } from '../../services/wishlistService'

// Define the shape of the context state
interface WishlistContextState {
  wishlist: string[]
  toggleWishlist: (productId: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
  wishlistCount: number
  loading: boolean
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
  // Use AuthContext directly - if not available, default to unauthenticated
  const authContext = useContext(AuthContext)
  const isAuthenticated = authContext?.isAuthenticated ?? false

  const [wishlist, setWishlist] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Load wishlist on mount and when auth state changes
  useEffect(() => {
    const loadWishlist = async () => {
      if (isAuthenticated) {
        try {
          setLoading(true)
          const items = await wishlistService.getWishlist()
          // Map Product[] to string[] (product IDs)
          setWishlist(items.map(product => product._id || product.id).filter((id): id is string => !!id))
        } catch (error) {
          console.error('Failed to load wishlist from API', error)
        } finally {
          setLoading(false)
        }
      } else {
        setWishlist([])
      }
    }

    loadWishlist()
  }, [isAuthenticated])

  const toggleWishlist = useCallback(async (productId: string) => {
    if (!isAuthenticated) {
      toast.error('Bạn cần phải đăng nhập để thêm sản phẩm vào danh sách yêu thích')
      return
    }

    const isIn = wishlist.includes(productId)

    try {
      if (isIn) {
        await wishlistService.removeFromWishlist(productId)
        setWishlist(prev => prev.filter(id => id !== productId))
        toast.info('Đã xóa sản phẩm khỏi danh sách yêu thích')
      } else {
        await wishlistService.addToWishlist(productId)
        setWishlist(prev => [...prev, productId])
        toast.success('Đã thêm sản phẩm vào danh sách yêu thích')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật danh sách yêu thích')
    }
  }, [wishlist, isAuthenticated])

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
    loading
  }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
