import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  name?: string
  error?: string
  showStrength?: boolean
  className?: string
}

export function PasswordInput({
  value,
  onChange,
  placeholder = 'Mật khẩu',
  name,
  error,
  showStrength = false,
  className = '',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const getPasswordStrength = (password: string) => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const strength = getPasswordStrength(value)
  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500'
    if (strength <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (strength <= 2) return 'Yếu'
    if (strength <= 3) return 'Trung bình'
    return 'Mạnh'
  }

  return (
    <div>
      <div className='relative'>
        <Input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          name={name}
          className={`pr-10 h-12 border-2 transition-all ${error ? 'border-red-300 focus:border-red-500' : 'border-blue-200 focus:border-blue-500'} ${className}`}
        />
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 hover:bg-transparent'
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className='h-4 w-4 text-gray-500' /> : <Eye className='h-4 w-4 text-gray-500' />}
        </Button>
      </div>

      {showStrength && value && (
        <div className='mt-2'>
          <div className='flex gap-1 mb-1'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= strength ? getStrengthColor() : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <p className='text-xs text-gray-600'>
            Độ mạnh mật khẩu:{' '}
            <span className={strength <= 2 ? 'text-red-500' : strength <= 3 ? 'text-yellow-500' : 'text-green-500'}>
              {getStrengthText()}
            </span>
          </p>
          {strength < 4 && (
            <p className='text-xs text-gray-500 mt-1'>
              Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số
            </p>
          )}
        </div>
      )}

      {error && <p className='text-red-500 text-sm mt-1'>{error}</p>}
    </div>
  )
}
