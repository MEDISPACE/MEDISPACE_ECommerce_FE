import { Input } from '../ui/input'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  name?: string
  error?: string
  className?: string
}

export function PhoneInput({
  value,
  onChange,
  placeholder = 'Số điện thoại',
  name,
  error,
  className = '',
}: PhoneInputProps) {
  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const digitsOnly = phone.replace(/\D/g, '')

    // Limit to 11 digits
    const limited = digitsOnly.slice(0, 11)

    // Format as XXX XXX XXXX
    if (limited.length <= 3) return limited
    if (limited.length <= 6) return `${limited.slice(0, 3)} ${limited.slice(3)}`
    return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    onChange(formatted)
  }

  const validatePhoneNumber = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '')
    return digitsOnly.length >= 10 && digitsOnly.length <= 11 && digitsOnly.startsWith('0')
  }

  const isValid = !value || validatePhoneNumber(value)

  return (
    <div>
      <Input
        type='tel'
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        name={name}
        className={`h-11 border-2 transition-all ${error || !isValid ? 'border-red-300 focus:border-red-500' : 'border-blue-200 focus:border-blue-500'} ${className}`}
      />
      {error && <p className='text-red-500 text-sm mt-1'>{error}</p>}
      {!isValid && value && !error && (
        <p className='text-red-500 text-sm mt-1'>Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)</p>
      )}
    </div>
  )
}
