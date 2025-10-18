/**
 * MEDISPACE Environment Configuration
 * Controls which APIs use mock data vs real backend
 */

// Auth - Always use real backend (available)
export const USE_REAL_AUTH = true

// Features using mock data (until BE is ready)
export const USE_MOCK_PRODUCTS = false // Changed to false - use real API
export const USE_MOCK_CATEGORIES = false // Changed to false - use real API
export const USE_MOCK_CART = true
export const USE_MOCK_ORDERS = true
export const USE_MOCK_SEARCH = true
export const USE_MOCK_REVIEWS = true

// API Base URLs
export const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3001/api/auth'
export const MAIN_API_URL = import.meta.env.VITE_MAIN_API_URL || 'http://localhost:3001/api'

// Mock Data Configuration
export const MOCK_CONFIG = {
  // Simulate API delays for realistic testing
  SIMULATE_DELAY: true,
  MIN_DELAY: 300,
  MAX_DELAY: 800,

  // Error simulation for testing
  SIMULATE_ERRORS: false,
  ERROR_RATE: 0.1, // 10% chance of error
} as const

// Feature Flags
export const FEATURES = {
  ENABLE_PRESCRIPTION_CHECK: true,
  ENABLE_DRUG_INTERACTION: false, // Not implemented yet
  ENABLE_PHARMACY_LOCATOR: false, // Not implemented yet
  ENABLE_TELEMEDICINE: false, // Future feature
} as const

export default {
  USE_REAL_AUTH,
  USE_MOCK_PRODUCTS,
  USE_MOCK_CATEGORIES,
  USE_MOCK_CART,
  USE_MOCK_ORDERS,
  USE_MOCK_SEARCH,
  USE_MOCK_REVIEWS,
  AUTH_API_URL,
  MAIN_API_URL,
  MOCK_CONFIG,
  FEATURES,
}
