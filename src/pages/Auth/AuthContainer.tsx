import React from 'react'

type ReactNode = React.ReactNode

interface AuthContainerProps {
  children: ReactNode
  className?: string
}

export default function AuthContainer({ children, className = '' }: AuthContainerProps) {
  return (
    <div className={`auth-page-container ${className}`}>
      <div className='auth-form-card'>{children}</div>
    </div>
  )
}
