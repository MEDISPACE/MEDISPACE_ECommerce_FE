/**
 * MEDISPACE Environment Configuration
 * All APIs now use real backend implementations
 */

// Auth - Always use real backend (available)
export const USE_REAL_AUTH = true

// API Base URLs
export const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3001/api/auth'
export const MAIN_API_URL = import.meta.env.VITE_MAIN_API_URL || 'http://localhost:3001/api'

// Feature Flags
export const FEATURES = {
  ENABLE_PRESCRIPTION_CHECK: true,
  ENABLE_DRUG_INTERACTION: false, // Not implemented yet
  ENABLE_PHARMACY_LOCATOR: false, // Not implemented yet
  ENABLE_TELEMEDICINE: false, // Future feature
} as const

export default {
  USE_REAL_AUTH,
  AUTH_API_URL,
  MAIN_API_URL,
  FEATURES,
}
