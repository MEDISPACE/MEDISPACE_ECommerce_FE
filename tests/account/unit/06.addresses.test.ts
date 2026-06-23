import { describe, expect, test } from 'vitest'
import { canDeleteAddress, formatAddressDisplay, isAddressLimit, validateAddressForm } from '../helpers/account-unit'
import { addresses } from '../fixtures/addresses'

describe('account addresses unit rules', () => {
  test('validateAddressForm fails with empty street', () => {
    expect(validateAddressForm({ address: '', phone: '0901234567', province: 'HCM', district: 'Q1', ward: 'BN' })).toBe(false)
  })

  test('validateAddressForm fails with invalid phone', () => {
    expect(validateAddressForm({ address: '123', phone: '123', province: 'HCM', district: 'Q1', ward: 'BN' })).toBe(false)
  })

  test('validateAddressForm fails with no province selected', () => {
    expect(validateAddressForm({ address: '123', phone: '0901234567', district: 'Q1', ward: 'BN' })).toBe(false)
  })

  test('validateAddressForm fails with no district selected', () => {
    expect(validateAddressForm({ address: '123', phone: '0901234567', province: 'HCM', ward: 'BN' })).toBe(false)
  })

  test('validateAddressForm fails with no ward selected', () => {
    expect(validateAddressForm({ address: '123', phone: '0901234567', province: 'HCM', district: 'Q1' })).toBe(false)
  })

  test('canDeleteAddress false if it is the only address', () => {
    expect(canDeleteAddress([{ id: 'a1', isDefault: true }], 'a1')).toBe(false)
  })

  test('canDeleteAddress false if default and no other address exists', () => {
    expect(canDeleteAddress([{ id: 'a1', isDefault: true }], 'a1')).toBe(false)
  })

  test('formatAddressDisplay returns correct full string', () => {
    expect(formatAddressDisplay(addresses.multiple[0])).toContain('123 Lê Lợi')
  })

  test('isAddressLimit true when user has max addresses', () => {
    expect(isAddressLimit(addresses.max)).toBe(true)
  })
})
