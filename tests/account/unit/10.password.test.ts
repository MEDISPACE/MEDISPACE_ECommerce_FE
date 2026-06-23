import { describe, expect, test } from 'vitest'
import { isCurrentPasswordRequired, validatePasswordMatch, validatePasswordStrength } from '../helpers/account-unit'

describe('account password unit rules', () => {
  test('validatePasswordStrength fails if < min length', () => {
    expect(validatePasswordStrength('A1!a')).toBe(false)
  })

  test('validatePasswordStrength fails if no uppercase', () => {
    expect(validatePasswordStrength('password!123')).toBe(false)
  })

  test('validatePasswordStrength fails if no number', () => {
    expect(validatePasswordStrength('Password!')).toBe(false)
  })

  test('validatePasswordStrength fails if no special char', () => {
    expect(validatePasswordStrength('Password123')).toBe(false)
  })

  test('validatePasswordMatch fails if passwords differ', () => {
    expect(validatePasswordMatch('Password!123', 'Password!124')).toBe(false)
  })

  test('validatePasswordMatch passes if passwords match', () => {
    expect(validatePasswordMatch('Password!123', 'Password!123')).toBe(true)
  })

  test('isCurrentPasswordRequired true for password users', () => {
    expect(isCurrentPasswordRequired({ hasPassword: true })).toBe(true)
  })

  test('isCurrentPasswordRequired false for social-only users', () => {
    expect(isCurrentPasswordRequired({ provider: 'google', hasPassword: false })).toBe(false)
  })
})
