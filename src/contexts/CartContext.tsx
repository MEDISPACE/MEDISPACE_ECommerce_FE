import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { ShoppingCart, Heart, Package, AlertCircle, CheckCircle } from 'lucide-react'
import { cartService } from '../services/cartService'
import type { Cart, AddToCartRequest, UpdateCartItemRequest } from '../types/cart'
import type { Product } from '../types/product'

// Cart state interface - combines backend data with UI state
interface CartState {
  cart: Cart | null
  selectedItems: Set<string> // productIds that are selected for checkout
  wishlist: Set<string>
  isLoading: boolean
}

// Cart actions
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART'; payload: Cart | null }
  | { type: 'ADD_TO_CART_SUCCESS'; payload: Cart }
  | { type: 'UPDATE_QUANTITY_SUCCESS'; payload: Cart }
  | { type: 'REMOVE_FROM_CART_SUCCESS'; payload: Cart }
  | { type: 'CLEAR_CART_SUCCESS'; payload: Cart }
  | { type: 'TOGGLE_ITEM_SELECTION'; payload: string }
  | { type: 'SELECT_ALL_ITEMS'; payload: boolean }
  | { type: 'ADD_TO_WISHLIST'; payload: string }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: string }
  | { type: 'LOAD_WISHLIST_FROM_STORAGE'; payload: string[] }

// Initial state
const initialState: CartState = {
  cart: null,
  selectedItems: new Set(),
  wishlist: new Set(),
  isLoading: false,
}

// Cart reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_CART':
      return { ...state, cart: action.payload }

    case 'ADD_TO_CART_SUCCESS':
      return { ...state, cart: action.payload }

    case 'UPDATE_QUANTITY_SUCCESS':
      return { ...state, cart: action.payload }

    case 'REMOVE_FROM_CART_SUCCESS':
      return { ...state, cart: action.payload }

    case 'CLEAR_CART_SUCCESS':
      return { ...state, cart: action.payload }

    case 'TOGGLE_ITEM_SELECTION': {
      const newSelected = new Set(state.selectedItems)
      if (newSelected.has(action.payload)) {
        newSelected.delete(action.payload)
      } else {
        newSelected.add(action.payload)
      }
      return { ...state, selectedItems: newSelected }
    }

    case 'SELECT_ALL_ITEMS': {
      if (action.payload && state.cart) {
        const allProductIds = state.cart.items.map((item) => item.productId)
        return { ...state, selectedItems: new Set(allProductIds) }
      } else {
        return { ...state, selectedItems: new Set() }
      }
    }

    case 'ADD_TO_WISHLIST':
      return {
        ...state,
        wishlist: new Set([...state.wishlist, action.payload]),
      }

    case 'REMOVE_FROM_WISHLIST': {
      const newWishlist = new Set(state.wishlist)
      newWishlist.delete(action.payload)
      return {
        ...state,
        wishlist: newWishlist,
      }
    }

    case 'LOAD_WISHLIST_FROM_STORAGE':
      return {
        ...state,
        wishlist: new Set(action.payload),
      }

    default:
      return state
  }
}

// Cart context interface
interface CartContextType {
  state: CartState
  addToCart: (product: Product, quantity?: number) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  clearCart: () => Promise<void>
  toggleItemSelection: (productId: string) => void
  selectAllItems: (selected: boolean) => void
  toggleWishlist: (productId: string, productName: string) => boolean
  isInWishlist: (productId: string) => boolean
  getCartItemsCount: () => number
  getSelectedItemsCount: () => number
  getSelectedItemsTotal: () => number
  moveToWishlist: (productId: string, productName: string) => void
  buyNow: (product: Product, quantity?: number) => void
  showPrescriptionWarning: (productName: string) => void
  showOutOfStockWarning: (productName: string) => void
  showOrderCreatedSuccess: (orderId: string) => void
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined)

// Cart provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart data from API on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        const cart = await cartService.getCart()
        dispatch({ type: 'SET_CART', payload: cart })
        // Auto-select all items
        if (cart && cart.items.length > 0) {
          dispatch({ type: 'SELECT_ALL_ITEMS', payload: true })
        }
      } catch (error) {
        // For guest users, API will create empty cart
        dispatch({ type: 'SET_CART', payload: null })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    loadCart()
  }, [])

  // Load wishlist from localStorage
  useEffect(() => {
    const savedWishlist = localStorage.getItem('medispace_wishlist')
    if (savedWishlist) {
      try {
        const wishlistData = JSON.parse(savedWishlist)
        dispatch({ type: 'LOAD_WISHLIST_FROM_STORAGE', payload: wishlistData })
      } catch (error) {
      }
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('medispace_wishlist', JSON.stringify([...state.wishlist]))
  }, [state.wishlist])

  // Cart actions
  const addToCart = async (product: Product, quantity: number = 1) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const request: AddToCartRequest = {
        productId: product._id,
        quantity,
      }
      const updatedCart = await cartService.addToCart(request)
      dispatch({ type: 'ADD_TO_CART_SUCCESS', payload: updatedCart })

      // Auto-select the new item
      dispatch({ type: 'TOGGLE_ITEM_SELECTION', payload: product._id })

      toast.success('Đã thêm vào giỏ hàng', {
        description: `"${product.name}" (x${quantity})`,
        duration: 3000,
        icon: <ShoppingCart className='w-5 h-5 text-blue-600' />,
        action: {
          label: 'Xem giỏ hàng',
          onClick: () => (window.location.href = '/cart'),
        },
      })
    } catch (error) {
      const axiosError = error as any
      const errorMessage = axiosError?.response?.data?.message || 'Vui lòng thử lại sau.'

      toast.error('Không thể thêm vào giỏ hàng', {
        description: errorMessage,
        duration: 3000,
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const request: UpdateCartItemRequest = { quantity }
      const updatedCart = await cartService.updateCartItem(productId, request)
      dispatch({ type: 'UPDATE_QUANTITY_SUCCESS', payload: updatedCart })
    } catch (error) {
      toast.error('Không thể cập nhật số lượng', {
        description: 'Vui lòng thử lại sau.',
        duration: 3000,
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const removeFromCart = async (productId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const updatedCart = await cartService.removeFromCart(productId)
      dispatch({ type: 'REMOVE_FROM_CART_SUCCESS', payload: updatedCart })
      // Remove from selected items
      dispatch({ type: 'TOGGLE_ITEM_SELECTION', payload: productId })
    } catch (error) {
      toast.error('Không thể xóa sản phẩm', {
        description: 'Vui lòng thử lại sau.',
        duration: 3000,
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const clearCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const updatedCart = await cartService.clearCart()
      dispatch({ type: 'CLEAR_CART_SUCCESS', payload: updatedCart })
      dispatch({ type: 'SELECT_ALL_ITEMS', payload: false })
    } catch (error) {
      toast.error('Không thể xóa giỏ hàng', {
        description: 'Vui lòng thử lại sau.',
        duration: 3000,
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const toggleItemSelection = (productId: string) => {
    dispatch({ type: 'TOGGLE_ITEM_SELECTION', payload: productId })
  }

  const selectAllItems = (selected: boolean) => {
    dispatch({ type: 'SELECT_ALL_ITEMS', payload: selected })
  }

  const toggleWishlist = (productId: string, productName: string): boolean => {
    const isInWishlist = state.wishlist.has(productId)

    if (isInWishlist) {
      dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: productId })
      toast.info('Đã xóa khỏi yêu thích', {
        description: `"${productName}"`,
        duration: 2500,
        icon: <Heart className='w-5 h-5 text-gray-400' />,
      })
      return false
    } else {
      dispatch({ type: 'ADD_TO_WISHLIST', payload: productId })
      toast.success('Đã thêm vào yêu thích', {
        description: `"${productName}"`,
        duration: 2500,
        icon: <Heart className='w-5 h-5 text-red-500 fill-red-500' />,
        action: {
          label: 'Xem danh sách',
          onClick: () => (window.location.href = '/account/wishlist'),
        },
      })
      return true
    }
  }

  const isInWishlist = (productId: string): boolean => {
    return state.wishlist.has(productId)
  }

  const getCartItemsCount = (): number => {
    return state.cart?.itemCount || 0
  }

  const getSelectedItemsCount = (): number => {
    return state.selectedItems.size
  }

  const getSelectedItemsTotal = (): number => {
    if (!state.cart) return 0
    return state.cart.items
      .filter((item) => state.selectedItems.has(item.productId))
      .reduce((total, item) => total + item.totalPrice, 0)
  }

  const moveToWishlist = (productId: string, productName: string) => {
    // Remove from cart
    removeFromCart(productId)

    // Add to wishlist
    dispatch({ type: 'ADD_TO_WISHLIST', payload: productId })

    toast.info('Đã chuyển sang yêu thích', {
      description: `"${productName}" đã được chuyển từ giỏ hàng sang danh sách yêu thích`,
      duration: 3000,
      icon: <Heart className='w-5 h-5 text-red-500 fill-red-500' />,
      action: {
        label: 'Hoàn tác',
        onClick: () => {
          // Undo: remove from wishlist, add back to cart
          dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: productId })
          // Note: We can't easily add back to cart without product data
          toast.success('Đã hoàn tác', {
            description: `"${productName}" đã được xóa khỏi yêu thích`,
            duration: 2000,
          })
        },
      },
    })
  }

  const buyNow = (product: Product, quantity: number = 1) => {
    // Add to cart first
    addToCart(product, quantity)

    // Small delay to show toast, then redirect
    setTimeout(() => {
      window.location.href = '/cart/checkout'
    }, 1000)
  }

  const showPrescriptionWarning = (productName: string) => {
    toast.warning('Cần kê đơn thuốc', {
      description: `"${productName}" yêu cầu đơn thuốc từ bác sĩ. Vui lòng tải lên đơn thuốc hoặc tư vấn dược sĩ.`,
      duration: 5000,
      icon: <AlertCircle className='w-5 h-5 text-orange-600' />,
      action: {
        label: 'Tư vấn ngay',
        onClick: () => (window.location.href = '/consultation/chat'),
      },
    })
  }

  const showOutOfStockWarning = (productName: string) => {
    toast.error('Sản phẩm hết hàng', {
      description: `"${productName}" tạm thời hết hàng. Chúng tôi sẽ thông báo khi có hàng trở lại.`,
      duration: 4000,
      icon: <Package className='w-5 h-5 text-red-600' />,
      action: {
        label: 'Nhận thông báo',
        onClick: () => {
          toast.success('Đã đăng ký nhận thông báo', {
            description: 'Chúng tôi sẽ email cho bạn khi sản phẩm có hàng trở lại',
            duration: 3000,
            icon: <CheckCircle className='w-5 h-5 text-green-600' />,
          })
        },
      },
    })
  }

  const showOrderCreatedSuccess = (orderId: string) => {
    toast.success('Đơn hàng đã được tạo', {
      description: `Mã đơn hàng: ${orderId}`,
      duration: 5000,
      icon: <CheckCircle className='w-5 h-5 text-green-600' />,
      action: {
        label: 'Xem đơn hàng',
        onClick: () => (window.location.href = `/account/orders/${orderId}`),
      },
    })
  }

  const value: CartContextType = {
    state,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleItemSelection,
    selectAllItems,
    toggleWishlist,
    isInWishlist,
    getCartItemsCount,
    getSelectedItemsCount,
    getSelectedItemsTotal,
    moveToWishlist,
    buyNow,
    showPrescriptionWarning,
    showOutOfStockWarning,
    showOrderCreatedSuccess,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
