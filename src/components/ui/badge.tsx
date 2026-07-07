import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '~/utils/lib'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 forced-color-adjust-none [color-scheme:light] [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#0A2463] text-white [a&]:hover:bg-[#071A49]',
        secondary: 'border-transparent bg-[#F0F6FF] text-[#1C2B4A] [a&]:hover:bg-[#DBEAFE]',
        destructive:
          'border-transparent bg-[#DC2626] text-white [a&]:hover:bg-[#B91C1C] focus-visible:ring-destructive/20',
        outline: 'border-[#BFDBFE] bg-white text-[#1C2B4A] [a&]:hover:bg-[#EFF6FF] [a&]:hover:text-[#0A2463]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return <Comp data-slot='badge' className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
