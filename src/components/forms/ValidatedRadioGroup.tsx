import React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface RadioOption {
  value: string
  label: string
}

interface ValidatedRadioGroupProps {
  label: string
  name: string
  value: string
  options: RadioOption[]
  icon: React.ReactNode
  error?: string
  isTouched?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}

export const ValidatedRadioGroup: React.FC<ValidatedRadioGroupProps> = ({
  label,
  name,
  value,
  options,
  icon,
  error,
  isTouched,
  onChange,
  onBlur,
}) => {
  const hasError = error && isTouched
  const hasSuccess = !error && isTouched && value

  return (
    <div className='register-input-group'>
      <label className='register-label'>
        {icon}
        {label}
      </label>
      <div className='register-gender-group'>
        {options.map((option) => (
          <label key={option.value} className='register-gender-option'>
            <input
              type='radio'
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              onBlur={onBlur}
              className='register-gender-radio'
            />
            <span className='register-gender-custom'></span>
            <span className='register-gender-text'>{option.label}</span>
          </label>
        ))}
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
