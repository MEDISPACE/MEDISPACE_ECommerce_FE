import React from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'

interface ValidatedInputProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'tel'
  value: string
  placeholder: string
  icon: React.ReactNode
  error?: string
  isTouched?: boolean
  showPassword?: boolean
  onTogglePassword?: () => void
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  required?: boolean
  minLength?: number
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  name,
  type = 'text',
  value,
  placeholder,
  icon,
  error,
  isTouched,
  showPassword,
  onTogglePassword,
  onChange,
  onBlur,
  required,
  minLength,
}) => {
  const hasError = error && isTouched
  const hasSuccess = !error && isTouched && value
  const isPasswordType = type === 'password'

  return (
    <div className='register-input-group'>
      <label htmlFor={name} className='register-label'>
        {icon}
        {label}
      </label>
      <div className='register-input-wrapper'>
        <span className='register-input-icon'>{icon}</span>
        <input
          type={isPasswordType && showPassword ? 'text' : type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`register-input ${isPasswordType ? 'register-password-input' : ''} ${
            hasError ? 'border-red-500' : ''
          } ${hasSuccess ? 'border-green-500' : ''}`}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
        />
        {isPasswordType && onTogglePassword && (
          <button type='button' className='register-password-toggle' onClick={onTogglePassword}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {/* Error Message */}
      {hasError && (
        <div className='flex items-center gap-2 mt-1 text-red-500 text-sm'>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Indicator */}
      {hasSuccess && (
        <div className='flex items-center gap-2 mt-1 text-green-500 text-sm'>
          <CheckCircle2 size={14} />
          <span>✓</span>
        </div>
      )}
    </div>
  )
}
