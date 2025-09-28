import React from 'react'

type ReactNode = React.ReactNode
import LoadingSpinner from '~/components/ui/LoadingSpinner'

interface AuthFormWrapperProps {
  children: ReactNode
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  loadingText: string
  className?: string
}

export default function AuthFormWrapper({
  children,
  onSubmit,
  isLoading,
  loadingText,
  className = '',
}: AuthFormWrapperProps) {
  return (
    <form onSubmit={onSubmit} className={`auth-form ${className}`} style={{ position: 'relative' }}>
      {isLoading && (
        <div className='form-loading-overlay'>
          <LoadingSpinner size='md' variant='pill' text={loadingText} />
        </div>
      )}
      {children}
    </form>
  )
}
