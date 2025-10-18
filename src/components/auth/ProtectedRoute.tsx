import React from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole, User } from '../../types/user'
import { AlertTriangle, Lock } from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'

interface UserWithPermissions extends User {
  permissions?: string[]
}

const getRoleName = (role: UserRole): string => {
  switch (role) {
    case 0: // UserRole.Customer
      return 'khách hàng'
    case 1: // UserRole.Pharmacist
      return 'dược sĩ'
    case 2: // UserRole.Admin
      return 'quản trị viên'
    default:
      return 'người dùng'
  }
}

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredPermissions?: string[]
  fallbackPath?: string
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions = [],
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-blue-600'>Đang tải...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  // Check role requirement
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4'>
        <div className='max-w-md w-full bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-8 text-center'>
          <div className='mb-6'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Lock className='w-8 h-8 text-red-600' />
            </div>
            <h2 className='text-xl font-medium text-gray-900 mb-2'>Không có quyền truy cập</h2>
            <p className='text-gray-600'>
              Bạn không có quyền truy cập vào trang này. Trang này chỉ dành cho{' '}
              {requiredRole !== undefined ? getRoleName(requiredRole) : 'người dùng đã được ủy quyền'}.
            </p>
          </div>

          <Alert className='mb-6'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              Role hiện tại: <span className='font-medium'>{getRoleName(user.role)}</span>
              <br />
              Role yêu cầu:{' '}
              <span className='font-medium'>
                {requiredRole !== undefined ? getRoleName(requiredRole) : 'Không xác định'}
              </span>
            </AlertDescription>
          </Alert>

          <div className='space-y-3'>
            <Button onClick={() => window.history.back()} variant='outline' className='w-full'>
              Quay lại
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
            >
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Check permissions requirement for extended user data
  if (requiredPermissions.length > 0 && 'permissions' in user) {
    const userPermissions = (user as UserWithPermissions).permissions || []
    const hasRequiredPermissions = requiredPermissions.every(
      (permission) => userPermissions.includes(permission) || userPermissions.includes('full_access'),
    )

    if (!hasRequiredPermissions) {
      return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4'>
          <div className='max-w-md w-full bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100 p-8 text-center'>
            <div className='mb-6'>
              <div className='w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <AlertTriangle className='w-8 h-8 text-orange-600' />
              </div>
              <h2 className='text-xl font-medium text-gray-900 mb-2'>Thiếu quyền hạn</h2>
              <p className='text-gray-600'>Bạn không có đủ quyền hạn để truy cập tính năng này.</p>
            </div>

            <Alert className='mb-6'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>Quyền hạn yêu cầu: {requiredPermissions.join(', ')}</AlertDescription>
            </Alert>

            <div className='space-y-3'>
              <Button onClick={() => window.history.back()} variant='outline' className='w-full'>
                Quay lại
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
              >
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
