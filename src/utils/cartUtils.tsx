import { toast } from 'sonner'
import { ShoppingCart, Heart, Package, AlertCircle, CheckCircle } from 'lucide-react'

// Re-export from CartContext for backward compatibility
// These functions will be replaced by CartContext hooks
export { useCart } from '../contexts/CartContext'

// Legacy functions - these will be deprecated
let cart: Array<{ id: string; quantity: number }> = []
const wishlist: Set<string> = new Set()

/**
 * LEGACY: Add product to cart (will be removed)
 * Use useCart().addToCart() instead
 */
export function addToCart(productId: string, productName: string, quantity: number = 1) {
  const existingItem = cart.find((item) => item.id === productId)

  if (existingItem) {
    existingItem.quantity += quantity
    toast.success('Đã cập nhật giỏ hàng', {
      description: `Tăng số lượng "${productName}" lên ${existingItem.quantity}`,
      duration: 3000,
      icon: <ShoppingCart className='w-5 h-5 text-blue-600' />,
    })
  } else {
    cart.push({ id: productId, quantity })
    toast.success('Đã thêm vào giỏ hàng', {
      description: `"${productName}" (x${quantity})`,
      duration: 3000,
      icon: <ShoppingCart className='w-5 h-5 text-blue-600' />,
      action: {
        label: 'Xem giỏ hàng',
        onClick: () => (window.location.href = '/cart'),
      },
    })
  }

  return cart
}

/**
 * LEGACY: Toggle wishlist (will be removed)
 * Use useCart().toggleWishlist() instead
 */
export function toggleWishlist(productId: string, productName: string): boolean {
  const isInWishlist = wishlist.has(productId)

  if (isInWishlist) {
    wishlist.delete(productId)
    toast.info('Đã xóa khỏi yêu thích', {
      description: `"${productName}"`,
      duration: 2500,
      icon: <Heart className='w-5 h-5 text-gray-400' />,
    })
    return false
  } else {
    wishlist.add(productId)
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

/**
 * LEGACY: Buy now - quick checkout (will be removed)
 * Use useCart().buyNow() instead
 */
export function buyNow(productId: string, productName: string, quantity: number = 1) {
  // Add to cart first
  addToCart(productId, productName, quantity)

  // Small delay to show toast, then redirect
  setTimeout(() => {
    window.location.href = '/cart/checkout'
  }, 1000)
}

/**
 * LEGACY: Check if product is in wishlist (will be removed)
 * Use useCart().isInWishlist() instead
 */
export function isInWishlist(productId: string): boolean {
  return wishlist.has(productId)
}

/**
 * LEGACY: Get cart items count (will be removed)
 * Use useCart().getCartItemsCount() instead
 */
export function getCartItemsCount(): number {
  return cart.reduce((total, item) => total + item.quantity, 0)
}

/**
 * LEGACY: Move item from cart to wishlist (will be removed)
 * Use useCart().moveToWishlist() instead
 */
export function moveToWishlist(productId: string, productName: string) {
  // Remove from cart
  cart = cart.filter((item) => item.id !== productId)

  // Add to wishlist
  wishlist.add(productId)

  toast.info('Đã chuyển sang yêu thích', {
    description: `"${productName}" đã được chuyển từ giỏ hàng sang danh sách yêu thích`,
    duration: 3000,
    icon: <Heart className='w-5 h-5 text-red-500 fill-red-500' />,
    action: {
      label: 'Hoàn tác',
      onClick: () => {
        // Undo: remove from wishlist, add back to cart
        wishlist.delete(productId)
        cart.push({ id: productId, quantity: 1 })
        toast.success('Đã hoàn tác', {
          description: `"${productName}" đã được chuyển lại giỏ hàng`,
          duration: 2000,
        })
      },
    },
  })
}

/**
 * Show prescription required warning
 */
export function showPrescriptionWarning(productName: string) {
  toast.warning('Cần kê đơn thuốc', {
    description: `"${productName}" yêu cầu đơn thuốc từ bác sĩ. Vui lòng tải lên đơn thuốc hoặc tư vấn dược sĩ.`,
    duration: 3000,
    icon: <AlertCircle className='w-5 h-5 text-orange-600' />,
    action: {
      label: 'Tư vấn ngay',
      onClick: () => (window.location.href = '/contact'),
    },
  })
}

/**
 * Show out of stock warning
 */
export function showOutOfStockWarning(productName: string) {
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

/**
 * Show order created success
 */
export function showOrderCreatedSuccess(orderId: string) {
  toast.success('Đơn hàng đã được tạo', {
    description: `Mã đơn hàng: ${orderId}`,
    duration: 3000,
    icon: <CheckCircle className='w-5 h-5 text-green-600' />,
    action: {
      label: 'Xem đơn hàng',
      onClick: () => (window.location.href = `/account/orders/${orderId}`),
    },
  })
}
