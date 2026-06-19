import { Minus, Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface QuantityInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 999,
  size = 'md',
  disabled = false,
}: QuantityInputProps) {
  const sizeClasses = {
    sm: {
      button: 'h-8 w-8',
      input: 'h-8 w-12 text-sm',
    },
    md: {
      button: 'h-9 w-9',
      input: 'h-9 w-14 text-base',
    },
    lg: {
      button: 'h-10 w-10',
      input: 'h-10 w-16 text-base',
    },
  }

  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min
    if (newValue >= min && newValue <= max) {
      onChange(newValue)
    }
  }

  return (
    <div className='flex items-center border-2 border-[#BFDBFE] rounded-lg overflow-hidden bg-white'>
      <Button
        variant='ghost'
        size='sm'
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        className={`${sizeClasses[size].button} rounded-none hover:bg-[#F0F6FF] border-0`}
      >
        <Minus className='w-3 h-3' />
      </Button>

      <Input
        type='number'
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        className={`${sizeClasses[size].input} border-0 text-center rounded-none focus:ring-0 focus:border-0 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />

      <Button
        variant='ghost'
        size='sm'
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        className={`${sizeClasses[size].button} rounded-none hover:bg-[#F0F6FF] border-0`}
      >
        <Plus className='w-3 h-3' />
      </Button>
    </div>
  )
}
