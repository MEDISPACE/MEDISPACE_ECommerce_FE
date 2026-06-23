import { describe, expect, test } from 'vitest'
import { avatarUpload, formatUserDisplayName, mapApiResponseToForm, mapFormToApiPayload, validateProfileForm } from '../helpers/account-unit'

describe('account profile unit rules', () => {
  test('validateProfileForm passes with all valid fields', () => {
    expect(validateProfileForm({ firstName: 'Tran', lastName: 'Bao', phone: '0901234567', email: 'bao@medispace.test', dob: '1995-01-01' })).toBe(true)
  })

  test('validateProfileForm fails with empty name', () => {
    expect(validateProfileForm({ firstName: '', lastName: 'Bao' })).toBe(false)
  })

  test('validateProfileForm fails with invalid phone format', () => {
    expect(validateProfileForm({ firstName: 'Tran', lastName: 'Bao', phone: '123' })).toBe(false)
  })

  test('validateProfileForm fails with invalid email format', () => {
    expect(validateProfileForm({ firstName: 'Tran', lastName: 'Bao', email: 'bad-email' })).toBe(false)
  })

  test('validateProfileForm fails with future DOB', () => {
    expect(validateProfileForm({ firstName: 'Tran', lastName: 'Bao', dob: '2999-01-01' })).toBe(false)
  })

  test('formatUserDisplayName returns correct string', () => {
    expect(formatUserDisplayName({ firstName: 'Tran', lastName: 'Bao' })).toBe('Tran Bao')
  })

  test('avatarUpload rejects non-image file types', () => {
    expect(avatarUpload({ type: 'text/plain', size: 1000 })).toBe(false)
  })

  test('avatarUpload rejects file > size limit', () => {
    expect(avatarUpload({ type: 'image/png', size: 6 * 1024 * 1024 })).toBe(false)
  })

  test('avatarUpload accepts valid image types', () => {
    expect(['image/jpeg', 'image/png', 'image/webp'].every((type) => avatarUpload({ type, size: 1000 }))).toBe(true)
  })

  test('mapApiResponseToForm maps all fields correctly', () => {
    expect(mapApiResponseToForm({ firstName: 'Tran', lastName: 'Bao', email: 'a@b.test', phoneNumber: '0901234567', dateOfBirth: '1995-01-01', gender: 'male' })).toEqual({ firstName: 'Tran', lastName: 'Bao', email: 'a@b.test', phone: '0901234567', dob: '1995-01-01', gender: 'male' })
  })

  test('mapFormToApiPayload maps all fields correctly', () => {
    expect(mapFormToApiPayload({ firstName: ' Tran ', lastName: ' Bao ', phone: '0901234567', dob: '1995-01-01', gender: 'male' })).toEqual({ firstName: 'Tran', lastName: 'Bao', phoneNumber: '0901234567', dateOfBirth: '1995-01-01', gender: 'male' })
  })
})
