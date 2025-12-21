// Simplified version without animations
import type { ReactNode } from 'react'

interface StaggerContainerProps {
  children: ReactNode
  staggerDelay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerContainer({ children, className = '' }: StaggerContainerProps) {
  return <div className={className}>{children}</div>
}

export function StaggerItem({ children, className = '' }: StaggerItemProps) {
  return <div className={className}>{children}</div>
}

export default StaggerContainer
