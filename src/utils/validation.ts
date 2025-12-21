// Validation utilities for MEDISPACE forms

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  firstError?: string
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  // Vietnamese phone number format
  const phoneRegex = /^(\+84|0)(3|5|7|8|9)[0-9]{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Mật khẩu phải có ít nhất 1 chữ thường' }
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Mật khẩu phải có ít nhất 1 chữ hoa' }
  }
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Mật khẩu phải có ít nhất 1 số' }
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return { isValid: false, message: 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (@$!%*?&)' }
  }
  return { isValid: true }
}

export const validateLoginForm = (formData: { email: string; password: string }): ValidationResult => {
  const errors: string[] = []

  // Check empty fields
  if (!formData.email.trim()) {
    errors.push('Vui lòng nhập email')
  }
  if (!formData.password.trim()) {
    errors.push('Vui lòng nhập mật khẩu')
  }

  // Validate email format
  if (formData.email.trim() && !validateEmail(formData.email)) {
    errors.push('Email không đúng định dạng')
  }

  return {
    isValid: errors.length === 0,
    errors,
    firstError: errors[0],
  }
}

export const validateRegisterForm = (formData: {
  firstName: string
  lastName: string
  gender: string
  phone: string
  email: string
  password: string
  confirmPassword: string
}): ValidationResult => {
  const errors: string[] = []

  // Check empty fields
  if (!formData.firstName.trim()) {
    errors.push('Vui lòng nhập họ')
  }
  if (!formData.lastName.trim()) {
    errors.push('Vui lòng nhập tên')
  }
  if (!formData.gender) {
    errors.push('Vui lòng chọn giới tính')
  }
  if (!formData.phone.trim()) {
    errors.push('Vui lòng nhập số điện thoại')
  }
  if (!formData.email.trim()) {
    errors.push('Vui lòng nhập email')
  }
  if (!formData.password.trim()) {
    errors.push('Vui lòng nhập mật khẩu')
  }
  if (!formData.confirmPassword.trim()) {
    errors.push('Vui lòng xác nhận mật khẩu')
  }

  // Validate formats
  if (formData.email.trim() && !validateEmail(formData.email)) {
    errors.push('Email không đúng định dạng')
  }

  if (formData.phone.trim() && !validatePhone(formData.phone)) {
    errors.push('Số điện thoại không đúng định dạng')
  }

  // Validate password
  if (formData.password.trim()) {
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid && passwordValidation.message) {
      errors.push(passwordValidation.message)
    }
  }

  // Check password match
  if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
    errors.push('Mật khẩu xác nhận không khớp')
  }

  return {
    isValid: errors.length === 0,
    errors,
    firstError: errors[0],
  }
}

export const validateForgotPasswordForm = (formData: { email: string }): ValidationResult => {
  const errors: string[] = []

  if (!formData.email.trim()) {
    errors.push('Vui lòng nhập email')
  }

  if (formData.email.trim() && !validateEmail(formData.email)) {
    errors.push('Email không đúng định dạng')
  }

  return {
    isValid: errors.length === 0,
    errors,
    firstError: errors[0],
  }
}
