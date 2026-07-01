// Constants matching backend enums
export enum TokenType {
  AccessToken = 0,
  RefreshToken = 1,
  ForgotPasswordToken = 2,
  EmailVerifyToken = 3,
}

export enum MediaType {
  Image = 0,
  Video = 1,
}

export enum UserRole {
  Customer = 0,
  Pharmacist = 1,
  Admin = 2,
}

export enum UserStatus {
  Unverified = 0,
  Verified = 1,
  Banned = 2,
}

export enum UserGender {
  Male = 0,
  Female = 1,
}

// Product status constants
export const ProductStatus = {
  ACTIVE: 'active',
  DISCONTINUED: 'discontinued',
  OUT_OF_STOCK: 'out_of_stock',
} as const

export type ProductStatusType = (typeof ProductStatus)[keyof typeof ProductStatus]

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/users/login',
    REGISTER: '/users/register',
    LOGOUT: '/users/logout',
    REFRESH_TOKEN: '/users/refresh-token',
    FORGOT_PASSWORD: '/users/forgot-password',
    RESET_PASSWORD: '/users/reset-password',
    VERIFY_EMAIL: '/users/verify-email',
    RESEND_VERIFY_EMAIL: '/users/resend-verify-email',
    VERIFY_FORGOT_PASSWORD: '/users/verify-forgot-password',
  },

  // User endpoints
  USERS: {
    ME: '/users/me',
    UPDATE_ME: '/users/me',
    CHANGE_PASSWORD: '/users/change-password',
    WISHLIST: '/users/wishlist',
    WISHLIST_ITEM: (productId: string) => `/users/wishlist/${productId}`,
  },

  // Address endpoints
  ADDRESSES: {
    BASE: '/addresses',
    BY_ID: (id: string) => `/addresses/${id}`,
    SET_DEFAULT: (id: string) => `/addresses/${id}/default`,
  },

  // Product endpoints
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
    BY_SLUG: (slug: string) => `/products/${slug}`,
  },

  // Category endpoints
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id: string) => `/categories/${id}`,
    BY_SLUG: (slug: string) => `/categories/slug/${slug}`,
  },

  // Brand endpoints
  BRANDS: {
    BASE: '/brands',
    BY_ID: (id: string) => `/brands/${id}`,
    BY_SLUG: (slug: string) => `/brands/slug/${slug}`,
  },

  // Order endpoints (TODO: Update when backend implements orders API)
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
    PAYMENT_URL: (id: string) => `/orders/${id}/payment-url`,
  },

  // Cart endpoints
  CART: {
    GET: '/cart',
    ADD_ITEM: '/cart/add',
    UPDATE_ITEM: (productId: string) => `/cart/update/${productId}`,
    UPDATE_ITEM_UNIT: (productId: string) => `/cart/update-unit/${productId}`,
    REMOVE_ITEM: (productId: string) => `/cart/remove/${productId}`,
    CLEAR: '/cart/clear',
    CHECKOUT: '/cart/checkout',
  },

  // Review endpoints
  REVIEWS: {
    BASE: '/reviews',
    BY_PRODUCT: (productId: string) => `/reviews/product/${productId}`,
    STATS: (productId: string) => `/reviews/product/${productId}/stats`,
    USER: '/reviews/user',
    BY_ID: (reviewId: string) => `/reviews/${reviewId}`,
    HELPFUL: (reviewId: string) => `/reviews/${reviewId}/helpful`,
    MODERATE: (reviewId: string) => `/reviews/${reviewId}/moderate`,
  },

  // Prescription endpoints
  PRESCRIPTIONS: {
    BASE: '/prescriptions',
    PHARMACIST: '/prescriptions/pharmacist',
    PENDING: '/prescriptions/pending',
    STATS: '/prescriptions/stats',
    BY_ID: (id: string) => `/prescriptions/${id}`,
    VERIFY: (id: string) => `/prescriptions/${id}/verify`,
  },

  // Admin endpoints
  ADMIN: {
    USERS: '/admin/users',
  },
} as const

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'Registration successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REFRESH_TOKEN_SUCCESS: 'Token refreshed successfully',
  FORGOT_PASSWORD_SUCCESS: 'Password reset email sent',
  RESET_PASSWORD_SUCCESS: 'Password reset successful',
  VERIFY_EMAIL_SUCCESS: 'Email verified successfully',
  RESEND_EMAIL_SUCCESS: 'Verification email sent successfully',
  UPDATE_PROFILE_SUCCESS: 'Profile updated successfully',
  CHANGE_PASSWORD_SUCCESS: 'Password changed successfully',
} as const

// Error messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  INVALID_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  NETWORK_ERROR: 'Network error occurred',
} as const
