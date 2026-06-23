import { describe, expect, test, vi } from 'vitest'
import { canUsePrescription, formatPrescriptionStatus, isPrescriptionExpiringSoon, isPrescriptionValid, validatePrescriptionUpload } from '../helpers/account-unit'

describe('account prescriptions unit rules', () => {
  test('isPrescriptionValid true if not expired', () => {
    vi.setSystemTime(new Date('2026-06-23'))
    expect(isPrescriptionValid({ expiresAt: '2026-06-24' })).toBe(true)
    vi.useRealTimers()
  })

  test('isPrescriptionValid false if expired', () => {
    vi.setSystemTime(new Date('2026-06-23'))
    expect(isPrescriptionValid({ expiresAt: '2026-06-01' })).toBe(false)
    vi.useRealTimers()
  })

  test('isPrescriptionExpiringSoon true if < 7 days remaining', () => {
    expect(isPrescriptionExpiringSoon({ expiresAt: '2026-06-26' }, new Date('2026-06-23'))).toBe(true)
  })

  test('validatePrescriptionUpload rejects invalid file types', () => {
    expect(validatePrescriptionUpload({ type: 'text/plain', size: 1000 })).toBe(false)
  })

  test('validatePrescriptionUpload rejects files > size limit', () => {
    expect(validatePrescriptionUpload({ type: 'image/png', size: 6 * 1024 * 1024 })).toBe(false)
  })

  test('canUsePrescription false if already used max times', () => {
    expect(canUsePrescription({ status: 'approved', usedCount: 2, maxUses: 2 })).toBe(false)
  })

  test('canUsePrescription false if pending review', () => {
    expect(canUsePrescription({ status: 'pending', usedCount: 0, maxUses: 2 })).toBe(false)
  })

  test('formatPrescriptionStatus returns correct label', () => {
    expect(formatPrescriptionStatus('approved')).toBe('Đã duyệt')
  })
})
