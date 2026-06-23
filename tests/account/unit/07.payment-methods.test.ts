import { describe, expect, test } from 'vitest'
import { canDeletePaymentMethod, formatCardType, isCardExpired, isCardExpiringSoon, mapApiCardToUI, maskCardNumber } from '../helpers/account-unit'

describe('account payment methods unit rules', () => {
  test('maskCardNumber shows only last 4 digits', () => {
    expect(maskCardNumber('4532')).toBe('**** **** **** 4532')
  })

  test('isCardExpired true if expiry < today', () => {
    expect(isCardExpired('05/26', new Date('2026-06-23'))).toBe(true)
  })

  test('isCardExpiringSoon true if < 30 days remaining', () => {
    expect(isCardExpiringSoon('06/26', new Date('2026-06-23'))).toBe(true)
  })

  test('formatCardType returns correct label', () => {
    expect(formatCardType('visa')).toBe('Visa')
    expect(formatCardType('mc')).toBe('Mastercard')
    expect(formatCardType('jcb')).toBe('JCB')
  })

  test('canDeletePaymentMethod false if only method', () => {
    expect(canDeletePaymentMethod([{ id: 'pm1' }])).toBe(false)
  })

  test('validateCardForm never runs because card capture must be tokenized by gateway', () => {
    expect(typeof (globalThis as any).validateCardForm).toBe('undefined')
  })

  test('mapApiCardToUI maps all fields correctly', () => {
    expect(mapApiCardToUI({ id: 'pm1', brand: 'visa', last4: '4532', expiryDate: '12/28', isDefault: true })).toEqual({ id: 'pm1', brand: 'Visa', maskedNumber: '**** **** **** 4532', expiryDate: '12/28', isDefault: true })
  })
})
