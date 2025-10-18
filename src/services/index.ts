/**
 * MEDISPACE SERVICES - Central Export
 *
 * All services for data fetching and API calls
 */

// Import all services
import { productService } from './productService'
import { categoryService } from './categoryService'
import { brandService } from './brandService'
import { orderService } from './orderService'
// import { reviewService } from './reviewService'
import { cartService } from './cartService'

// Re-export services
export { productService } from './productService'
export { categoryService } from './categoryService'
export { brandService } from './brandService'
export { orderService } from './orderService'
// export { reviewService } from './reviewService'
export { cartService } from './cartService'

// Import existing services if they exist
export * from './apiClient'

// Re-export for convenience
export { default as productServiceDefault } from './productService'
export { default as categoryServiceDefault } from './categoryService'
export { default as brandServiceDefault } from './brandService'
export { default as orderServiceDefault } from './orderService'
// export { default as reviewServiceDefault } from './reviewService'
export { default as cartServiceDefault } from './cartService'

/**
 * Service Registry - Easy access to all services
 */
export const services = {
  products: productService,
  categories: categoryService,
  brands: brandService,
  orders: orderService,
  // reviews: reviewService,
  cart: cartService,
}

export default services
