import * as React from 'react'

import { cn } from '~/utils/lib'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot='input'
        className={cn(
          'file:text-gray-900 placeholder:text-gray-500 selection:bg-[#E8EDF5] selection:text-black',
          'bg-white border-gray-300 [color-scheme:light] forced-color-adjust-none flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base text-gray-900 transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-[#1E40AF] focus-visible:ring-[#1E40AF]/20 focus-visible:ring-[3px] focus:border-[#1E40AF]',
          'aria-invalid:ring-red-500/20 aria-invalid:border-red-500',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export { Input }
