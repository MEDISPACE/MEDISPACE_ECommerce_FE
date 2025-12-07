import { useNavigate } from 'react-router'
import { useCallback } from 'react'
import { UserRole } from '../../types/user'

/**
 * Custom hook for navigating based on user role
 * Automatically navigates to the appropriate page based on user role:
 * - Admin -> /admin/dashboard
 * - Pharmacist -> /pharmacist
 * - Customer -> /
 *
 * @returns navigateByRole function that accepts a UserRole
 *
 * @example
 * ```tsx
 * const navigateByRole = useRoleNavigation()
 *
 * // After login
 * navigateByRole(user.role)
 * ```
 */
export const useRoleNavigation = () => {
  const navigate = useNavigate()

  const navigateByRole = useCallback(
    (role: UserRole) => {
      if (role === UserRole.Admin) {
        navigate('/admin/dashboard')
      } else if (role === UserRole.Pharmacist) {
        navigate('/pharmacist/dashboard')
      } else {
        navigate('/')
      }
    },
    [navigate],
  )

  return navigateByRole
}
