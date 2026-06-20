import * as React from 'react'

import { cn } from '~/utils/lib'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'resize-none border-gray-300 placeholder:text-gray-500 focus-visible:border-[#1E40AF] focus-visible:ring-[#1E40AF]/20 aria-invalid:ring-red-500/20 aria-invalid:border-red-500 bg-white flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base text-gray-900 transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
