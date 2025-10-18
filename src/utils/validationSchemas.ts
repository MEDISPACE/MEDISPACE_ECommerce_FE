/**
 * MEDISPACE VALIDATION SCHEMAS
 *
 * Centralized validation logic to avoid duplication across forms
 * Can be used with react-hook-form, formik, or standalone
 */

/**
 * Common regex patterns
 */
export const REGEX_PATTERNS = {
  // Vietnamese phone number: 10 digits starting with 0
  phoneVN: /^0[0-9]{9}$/,

  // Email
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
  passwordStrong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,

  // Vietnamese national ID (CCCD): 12 digits
  nationalId: /^[0-9]{12}$/,

  // License number (pharmacist): format varies
  license: /^[A-Z0-9]{6,20}$/,

  // Product SKU
  sku: /^[A-Z0-9-]{4,20}$/,

  // Slug: lowercase, numbers, hyphens only
  slug: /^[a-z0-9-]+$/,

  // Vietnamese characters with diacritics
  vietnameseName: /^[a-zA-ZÀ-ỹ\s]+$/,
} as const

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
  required: 'Vui lòng điền thông tin này',
  email: 'Email không hợp lệ',
  phone: 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)',
  passwordWeak: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số',
  passwordMismatch: 'Mật khẩu xác nhận không khớp',
  minLength: (min: number) => `Tối thiểu ${min} ký tự`,
  maxLength: (max: number) => `Tối đa ${max} ký tự`,
  min: (min: number) => `Giá trị tối thiểu là ${min}`,
  max: (max: number) => `Giá trị tối đa là ${max}`,
  nationalId: 'CCCD phải có 12 số',
  license: 'Số chứng chỉ hành nghề không hợp lệ',
  sku: 'Mã SKU không hợp lệ (4-20 ký tự, chữ hoa, số, dấu gạch ngang)',
  slug: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang',
  url: 'URL không hợp lệ',
  positiveNumber: 'Giá trị phải là số dương',
  integer: 'Giá trị phải là số nguyên',
} as const

/**
 * Field Validators - Reusable validation functions
 */
export const validators = {
  /**
   * Required field
   */
  required: (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return ERROR_MESSAGES.required
    }
    if (typeof value === 'string' && value.trim() === '') {
      return ERROR_MESSAGES.required
    }
    return true
  },

  /**
   * Email validation
   */
  email: (value: string) => {
    if (!value) return true // Allow empty if not required
    if (!REGEX_PATTERNS.email.test(value)) {
      return ERROR_MESSAGES.email
    }
    return true
  },

  /**
   * Vietnamese phone number
   */
  phoneVN: (value: string) => {
    if (!value) return true
    if (!REGEX_PATTERNS.phoneVN.test(value)) {
      return ERROR_MESSAGES.phone
    }
    return true
  },

  /**
   * Strong password
   */
  password: (value: string) => {
    if (!value) return true
    if (!REGEX_PATTERNS.passwordStrong.test(value)) {
      return ERROR_MESSAGES.passwordWeak
    }
    return true
  },

  /**
   * Password confirmation
   */
  passwordConfirm: (value: string, passwordValue: string) => {
    if (value !== passwordValue) {
      return ERROR_MESSAGES.passwordMismatch
    }
    return true
  },

  /**
   * Min length
   */
  minLength: (min: number) => (value: string) => {
    if (!value) return true
    if (value.length < min) {
      return ERROR_MESSAGES.minLength(min)
    }
    return true
  },

  /**
   * Max length
   */
  maxLength: (max: number) => (value: string) => {
    if (!value) return true
    if (value.length > max) {
      return ERROR_MESSAGES.maxLength(max)
    }
    return true
  },

  /**
   * National ID (CCCD)
   */
  nationalId: (value: string) => {
    if (!value) return true
    if (!REGEX_PATTERNS.nationalId.test(value)) {
      return ERROR_MESSAGES.nationalId
    }
    return true
  },

  /**
   * License number
   */
  license: (value: string) => {
    if (!value) return true
    if (!REGEX_PATTERNS.license.test(value)) {
      return ERROR_MESSAGES.license
    }
    return true
  },

  /**
   * Product SKU
   */
  sku: (value: string) => {
    if (!value) return true
    if (!REGEX_PATTERNS.sku.test(value)) {
      return ERROR_MESSAGES.sku
    }
    return true
  },

  /**
   * Slug
   */
  slug: (value: string) => {
    if (!value) return true
    if (!REGEX_PATTERNS.slug.test(value)) {
      return ERROR_MESSAGES.slug
    }
    return true
  },

  /**
   * URL
   */
  url: (value: string) => {
    if (!value) return true
    try {
      new URL(value)
      return true
    } catch {
      return ERROR_MESSAGES.url
    }
  },

  /**
   * Positive number
   */
  positiveNumber: (value: number) => {
    if (value === null || value === undefined) return true
    if (value <= 0) {
      return ERROR_MESSAGES.positiveNumber
    }
    return true
  },

  /**
   * Integer
   */
  integer: (value: number) => {
    if (value === null || value === undefined) return true
    if (!Number.isInteger(value)) {
      return ERROR_MESSAGES.integer
    }
    return true
  },

  /**
   * Min value
   */
  min: (min: number) => (value: number) => {
    if (value === null || value === undefined) return true
    if (value < min) {
      return ERROR_MESSAGES.min(min)
    }
    return true
  },

  /**
   * Max value
   */
  max: (max: number) => (value: number) => {
    if (value === null || value === undefined) return true
    if (value > max) {
      return ERROR_MESSAGES.max(max)
    }
    return true
  },
}

/**
 * Common field validation configs
 * Use with EntityFormFields or react-hook-form
 */
export const fieldValidations = {
  // User fields
  email: {
    required: validators.required,
    pattern: validators.email,
  },
  phone: {
    required: validators.required,
    pattern: validators.phoneVN,
  },
  password: {
    required: validators.required,
    pattern: validators.password,
  },
  name: {
    required: validators.required,
    minLength: validators.minLength(2),
    maxLength: validators.maxLength(100),
  },

  // Product fields
  productName: {
    required: validators.required,
    minLength: validators.minLength(3),
    maxLength: validators.maxLength(200),
  },
  sku: {
    required: validators.required,
    pattern: validators.sku,
  },
  slug: {
    required: validators.required,
    pattern: validators.slug,
  },
  price: {
    required: validators.required,
    min: validators.min(0),
  },
  stock: {
    required: validators.required,
    min: validators.min(0),
    integer: validators.integer,
  },

  // Pharmacist fields
  licenseNumber: {
    required: validators.required,
    pattern: validators.license,
  },
  nationalId: {
    pattern: validators.nationalId,
  },

  // Address fields
  address: {
    required: validators.required,
    minLength: validators.minLength(10),
    maxLength: validators.maxLength(500),
  },

  // URL fields
  url: {
    pattern: validators.url,
  },
} as const

/**
 * Validation helper for form submission
 */
export function validateForm<T extends Record<string, unknown>>(
  data: T,
  rules: Record<keyof T, Record<string, (value: unknown) => true | string>>,
): { valid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {}

  for (const field in rules) {
    const fieldRules = rules[field]
    const value = data[field]

    for (const ruleName in fieldRules) {
      const rule = fieldRules[ruleName]
      const result = rule(value)

      if (result !== true) {
        errors[field] = result
        break // Stop at first error for this field
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Quick validation helpers for common use cases
 */
export const quickValidate = {
  isEmail: (email: string) => REGEX_PATTERNS.email.test(email),
  isPhoneVN: (phone: string) => REGEX_PATTERNS.phoneVN.test(phone),
  isStrongPassword: (password: string) => REGEX_PATTERNS.passwordStrong.test(password),
  isSlug: (slug: string) => REGEX_PATTERNS.slug.test(slug),
  isUrl: (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },
}
