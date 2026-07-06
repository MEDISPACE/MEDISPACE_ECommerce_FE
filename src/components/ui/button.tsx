import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '~/utils/lib'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all [color-scheme:light] forced-color-adjust-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-[#1E40AF] focus-visible:ring-[#1E40AF]/20 focus-visible:ring-[3px] aria-invalid:ring-red-500/20 aria-invalid:border-red-500",
  {
    variants: {
      variant: {
        default: 'bg-[#0A2463] text-white hover:bg-[#071A49] hover:text-white',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 hover:text-white focus-visible:ring-red-500/20',
        outline:
          'border border-[#BFDBFE] bg-white text-[#0A2463] hover:border-[#1E40AF] hover:bg-[#F0F6FF] hover:text-[#0A2463]',
        secondary: 'bg-[#F0F6FF] text-[#0A2463] hover:bg-[#E8EDF5] hover:text-[#0A2463]',
        ghost: 'bg-transparent text-inherit hover:bg-[#F0F6FF] hover:text-[#0A2463]',
        link: 'text-[#0A2463] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'

  return <Comp data-slot='button' className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})

Button.displayName = 'Button'

export { Button, buttonVariants }
