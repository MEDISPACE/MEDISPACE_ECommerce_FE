import { describe, expect, test } from 'vitest'
import { getDefaultSettings, mapFormToSettingsPayload, mapSettingsApiToForm, validateSettings } from '../helpers/account-unit'

describe('account settings unit rules', () => {
  test('mapSettingsApiToForm maps all fields correctly', () => {
    expect(mapSettingsApiToForm({ language: 'en', theme: 'dark', emailNotifications: false })).toEqual({ language: 'en', theme: 'dark', emailNotifications: false })
  })

  test('mapFormToSettingsPayload maps all fields correctly', () => {
    expect(mapFormToSettingsPayload({ language: 'vi', theme: 'system', emailNotifications: true })).toEqual({ language: 'vi', theme: 'system', emailNotifications: true })
  })

  test('validateSettings passes with valid data', () => {
    expect(validateSettings({ language: 'vi', theme: 'system' })).toBe(true)
  })

  test('getDefaultSettings returns correct defaults', () => {
    expect(getDefaultSettings()).toEqual({ language: 'vi', theme: 'system', emailNotifications: true })
  })
})
