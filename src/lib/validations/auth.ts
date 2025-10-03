// Validation schemas for authentication using Zod
import { z } from 'zod'

// Login validation
export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu').min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

// Register validation
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'Vui lòng nhập họ')
      .min(2, 'Họ phải có ít nhất 2 ký tự')
      .max(50, 'Họ không được quá 50 ký tự'),
    lastName: z
      .string()
      .min(1, 'Vui lòng nhập tên')
      .min(2, 'Tên phải có ít nhất 2 ký tự')
      .max(50, 'Tên không được quá 50 ký tự'),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
    password: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .regex(/(?=.*[a-z])/, 'Mật khẩu phải có ít nhất 1 chữ thường')
      .regex(/(?=.*[A-Z])/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
      .regex(/(?=.*\d)/, 'Mật khẩu phải có ít nhất 1 số')
      .regex(/(?=.*[@$!%*?&])/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'),
    confirm_password: z.string(),
    phoneNumber: z
      .string()
      .optional()
      .refine((val) => !val || /^(\+84|0)(3|5|7|8|9)[0-9]{8}$/.test(val.replace(/\s/g, '')), {
        message: 'Số điện thoại không đúng định dạng',
      }),
    gender: z.enum(['male', 'female']).optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  })

// Forgot password validation
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
})

// Reset password validation
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token không hợp lệ'),
    password: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .regex(/(?=.*[a-z])/, 'Mật khẩu phải có ít nhất 1 chữ thường')
      .regex(/(?=.*[A-Z])/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
      .regex(/(?=.*\d)/, 'Mật khẩu phải có ít nhất 1 số')
      .regex(/(?=.*[@$!%*?&])/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

// Change password validation
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .regex(/(?=.*[a-z])/, 'Mật khẩu phải có ít nhất 1 chữ thường')
      .regex(/(?=.*[A-Z])/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
      .regex(/(?=.*\d)/, 'Mật khẩu phải có ít nhất 1 số')
      .regex(/(?=.*[@$!%*?&])/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmNewPassword'],
  })

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
