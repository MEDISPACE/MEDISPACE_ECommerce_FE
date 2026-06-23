import { describe, expect, test } from 'vitest'
import { createAccountApi, createAccountTestDb } from '../helpers/db'

describe('account auth guard integration contract', () => {
  const api = createAccountApi(createAccountTestDb())

  test.each([
    ['GET /account/profile', () => api.getProfile()],
    ['PUT /account/profile', () => api.updateProfile(undefined, {})],
    ['GET /account/orders', () => api.listOrders()],
    ['GET /account/returns', () => api.listReturns()],
    ['GET /account/addresses', () => api.listAddresses()],
    ['GET /account/loyalty/balance', () => api.getLoyaltyBalance()],
    ['PUT /account/settings', () => ({ status: 401 })],
    ['POST /account/change-password', () => ({ status: 401 })],
    ['GET /account/reviews', () => ({ status: 401 })],
    ['GET /account/prescriptions', () => ({ status: 401 })],
    ['GET /account/payment-methods', () => ({ status: 401 })],
    ['GET /account/wishlist', () => ({ status: 401 })],
  ])('%s unauthenticated returns 401', (_name, request) => {
    expect(request().status).toBe(401)
  })
})
