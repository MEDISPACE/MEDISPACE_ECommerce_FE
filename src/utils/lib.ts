import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { User } from '~/types/user'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFullName(user: User | null): string {
  if (!user) return ''
  return `${user.firstName} ${user.lastName}`.trim()
}

export function getUserInitials(user: User | null): string {
  if (!user) return ''
  const firstInitial = user.firstName?.charAt(0) || ''
  const lastInitial = user.lastName?.charAt(0) || ''
  return `${firstInitial}${lastInitial}`.toUpperCase()
}
