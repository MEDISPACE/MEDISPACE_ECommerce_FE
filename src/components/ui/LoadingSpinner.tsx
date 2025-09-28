import { Pill, Cross, Activity } from 'lucide-react'
import '~/style/LoadingSpinner.css'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'pill' | 'cross' | 'activity' | 'pulse'
  className?: string
  text?: string
}

export default function LoadingSpinner({ size = 'md', variant = 'pill', className = '', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'loading-spinner-sm',
    md: 'loading-spinner-md',
    lg: 'loading-spinner-lg',
  }

  const renderIcon = () => {
    const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24

    switch (variant) {
      case 'pill':
        return <Pill size={iconSize} className='loading-icon-pill' />
      case 'cross':
        return <Cross size={iconSize} className='loading-icon-cross' />
      case 'activity':
        return <Activity size={iconSize} className='loading-icon-activity' />
      case 'pulse':
        return (
          <div className='loading-pulse-container'>
            <div className='loading-pulse-dot'></div>
            <div className='loading-pulse-dot'></div>
            <div className='loading-pulse-dot'></div>
          </div>
        )
      default:
        return <Pill size={iconSize} className='loading-icon-pill' />
    }
  }

  return (
    <div className={`loading-spinner ${sizeClasses[size]} ${className}`}>
      <div className='loading-spinner-icon'>{renderIcon()}</div>
      {text && <span className='loading-spinner-text'>{text}</span>}
    </div>
  )
}
